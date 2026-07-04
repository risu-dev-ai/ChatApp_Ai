export type ThemePreset = "sunset" | "cyberpunk" | "forest" | "neon" | "light" | "sophisticated";

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  encryptionPhrase: string;
  publicKey: string;
  privateKey: string;
  password?: string;
  isLoggedIn: boolean;
  step: "account" | "otp_verify" | "profile" | "security" | "complete";
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'user' or contact ID or 'ai'
  text: string;
  timestamp: string; // ISO String or display string
  status: "sent" | "delivered" | "read" | "pending";
  isE2EE?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "audio" | "video";
  mediaSize?: string;
  mediaOrigSize?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: "direct" | "group" | "ai";
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isE2EE: boolean;
  statusText?: string;
  isOnline?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  isCustom?: boolean;
}

export interface CallLog {
  id: string;
  contactName: string;
  avatarUrl: string;
  type: "incoming" | "outgoing" | "missed";
  time: string;
  duration?: number; // duration in seconds
}

export interface ThemeColors {
  primary: string;
  primaryGradient: string;
  background: string;
  cardBg: string;
  textMain: string;
  textMuted: string;
  accent: string;
  border: string;
  tabActive: string;
}
