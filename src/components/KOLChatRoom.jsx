import React, { useState, useEffect, useRef } from 'react';
import { 
  Search as SearchIcon, 
  Settings as SettingsIcon, 
  Video as VideoIcon, 
  Phone, 
  Plus, 
  Smile, 
  Send as SendIcon, 
  CheckCheck,
  ArrowLeft,
  X as CloseIcon,
  FileText
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import {
  formatChatTime,
  mapApiConversation,
  mapUserToConversation,
  mergeConversations,
  sortConversations,
  normalizeMessage,
  getChatPartnerId,
} from '../utils/chatHelpers';
import { toProfileView, getDisplayName } from '../utils/profileHelpers';
import { connectSocket, getSocket } from '../utils/socket';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=verified';
const TYPING_STOP_MS = 2000;
const FALLBACK_POLL_MS = 30000;

export default function KOLChatRoom({ onSettingsClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [draftConversations, setDraftConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [sendError, setSendError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [activeMessageActions, setActiveMessageActions] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [typingUserId, setTypingUserId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const isTypingEmittedRef = useRef(false);
  const currentUserRef = useRef(null);
  const selectedUserRef = useRef(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const data = await apiFetch('/api/messages/conversations');
      const mapped = sortConversations(data.map((c) => mapApiConversation(c, DEFAULT_AVATAR)));
      setConversations(mapped);
      setDraftConversations((prev) =>
        prev.filter((draft) => !mapped.some((c) => c._id === draft._id))
      );
    } catch (error) {
      if (error.status === 401) {
        setUnauthorized(true);
      }
    } finally {
      setConversationsLoading(false);
    }
  };

  const emitTypingStop = () => {
    const socket = getSocket();
    const peer = selectedUserRef.current;
    if (!socket?.connected || !peer) return;
    if (isTypingEmittedRef.current) {
      socket.emit('typing:stop', { receiverId: peer._id });
      isTypingEmittedRef.current = false;
    }
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
  };

  const emitTypingStart = () => {
    const socket = getSocket();
    const peer = selectedUserRef.current;
    if (!socket?.connected || !peer) return;
    if (!isTypingEmittedRef.current) {
      socket.emit('typing:start', { receiverId: peer._id });
      isTypingEmittedRef.current = true;
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(emitTypingStop, TYPING_STOP_MS);
  };

  useEffect(() => {
    const refreshMe = () => {
      apiFetch('/api/auth/me')
        .then((data) => setCurrentUser(toProfileView(data, DEFAULT_AVATAR)))
        .catch(() => {});
    };
    refreshMe();
    fetchConversations();

    const socket = connectSocket();

    const onConnect = () => {
      setSocketConnected(true);
      fetchConversations();
    };
    const onDisconnect = () => setSocketConnected(false);

    const onNewMessage = (msg) => appendSocketMessage(msg);
    const onConversationUpdated = () => fetchConversations();
    const onTyping = ({ senderId, isTyping }) => {
      setTypingUserId(isTyping ? String(senderId) : null);
    };
    const onMessagesRead = ({ readerId, messageIds }) => {
      setMessages((prev) => {
        const chatId = String(readerId);
        if (!prev[chatId]) return prev;
        return {
          ...prev,
          [chatId]: prev[chatId].map((m) =>
            messageIds?.includes(String(m._id)) ? { ...m, read: true } : m
          ),
        };
      });
    };
    const onMessageUpdated = (msg) => {
      const myId = currentUserRef.current?._id;
      if (!myId) return;
      const chatId = getChatPartnerId(msg, myId);
      const normalized = normalizeMessage(msg, chatId);
      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((m) =>
          String(m._id) === String(msg._id) ? { ...m, ...normalized } : m
        ),
      }));
    };
    const onMessageDeleted = (msg) => onMessageUpdated(msg);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('newMessage', onNewMessage);
    socket.on('conversationUpdated', onConversationUpdated);
    socket.on('typing', onTyping);
    socket.on('messagesRead', onMessagesRead);
    socket.on('messageUpdated', onMessageUpdated);
    socket.on('messageDeleted', onMessageDeleted);

    if (socket.connected) onConnect();

    const fallbackInterval = setInterval(() => {
      if (!getSocket()?.connected) fetchConversations();
    }, FALLBACK_POLL_MS);

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshMe();
        fetchConversations();
      }
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      emitTypingStop();
      clearInterval(fallbackInterval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('newMessage', onNewMessage);
      socket.off('conversationUpdated', onConversationUpdated);
      socket.off('typing', onTyping);
      socket.off('messagesRead', onMessagesRead);
      socket.off('messageUpdated', onMessageUpdated);
      socket.off('messageDeleted', onMessageDeleted);
    };
  }, []);

  const updateConversationPreview = (userId, messageText, { fromMe = false } = {}) => {
    const preview = messageText || 'Start a conversation';
    const now = new Date().toISOString();
    const updater = (list) =>
      list.map((c) =>
        c._id === userId
          ? {
              ...c,
              lastMessage: preview,
              lastMessageAt: now,
              isDraft: false,
              unread: fromMe ? 0 : c.unread,
            }
          : c
      );

    setConversations((prev) => sortConversations(updater(prev)));
    setDraftConversations((prev) => {
      const updated = updater(prev);
      return updated.some((c) => c._id === userId) ? sortConversations(updated) : prev;
    });
  };

  const appendSocketMessage = (msg) => {
    const myId = currentUserRef.current?._id;
    if (!myId) return;

    const chatId = getChatPartnerId(msg, myId);
    const normalized = normalizeMessage(msg, chatId);

    setMessages((prev) => {
      const list = prev[chatId] || [];
      if (list.some((m) => String(m._id) === String(msg._id))) return prev;
      return {
        ...prev,
        [chatId]: [...list, normalized].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        ),
      };
    });

    const fromMe = String(msg.senderId) === String(myId);
    updateConversationPreview(
      chatId,
      msg.deleted ? 'This message was deleted' : msg.message,
      { fromMe }
    );

    if (!fromMe) {
      const viewing =
        selectedUserRef.current &&
        String(selectedUserRef.current._id) === chatId;
      if (!viewing) {
        setConversations((prev) =>
          sortConversations(
            prev.map((c) =>
              String(c._id) === chatId ? { ...c, unread: (c.unread || 0) + 1 } : c
            )
          )
        );
      }
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await apiFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(
          results.map((user) => mapUserToConversation(user, DEFAULT_AVATAR))
        );
      } catch (error) {
        if (error.status === 401) {
          setUnauthorized(true);
          setSearchError('Unauthorized. Please log in again.');
        } else {
          setSearchError('Failed to search users. Please try again.');
        }
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedUser) return;
    if (messages[selectedUser._id]) return;
    fetchMessages(selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    setTypingUserId(null);
    emitTypingStop();
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser, messages[selectedUser?._id]?.length]);

  const fetchMessages = async (user, { silent = false } = {}) => {
    if (!silent) {
      setMessagesLoading(true);
      setMessagesError('');
    }

    try {
      const data = await apiFetch(`/api/messages/${user._id}`);
      const normalized = data
        .map((msg) => normalizeMessage(msg, user._id))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages((prev) => ({ ...prev, [user._id]: normalized }));

      setConversations((prev) =>
        sortConversations(
          prev.map((c) => (c._id === user._id ? { ...c, unread: 0 } : c))
        )
      );

      if (normalized.length > 0) {
        const last = normalized[normalized.length - 1];
        updateConversationPreview(user._id, last.deleted ? 'This message was deleted' : last.message, {
          fromMe: last.sender === 'me',
        });
      }
    } catch (error) {
      if (error.status === 401) {
        setUnauthorized(true);
        setMessagesError('Unauthorized. Please log in again.');
      } else {
        setMessagesError('Unable to load messages. Try again later.');
      }
      setMessages(prev => ({ ...prev, [user._id]: [] }));
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!selectedUser) return;
    setActionError('');

    try {
      const response = await apiFetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      const updatedMessage = response.deletedMessage;
      setMessages(prev => ({
        ...prev,
        [selectedUser._id]: prev[selectedUser._id].map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg
        ),
      }));
    } catch (error) {
      if (error.status === 401) {
        setUnauthorized(true);
        setActionError('Unauthorized. Please log in again.');
      } else {
        setActionError('Unable to delete the message. Please try again.');
      }
    }
  };

  const startMessagePress = (message) => {
    if (message.sender !== 'me' || message.deleted) return;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      setActiveMessageActions(message);
    }, 500);
  };

  const cancelMessagePress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleChooseMessageAction = (action) => {
    if (!activeMessageActions) return;
    const message = activeMessageActions;
    setActiveMessageActions(null);

    if (action === 'edit') {
      setEditingMessageId(message._id);
      setInputMessage(message.message || '');
      setPendingFile(null);
      setActionError('');
    }

    if (action === 'delete') {
      handleDeleteMessage(message._id);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInputMessage('');
    setActionError('');
  };

  const handleSelectUser = (user) => {
    const chatUser = user.avatar
      ? user
      : mapUserToConversation(user, DEFAULT_AVATAR);

    setSelectedUser(chatUser);
    setIsMobileChatOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setInputMessage('');
    setSendError('');
    setTypingUserId(null);
    emitTypingStop();

    const existsInList =
      conversations.some((c) => c._id === chatUser._id) ||
      draftConversations.some((c) => c._id === chatUser._id);

    if (!existsInList) {
      setDraftConversations((prev) => [
        mapUserToConversation(chatUser, DEFAULT_AVATAR, { isDraft: true }),
        ...prev.filter((c) => c._id !== chatUser._id),
      ]);
    }
  };

  const handleSend = async () => {
    if (!selectedUser) return;
    const messageText = inputMessage.trim();
    const isEditing = Boolean(editingMessageId);

    if (isEditing && !messageText) {
      setSendError('Enter text to update the message.');
      return;
    }

    if (!isEditing && !messageText && !pendingFile) return;
    setSendError('');
    emitTypingStop();
    setIsSending(true);

    try {
      if (isEditing) {
        const response = await apiFetch(`/api/messages/${editingMessageId}`, {
          method: 'PUT',
          body: JSON.stringify({ message: messageText }),
        });

        const updatedMessage = {
          ...response.updatedMessage,
          sender: response.updatedMessage.senderId === selectedUser._id ? 'them' : 'me',
          read: response.updatedMessage.read ?? false,
          edited: response.updatedMessage.edited ?? true,
          deleted: response.updatedMessage.deleted ?? false,
          time: new Date(response.updatedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        };

        setMessages(prev => ({
          ...prev,
          [selectedUser._id]: prev[selectedUser._id].map((msg) =>
            msg._id === updatedMessage._id ? { ...msg, ...updatedMessage } : msg
          ),
        }));

        handleCancelEdit();
      } else {
        const response = await apiFetch(`/api/messages/send/${selectedUser._id}`, {
          method: 'POST',
          body: JSON.stringify({ message: messageText || `Sent a file: ${pendingFile.name}` }),
        });

        const newMessage = normalizeMessage(response.newMessage, selectedUser._id);

        setMessages((prev) => {
          const list = prev[selectedUser._id] || [];
          if (list.some((m) => String(m._id) === String(newMessage._id))) return prev;
          return {
            ...prev,
            [selectedUser._id]: [...list, newMessage],
          };
        });
        updateConversationPreview(
          selectedUser._id,
          newMessage.deleted ? 'This message was deleted' : newMessage.message,
          { fromMe: true }
        );
        setInputMessage('');
        setPendingFile(null);
        if (messageInputRef.current) {
          messageInputRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      if (error.status === 401) {
        setUnauthorized(true);
        setSendError('Unauthorized. Please log in again.');
      } else {
        setSendError(isEditing ? 'Unable to update the message. Please try again.' : 'Unable to send message. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('File size too large! Please upload an image or file under 500KB for secure transmission.');
      return;
    }

    setPendingFile({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      size: (file.size / 1024).toFixed(1) + ' KB',
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [inputMessage]);

  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    if (value.trim() && selectedUser) {
      emitTypingStart();
    } else {
      emitTypingStop();
    }
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openProfile = (user) => {
    if (!user) {
      onSettingsClick(null);
      return;
    }
    const isOwnProfile =
      currentUser && String(user._id) === String(currentUser._id);
    onSettingsClick(isOwnProfile ? null : toProfileView(user, DEFAULT_AVATAR));
  };

  const isPartnerTyping =
    selectedUser && typingUserId && String(typingUserId) === String(selectedUser._id);

  const currentChat = selectedUser ? {
    avatar: selectedUser.avatar || selectedUser.profilePicture || DEFAULT_AVATAR,
    name: getDisplayName(selectedUser),
    status: isPartnerTyping ? 'typing…' : socketConnected ? 'Online' : 'Connecting…',
  } : {
    avatar: DEFAULT_AVATAR,
    name: 'Select a user',
    status: 'Start a chat from search',
  };

  const currentMessages = selectedUser ? messages[selectedUser._id] || [] : [];
  const isSearching = Boolean(searchQuery.trim());
  const sidebarChats = mergeConversations(conversations, draftConversations);

  const renderConversationItem = (chat) => (
    <div
      key={chat._id}
      onClick={() => handleSelectUser(chat)}
      className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-b border-slate-100/50 ${
        selectedUser?._id === chat._id
          ? 'bg-white shadow-sm border-l-4 border-l-brand-secondary'
          : 'hover:bg-slate-100/50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={chat.avatar}
          alt={chat.username}
          className="w-14 h-14 rounded-full bg-slate-200 border-2 border-white shadow-sm"
        />
        {chat.online && (
          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-bold text-brand-primary truncate">
            {getDisplayName(chat)}
          </h3>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-[10px] text-slate-500 font-medium">
              {formatChatTime(chat.lastMessageAt)}
            </span>
            {chat.unread > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-secondary text-white text-[10px] font-bold flex items-center justify-center">
                {chat.unread > 9 ? '9+' : chat.unread}
              </span>
            )}
          </div>
        </div>
        <p className={`text-sm truncate ${chat.unread > 0 ? 'text-brand-primary font-semibold' : 'text-slate-500'}`}>
          {chat.lastMessage}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-full pb-20 md:pb-0">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
      {/* Sidebar */}
      <aside className={`w-full md:w-[320px] lg:w-[400px] border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-hidden shrink-0 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border-none font-medium shadow-sm outline-none focus:ring-2 focus:ring-brand-secondary/20 transition-all placeholder:text-slate-400"
              placeholder="Search conversations..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openProfile(currentUser)}
            className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform"
          >
            <img
              src={currentUser?.avatar || DEFAULT_AVATAR}
              alt={currentUser ? getDisplayName(currentUser) : 'Profile'}
              className="w-full h-full object-cover"
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            searchLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <SearchIcon className="w-12 h-12 mb-3 opacity-10" />
                <p className="text-sm font-medium">Searching users…</p>
              </div>
            ) : searchError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <SearchIcon className="w-12 h-12 mb-3 opacity-10" />
                <p className="text-sm font-medium">{searchError}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  People
                </p>
                {searchResults.map((user) => renderConversationItem(user))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <SearchIcon className="w-12 h-12 mb-3 opacity-10" />
                <p className="text-sm font-medium">No users match your search.</p>
              </div>
            )
          ) : conversationsLoading && sidebarChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <SearchIcon className="w-12 h-12 mb-3 opacity-10" />
              <p className="text-sm font-medium">Loading conversations…</p>
            </div>
          ) : sidebarChats.length > 0 ? (
            sidebarChats.map((chat) => renderConversationItem(chat))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <SearchIcon className="w-12 h-12 mb-3 opacity-10" />
              <p className="text-sm font-medium">No conversations yet.</p>
              <p className="text-xs mt-2 text-slate-400 max-w-[220px]">
                You don&apos;t need to search first — when someone messages you, their chat will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className={`flex-1 flex-col relative bg-slate-50 transition-colors ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
        {/* Header */}
        <header className="h-16 px-4 md:px-6 bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileChatOpen(false)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img src={currentChat.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
              {selectedUser && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-brand-primary truncate max-w-[150px] md:max-w-none leading-tight">{currentChat.name}</h2>
              <span
                className={`text-[11px] font-medium truncate ${
                  isPartnerTyping ? 'text-brand-secondary animate-pulse' : 'text-slate-400'
                }`}
              >
                {currentChat.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <VideoIcon className="w-5 h-5 text-slate-400 hover:text-brand-secondary transition-colors cursor-pointer" />
            <Phone className="w-5 h-5 text-slate-400 hover:text-brand-secondary transition-colors cursor-pointer" />
            <div className="w-[1px] h-6 bg-slate-200" />
            <SettingsIcon 
              onClick={() => openProfile(selectedUser)}
              className="w-5 h-5 text-slate-400 hover:text-brand-secondary transition-colors cursor-pointer" 
            />
          </div>
        </header>

        {/* Message View */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col scroll-smooth">
          <div className="self-center bg-slate-200/50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">
            Today
          </div>

          {messagesLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <SearchIcon className="w-12 h-12 opacity-10" />
              <p>Loading chat history…</p>
            </div>
          ) : unauthorized ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <SearchIcon className="w-12 h-12 opacity-10" />
              <p>Unauthorized. Please log in again.</p>
            </div>
          ) : selectedUser ? (
            currentMessages.length > 0 ? (
              currentMessages.map((msg) => (
                <div
                  key={msg._id || msg.id}
                  onMouseDown={() => startMessagePress(msg)}
                  onMouseUp={cancelMessagePress}
                  onMouseLeave={cancelMessagePress}
                  onTouchStart={() => startMessagePress(msg)}
                  onTouchEnd={cancelMessagePress}
                  onTouchCancel={cancelMessagePress}
                  onContextMenu={(e) => {
                    if (msg.sender === 'me' && !msg.deleted) {
                      e.preventDefault();
                      setActiveMessageActions(msg);
                    }
                  }}
                  className={`flex w-full gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    msg.sender === 'me' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'them' && (
                    <img
                      src={currentChat.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0 self-end mb-5 bg-slate-200"
                    />
                  )}
                  <div
                    className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
                      msg.sender === 'me' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'me'
                          ? 'bg-brand-primary text-white rounded-br-sm'
                          : 'bg-white border border-slate-200/80 text-brand-on-surface rounded-bl-sm shadow-sm'
                      } ${msg.deleted ? 'italic opacity-80' : ''}`}
                    >
                      {msg.message && <p>{msg.message}</p>}
                      {msg.file && (
                        <div className="mt-2 space-y-2">
                          {msg.file.type.startsWith('image/') ? (
                            <a href={msg.file.url} target="_blank" rel="noreferrer" className="block">
                              <img src={msg.file.url} alt="" className="max-w-full rounded-lg max-h-64 object-cover" />
                            </a>
                          ) : msg.file.type.startsWith('video/') ? (
                            <video src={msg.file.url} controls className="max-w-full rounded-lg max-h-64" />
                          ) : (
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <FileText className="w-6 h-6 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{msg.file.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase">
                                  {msg.file.size} • {msg.file.type.split('/')[1]}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.edited && !msg.deleted && (
                        <span className={`block text-[10px] mt-1 ${msg.sender === 'me' ? 'text-white/60' : 'text-slate-400'}`}>
                          edited
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        msg.sender === 'me' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span className="text-[10px] text-slate-400">{msg.time}</span>
                      {msg.sender === 'me' && !msg.deleted && (
                        <CheckCheck
                          className={`w-3.5 h-3.5 shrink-0 ${
                            msg.read ? 'text-sky-500' : 'text-slate-400'
                          }`}
                          aria-label={msg.read ? 'Read' : 'Delivered'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
                <SearchIcon className="w-12 h-12 opacity-10" />
                <p>No messages yet. Send the first message to start this conversation.</p>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <SearchIcon className="w-12 h-12 opacity-10" />
              <p>Select a user to start messaging.</p>
            </div>
          )}

          <div ref={messagesEndRef} />

          {activeMessageActions && (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/30" onClick={() => setActiveMessageActions(null)}>
              <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-semibold mb-3">Message options</p>
                <button
                  onClick={() => handleChooseMessageAction('edit')}
                  className="w-full rounded-2xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white mb-3 hover:brightness-110 transition"
                  type="button"
                >
                  Edit message
                </button>
                <button
                  onClick={() => handleChooseMessageAction('delete')}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white mb-3 hover:brightness-110 transition"
                  type="button"
                >
                  Delete message
                </button>
                <button
                  onClick={() => setActiveMessageActions(null)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <footer className="p-4 md:p-6 bg-transparent">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            {editingMessageId && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3">
                <p>Editing message — press send to update.</p>
                <button
                  onClick={handleCancelEdit}
                  className="text-amber-700 font-semibold hover:text-amber-900"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            )}
            {/* File Preview Section */}
            {pendingFile && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {pendingFile.type.startsWith('image/') ? (
                    <img src={pendingFile.url} alt="" className="w-full h-full object-cover" />
                  ) : pendingFile.type.startsWith('video/') ? (
                    <video src={pendingFile.url} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-800">{pendingFile.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{pendingFile.size} • {pendingFile.type.split('/')[1]}</p>
                </div>
                <button 
                  onClick={() => setPendingFile(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-brand-error flex items-center justify-center transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 md:gap-3 bg-white/70 backdrop-blur-md rounded-2xl px-3 md:px-4 py-2 shadow-lg border border-slate-200/50 focus-within:border-brand-secondary/50 transition-all duration-300">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 mb-0.5 text-slate-400 hover:text-brand-secondary transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
              <textarea
                ref={messageInputRef}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium py-2 outline-none resize-none min-h-[40px] max-h-32 overflow-y-auto leading-relaxed"
                placeholder={selectedUser ? 'Type a message… (Shift+Enter for new line)' : 'Select a user to message'}
                value={inputMessage}
                onChange={handleMessageInputChange}
                onBlur={emitTypingStop}
                onKeyDown={handleMessageKeyDown}
                disabled={!selectedUser || unauthorized}
              />
              <div className="flex items-center gap-1 shrink-0 mb-0.5">
                <button className="p-2 text-slate-400 hover:text-brand-secondary transition-colors hidden sm:block">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!selectedUser || (!inputMessage.trim() && !pendingFile) || isSending || unauthorized}
                  className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shrink-0 shadow-lg shadow-brand-primary/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <SendIcon className="w-5 h-5 translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      </section>

      {/* FAB for Mobile Settings */}
      {!isMobileChatOpen && (
        <button 
          onClick={() => openProfile(currentUser)}
          className="md:hidden fixed right-6 bottom-24 w-14 h-14 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
