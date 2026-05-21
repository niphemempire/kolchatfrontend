export function normalizeMessage(msg, chatPartnerId) {
  return {
    ...msg,
    sender: String(msg.senderId) === String(chatPartnerId) ? 'them' : 'me',
    read: msg.read ?? false,
    edited: msg.edited ?? false,
    deleted: msg.deleted ?? false,
    time: new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

export function getChatPartnerId(message, myUserId) {
  return String(message.senderId) === String(myUserId)
    ? String(message.receiverId)
    : String(message.senderId);
}

export function formatChatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function mapUserToConversation(user, defaultAvatar, overrides = {}) {
  return {
    _id: user._id,
    username: user.username,
    fullName: user.fullName || user.username,
    profilePicture: user.profilePicture || '',
    bio: user.bio || '',
    avatar: user.profilePicture || defaultAvatar,
    lastMessage: overrides.lastMessage ?? 'Start a conversation',
    lastMessageAt: overrides.lastMessageAt ?? new Date().toISOString(),
    unread: overrides.unread ?? 0,
    online: overrides.online ?? true,
    isDraft: overrides.isDraft ?? false,
  };
}

export function mapApiConversation(conv, defaultAvatar) {
  return mapUserToConversation(conv, defaultAvatar, {
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    unread: conv.unread ?? 0,
    bio: conv.bio ?? '',
    isDraft: false,
  });
}

export function sortConversations(list) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );
}

export function mergeConversations(serverList, localDrafts) {
  const byId = new Map();
  serverList.forEach((c) => byId.set(c._id, c));
  localDrafts.forEach((c) => {
    if (!byId.has(c._id)) byId.set(c._id, c);
  });
  return sortConversations(Array.from(byId.values()));
}
