import { Chat, Contact, CallLog } from "./types";

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_CHATS: Chat[] = [
  {
    id: "ai-companion",
    name: "BakBak AI",
    type: "ai",
    avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    lastMessage: "Welcome! I am your premium E2EE AI Chat Assistant. How can I help you today?",
    lastMessageTime: "Just now",
    unreadCount: 0,
    isE2EE: true,
    isOnline: true,
    statusText: "Active AI Engine",
  }
];

export const INITIAL_CALLS: CallLog[] = [];
