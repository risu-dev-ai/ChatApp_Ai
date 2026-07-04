import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Phone,
  CircleDot,
  Grid,
  Plus,
  Search,
  Settings,
  User as UserIcon,
  Users,
  Video,
  Trash2,
  Edit,
  Shield,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Camera,
  Check,
  CheckCheck,
  Lock,
  Unlock,
  Send,
  RefreshCw,
  Key,
  Copy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PhoneOff,
  X,
  Info,
  Sliders,
  Sparkles,
  Wifi,
  WifiOff,
  Database,
  Server,
  HardDrive,
  Cloud,
  Activity,
  Paperclip,
  Mail,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemePreset, User, Message, Chat, Contact, CallLog, ThemeColors } from "./types";
import { THEME_CONFIGS } from "./theme";
import { INITIAL_CONTACTS, INITIAL_CHATS, INITIAL_CALLS } from "./data";
import { encryptMessage, decryptMessage, generateE2EEKeys, generateId, getFormattedTime } from "./utils";
import { BakBakLogo } from "./components/BakBakLogo";

export default function App() {
  // Theme state
  const [themePreset, setThemePreset] = useState<ThemePreset>(() => {
    try {
      const saved = localStorage.getItem("bakbak_theme_preset");
      if (saved) return saved as ThemePreset;
    } catch (e) {
      console.error(e);
    }
    return "sophisticated";
  });
  const theme: ThemeColors = THEME_CONFIGS[themePreset];

  // Offline / Network Simulator states
  const [isOnlineSimulated, setIsOnlineSimulated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bakbak_is_online_simulated");
      return saved !== null ? saved === "true" : true;
    } catch (e) {
      return true;
    }
  });

  const [networkSpeedSim, setNetworkSpeedSim] = useState<"5G" | "4G" | "3G" | "Offline">(() => {
    try {
      const saved = localStorage.getItem("bakbak_network_speed_sim");
      if (saved) return saved as "5G" | "4G" | "3G" | "Offline";
    } catch (e) {}
    return "5G";
  });

  const [mongoDbConnectionString, setMongoDbConnectionString] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("bakbak_mongodb_uri");
      if (saved) return saved;
    } catch (e) {}
    return "mongodb+srv://admin:secure_password@cluster0.bakbak.mongodb.net/bakbak?retryWrites=true&w=majority";
  });

  const [redisConnectionString, setRedisConnectionString] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("bakbak_redis_uri");
      if (saved) return saved;
    } catch (e) {}
    return "redis://:strong_redis_password@redis-cache.bakbak.net:6379";
  });

  const [mediaCompressionLevel, setMediaCompressionLevel] = useState<"high" | "medium" | "off">(() => {
    try {
      const saved = localStorage.getItem("bakbak_media_compression_level");
      if (saved) return saved as "high" | "medium" | "off";
    } catch (e) {}
    return "high";
  });

  // Authentication & Profile States
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem("bakbak_user_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      id: "user",
      username: "test1",
      email: "test1@gmail.com",
      phone: "+91 9142289731",
      displayName: "Test1",
      bio: 'Hey there! I am using BakBak AI.',
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      encryptionPhrase: "sunset-glow-secure-tunnel-key",
      publicKey: "BB_PUB_7E59D1A2C3E4F5G6H7I8J9K0L1M2N3O4",
      privateKey: "BB_PRIV_0987654321FEDCBA9876543210EDCBA987654321",
      isLoggedIn: false,
      step: "account",
    };
  });

  // Login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Create Account inputs
  const [signupUsername, setSignupUsername] = useState("bakbak_user");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupBio, setSignupBio] = useState("Hey there! I am using BakBak AI.");
  const [signupAvatar, setSignupAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80");
  const [signupPhrase, setSignupPhrase] = useState("my-super-secret-passphrase-2026");
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [keyGenProgress, setKeyGenProgress] = useState(0);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpTarget, setOtpTarget] = useState(""); // Email or Phone number being verified
  const [otpChannel, setOtpChannel] = useState<"email" | "telegram" | "whatsapp">("email");
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpStatusMsg, setOtpStatusMsg] = useState("");
  const [otpSimulatedAlert, setOtpSimulatedAlert] = useState(""); // Stores simulated toast for sandbox delivery
  const [sandboxCode, setSandboxCode] = useState("");

  // Core Messenger States
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem("bakbak_chats");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHATS;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem("bakbak_contacts");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CONTACTS;
  });

  const [calls, setCalls] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem("bakbak_calls");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CALLS;
  });
  
  // Message history indexed by chatId
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem("bakbak_messages");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      "santosh-sme": [
        { id: "m1", chatId: "santosh-sme", senderId: "santosh-sme", text: "Hii", timestamp: "Yesterday", status: "read" },
        { id: "m2", chatId: "santosh-sme", senderId: "user", text: "Hello! How is the integration going?", timestamp: "Yesterday", status: "read" },
        { id: "m3", chatId: "santosh-sme", senderId: "santosh-sme", text: "Everything builds successfully. gRPC pipelines are active.", timestamp: "Yesterday", status: "read" },
      ],
      "ankush-2": [
        { id: "m4", chatId: "ankush-2", senderId: "ankush-2", text: "✍️ दिल से दिल की बात करते हैं", timestamp: "06/30/26", status: "read" },
        { id: "m5", chatId: "ankush-2", senderId: "ankush-2", text: "Did you check out the new theme engine updates?", timestamp: "06/30/26", status: "delivered" },
      ],
      "amrita-gupta": [
        { id: "m6", chatId: "amrita-gupta", senderId: "amrita-gupta", text: "Hff", timestamp: "06/29/26", status: "read" },
      ],
      "rahul-45": [
        { id: "m7", chatId: "rahul-45", senderId: "rahul-45", text: "Hii 😊👋", timestamp: "06/28/26", status: "read" },
      ],
      "ffh": [
        { id: "m8", chatId: "ffh", senderId: "ffh", text: "Hii good", timestamp: "06/28/26", status: "read" },
      ],
      "rahul-56": [
        { id: "m9", chatId: "rahul-56", senderId: "rahul-56", text: "Skgs", timestamp: "06/28/26", status: "read" },
      ],
      "ai-companion": [
        {
          id: "m_ai_1",
          chatId: "ai-companion",
          senderId: "ai-companion",
          text: "Hello! Welcome to **BakBak AI** 🚀\n\nI am your secure, end-to-end encrypted Gemini AI assistant. I can help you draft messages, explain technical topics, summarize notes, or design mock assets. Feel free to ask me anything!",
          timestamp: "Just now",
          status: "read",
        }
      ]
    };
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<"chats" | "calls" | "status" | "more">("chats");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [subView, setSubView] = useState<null | "edit-profile" | "create-group" | "sync-contacts" | "e2ee-info" | "db-architecture">(null);
  const [activeCall, setActiveCall] = useState<{
    contactName: string;
    avatarUrl: string;
    type: "audio" | "video";
    status: "ringing" | "connected" | "ended";
    isGroup?: boolean;
    groupParticipants?: string[];
  } | null>(null);

  // Call timers
  const [callDuration, setCallDuration] = useState(0);
  const callIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interactive configurations
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false); // Toggle to show AES cipher representation

  // Group creation inputs
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupContacts, setSelectedGroupContacts] = useState<string[]>([]);

  // Status Story State
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; avatarUrl: string; time: string; text?: string; mediaUrl?: string }>>([
    { id: "s_santosh", name: "Santosh kumar", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", time: "10 minutes ago", text: "Building the gRPC pipeline!" },
    { id: "s_ankush", name: "Ankush.2", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", time: "1 hour ago", text: "Tea break with code ☕" },
    { id: "s_amrita", name: "AmritaGupta", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", time: "4 hours ago", text: "Exploring fresh mountains! 🏔️" },
  ]);
  const [newStatusText, setNewStatusText] = useState("");
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);

  // Contacts Sub-Tabs: 'all' | 'missed' | 'contacts'
  const [callsSubTab, setCallsSubTab] = useState<"all" | "missed" | "contacts">("all");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Floating AI companion state
  const [isFloatingAIOpen, setIsFloatingAIOpen] = useState(false);
  const [floatingAIMessageInput, setFloatingAIMessageInput] = useState("");
  const [floatingAIHistory, setFloatingAIHistory] = useState<Message[]>([]);

  // Initialize floating history with timestamp once computed
  useEffect(() => {
    setFloatingAIHistory([
      {
        id: "f_ai_init",
        chatId: "floating-ai",
        senderId: "ai-companion",
        text: "Hello! I am your **BakBak AI** floating assistant. How can I help you today? I am accessible from any screen!",
        timestamp: getFormattedTime(),
        status: "read",
      }
    ]);
  }, []);

  const [isFloatingAITyping, setIsFloatingAITyping] = useState(false);

  // App Scale Zoom state
  const [appScale, setAppScale] = useState<"small" | "normal" | "large">(() => {
    try {
      const saved = localStorage.getItem("bakbak_app_scale");
      return (saved as "small" | "normal" | "large") || "normal";
    } catch (e) {
      return "normal";
    }
  });

  // Premium Trusted status state
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bakbak_is_premium");
      return saved === "true";
    } catch (e) {
      return false;
    }
  });

  // Camera capture inside app state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Voice Mode States
  const [isTTSMuted, setIsTTSMuted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("bakbak_tts_muted");
      return saved === "true";
    } catch (e) {
      return false;
    }
  });
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [isVoiceSupported] = useState(() => {
    return typeof window !== "undefined" && 
      (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);
  });

  const wakeWordRecRef = useRef<any>(null);
  const activeRecRef = useRef<any>(null);

  // Ref to always hold the latest value of isLoggedIn, isWakeWordActive, isVoiceListening, isFloatingAIOpen
  const voiceStateRef = useRef({
    isLoggedIn: user.isLoggedIn,
    isWakeWordActive,
    isVoiceListening,
    isFloatingAIOpen,
    floatingAIHistory
  });

  useEffect(() => {
    voiceStateRef.current = {
      isLoggedIn: user.isLoggedIn,
      isWakeWordActive,
      isVoiceListening,
      isFloatingAIOpen,
      floatingAIHistory
    };
  }, [user.isLoggedIn, isWakeWordActive, isVoiceListening, isFloatingAIOpen, floatingAIHistory]);

  // Sync TTS Mute preference
  useEffect(() => {
    try {
      localStorage.setItem("bakbak_tts_muted", isTTSMuted ? "true" : "false");
    } catch (e) {}
  }, [isTTSMuted]);

  // Audio chimes generator using standard browser Web Audio API
  const playChime = (type: "wake" | "success" | "listening") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "wake") {
        // High double-beep
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "listening") {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "success") {
        // Upward arpeggio
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context playChime failed", e);
    }
  };

  // Speaks response aloud
  const speakText = (text: string) => {
    if (isTTSMuted) return;
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      // Clean Markdown & code brackets for natural spoken audio
      const cleanText = text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`{1,3}[\s\S]*?`{1,3}/g, "") // remove code blocks
        .replace(/\[.*?\]/g, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Look for a pleasing natural english voice
      const preferred = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) ||
                        voices.find(v => v.lang.startsWith("en-")) ||
                        voices[0];
      if (preferred) {
        utterance.voice = preferred;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis failed", e);
    }
  };

  // Start Background Wake Word Engine
  const startWakeWordEngine = () => {
    if (!isVoiceSupported) return;
    if (wakeWordRecRef.current) return; // Already running

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        console.log("Background wake-word listener started.");
      };

      rec.onresult = (event: any) => {
        const current = voiceStateRef.current;
        // Don't act if user is logged out, wake word is disabled, or actively listening/speaking
        if (!current.isLoggedIn || !current.isWakeWordActive || current.isVoiceListening) {
          return;
        }

        const lastIndex = event.results.length - 1;
        const text = event.results[lastIndex][0].transcript.toLowerCase().trim();
        console.log("Wake word candidate transcript:", text);

        // Check if transcription contains "bakbak help me" or similar wake phrases
        if (text.includes("bakbak help me") || text.includes("bak bak help me") || text.includes("help me bakbak") || text.includes("bakbak help")) {
          console.log("Wake word DETECTED!");
          
          // Play a delightful chime!
          playChime("wake");

          // Open floating AI
          setIsFloatingAIOpen(true);

          // Add a temporary system log or assistant cue
          setFloatingAIHistory((prev) => [
            ...prev,
            {
              id: generateId("f_ai_wake"),
              chatId: "floating-ai",
              senderId: "ai-companion",
              text: "⚡ **Wake word detected!** Listening now...",
              timestamp: getFormattedTime(),
              status: "read",
            }
          ]);

          // Stop background listener temporarily so active microphone can record
          rec.abort();

          // Wait a tiny bit then trigger active voice listening
          setTimeout(() => {
            triggerActiveListening();
          }, 350);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Wake word recognition error:", e.error);
        if (e.error === "not-allowed") {
          // Mic permission denied, turn off wake word to avoid loops
          setIsWakeWordActive(false);
        }
      };

      rec.onend = () => {
        wakeWordRecRef.current = null;
        // Auto restart background listening if still active and logged in
        setTimeout(() => {
          const current = voiceStateRef.current;
          if (current.isLoggedIn && current.isWakeWordActive && !current.isVoiceListening) {
            startWakeWordEngine();
          }
        }, 1200);
      };

      wakeWordRecRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to start wake word engine:", e);
    }
  };

  const stopWakeWordEngine = () => {
    if (wakeWordRecRef.current) {
      try {
        wakeWordRecRef.current.abort();
      } catch (e) {}
      wakeWordRecRef.current = null;
    }
  };

  // Actively listen to user's question, transcribe it, and auto-submit!
  const triggerActiveListening = () => {
    if (!isVoiceSupported) return;
    
    // Stop background listener to free up the microphone resource
    stopWakeWordEngine();
    setIsVoiceListening(true);
    playChime("listening");

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognitionClass();
      rec.continuous = false; // Stop as soon as user pauses speaking
      rec.interimResults = true;
      rec.lang = "en-US";

      let finalResult = "";

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setFloatingAIMessageInput(transcript);
        finalResult = transcript;
      };

      rec.onerror = (e: any) => {
        console.warn("Active listening error:", e.error);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
        activeRecRef.current = null;
        playChime("success");

        // Auto submit if something was transcribed!
        if (finalResult.trim()) {
          submitFloatingVoiceMessage(finalResult);
        } else {
          // No text, restart background listener
          setTimeout(() => {
            if (voiceStateRef.current.isWakeWordActive) {
              startWakeWordEngine();
            }
          }, 800);
        }
      };

      activeRecRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to start active listening:", e);
      setIsVoiceListening(false);
      if (isWakeWordActive) {
        startWakeWordEngine();
      }
    }
  };

  // Submit the voice message to the API and read the response aloud
  const submitFloatingVoiceMessage = async (txt: string) => {
    if (!txt.trim()) return;

    const userMsg: Message = {
      id: generateId("f_usr_msg"),
      chatId: "floating-ai",
      senderId: "user",
      text: txt,
      timestamp: getFormattedTime(),
      status: "read",
    };

    setFloatingAIHistory((prev) => [...prev, userMsg]);
    setIsFloatingAITyping(true);

    try {
      const currentHistory = voiceStateRef.current.floatingAIHistory;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: txt,
          history: [...currentHistory, userMsg].map((m) => ({
            role: m.senderId === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });
      const data = await res.json();
      const aiReply = data.text;

      setFloatingAIHistory((prev) => [
        ...prev,
        {
          id: generateId("f_ai_resp"),
          chatId: "floating-ai",
          senderId: "ai-companion",
          text: aiReply,
          timestamp: getFormattedTime(),
          status: "read",
        },
      ]);

      // Speak response aloud!
      speakText(aiReply);

    } catch (err) {
      setFloatingAIHistory((prev) => [
        ...prev,
        {
          id: generateId("f_ai_err"),
          chatId: "floating-ai",
          senderId: "system",
          text: "Connection issue. Please check network speed or API secrets key setup.",
          timestamp: getFormattedTime(),
          status: "read",
        },
      ]);
    } finally {
      setIsFloatingAITyping(false);
      // Restart background wake-word engine!
      setTimeout(() => {
        if (voiceStateRef.current.isWakeWordActive) {
          startWakeWordEngine();
        }
      }, 1000);
    }
  };

  // Manage automatic wake word activation
  useEffect(() => {
    if (user.isLoggedIn && isWakeWordActive && !isVoiceListening) {
      startWakeWordEngine();
    } else {
      stopWakeWordEngine();
    }

    return () => {
      stopWakeWordEngine();
    };
  }, [user.isLoggedIn, isWakeWordActive]);

  // Message scroll reference
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick sign-in with default account
  const handleQuickSignIn = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: true,
      step: "complete",
    }));
  };

  // Demo Sign-in validations
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter your credentials.");
      return;
    }
    // Simple mock logic
    if (loginEmail === "test1@gmail.com" || loginEmail === "test1" || loginEmail === "you@example.com") {
      setUser((prev) => ({
        ...prev,
        isLoggedIn: true,
        step: "complete",
      }));
      setLoginError("");
    } else {
      // Create account
      setUser((prev) => ({
        ...prev,
        email: loginEmail,
        isLoggedIn: true,
        step: "complete",
      }));
      setLoginError("");
    }
  };

  // Sign out
  const handleSignOut = () => {
    setUser((prev) => ({
      ...prev,
      isLoggedIn: false,
      step: "account",
    }));
    setActiveChatId(null);
    setSubView(null);
  };

  // OTP Operations
  const sendOtpCode = async (channelOverride?: "email" | "telegram" | "whatsapp") => {
    setOtpLoading(true);
    setOtpError("");
    setOtpStatusMsg("");
    setOtpSimulatedAlert("");

    const activeChannel = channelOverride || otpChannel;
    // Target is either Email (for email) or signupPhone (for telegram/whatsapp)
    const target = activeChannel === "email" ? signupEmail : (signupPhone || "+91 9142289731");
    setOtpTarget(target);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeChannel === "email" ? "email" : "phone",
          target,
          channel: activeChannel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpStatusMsg(data.statusDetails || "OTP code sent successfully!");
        setSandboxCode(data.otp || "");
        if (data.simulatedNotification) {
          setOtpSimulatedAlert(data.simulatedNotification);
        }
      } else {
        setOtpError(data.error || "Failed to send OTP code.");
      }
    } catch (err) {
      setOtpError("Network error sending OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtpCode = async () => {
    if (!otpInput) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    setOtpStatusMsg("");

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: otpTarget,
          otp: otpInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Correctly verified! Go to profile step
        setUser((prev) => ({
          ...prev,
          username: signupUsername,
          email: signupEmail,
          phone: signupPhone || "+91 9142289731",
          step: "profile",
        }));
      } else {
        setOtpError(data.error || "Verification failed. Please try again.");
      }
    } catch (err) {
      setOtpError("Network error verifying OTP code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Custom step navigation for SignUp
  const advanceSignupStep = () => {
    if (user.step === "account") {
      if (!signupEmail) {
        alert("Email Address is required.");
        return;
      }
      setUser((prev) => ({
        ...prev,
        username: signupUsername,
        email: signupEmail,
        phone: signupPhone || "+91 9142289731",
        step: "otp_verify",
      }));
      // Set the default verification targets
      const defaultTarget = signupEmail;
      setOtpTarget(defaultTarget);
      setOtpChannel("email");
      setOtpSent(false);
      setOtpInput("");
      setOtpError("");
      setOtpStatusMsg("");
      setOtpSimulatedAlert("");
      setSandboxCode("");
    } else if (user.step === "otp_verify") {
      verifyOtpCode();
    } else if (user.step === "profile") {
      setUser((prev) => ({
        ...prev,
        displayName: signupDisplayName || "BakBak User",
        bio: signupBio,
        avatarUrl: capturedImage || signupAvatar,
        step: "security",
      }));
    } else if (user.step === "security") {
      // Trigger encryption keys animation
      setIsGeneratingKeys(true);
      setKeyGenProgress(10);
      
      const interval = setInterval(() => {
        setKeyGenProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              const generated = generateE2EEKeys();
              setUser((prev) => ({
                ...prev,
                encryptionPhrase: signupPhrase,
                publicKey: generated.publicKey,
                privateKey: generated.privateKey,
                isLoggedIn: true,
                step: "complete",
              }));
              setIsGeneratingKeys(false);
            }, 500);
            return 100;
          }
          return p + 15;
        });
      }, 200);
    }
  };

  // Enable Camera
  const startCamera = async () => {
    setIsCameraActive(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Could not access camera. Please check camera permissions in metadata or browser.");
    }
  };

  // Close Camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  // Take photo
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = 300;
        canvas.height = 300;
        context.drawImage(video, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Place simulated call
  const triggerCall = (contactName: string, avatarUrl: string, type: "audio" | "video", isGroup: boolean = false) => {
    setActiveCall({
      contactName,
      avatarUrl,
      type,
      status: "ringing",
      isGroup,
    });
    setCallDuration(0);

    // Call acceptance simulation
    setTimeout(() => {
      setActiveCall((prev) => {
        if (prev && prev.status === "ringing") {
          return { ...prev, status: "connected" };
        }
        return prev;
      });
      // Start duration count
      callIntervalRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }, 2500);
  };

  // End active call
  const endCall = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
    }
    
    if (activeCall) {
      // Add call log
      const newLog: CallLog = {
        id: generateId("call"),
        contactName: activeCall.contactName,
        avatarUrl: activeCall.avatarUrl,
        type: activeCall.status === "ringing" ? "missed" : "outgoing",
        time: "Just now",
        duration: callDuration > 0 ? callDuration : undefined,
      };
      setCalls((prev) => [newLog, ...prev]);
    }

    setActiveCall((prev) => (prev ? { ...prev, status: "ended" } : null));
    setTimeout(() => {
      setActiveCall(null);
      setCallDuration(0);
    }, 800);
  };

  // Scroll to bottom on message updates
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChatId, isTyping]);

  // Clean up call interval on unmount
  useEffect(() => {
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, []);

  // Save core state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("bakbak_theme_preset", themePreset);
    } catch (e) {
      console.error(e);
    }
  }, [themePreset]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_is_online_simulated", isOnlineSimulated ? "true" : "false");
    } catch (e) {
      console.error(e);
    }
  }, [isOnlineSimulated]);

  // Automated Offline Sync Engine: Sync pending local state to MongoDB / Redis when online
  useEffect(() => {
    if (isOnlineSimulated) {
      // Find all pending messages across all chats
      const pendingMessages = Object.entries(messages).flatMap(([chatId, thread]) =>
        (thread as Message[]).filter((m) => m.status === "pending").map((m) => ({ chatId, m }))
      );

      if (pendingMessages.length > 0) {
        const timer = setTimeout(() => {
          setMessages((prev) => {
            const updated = { ...prev };
            for (const key in updated) {
              updated[key] = (updated[key] as Message[]).map((m) =>
                m.status === "pending" ? { ...m, status: "sent" } : m
              );
            }
            return updated;
          });

          // Trigger simulated reply from the contact/AI for those synced messages
          pendingMessages.forEach(({ chatId, m }) => {
            const chat = chats.find((c) => c.id === chatId);
            if (!chat) return;

            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              const isE2EEActive = chat.isE2EE;

              if (chat.type === "ai") {
                const aiResp = `[Synced via Redis Cache & Sharded MongoDB Cluster] I received your buffered offline message: "${m.text}". High-scale network synchronization is fully complete! Let's resume our conversation.`;
                const encryptedResp = isE2EEActive ? encryptMessage(aiResp, user.encryptionPhrase) : aiResp;

                setMessages((prev) => ({
                  ...prev,
                  [chatId]: [
                    ...(prev[chatId] || []),
                    {
                      id: generateId("synced_resp"),
                      chatId,
                      senderId: "ai-companion",
                      text: encryptedResp,
                      timestamp: getFormattedTime(),
                      status: "read",
                      isE2EE: isE2EEActive,
                    },
                  ],
                }));
              } else {
                const friendResp = `Hey! Just got your message that was queued in offline mode. The MongoDB/Redis pipelines synced it perfectly. 👍`;
                const encryptedResp = isE2EEActive ? encryptMessage(friendResp, user.encryptionPhrase) : friendResp;

                setMessages((prev) => ({
                  ...prev,
                  [chatId]: [
                    ...(prev[chatId] || []),
                    {
                      id: generateId("synced_resp"),
                      chatId,
                      senderId: chatId,
                      text: encryptedResp,
                      timestamp: getFormattedTime(),
                      status: "read",
                      isE2EE: isE2EEActive,
                    },
                  ],
                }));
              }
            }, 1000);
          });
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [isOnlineSimulated, messages, chats, user.encryptionPhrase]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_user_profile", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_chats", JSON.stringify(chats));
    } catch (e) {
      console.error(e);
    }
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_contacts", JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_calls", JSON.stringify(calls));
    } catch (e) {
      console.error(e);
    }
  }, [calls]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_messages", JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_app_scale", appScale);
    } catch (e) {}
  }, [appScale]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_is_premium", isPremium ? "true" : "false");
    } catch (e) {}
  }, [isPremium]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_network_speed_sim", networkSpeedSim);
    } catch (e) {}
  }, [networkSpeedSim]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_mongodb_uri", mongoDbConnectionString);
    } catch (e) {}
  }, [mongoDbConnectionString]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_redis_uri", redisConnectionString);
    } catch (e) {}
  }, [redisConnectionString]);

  useEffect(() => {
    try {
      localStorage.setItem("bakbak_media_compression_level", mediaCompressionLevel);
    } catch (e) {}
  }, [mediaCompressionLevel]);

  // Sync Address Book contacts
  const handleSyncContacts = () => {
    setSubView("sync-contacts");
  };

  // Trigger real sync
  const [isSyncingProcess, setIsSyncingProcess] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const triggerSyncDatabase = () => {
    setIsSyncingProcess(true);
    setSyncProgress(10);
    const interval = setInterval(() => {
      setSyncProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Add some fresh automated contacts
            const syncedContacts: Contact[] = [
              {
                id: "sc_deepak",
                name: "Deepak Choudhary",
                username: "deepak_c",
                email: "deepak@example.com",
                phone: "+91 94140 28400",
                bio: "Full Stack Dev | Flutter Expert 📱",
                avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&auto=format&fit=crop&q=80",
                isCustom: true,
              },
              {
                id: "sc_priya",
                name: "Priya Sharma",
                username: "priya_s",
                email: "priya@gmail.com",
                phone: "+91 99991 12345",
                bio: "Hey! Let's build something next-gen with AI",
                avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
                isCustom: true,
              }
            ];

            // Filter out existing ones
            setContacts((prev) => {
              const ids = new Set(prev.map(c => c.id));
              const filtered = syncedContacts.filter(sc => !ids.has(sc.id));
              return [...prev, ...filtered];
            });

            setIsSyncingProcess(false);
            setSubView(null);
            alert("Local contacts synchronized successfully! Placed 2 verified friends in your address book.");
          }, 300);
          return 100;
        }
        return p + 20;
      });
    }, 250);
  };

  // Create Group Chat
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert("Please enter a group name.");
      return;
    }
    if (selectedGroupContacts.length === 0) {
      alert("Please select at least 1 contact.");
      return;
    }

    const newGroupId = generateId("group");
    const newChat: Chat = {
      id: newGroupId,
      name: newGroupName,
      type: "group",
      avatarUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150&auto=format&fit=crop&q=80",
      lastMessage: `${user.displayName} created this group.`,
      lastMessageTime: "Just now",
      unreadCount: 0,
      isE2EE: false,
      statusText: `${selectedGroupContacts.length + 1} members`,
    };

    setChats((prev) => [newChat, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newGroupId]: [
        {
          id: generateId("msg"),
          chatId: newGroupId,
          senderId: "system",
          text: `🛡️ Group created. End-to-end encryption is not active for standard multi-user groups. Use Direct Secret Chats for maximum E2EE safety.`,
          timestamp: "Just now",
          status: "read",
        },
        {
          id: generateId("msg"),
          chatId: newGroupId,
          senderId: "user",
          text: `Welcome everyone to the ${newGroupName} chat!`,
          timestamp: "Just now",
          status: "sent",
        }
      ]
    }));

    setNewGroupName("");
    setSelectedGroupContacts([]);
    setSubView(null);
    setActiveChatId(newGroupId);
  };

  // Add custom manual contact
  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      alert("Name and Phone Number are required.");
      return;
    }

    const contactId = generateId("c");
    const freshContact: Contact = {
      id: contactId,
      name: newContactName,
      username: newContactName.toLowerCase().replace(/\s+/g, "_"),
      email: newContactEmail || `${contactId}@example.com`,
      phone: newContactPhone,
      bio: "Hey there! I am using BakBak AI.",
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`,
      isCustom: true,
    };

    setContacts((prev) => [freshContact, ...prev]);
    
    // Add a corresponding chat in list
    const newChat: Chat = {
      id: contactId,
      name: newContactName,
      type: "direct",
      avatarUrl: freshContact.avatarUrl,
      lastMessage: "Tap to begin secure chat",
      lastMessageTime: "Just now",
      unreadCount: 0,
      isE2EE: true,
      isOnline: true,
      statusText: "online",
    };

    setChats((prev) => [newChat, ...prev]);
    setNewContactName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setShowAddContactModal(false);
  };

  // Delete Contact
  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact and active chat?")) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    }
  };

  // Submit Text Message in chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    const msgId = generateId("m");
    const rawText = messageInput;
    setMessageInput("");

    // E2EE logic: if E2EE mode is enabled for the direct chat, encrypt the payload client-side!
    const isE2EEActive = currentChat.isE2EE;
    const finalStoredText = isE2EEActive
      ? encryptMessage(rawText, user.encryptionPhrase)
      : rawText;

    const newUserMessage: Message = {
      id: msgId,
      chatId: activeChatId,
      senderId: "user",
      text: finalStoredText,
      timestamp: getFormattedTime(),
      status: "pending",
      isE2EE: isE2EEActive,
    };

    // Append user message instantly
    setMessages((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newUserMessage],
    }));

    // Transition pending to sent ONLY if online, with networkSpeedSim-based latency
    if (isOnlineSimulated) {
      let delay = 100;
      if (networkSpeedSim === "4G") delay = 450;
      if (networkSpeedSim === "3G") delay = 1400;

      setTimeout(() => {
        setMessages((prev) => {
          const thread = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: thread.map((m) => (m.id === msgId ? { ...m, status: "sent" } : m)),
          };
        });
      }, delay);
    }

    // Update last message in chat list
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: isE2EEActive ? `🔒 [E2EE Cipher] ${finalStoredText.substring(0, 20)}...` : rawText,
              lastMessageTime: "Just now",
            }
          : c
      )
    );

    // AI Chat trigger or mock respondent ONLY if online
    if (!isOnlineSimulated) return;

    if (currentChat.type === "ai") {
      setIsTyping(true);

      // Get history for Gemini API
      const thread = messages[activeChatId] || [];
      const historyPayload = thread
        .filter((m) => m.senderId !== "system")
        .slice(-6) // take last 6 messages
        .map((m) => {
          // Decrypt if it was stored encrypted
          const decryptedContent = m.isE2EE
            ? decryptMessage(m.text, user.encryptionPhrase)
            : m.text;
          return {
            role: m.senderId === "user" ? "user" : "assistant",
            content: decryptedContent,
          };
        });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: rawText,
            history: historyPayload,
          }),
        });

        const data = await res.json();
        setIsTyping(false);

        if (data.error) {
          throw new Error(data.error);
        }

        const aiResponseId = generateId("ai_m");
        const aiResponseText = isE2EEActive
          ? encryptMessage(data.text, user.encryptionPhrase)
          : data.text;

        const newAiMessage: Message = {
          id: aiResponseId,
          chatId: activeChatId,
          senderId: "ai-companion",
          text: aiResponseText,
          timestamp: getFormattedTime(),
          status: "read",
          isE2EE: isE2EEActive,
        };

        setMessages((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), newAiMessage],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: isE2EEActive ? `🔒 [E2EE Cipher] ${aiResponseText.substring(0, 20)}...` : data.text,
                  lastMessageTime: "Just now",
                }
              : c
          )
        );
      } catch (err) {
        setIsTyping(false);
        const errorMsgId = generateId("ai_err");
        const errText = "Error connecting to AI Server. Please ensure your Express environment is running properly.";
        const encryptedErr = isE2EEActive ? encryptMessage(errText, user.encryptionPhrase) : errText;

        setMessages((prev) => ({
          ...prev,
          [activeChatId]: [
            ...(prev[activeChatId] || []),
            {
              id: errorMsgId,
              chatId: activeChatId,
              senderId: "system",
              text: encryptedErr,
              timestamp: getFormattedTime(),
              status: "read",
              isE2EE: isE2EEActive,
            },
          ],
        }));
      }
    } else {
      // Direct message mock responses to simulate real-time interactive chats
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const autoTextResponses = [
          "Got it! Let's discuss this later.",
          "Perfect. That matches the Room DB offline queue logic perfectly! 👍",
          "Awesome. Let me verify the AES-256 keys again.",
          "✍️ दिल से दिल की बात करते हैं - Indeed, let's chat!",
          "Yes! E2EE feels highly secure here.",
        ];
        const randomResponse = autoTextResponses[Math.floor(Math.random() * autoTextResponses.length)];
        const aiResponseId = generateId("resp");
        const finalStoredResp = isE2EEActive
          ? encryptMessage(randomResponse, user.encryptionPhrase)
          : randomResponse;

        const mockResponseMsg: Message = {
          id: aiResponseId,
          chatId: activeChatId,
          senderId: activeChatId,
          text: finalStoredResp,
          timestamp: getFormattedTime(),
          status: "read",
          isE2EE: isE2EEActive,
        };

        setMessages((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), mockResponseMsg],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: isE2EEActive ? `🔒 [E2EE Cipher] ${finalStoredResp.substring(0, 20)}...` : randomResponse,
                  lastMessageTime: "Just now",
                  unreadCount: c.unreadCount + 1,
                }
              : c
          )
        );
      }, 1500);
    }
  };

  // Attachment and Media compression handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    const origSizeInMb = file.size / (1024 * 1024);
    const origSizeLabel = `${origSizeInMb.toFixed(2)} MB`;

    // Simulate on-the-fly edge/CDN compression
    let compressedSizeInMb = origSizeInMb;
    if (mediaCompressionLevel === "high") {
      compressedSizeInMb = origSizeInMb * 0.15; // 85% saved
    } else if (mediaCompressionLevel === "medium") {
      compressedSizeInMb = origSizeInMb * 0.50; // 50% saved
    }
    const compSizeLabel = `${compressedSizeInMb.toFixed(2)} MB`;

    // Detect media type
    let fileType: "image" | "audio" | "video" = "image";
    if (file.type.startsWith("audio/")) {
      fileType = "audio";
    } else if (file.type.startsWith("video/")) {
      fileType = "video";
    }

    const localUrl = URL.createObjectURL(file);
    const msgId = generateId("m_media");

    const isE2EEActive = currentChat.isE2EE;
    const mediaPrompt = `Attached a compressed ${fileType} (${compSizeLabel})`;
    const finalStoredText = isE2EEActive
      ? encryptMessage(mediaPrompt, user.encryptionPhrase)
      : mediaPrompt;

    const newMediaMessage: Message = {
      id: msgId,
      chatId: activeChatId,
      senderId: "user",
      text: finalStoredText,
      timestamp: getFormattedTime(),
      status: "pending",
      isE2EE: isE2EEActive,
      mediaUrl: localUrl,
      mediaType: fileType,
      mediaSize: compSizeLabel,
      mediaOrigSize: origSizeLabel,
    };

    // Append message with media payload instantly
    setMessages((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMediaMessage],
    }));

    // Transition pending to sent ONLY if online, with networkSpeedSim-based latency
    if (isOnlineSimulated) {
      let delay = 100;
      if (networkSpeedSim === "4G") delay = 450;
      if (networkSpeedSim === "3G") delay = 1400;

      setTimeout(() => {
        setMessages((prev) => {
          const thread = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: thread.map((m) => (m.id === msgId ? { ...m, status: "sent" } : m)),
          };
        });
      }, delay);
    }

    // Update last message in chat list
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: isE2EEActive ? `🔒 [E2EE Media] ${mediaPrompt}` : mediaPrompt,
              lastMessageTime: "Just now",
            }
          : c
      )
    );

    // AI Chat trigger or mock respondent ONLY if online
    if (!isOnlineSimulated) return;

    if (currentChat.type === "ai") {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiResponseId = generateId("ai_m");
        const aiText = `[Cloudinary Media CDN Sync Node] Received your ${fileType} file successfully!\n- Original Size: ${origSizeLabel}\n- Compressed Size: ${compSizeLabel}\n- Saved bandwidth: ${mediaCompressionLevel === "high" ? "85% saved (Cloudinary f_auto, q_auto WebP)" : mediaCompressionLevel === "medium" ? "50% saved" : "0% (Raw size)"}\n\nAwesome work scaling the systems with Cloudinary!`;
        const aiResponseText = isE2EEActive
          ? encryptMessage(aiText, user.encryptionPhrase)
          : aiText;

        const newAiMessage: Message = {
          id: aiResponseId,
          chatId: activeChatId,
          senderId: "ai-companion",
          text: aiResponseText,
          timestamp: getFormattedTime(),
          status: "read",
          isE2EE: isE2EEActive,
        };

        setMessages((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), newAiMessage],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: isE2EEActive ? `🔒 [E2EE Cipher] ${aiResponseText.substring(0, 20)}...` : aiText,
                  lastMessageTime: "Just now",
                }
              : c
          )
        );
      }, 2000);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const friendResp = `Nice! I received your attached ${fileType} (${compSizeLabel}). Cloudinary Asset CDN served it in under 15ms. Looks perfect!`;
        const friendResponseText = isE2EEActive
          ? encryptMessage(friendResp, user.encryptionPhrase)
          : friendResp;

        const mockResponseMsg: Message = {
          id: generateId("resp"),
          chatId: activeChatId,
          senderId: activeChatId,
          text: friendResponseText,
          timestamp: getFormattedTime(),
          status: "read",
          isE2EE: isE2EEActive,
        };

        setMessages((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), mockResponseMsg],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: isE2EEActive ? `🔒 [E2EE Cipher] ${friendResponseText.substring(0, 20)}...` : friendResp,
                  lastMessageTime: "Just now",
                  unreadCount: c.unreadCount + 1,
                }
              : c
          )
        );
      }, 1500);
    }

    // Reset file input value so same file can be chosen again
    e.target.value = "";
  };

  // Add standard text status story
  const handleAddStatus = () => {
    if (!newStatusText.trim()) return;
    const newStory = {
      id: generateId("story"),
      name: user.displayName,
      avatarUrl: user.avatarUrl,
      time: "Just now",
      text: newStatusText,
    };
    setStatuses((prev) => [newStory, ...prev]);
    setNewStatusText("");
    setShowAddStatusModal(false);
  };

  // Filter contacts by query
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter chats by query
  const filteredChats = chats.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Active chat details
  const activeChat = chats.find((c) => c.id === activeChatId);
  const activeChatMessages = activeChatId ? messages[activeChatId] || [] : [];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-2 sm:p-6 transition-all duration-300"
      style={{
        background: `radial-gradient(circle at top, ${theme.cardBg} 0%, ${theme.background} 100%)`,
        color: theme.textMain,
        fontFamily: "var(--font-sans)",
      }}
      id="root-container"
    >
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] -top-20 -left-20 animate-pulse"
          style={{ background: theme.primary }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full blur-[90px] bottom-10 right-10 opacity-70"
          style={{ background: theme.accent }}
        />
      </div>

      {/* Main Container - Renders Device Frame or Login Screen */}
      <div className="relative w-full max-w-sm sm:max-w-md aspect-[9/19] h-[820px] bg-black rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[6px] border-neutral-800 overflow-hidden flex flex-col">
        {/* Device Top Speaker Notch / Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 pulsate" />
            <span className="text-[9px] font-mono text-neutral-400">1 device</span>
          </div>
          <div className="w-4 h-1 bg-neutral-900 rounded-full" />
        </div>

        {/* Device Status Bar */}
        <div className="w-full h-8 flex justify-between items-center px-6 pt-2 text-[11px] font-medium font-mono text-neutral-400 select-none z-30">
          <span>9:05 AM</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOnlineSimulated(p => !p)}
              className="text-[8px] bg-neutral-900 px-1.5 py-0.5 rounded transition-all hover:bg-neutral-800 flex items-center gap-1 font-mono border border-neutral-800"
              title="Click to toggle Offline Mode"
            >
              <span className={`w-1 h-1 rounded-full ${isOnlineSimulated ? "bg-emerald-400" : "bg-amber-500 animate-pulse"}`} />
              <span className={isOnlineSimulated ? "text-emerald-400" : "text-amber-500"}>
                {isOnlineSimulated ? "5G (Online)" : "OFFLINE"}
              </span>
            </button>
            <span>E2EE</span>
            <div className="w-5 h-2.5 border border-neutral-700 rounded-sm p-0.5 flex items-center">
              <div className={`w-full h-full rounded-2xs ${isOnlineSimulated ? "bg-emerald-400" : "bg-amber-500"}`} />
            </div>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className={`flex-1 w-full rounded-[38px] overflow-hidden bg-zinc-950 flex flex-col relative transition-all duration-200 ${
          appScale === "small" ? "scale-small" : appScale === "large" ? "scale-large" : ""
        }`}>
          
          {/* NOT LOGGED IN / SIGNUP WORKFLOW */}
          {!user.isLoggedIn ? (
            <div
              className="absolute inset-0 flex flex-col justify-between p-6 overflow-y-auto"
              style={{ background: theme.background }}
              id="auth-flow"
            >
              {/* Logo / Header */}
              <div className="flex flex-col items-center text-center mt-6">
                {/* Purple Smiley Logo from screenshots */}
                <div className="relative w-16 h-16 bg-neutral-900 rounded-3xl flex items-center justify-center border border-neutral-800 shadow-xl mb-4 group overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: theme.primaryGradient }}
                  />
                  <BakBakLogo size={48} theme="dark" />
                </div>

                <h1 className="text-2xl font-bold font-display tracking-tight text-white mb-1">
                  {user.step === "account" ? "Create Account" : user.step === "otp_verify" ? "OTP Verification" : user.step === "profile" ? "Build Profile" : "Security Check"}
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-4">
                  PREMIUM E2EE CHAT CLIENT
                </p>
              </div>

              {/* Step Indicators for Sign Up */}
              {user.step !== "complete" && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[
                    { label: "1", name: "ACCOUNT" },
                    { label: "2", name: "PROFILE" },
                    { label: "3", name: "SECURITY" },
                  ].map((s, idx) => {
                    const isActive =
                      (idx === 0 && (user.step === "account" || user.step === "otp_verify")) ||
                      (idx === 1 && user.step === "profile") ||
                      (idx === 2 && user.step === "security");
                    const isDone =
                      (idx === 0 && user.step !== "account" && user.step !== "otp_verify") ||
                      (idx === 1 && user.step === "security");

                    return (
                      <div key={idx} className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                            isActive
                              ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110"
                              : isDone
                              ? "bg-zinc-800 border-zinc-800 text-emerald-400"
                              : "border-zinc-800 text-zinc-600 bg-transparent"
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : s.label}
                        </div>
                        {idx < 2 && <div className="w-8 h-[1px] bg-zinc-800 mx-1" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* INPUT FIELDS / ACTION PANEL */}
              <div className="flex-1 flex flex-col justify-center">
                {user.step === "account" && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="bakbak_user"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 font-mono"
                      />
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        Letters, numbers, dots, underscores only
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Email Address <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                      />
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        Optional — for recovery and sync
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={advanceSignupStep}
                      className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all transform hover:scale-[1.01] mt-4 flex items-center justify-center gap-1 shadow-lg"
                      style={{ background: theme.primaryGradient }}
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {user.step === "otp_verify" && (
                  <div className="space-y-4">
                    {/* Sandbox Notice Banner if otpSimulatedAlert is active */}
                    {otpSimulatedAlert && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 animate-bounce">
                        <span className="text-base">🔔</span>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-amber-400 font-sans">Simulated Delivery Alert</p>
                          <p className="text-[10px] text-zinc-300 font-mono leading-tight mt-0.5">
                            {otpSimulatedAlert}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        BakBak secures chats with military-grade E2EE. To prevent bot registration, please verify your identity via **Email**, **Telegram**, or **WhatsApp**. Only one verification is required.
                      </p>
                    </div>

                    {/* Channel Selector */}
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                        Select Verification Channel
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpChannel("email");
                            setOtpSent(false);
                            setOtpInput("");
                            setOtpError("");
                            setOtpStatusMsg("");
                            setOtpSimulatedAlert("");
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                            otpChannel === "email"
                              ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Mail className="w-4 h-4 mb-1" />
                          Email
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOtpChannel("telegram");
                            setOtpSent(false);
                            setOtpInput("");
                            setOtpError("");
                            setOtpStatusMsg("");
                            setOtpSimulatedAlert("");
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                            otpChannel === "telegram"
                              ? "bg-sky-500/10 border-sky-500 text-sky-400 shadow-md shadow-sky-500/5"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Send className="w-4 h-4 mb-1 text-sky-400" />
                          Telegram
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOtpChannel("whatsapp");
                            setOtpSent(false);
                            setOtpInput("");
                            setOtpError("");
                            setOtpStatusMsg("");
                            setOtpSimulatedAlert("");
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                            otpChannel === "whatsapp"
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 mb-1 text-emerald-400" />
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Status Target Info */}
                    <div className="p-2.5 bg-zinc-900/40 rounded-xl border border-zinc-850 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">Target Dest:</span>
                      <span className="text-zinc-300 font-bold max-w-[200px] truncate">
                        {otpChannel === "email" ? (signupEmail || "No Email set") : (signupPhone || "+91 9142289731 (Default)")}
                      </span>
                    </div>

                    {/* Send Code button */}
                    {!otpSent ? (
                      <button
                        type="button"
                        disabled={otpLoading}
                        onClick={() => sendOtpCode()}
                        className="w-full rounded-xl py-3 text-xs font-bold text-black bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {otpLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Key className="w-3.5 h-3.5" />
                        )}
                        Send Verification Code
                      </button>
                    ) : (
                      <div className="space-y-3.5">
                        {/* OTP Input Form */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-medium text-zinc-400">
                              Enter 6-Digit Verification OTP
                            </label>
                            <button
                              type="button"
                              onClick={() => sendOtpCode()}
                              className="text-[10px] text-amber-500 hover:underline"
                            >
                              Resend Code
                            </button>
                          </div>
                          <input
                            type="text"
                            maxLength={6}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 123456"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-bold text-amber-400 tracking-[8px] focus:outline-none focus:border-amber-500 transition-colors font-mono placeholder:text-zinc-700"
                          />
                        </div>

                        {/* Sandbox OTP Helper badge */}
                        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wide">🛠️ Sandbox Testing Console</span>
                            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold font-mono">
                              OTP: Available
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-500 font-sans leading-tight">
                            To ensure an uninterrupted local dev workflow, use the generated OTP code from our secure memory stack:
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <code className="text-sm font-bold text-amber-400 font-mono tracking-widest bg-zinc-950 px-3 py-1 rounded border border-zinc-800 select-all">
                              {sandboxCode || "123456"}
                            </code>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="button"
                          disabled={otpLoading}
                          onClick={verifyOtpCode}
                          className="w-full rounded-xl py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-1 shadow-lg"
                          style={{ background: theme.primaryGradient }}
                        >
                          {otpLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Verify & Continue
                        </button>
                      </div>
                    )}

                    {/* Status / Error messages */}
                    {otpError && (
                      <p className="text-[11px] text-red-400 font-mono text-center bg-red-950/20 border border-red-950 py-1.5 px-3 rounded-lg">
                        ⚠️ {otpError}
                      </p>
                    )}
                    {otpStatusMsg && !otpError && (
                      <p className="text-[10px] text-emerald-400 font-mono text-center bg-emerald-950/20 border border-emerald-950 py-1.5 px-3 rounded-lg leading-tight">
                        ✅ {otpStatusMsg}
                      </p>
                    )}

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUser((p) => ({ ...p, step: "account" }));
                        setOtpSent(false);
                        setOtpInput("");
                        setOtpError("");
                        setOtpStatusMsg("");
                        setOtpSimulatedAlert("");
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-850 mt-1"
                    >
                      Back to Account Details
                    </button>
                  </div>
                )}

                {user.step === "profile" && (
                  <div className="space-y-4">
                    {/* Capture / Avatar Upload Selection */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center group shadow-inner">
                        {capturedImage ? (
                          <img src={capturedImage} alt="captured" className="w-full h-full object-cover" />
                        ) : signupAvatar ? (
                          <img src={signupAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-zinc-700" />
                        )}
                        <button
                          onClick={startCamera}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white transition-opacity duration-200"
                        >
                          <Camera className="w-5 h-5 mb-1 text-amber-500" />
                          TAKE PHOTO
                        </button>
                      </div>

                      {/* Video Streaming capture */}
                      {isCameraActive && (
                        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                          <div className="relative w-full max-w-xs aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={captureSnapshot}
                              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-xl transition-all"
                            >
                              SNAP IMAGE
                            </button>
                            <button
                              onClick={stopCamera}
                              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-zinc-400">
                        Tap avatar to capture real-time webcam photo
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={signupDisplayName}
                        onChange={(e) => setSignupDisplayName(e.target.value)}
                        placeholder="e.g. Test1"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Bio / About
                      </label>
                      <textarea
                        value={signupBio}
                        onChange={(e) => setSignupBio(e.target.value)}
                        placeholder="I am using BakBak AI."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 h-16 resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setUser((p) => ({ ...p, step: "account" }))}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-xs font-semibold text-zinc-400 hover:bg-zinc-850"
                      >
                        Back
                      </button>
                      <button
                        onClick={advanceSignupStep}
                        className="flex-[2] rounded-xl py-3 text-xs font-bold text-white transition-all"
                        style={{ background: theme.primaryGradient }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {user.step === "security" && (
                  <div className="space-y-4">
                    {isGeneratingKeys ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                        <h3 className="text-sm font-semibold text-white mb-2">
                          Generating AES-256 E2EE Cryptographic Tunnel...
                        </h3>
                        <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                          Computing Diffie-Hellman safe key values for double ratchet synchronization.
                        </p>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${keyGenProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 mt-2">
                          {keyGenProgress}% Completed
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-zinc-900/60 border border-amber-500/10 p-3 rounded-xl flex items-start gap-3">
                          <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-white">E2EE Key-Exchange Phrase</h4>
                            <p className="text-[10px] text-zinc-500">
                              This secret string initializes your client-side ratchet. Keep it safe to restore secret chats.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                            Encryption Phrase
                          </label>
                          <input
                            type="text"
                            value={signupPhrase}
                            onChange={(e) => setSignupPhrase(e.target.value)}
                            placeholder="Enter a secure phrase"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                          />
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => setUser((p) => ({ ...p, step: "profile" }))}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-3 text-xs font-semibold text-zinc-400 hover:bg-zinc-850"
                          >
                            Back
                          </button>
                          <button
                            onClick={advanceSignupStep}
                            className="flex-[2] rounded-xl py-3 text-xs font-bold text-white transition-all shadow-md"
                            style={{ background: theme.primaryGradient }}
                          >
                            Generate Keys & Sign In
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* DEMO BYPASS LINKS */}
              <div className="text-center pt-4 border-t border-zinc-900">
                <p className="text-xs text-zinc-500">
                  Already have an account?{" "}
                  <button
                    onClick={handleQuickSignIn}
                    className="font-semibold text-amber-500 hover:underline"
                  >
                    Sign In (Demo Account)
                  </button>
                </p>
              </div>
            </div>
          ) : (
            
            /* ACTIVE MESSENGER LOGGED IN SHELL */
            <div className="flex-1 w-full flex flex-col relative overflow-hidden" style={{ background: theme.background }}>
              
              {/* TOP HEADER MODULE */}
              <header className="px-4 py-3 border-b flex justify-between items-center bg-zinc-950 z-10" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-900/50 flex items-center justify-center border border-purple-500/20 shadow overflow-hidden">
                    <BakBakLogo size={24} theme="dark" />
                  </div>
                  <h2 className="text-lg font-bold font-display tracking-tight text-white">BakBak AI</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab("more");
                      setSubView(null);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* MAIN TAB SWITCH PANEL */}
              <main className="flex-1 overflow-y-auto flex flex-col relative pb-16">
                
                {/* 1. CHATS TAB VIEW */}
                {activeTab === "chats" && !subView && (
                  <div className="flex-1 flex flex-col">
                    {!isOnlineSimulated && (
                      <div className="bg-amber-950/40 border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between text-[10px] text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                          <span>Offline Mode Active (SQLite Room Cache)</span>
                        </div>
                        <button 
                          onClick={() => setIsOnlineSimulated(true)}
                          className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 rounded border border-amber-500/30 font-semibold transition-all cursor-pointer text-[9px]"
                        >
                          Go Online
                        </button>
                      </div>
                    )}
                    {/* Header quick-action profile/new-group tabs */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-950/40 border-b" style={{ borderColor: theme.border }}>
                      <button
                        onClick={() => {
                          setActiveTab("more");
                          setSubView(null);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-850 transition-all shadow-sm"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                        Profile
                      </button>
                      <button
                        onClick={() => setSubView("create-group")}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-md transform hover:scale-[1.01]"
                        style={{ background: theme.primaryGradient }}
                      >
                        <Users className="w-3.5 h-3.5" />
                        New Group
                      </button>
                    </div>

                    {/* Chat search exact email or number */}
                    <div className="px-3 py-2 bg-zinc-950/20 border-b" style={{ borderColor: theme.border }}>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search exact email or phone number..."
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300">
                            <X className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Horizontal Stories status indicators */}
                    <div className="p-3 border-b bg-zinc-950/10 flex gap-3 overflow-x-auto" style={{ borderColor: theme.border }}>
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => setShowAddStatusModal(true)}
                          className="relative w-12 h-12 rounded-full border border-dashed border-zinc-700 bg-zinc-900 flex items-center justify-center mb-1 group hover:border-amber-500 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                        </button>
                        <span className="text-[9px] text-zinc-500">Your Status</span>
                      </div>

                      {statuses.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => alert(`Status by ${st.name}: "${st.text || "No status caption"}"`)}
                          className="flex flex-col items-center shrink-0 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full p-[2px] border-2 border-amber-500 mb-1">
                            <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <span className="text-[9px] text-zinc-400 max-w-[50px] truncate text-center">{st.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chat lists */}
                    <div className="flex-1 divide-y divide-zinc-900/60 overflow-y-auto">
                      {filteredChats.length === 0 ? (
                        <div className="text-center py-12 px-6">
                          <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                          <p className="text-xs text-zinc-500">No active chats found matching "{searchQuery}"</p>
                        </div>
                      ) : (
                        filteredChats.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => {
                              setActiveChatId(chat.id);
                              // Reset unread count
                              setChats((prev) =>
                                prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
                              );
                            }}
                            className={`flex items-center gap-3 p-3.5 transition-all cursor-pointer select-none group border-l-2 border-transparent ${
                              themePreset === "sophisticated"
                                ? activeChatId === chat.id
                                  ? "active-chat"
                                  : "chat-item"
                                : activeChatId === chat.id
                                ? "bg-zinc-900 border-l-2 border-amber-500"
                                : "hover:bg-zinc-900/50 hover:border-amber-500"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img src={chat.avatarUrl} alt={chat.name} className="w-11 h-11 object-cover rounded-full border border-zinc-800" />
                              {chat.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <h4 className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                                  {chat.name}
                                  {chat.isE2EE && (
                                    <Lock className="w-3 h-3 text-emerald-400" title="End-to-End Encrypted direct ratcheted tunnel" />
                                  )}
                                  {chat.type === "ai" && (
                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1 py-0.5 rounded-sm font-mono">
                                      AI BOT
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[9px] font-mono text-zinc-500">{chat.lastMessageTime}</span>
                              </div>
                              <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                                {chat.lastMessage}
                              </p>
                            </div>

                            {chat.unreadCount > 0 && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md shadow-red-500/20 shrink-0"
                                style={{ background: theme.primaryGradient }}
                              >
                                {chat.unreadCount}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. CALLS & CONTACTS VIEW */}
                {activeTab === "calls" && !subView && (
                  <div className="flex-1 flex flex-col">
                    {/* All / Missed / Contacts Header Tab Presets */}
                    <div className="px-4 py-3 bg-zinc-950/60 border-b flex justify-between items-center" style={{ borderColor: theme.border }}>
                      <h3 className="text-sm font-bold text-white font-display">Calls & Contacts</h3>
                      
                      <button
                        onClick={() => setShowAddContactModal(true)}
                        className="p-1 bg-zinc-900 border border-zinc-800 text-amber-500 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-mono px-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD
                      </button>
                    </div>

                    {/* Contacts Sub tabs */}
                    <div className="p-3 grid grid-cols-3 gap-1 bg-zinc-950/30 border-b" style={{ borderColor: theme.border }}>
                      {(["all", "missed", "contacts"] as const).map((tab) => {
                        const labelMap = { all: "All", missed: "Missed", contacts: "Contacts" };
                        const isActive = callsSubTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setCallsSubTab(tab)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                              isActive
                                ? "text-white shadow"
                                : "text-zinc-500 hover:text-zinc-300 bg-transparent"
                            }`}
                            style={{ background: isActive ? theme.primaryGradient : "transparent" }}
                          >
                            {labelMap[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Scroll content for calls */}
                    <div className="flex-1 overflow-y-auto p-3">
                      {/* Sub tab All or Missed lists */}
                      {callsSubTab !== "contacts" && (
                        <div className="space-y-2.5">
                          {calls
                            .filter((log) => callsSubTab === "all" || log.type === "missed")
                            .map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <img src={log.avatarUrl} alt={log.contactName} className="w-10 h-10 object-cover rounded-full border border-zinc-800" />
                                  <div>
                                    <h4 className="text-xs font-semibold text-white">{log.contactName}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          log.type === "missed" ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                                        }`}
                                      />
                                      <span className="text-[9px] font-mono text-zinc-500">{log.time}</span>
                                      {log.duration && (
                                        <span className="text-[9px] font-mono text-zinc-500">• {log.duration}s</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => triggerCall(log.contactName, log.avatarUrl, "audio")}
                                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-lg text-amber-500 transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => triggerCall(log.contactName, log.avatarUrl, "video")}
                                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-lg text-emerald-400 transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Sub tab Contacts List */}
                      {callsSubTab === "contacts" && (
                        <div className="space-y-3">
                          {/* Search contacts bar */}
                          <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search contact book..."
                              className="w-full bg-zinc-900 border border-zinc-850 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          {filteredContacts.map((ct) => (
                            <div
                              key={ct.id}
                              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-900 flex flex-col gap-2.5"
                            >
                              <div className="flex items-center gap-3">
                                <img src={ct.avatarUrl} alt={ct.name} className="w-10 h-10 object-cover rounded-full border border-zinc-850" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-xs font-semibold text-white truncate">{ct.name}</h4>
                                  <p className="text-[9px] font-mono text-zinc-500">{ct.phone}</p>
                                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">"{ct.bio}"</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-900/40">
                                {/* Message quick redirect */}
                                <button
                                  onClick={() => {
                                    // ensure active chat
                                    const chatExists = chats.find(c => c.id === ct.id);
                                    if (!chatExists) {
                                      const newChat: Chat = {
                                        id: ct.id,
                                        name: ct.name,
                                        type: "direct",
                                        avatarUrl: ct.avatarUrl,
                                        lastMessage: "Chat started from address book",
                                        lastMessageTime: "Just now",
                                        unreadCount: 0,
                                        isE2EE: true,
                                      };
                                      setChats(prev => [newChat, ...prev]);
                                    }
                                    setActiveChatId(ct.id);
                                    setActiveTab("chats");
                                  }}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                  title="Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => triggerCall(ct.name, ct.avatarUrl, "audio")}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-amber-500 transition-colors"
                                  title="Voice Call"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => triggerCall(ct.name, ct.avatarUrl, "video")}
                                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-emerald-400 transition-colors"
                                  title="Video Call"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                </button>
                                {ct.isCustom && (
                                  <button
                                    onClick={() => handleDeleteContact(ct.id)}
                                    className="p-1.5 bg-zinc-900 hover:bg-red-950 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Delete Contact"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. STATUS VIEW */}
                {activeTab === "status" && !subView && (
                  <div className="flex-1 flex flex-col p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white font-display">Recent Updates</h3>
                      <button
                        onClick={() => setShowAddStatusModal(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow"
                        style={{ background: theme.primaryGradient }}
                      >
                        Add Status
                      </button>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 mb-4 flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatarUrl} alt="user" className="w-12 h-12 object-cover rounded-full border border-zinc-800" />
                        <div className="absolute bottom-0 right-0 bg-amber-500 w-4 h-4 rounded-full flex items-center justify-center text-black border border-zinc-900">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Your Status</h4>
                        <p className="text-[10px] text-zinc-500">Tap + to add a quick text story</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {statuses.map((st) => (
                        <div
                          key={st.id}
                          className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 flex flex-col gap-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={st.avatarUrl} alt={st.name} className="w-9 h-9 object-cover rounded-full border border-zinc-800" />
                            <div>
                              <h5 className="text-xs font-bold text-white">{st.name}</h5>
                              <span className="text-[9px] font-mono text-zinc-500">{st.time}</span>
                            </div>
                          </div>
                          {st.text && (
                            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-850">
                              <p className="text-xs text-zinc-300 italic">"{st.text}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MORE / SETTINGS TAB */}
                {activeTab === "more" && !subView && (
                  <div className="flex-1 flex flex-col p-4 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase font-mono tracking-widest mb-1">Settings</h3>
                    
                    {/* User profile banner */}
                    <div
                      onClick={() => setSubView("edit-profile")}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-850 hover:border-amber-500/40 transition-all cursor-pointer flex justify-between items-center group shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt="user" className="w-14 h-14 object-cover rounded-full border-2 border-zinc-800" />
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{user.displayName}</h4>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{user.bio}</p>
                          <span className="text-[9px] font-mono text-zinc-500">{user.phone}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-all" />
                    </div>

                    {/* Chat & Themes choice box */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-3.5">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Chats & Themes</h4>
                      <p className="text-[11px] text-zinc-500">Choose Theme Preset</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { preset: "sophisticated", label: "Sophisticated Dark", colors: ["#5288C1", "#2B5278", "#1C1C21"] },
                          { preset: "sunset", label: "Sunset Glow", colors: ["#ff5e36", "#f43b86", "#1c1517"] },
                          { preset: "cyberpunk", label: "Gemini Cyberpunk", colors: ["#06b6d4", "#a855f7", "#18181b"] },
                          { preset: "forest", label: "Desi Forest", colors: ["#10b981", "#059669", "#121a16"] },
                          { preset: "neon", label: "Neon Blue", colors: ["#3b82f6", "#2563eb", "#111827"] },
                          { preset: "light", label: "Day Mode Light", colors: ["#3b82f6", "#1d4ed8", "#ffffff"] },
                        ].map((th) => (
                          <button
                            key={th.preset}
                            onClick={() => setThemePreset(th.preset as ThemePreset)}
                            className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all relative ${
                              themePreset === th.preset
                                ? "border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/5 scale-[1.01]"
                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                            }`}
                          >
                            <span className="text-[10px] font-semibold text-white">{th.label}</span>
                            <div className="flex gap-1.5 items-center">
                              {th.colors.map((c, i) => (
                                <div key={i} className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ background: c }} />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* App Size & Zoom Controller */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-3">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Display & Size Scaling</h4>
                      <p className="text-[11px] text-zinc-500">Customize font and icons scale dynamically</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { scale: "small", label: "Small / Compact" },
                          { scale: "normal", label: "Normal Default" },
                          { scale: "large", label: "Large Display" },
                        ].map((sc) => (
                          <button
                            key={sc.scale}
                            onClick={() => setAppScale(sc.scale as any)}
                            className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                              appScale === sc.scale
                                ? "border-amber-500 bg-amber-500/5 text-amber-400 font-bold"
                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400 text-[10px]"
                            }`}
                          >
                            <span className="text-[9px]">{sc.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                     {/* Address book sync block */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-2.5">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Address Book Sync</h4>
                      <div className="flex gap-3 items-start">
                        <RefreshCw className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                        <div>
                          <h5 className="text-[11px] font-semibold text-white">Automated Local Contacts Sync</h5>
                          <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                            Scan your local mobile address book to automatically find and add your friends registered on BakBak AI.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSyncContacts}
                        className="w-full bg-zinc-900 border border-zinc-800 hover:border-amber-500 hover:bg-amber-500/10 rounded-xl py-2.5 text-xs font-bold text-amber-500 transition-all flex items-center justify-center gap-1 mt-1"
                      >
                        Sync Local Contacts
                      </button>
                    </div>

                    {/* Premium Trusted User Status */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none rounded-full" />
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[10px] font-bold text-amber-400 uppercase font-mono tracking-widest">Trusted User Club</h4>
                            {isPremium && (
                              <span className="bg-amber-500/20 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20 font-mono flex items-center gap-0.5 animate-pulse">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">
                            Activate Trusted User privileges to instantly unlock Premium capabilities like AI Prompt Polishing, Whisper Mode (Self-Destruct Messages), and HD Media compression.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setIsPremium(!isPremium)}
                          className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isPremium
                              ? "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-750"
                              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/10"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isPremium ? "Deactivate Premium Privileges" : "Unlock Premium Features (Free)"}
                        </button>
                      </div>
                    </div>

                    {/* Account Actions Section */}
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-900 space-y-2.5">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest">Account Actions</h4>
                      
                      <button
                        onClick={() => setSubView("edit-profile")}
                        className="w-full text-left py-2 flex justify-between items-center text-xs text-zinc-300 hover:text-white border-b border-zinc-900/60"
                      >
                        <span>Edit Profile</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left py-2 flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Account</span>
                      </button>
                    </div>

                    {/* Minimalist developer footer diagnostics */}
                    <div className="pt-2 text-center flex flex-col gap-1">
                      <p className="text-[9px] text-zinc-600 font-mono">BakBak AI Client v1.2.0 • Secured E2EE</p>
                      <button
                        onClick={() => setSubView("db-architecture")}
                        className="text-[9px] text-zinc-500 hover:text-zinc-300 underline font-mono transition-colors self-center"
                      >
                        [ Advanced Diagnostics & System Scaling Configs ]
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. EDIT PROFILE VIEW */}
                {subView === "edit-profile" && (
                  <div className="p-4 flex flex-col space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: theme.border }}>
                      <button onClick={() => setSubView(null)} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-sm font-bold text-white font-display">My Profile</h3>
                    </div>

                    {/* Profile avatar capture snapshot */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center group shadow-md">
                        {capturedImage ? (
                          <img src={capturedImage} alt="user" className="w-full h-full object-cover" />
                        ) : (
                          <img src={user.avatarUrl} alt="user" className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={startCamera}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] text-white transition-opacity duration-200"
                        >
                          <Camera className="w-5 h-5 mb-1 text-amber-500" />
                          RECAPTURE
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500">Tap to capture webcam photo</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">DISPLAY NAME</label>
                        <input
                          type="text"
                          value={user.displayName}
                          onChange={(e) => setUser((p) => ({ ...p, displayName: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">ABOUT / BIO</label>
                        <textarea
                          value={user.bio}
                          onChange={(e) => setUser((p) => ({ ...p, bio: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 h-16 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">EMAIL ADDRESS</label>
                        <input
                          type="email"
                          value={user.email}
                          onChange={(e) => setUser((p) => ({ ...p, email: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">PHONE NUMBER</label>
                        <input
                          type="text"
                          value={user.phone}
                          onChange={(e) => setUser((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (capturedImage) {
                            setUser((p) => ({ ...p, avatarUrl: capturedImage }));
                          }
                          setSubView(null);
                          alert("Profile details updated successfully.");
                        }}
                        className="w-full rounded-xl py-3 text-xs font-bold text-white transition-all shadow-md"
                        style={{ background: theme.primaryGradient }}
                      >
                        Save Details
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. CREATE GROUP VIEW */}
                {subView === "create-group" && (
                  <div className="p-4 flex flex-col space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: theme.border }}>
                      <button onClick={() => setSubView(null)} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-sm font-bold text-white font-display">New Group</h3>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                        <Users className="w-8 h-8" />
                      </div>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 text-center"
                      />
                    </div>

                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono tracking-widest block">
                        Select Contacts
                      </span>

                      <div className="divide-y divide-zinc-900/60 max-h-[220px] overflow-y-auto">
                        {contacts.map((c) => {
                          const isSelected = selectedGroupContacts.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedGroupContacts((prev) =>
                                  isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                                );
                              }}
                              className="flex items-center justify-between py-2.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <img src={c.avatarUrl} alt={c.name} className="w-8 h-8 object-cover rounded-full border border-zinc-850" />
                                <span className="text-xs text-white font-medium">{c.name}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-800"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleCreateGroup}
                        className="w-full rounded-xl py-3 text-xs font-bold text-white transition-all shadow-md mt-4"
                        style={{ background: theme.primaryGradient }}
                      >
                        Create Group Chat
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. CONTACTS SYNC VIEW */}
                {subView === "sync-contacts" && (
                  <div className="p-4 flex flex-col items-center justify-center text-center h-full max-h-[400px]">
                    {isSyncingProcess ? (
                      <div className="space-y-4 py-8">
                        <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                        <div>
                          <h4 className="text-xs font-bold text-white mb-1">Scanning Local SIM Address Book...</h4>
                          <p className="text-[10px] text-zinc-500">Matching verified phone hashes against active ScyllaDB records.</p>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${syncProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{syncProgress}%</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <RefreshCw className="w-12 h-12 text-blue-400 mx-auto" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Local Contact Synchronization</h4>
                          <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                            We will analyze the names and numbers in your local database to discover which of your friends are currently registered on Chat App AI.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSubView(null)}
                            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={triggerSyncDatabase}
                            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl"
                          >
                            Sync Database Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. E2EE CREDENTIALS INFO */}
                {subView === "e2ee-info" && (
                  <div className="p-4 flex flex-col space-y-4 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: theme.border }}>
                      <button onClick={() => setSubView("db-architecture")} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-sm font-bold text-white font-display">E2EE Tunnel status</h3>
                    </div>

                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-[10px] text-zinc-400 leading-relaxed break-all">
                      <div className="flex justify-between border-b border-zinc-850 pb-1">
                        <span className="text-amber-500 font-bold">TUNNEL SYSTEM</span>
                        <span className="text-emerald-400">DOUBLE RATCHET</span>
                      </div>
                      
                      <div>
                        <span className="text-white block font-bold mb-0.5">ENCRYPTION PHRASE:</span>
                        <span className="bg-zinc-950 p-1 rounded block">{user.encryptionPhrase}</span>
                      </div>

                      <div>
                        <span className="text-white block font-bold mb-0.5">CLIENT PUBLIC KEY (DH):</span>
                        <span className="bg-zinc-950 p-1 rounded block select-all text-blue-300">{user.publicKey}</span>
                      </div>

                      <div>
                        <span className="text-white block font-bold mb-0.5">CLIENT SECURE PRIVATE KEY:</span>
                        <span className="bg-zinc-950 p-1 rounded block text-zinc-600">{user.privateKey.substring(0, 30)}... [SECRET]</span>
                      </div>

                      <div className="pt-2 text-zinc-500 text-[9px] italic leading-snug">
                        * In standard chat apps, client-side cryptographic keys secure every conversation block. This prevents servers, middlemen, or network monitors from snooping on your data payloads.
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. DATABASE & SYSTEMS ARCHITECTURE PANEL */}
                {subView === "db-architecture" && (
                  <div className="p-4 flex flex-col space-y-4 max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.border }}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSubView(null)} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h3 className="text-sm font-bold text-white font-display">Systems Architecture</h3>
                      </div>
                      <button
                        onClick={() => setSubView("e2ee-info")}
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        View Keys
                      </button>
                    </div>

                    {/* Network Switch Simulator with zero-lag indicators */}
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 space-y-3.5 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-widest flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                          NETWORK TRANSITION SIMULATOR
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          networkSpeedSim === "Offline" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400 animate-pulse"
                        }`}>
                          {networkSpeedSim === "Offline" ? "DISCONNECTED" : "CONNECTED"}
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Simulate transitions from high-speed 5G to cellular 4G or complete offline outages. Thanks to client-side Room-DB inspired caching, network switches cause zero interface lag.
                      </p>

                      <div className="grid grid-cols-4 gap-1.5">
                        {(["5G", "4G", "3G", "Offline"] as const).map((net) => {
                          const isActive = networkSpeedSim === net;
                          return (
                            <button
                              key={net}
                              onClick={() => {
                                setNetworkSpeedSim(net);
                                if (net === "Offline") {
                                  setIsOnlineSimulated(false);
                                } else {
                                  setIsOnlineSimulated(true);
                                }
                              }}
                              className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                                isActive
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5"
                                  : "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {net === "Offline" ? "🛑 Offline" : `⚡ ${net}`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Live Network Latency Diagnostics */}
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-850/60 font-mono text-[9px] space-y-1 text-zinc-400">
                        <div className="flex justify-between">
                          <span>Connection Quality:</span>
                          <span className={networkSpeedSim === "Offline" ? "text-red-400" : "text-emerald-400"}>
                            {networkSpeedSim === "5G" && "Ultra Low-Latency (Sub-15ms)"}
                            {networkSpeedSim === "4G" && "Broadband Standard (25ms - 45ms)"}
                            {networkSpeedSim === "3G" && "Slow Cell Carrier (120ms - 240ms)"}
                            {networkSpeedSim === "Offline" && "Simulated Blackout / Offline State"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Socket Latency:</span>
                          <span className="text-white">
                            {networkSpeedSim === "5G" && "8 ms"}
                            {networkSpeedSim === "4G" && "34 ms"}
                            {networkSpeedSim === "3G" && "178 ms"}
                            {networkSpeedSim === "Offline" && "∞ ms (LocalStorage buffering)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>WebSocket State:</span>
                          <span className={networkSpeedSim === "Offline" ? "text-amber-500" : "text-blue-400"}>
                            {networkSpeedSim === "Offline" ? "Sleeping / Queueing local" : "Active & Persistent (gRPC Node)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MongoDB Sharded Cluster Configuration */}
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-amber-500 font-mono tracking-widest flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-amber-500" />
                          MONGODB ATLAS CONNECTIVITY
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">SHARDED REPLICAS</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">MONGODB_URI</label>
                        <input
                          type="text"
                          value={mongoDbConnectionString}
                          onChange={(e) => setMongoDbConnectionString(e.target.value)}
                          placeholder="mongodb+srv://..."
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-[10px] font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex gap-2 items-center text-[9px] text-zinc-500 leading-normal font-mono bg-zinc-950/40 p-2.5 rounded border border-zinc-850/30">
                        <Server className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <div className="text-zinc-400 font-semibold">Cluster Topology: bakbak-prod-shard-00</div>
                          <div>Nodes: 3 Primary, 6 Replicas (Active Replication)</div>
                        </div>
                      </div>
                    </div>

                    {/* Redis Cache Latency Tuning */}
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                          REDIS MEMORY CACHING
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">IN-MEMORY SPEED</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">REDIS_URI</label>
                        <input
                          type="text"
                          value={redisConnectionString}
                          onChange={(e) => setRedisConnectionString(e.target.value)}
                          placeholder="redis://..."
                          className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-zinc-950/40 p-2.5 rounded border border-zinc-850/30">
                        <div className="text-zinc-500">
                          <span className="text-emerald-400 font-bold block">99.98%</span>
                          Cache Hit Rate
                        </div>
                        <div className="text-zinc-500">
                          <span className="text-blue-400 font-bold block">&lt; 0.2ms</span>
                          Avg Cache Latency
                        </div>
                      </div>
                    </div>

                    {/* Cloudinary CDN Media Storage */}
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-purple-400 font-mono tracking-widest flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-purple-400" />
                          CLOUDINARY MEDIA CDN
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">CLOUDINARY STORAGE</span>
                      </div>

                      {/* Compression Level Choice */}
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Cloudinary Quality Preset</span>
                        <div className="flex gap-1.5">
                          {[
                            { level: "high", label: "High (Compress 85%)" },
                            { level: "medium", label: "Medium (Compress 50%)" },
                            { level: "off", label: "Off (Raw Media)" },
                          ].map((item) => (
                            <button
                              key={item.level}
                              type="button"
                              onClick={() => setMediaCompressionLevel(item.level as any)}
                              className={`flex-1 py-1.5 rounded-lg text-[8px] font-bold transition-all border ${
                                mediaCompressionLevel === item.level
                                  ? "bg-purple-500/10 border-purple-500 text-purple-400"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-500"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2 bg-zinc-950/40 rounded border border-zinc-850/30 text-[9px] text-zinc-500 leading-normal font-mono">
                        <span className="text-purple-400 font-bold">CLOUDINARY OPTIMIZATION:</span> JPEG/PNG images auto-converted to high-efficiency WebP/AVIF via `f_auto,q_auto`. Audio notes encoded to high-compression AAC. Videos optimized using H.265 transcoding on Cloudinary edge-servers on-the-fly.
                      </div>
                    </div>

                    {/* Active Local Database Offline Sync Diagnostic */}
                    <div className="p-4 bg-emerald-950/10 border border-emerald-900/40 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400 font-mono tracking-widest">
                        <span>LOCAL DATABASE DIAGNOSTICS</span>
                        <span className="animate-pulse">● READY</span>
                      </div>
                      
                      <div className="space-y-1 text-zinc-400 font-mono text-[9px]">
                        <div className="flex justify-between">
                          <span>Local Cache Engine:</span>
                          <span className="text-white">Room / SQLite Local Cache</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Local Buffered Messages:</span>
                          <span className="text-amber-400 font-bold">
                            {(Object.values(messages).flat() as Message[]).filter((m) => m.status === "pending").length} unsynced
                          </span>
                        </div>
                      </div>

                      {/* Manual Cloud Sync Button if they want to trigger manual push */}
                      <button
                        onClick={() => {
                          // Manually trigger a mock sync of any pending messages
                          const pendingCount = (Object.values(messages).flat() as Message[]).filter((m) => m.status === "pending").length;
                          if (pendingCount === 0) {
                            alert("Local cache is already 100% in sync with Sharded MongoDB Cluster.");
                            return;
                          }
                          
                          // Transition all pending messages to sent
                          setMessages((prev) => {
                            const updated: typeof prev = {};
                            for (const key in prev) {
                              updated[key] = (prev[key] as Message[]).map((m) =>
                                m.status === "pending" ? { ...m, status: "sent" } : m
                              );
                            }
                            return updated;
                          });
                          alert(`Cloud Synchronization completed successfully! Registered ${pendingCount} local offline payloads into Sharded MongoDB Clusters.`);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        FORCE SYNC WITH MONGODB ATLAS
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to clear all local chat history, cache buffers, and customized profile data? This will reset the applet to its pristine state.")) {
                            try {
                              localStorage.removeItem("bakbak_messages");
                              localStorage.removeItem("bakbak_user");
                              localStorage.removeItem("bakbak_chats");
                              localStorage.removeItem("bakbak_theme");
                              localStorage.removeItem("bakbak_compression");
                              localStorage.removeItem("bakbak_contacts");
                              alert("Local Cache fully purged! The application will now reload to apply the clean slate.");
                              window.location.reload();
                            } catch (e) {
                              alert("Error purging local storage cache.");
                            }
                          }
                        }}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        CLEAR ALL CACHED DEMO DATA & RESET
                      </button>
                    </div>
                  </div>
                )}

              </main>

              {/* ACTIVE BOTTOM NAV MENU RAILS */}
              <nav className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-950 border-t flex justify-around items-center px-2 z-10" style={{ borderColor: theme.border }}>
                {[
                  { tab: "chats", label: "Chats", icon: MessageSquare },
                  { tab: "calls", label: "Calls", icon: Phone },
                  { tab: "status", label: "Status", icon: CircleDot },
                  { tab: "more", label: "More", icon: Grid },
                ].map((item) => {
                  const isActive = activeTab === item.tab && !subView;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        setActiveTab(item.tab as any);
                        setSubView(null);
                      }}
                      className="flex flex-col items-center justify-center h-full flex-1 group transition-all duration-200"
                    >
                      <div
                        className={`p-1 rounded-xl mb-0.5 group-hover:scale-110 transition-transform ${
                          isActive ? "text-amber-500" : "text-zinc-500 group-hover:text-zinc-300"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[9px] font-medium tracking-wide ${
                          isActive ? "text-amber-500 font-bold" : "text-zinc-500"
                        }`}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute bottom-1 w-5 h-0.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* ACTIVE CHAT WINDOW COVER OVERLAY */}
          <AnimatePresence>
            {activeChatId && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute inset-0 z-40 bg-zinc-950 flex flex-col"
                style={{ background: theme.background }}
              >
                {/* Active Chat Header */}
                <header className="px-4 py-3 border-b flex items-center justify-between bg-zinc-950" style={{ borderColor: theme.border }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveChatId(null)}
                      className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-400"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {activeChat && (
                      <div className="flex items-center gap-2">
                        <img src={activeChat.avatarUrl} alt={activeChat.name} className="w-9 h-9 object-cover rounded-full border border-zinc-800" />
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                            {activeChat.name}
                            {activeChat.isE2EE && <Lock className="w-3 h-3 text-emerald-400" />}
                          </h4>
                          <span className="text-[9px] text-zinc-500 block font-mono">
                            {isTyping ? "typing..." : (!isOnlineSimulated ? "working offline" : (activeChat.statusText || "online"))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {activeChat && activeChat.type !== "ai" && (
                      <>
                        <button
                          onClick={() => triggerCall(activeChat.name, activeChat.avatarUrl, "audio", activeChat.type === "group")}
                          className="p-1.5 hover:bg-zinc-900 rounded-lg text-amber-500 transition-colors"
                          title={activeChat.type === "group" ? "Group Voice Call" : "Voice Call"}
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerCall(activeChat.name, activeChat.avatarUrl, "video", activeChat.type === "group")}
                          className="p-1.5 hover:bg-zinc-900 rounded-lg text-emerald-400 transition-colors"
                          title={activeChat.type === "group" ? "Group Video Call" : "Video Call"}
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {activeChat && activeChat.isE2EE && (
                      <button
                        onClick={() => setShowEncrypted(!showEncrypted)}
                        className={`p-1.5 rounded-lg border text-[9px] font-mono transition-all ${
                          showEncrypted
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                        title="Toggle decrypted / encrypted cipher visualization"
                      >
                        🔑 CIPHER
                      </button>
                    )}
                  </div>
                </header>

                {/* Secure E2EE Ratchet Status Bar banner */}
                {activeChat && activeChat.isE2EE && (
                  <div className="bg-zinc-950/80 px-4 py-1.5 border-b border-zinc-900/60 flex justify-between items-center text-[8px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Lock className="w-2.5 h-2.5" /> CLIENT-SIDE E2EE ACTIVATED
                    </span>
                    <span>KEY: {user.publicKey.substring(0, 10)}...</span>
                  </div>
                )}

                {/* Message list stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {activeChatMessages.map((msg, idx) => {
                    const isMe = msg.senderId === "user";
                    const isSys = msg.senderId === "system";

                    // Handle E2EE decrypted/encrypted toggling
                    let messageTextToDisplay = msg.text;
                    if (msg.isE2EE) {
                      if (showEncrypted) {
                        // Show raw cipher stored
                        messageTextToDisplay = `🔒 CYPHERTEXT:\n${msg.text}`;
                      } else {
                        // Decrypt in memory using our secret key
                        messageTextToDisplay = decryptMessage(msg.text, user.encryptionPhrase);
                      }
                    }

                    if (isSys) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="px-3 py-1 rounded bg-zinc-900/80 text-[10px] text-zinc-500 border border-zinc-850/50 leading-relaxed inline-block max-w-[280px]">
                            {messageTextToDisplay}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                          {!isMe && activeChat && (
                            <img src={activeChat.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-zinc-850 shrink-0" />
                          )}
                          <div>
                            <div
                              className={`p-3 text-xs break-words shadow-sm leading-relaxed ${
                                themePreset === "sophisticated"
                                  ? isMe
                                    ? "bubble-out text-white"
                                    : "bubble-in text-[#E0E0E6]"
                                  : isMe
                                  ? "bg-zinc-800 text-white rounded-tr-xs"
                                  : "bg-zinc-900 text-zinc-200 rounded-tl-xs"
                              }`}
                              style={{
                                background: themePreset === "sophisticated" ? undefined : (isMe ? theme.primaryGradient : undefined),
                              }}
                            >
                              {msg.mediaUrl && (
                                <div className="space-y-2 mb-2 max-w-[240px]">
                                  {msg.mediaType === "image" && (
                                    <img
                                      src={msg.mediaUrl}
                                      alt="Attachment"
                                      className="rounded-lg max-h-[160px] w-full object-cover border border-black/25"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  {msg.mediaType === "video" && (
                                    <video
                                      src={msg.mediaUrl}
                                      controls
                                      className="rounded-lg max-h-[160px] w-full object-cover border border-black/25"
                                    />
                                  )}
                                  {msg.mediaType === "audio" && (
                                    <audio src={msg.mediaUrl} controls className="w-full max-w-[220px]" />
                                  )}
                                  <div className="p-2 bg-black/45 rounded-lg text-[9px] font-mono text-zinc-300 space-y-0.5 border border-black/15">
                                    <div className="flex justify-between gap-2 font-bold text-amber-400">
                                      <span className="uppercase">{msg.mediaType} ATTACHMENT</span>
                                      <span>{msg.mediaSize}</span>
                                    </div>
                                    <div className="text-[8px] text-zinc-400">
                                      Raw: {msg.mediaOrigSize} (Ratio: {mediaCompressionLevel === "high" ? "85% off" : mediaCompressionLevel === "medium" ? "50% off" : "0% off"})
                                    </div>
                                    <div className="text-[8px] text-purple-300">
                                      Storage: Cloudinary CDN (Synced)
                                    </div>
                                    <div className="text-[7px] text-zinc-500 italic mt-0.5">
                                      {isOnlineSimulated ? "✓ Cloud Synced" : "⚡ Local Queue Backup"}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <span className="whitespace-pre-wrap">{messageTextToDisplay}</span>
                            </div>
                            
                            <div className={`flex items-center gap-1 mt-1 text-[9px] font-mono text-zinc-500 ${isMe ? "justify-end" : "justify-start"}`}>
                              <span>{msg.timestamp}</span>
                              {isMe && (
                                <span>
                                  {msg.status === "pending" && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                                  {msg.status === "sent" && <Check className="w-2.5 h-2.5" />}
                                  {msg.status === "delivered" && <CheckCheck className="w-2.5 h-2.5 text-zinc-500" />}
                                  {msg.status === "read" && <CheckCheck className="w-2.5 h-2.5 text-blue-400" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 max-w-[80%]">
                        {activeChat && (
                          <img src={activeChat.avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-zinc-850 shrink-0" />
                        )}
                        <div className="bg-zinc-900/80 p-3 rounded-2xl rounded-tl-xs flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messageEndRef} />
                </div>

                {/* Quick actions row */}
                <div className="px-3 py-1 bg-zinc-950/20 border-t border-zinc-900/40 flex gap-2 overflow-x-auto select-none">
                  {[
                    "Hii",
                    "How are you?",
                    "Send safe keys",
                    "Encrypt text",
                    "gRPC status?",
                  ].map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => setMessageInput(word)}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-400 hover:text-white shrink-0"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Chat input message form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-zinc-950 border-t flex items-center gap-2"
                  style={{ borderColor: theme.border }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,audio/*,video/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all shrink-0"
                    title="Attach Media (Image, Audio, Video)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={activeChat?.isE2EE ? "🔒 Type secure racheted message..." : "Type a message..."}
                    className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl text-black font-bold hover:scale-105 transition-all shadow shrink-0"
                    style={{ background: theme.primaryGradient }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE CALL POPUP SYSTEM OVERLAY */}
          {activeCall && (
            <div className="absolute inset-0 z-50 bg-neutral-950 flex flex-col justify-between p-6 text-center select-none animate-fade-in">
              {/* Call Top E2EE status logo banner */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500 mt-6">
                <Shield className="w-4 h-4 text-emerald-400" /> SECURE E2EE SRTP CHANNEL
              </div>

              {/* Call Central info / Live Video Camera preview stream */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {activeCall.type === "video" && activeCall.status === "connected" ? (
                  activeCall.isGroup ? (
                    /* Group Video Calling Bento Grid Layout! */
                    <div className="w-full grid grid-cols-2 gap-3 p-1 aspect-[3/4] max-w-sm">
                      {/* Grid 1: The real user's webcam preview */}
                      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-md">
                        <video
                          ref={(el) => {
                            if (el && !el.srcObject) {
                              navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                                .then((stream) => {
                                  el.srcObject = stream;
                                  el.play();
                                })
                                .catch((err) => console.log("Video preview disabled/denied", err));
                            }
                          }}
                          className="w-full h-full object-cover transform scale-x-[-1]"
                          playsInline
                        />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-zinc-300 font-mono">
                          You (Broadcasting HD)
                        </div>
                      </div>

                      {/* Grid 2: Participant 1 */}
                      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-md flex items-center justify-center">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                          alt="Friend 1"
                          className="w-full h-full object-cover absolute inset-0 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-emerald-400 font-mono flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                          Santosh kumar (Speaker)
                        </div>
                      </div>

                      {/* Grid 3: Participant 2 */}
                      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-md flex items-center justify-center">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                          alt="Friend 2"
                          className="w-full h-full object-cover absolute inset-0 opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-zinc-300 font-mono">
                          Ankush.2
                        </div>
                      </div>

                      {/* Grid 4: Participant 3 */}
                      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative shadow-md flex items-center justify-center">
                        <img
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                          alt="Friend 3"
                          className="w-full h-full object-cover absolute inset-0 opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-zinc-300 font-mono">
                          AmritaGupta
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Live real web camera element preview if video call is active! */
                    <div className="w-full max-w-xs aspect-[3/4] bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden relative shadow-2xl">
                      <video
                        ref={(el) => {
                          if (el && !el.srcObject) {
                            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                              .then((stream) => {
                                el.srcObject = stream;
                                el.play();
                              })
                              .catch((err) => console.log("Video preview disabled/denied", err));
                          }
                        }}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        playsInline
                      />
                      
                      {/* Floating mini remote user mock card */}
                      <div className="absolute top-3 right-3 w-16 h-22 rounded-xl border border-zinc-700 overflow-hidden bg-black/60 shadow flex flex-col items-center justify-center">
                        <img src={activeCall.avatarUrl} alt="contact" className="w-10 h-10 rounded-full object-cover" />
                        <span className="text-[7px] font-bold text-white mt-1 max-w-[50px] truncate">{activeCall.contactName.split(" ")[0]}</span>
                      </div>

                      {/* Live overlay status */}
                      <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg border border-zinc-800/40 text-[8px] font-mono text-emerald-400 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        FPS: 60 | LATENCY: 22ms
                      </div>
                    </div>
                  )
                ) : (
                  /* Audio Call Standard circle face exactly like screenshots */
                  <div className="space-y-6">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping" />
                      <img
                        src={activeCall.avatarUrl}
                        alt="contact"
                        className="w-32 h-32 rounded-full object-cover border-2 border-amber-500 relative z-10"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">{activeCall.contactName}</h3>
                      <p className="text-xs text-zinc-500 font-mono tracking-wide mt-1 uppercase">
                        {activeCall.status === "ringing" ? "Ringing..." : "Connected"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Connected timer duration */}
              {activeCall.status === "connected" && (
                <span className="text-sm font-mono text-zinc-400">
                  {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                </span>
              )}

              {/* Call Action buttons panel */}
              <div className="pb-8 space-y-6">
                <div className="flex items-center justify-center gap-6">
                  <button className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <MicOff className="w-5 h-5" />
                  </button>
                  <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-600/20"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-[10px] text-zinc-600 font-mono leading-relaxed">
                  Call encrypted via real-time WebRTC securely (SRTP/DTLS 256bit).<br />
                  STUN/TURN connection active: 0.0.0.0:3478
                </p>
              </div>
            </div>
          )}

          {/* ADD CONTACT MODAL POPUP */}
          {showAddContactModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Add New Friend</h4>
                  <button onClick={() => setShowAddContactModal(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase font-mono">Contact Name</label>
                    <input
                      type="text"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      placeholder="e.g. Deepak Choudhary"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase font-mono">Phone Number</label>
                    <input
                      type="text"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      placeholder="e.g. +91 94140 28400"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase font-mono">Email Address</label>
                    <input
                      type="email"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      placeholder="e.g. deepak@example.com"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleAddContact}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all shadow"
                    style={{ background: theme.primaryGradient }}
                  >
                    Add to Address Book
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD STATUS CAPTION MODAL POPUP */}
          {showAddStatusModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">New Status Update</h4>
                  <button onClick={() => setShowAddStatusModal(false)} className="text-zinc-500 hover:text-zinc-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase font-mono">Status Story Text</label>
                    <textarea
                      value={newStatusText}
                      onChange={(e) => setNewStatusText(e.target.value)}
                      placeholder="What is happening today? e.g. Syncing Room DB!"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 h-20 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleAddStatus}
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all shadow"
                    style={{ background: theme.primaryGradient }}
                  >
                    Post Status story
                  </button>
                </div>
              </div>
            </div>
          )}

          {user.isLoggedIn && (
            <>
              {/* FLOATING AI ASSISTANT BUBBLE/WIDGET */}
              <div className="absolute bottom-20 right-4 z-40">
                <button
                  onClick={() => setIsFloatingAIOpen(!isFloatingAIOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-[0_4px_16px_rgba(236,72,153,0.4)] flex items-center justify-center border border-pink-400/20 hover:scale-105 active:scale-95 transition-all duration-200"
                  title="BakBak AI Assistant"
                >
                  <BakBakLogo size={22} theme="dark" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950 text-[6px] text-white items-center justify-center font-bold"></span>
                  </span>
                </button>
              </div>

              {/* FLOATING AI DRAWER PANEL */}
              <AnimatePresence>
                {isFloatingAIOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 220 }}
                    className="absolute bottom-32 right-4 left-4 z-40 max-w-[340px] h-[360px] bg-zinc-950/95 backdrop-blur border border-zinc-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BakBakLogo size={18} theme="dark" />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white tracking-wide">BakBak Floating AI</span>
                            <span className="text-[7px] bg-gradient-to-r from-pink-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">Companion</span>
                          </div>
                          {isVoiceSupported ? (
                            <span className="text-[7px] text-zinc-400 block font-mono">
                              {isWakeWordActive ? "🎙️ Wake-Word: Active ('BakBak help me')" : "🎙️ Wake-Word: Paused"}
                            </span>
                          ) : (
                            <span className="text-[7px] text-zinc-500 block">Voice Mode unsupported in browser</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Wake-Word Toggle Button */}
                        {isVoiceSupported && (
                          <button
                            onClick={() => {
                              setIsWakeWordActive(!isWakeWordActive);
                              playChime("listening");
                            }}
                            className={`p-1 rounded-lg border transition-all ${
                              isWakeWordActive
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-zinc-850 border-zinc-800 text-zinc-500"
                            }`}
                            title={isWakeWordActive ? "Pause 'BakBak help me' trigger" : "Activate 'BakBak help me' trigger"}
                          >
                            <Mic className="w-3 h-3" />
                          </button>
                        )}

                        {/* Speech Synthesis Speaker Toggle Button */}
                        <button
                          onClick={() => {
                            const nextState = !isTTSMuted;
                            setIsTTSMuted(nextState);
                            if (!nextState) {
                              playChime("success");
                            } else {
                              window.speechSynthesis?.cancel();
                            }
                          }}
                          className={`p-1 rounded-lg border transition-all ${
                            !isTTSMuted
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                              : "bg-zinc-850 border-zinc-800 text-zinc-500"
                          }`}
                          title={isTTSMuted ? "Unmute AI speech" : "Mute AI speech"}
                        >
                          {isTTSMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => setIsFloatingAIOpen(false)}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                      {floatingAIHistory.map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.senderId === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-[85%] px-2.5 py-1.5 text-[11px] leading-relaxed rounded-xl shadow-sm ${
                              m.senderId === "user"
                                ? "bg-amber-500 text-black rounded-tr-none"
                                : "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-none"
                            }`}
                          >
                            {m.text}
                          </div>
                          <span className="text-[7px] text-zinc-500 mt-0.5 px-1 font-mono">{m.timestamp}</span>
                        </div>
                      ))}
                      {isVoiceListening && (
                        <div className="flex flex-col items-center justify-center p-3.5 bg-pink-950/20 border border-pink-500/20 rounded-2xl space-y-2 animate-pulse my-1">
                          <div className="flex items-center gap-1.5 justify-center h-6">
                            <span className="w-1 bg-pink-500 h-2.5 rounded animate-bounce [animation-delay:0.1s]"></span>
                            <span className="w-1 bg-pink-400 h-4.5 rounded animate-bounce [animation-delay:0.3s]"></span>
                            <span className="w-1 bg-purple-500 h-6 rounded animate-bounce [animation-delay:0.5s]"></span>
                            <span className="w-1 bg-pink-500 h-3.5 rounded animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1 bg-purple-400 h-1.5 rounded animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                          <span className="text-[10px] font-mono text-pink-400 font-bold animate-pulse">Speak now... BakBak is listening</span>
                        </div>
                      )}
                      {isFloatingAITyping && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-zinc-900/50 px-2.5 py-1.5 rounded-xl border border-zinc-850 w-fit">
                          <span className="animate-bounce">●</span>
                          <span className="animate-bounce delay-100">●</span>
                          <span className="animate-bounce delay-200">●</span>
                          <span className="text-[9px] font-mono ml-1">BakBak is thinking...</span>
                        </div>
                      )}
                    </div>

                    {/* Input Bar */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!floatingAIMessageInput.trim() || isFloatingAITyping) return;
                        const txt = floatingAIMessageInput;
                        setFloatingAIMessageInput("");

                        const userMsg: Message = {
                          id: generateId("f_usr_msg"),
                          chatId: "floating-ai",
                          senderId: "user",
                          text: txt,
                          timestamp: getFormattedTime(),
                          status: "read",
                        };
                        setFloatingAIHistory((prev) => [...prev, userMsg]);
                        setIsFloatingAITyping(true);

                        try {
                          const res = await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              message: txt,
                              history: floatingAIHistory.map((m) => ({
                                role: m.senderId === "user" ? "user" : "assistant",
                                content: m.text,
                              })),
                            }),
                          });
                          const data = await res.json();
                          const replyText = data.text;
                          setFloatingAIHistory((prev) => [
                            ...prev,
                            {
                              id: generateId("f_ai_resp"),
                              chatId: "floating-ai",
                              senderId: "ai-companion",
                              text: replyText,
                              timestamp: getFormattedTime(),
                              status: "read",
                            },
                          ]);

                          // Speak response aloud!
                          speakText(replyText);

                        } catch (err) {
                          setFloatingAIHistory((prev) => [
                            ...prev,
                            {
                              id: generateId("f_ai_err"),
                              chatId: "floating-ai",
                              senderId: "system",
                              text: "Connection issue. Please check network speed or API secrets key setup.",
                              timestamp: getFormattedTime(),
                              status: "read",
                            },
                          ]);
                        } finally {
                          setIsFloatingAITyping(false);
                        }
                      }}
                      className="p-2 bg-zinc-900 border-t border-zinc-800 flex gap-1.5 items-center"
                    >
                      {/* Manual Microphone Button */}
                      {isVoiceSupported && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isVoiceListening) {
                              if (activeRecRef.current) activeRecRef.current.stop();
                            } else {
                              triggerActiveListening();
                            }
                          }}
                          className={`p-2 rounded-xl transition-all ${
                            isVoiceListening
                              ? "bg-pink-500 text-white animate-pulse"
                              : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                          title={isVoiceListening ? "Stop listening" : "Talk directly to BakBak"}
                        >
                          <Mic className={`w-3.5 h-3.5 ${isVoiceListening ? "scale-110" : ""}`} />
                        </button>
                      )}

                      <input
                        type="text"
                        value={floatingAIMessageInput}
                        onChange={(e) => setFloatingAIMessageInput(e.target.value)}
                        placeholder={isVoiceListening ? "Listening..." : "Ask floating companion..."}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-pink-500"
                        disabled={isVoiceListening}
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white transition-all scale-90"
                        disabled={isVoiceListening}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

        </div>

        {/* Home Navigation indicator swipe bar */}
        <div className="w-full h-5 flex justify-center items-center z-10">
          <div className="w-32 h-1 bg-zinc-800 rounded-full" />
        </div>
      </div>
    </div>
  );
}
