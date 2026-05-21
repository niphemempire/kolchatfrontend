const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=verified';

export function toProfileView(user, defaultAvatar = DEFAULT_AVATAR) {
  if (!user) return null;
  return {
    _id: user._id,
    fullName: user.fullName || user.username || 'User',
    username: user.username || '',
    bio: user.bio || '',
    profilePicture: user.profilePicture || '',
    avatar: user.profilePicture || user.avatar || defaultAvatar,
  };
}

export function getDisplayName(user) {
  return user?.fullName || user?.username || 'User';
}
