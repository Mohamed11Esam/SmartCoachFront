import { create } from 'zustand';
import { Conversation, Message } from '../types';
import { getSocket } from '../lib/socket';
import api from '../lib/axios';
import { useAuthStore } from './authStore';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isCoachTyping: boolean;
  isLoading: boolean;

  // Actions
  selectConversation: (id: string) => void;
  sendMessage: (content: string, mediaUrl?: string) => Promise<void>;
  receiveMessage: (message: Message) => void;
  setCoachTyping: (isTyping: boolean) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  startConversationWithCoach: (coachUserId: string, coachName: string, coachAvatar?: string) => string;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isCoachTyping: false,
  isLoading: false,

  selectConversation: (id) => {
    set({ activeConversationId: id });
    const convs = get().conversations.map((c) =>
      c._id === id ? { ...c, unreadCount: 0 } : c
    );
    set({ conversations: convs });

    // Join room on socket if active
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('joinConversation', id);
    }
  },

  sendMessage: async (content, mediaUrl) => {
    const { activeConversationId, messages, conversations } = get();
    if (!activeConversationId) return;

    const currentUser = useAuthStore.getState().user;

    const newMessage: Message = {
      _id: 'msg_' + Date.now(),
      conversationId: activeConversationId,
      senderId: currentUser?._id || 'user_athlete',
      senderName: currentUser?.name || 'Athlete',
      content,
      mediaUrl,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    // Optimistic update
    const currentMsgs = messages[activeConversationId] || [];
    set({
      messages: {
        ...messages,
        [activeConversationId]: [...currentMsgs, newMessage],
      },
      conversations: conversations.map((c) =>
        c._id === activeConversationId
          ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt }
          : c
      ),
    });

    // Try socket emit
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('sendMessage', {
        conversationId: activeConversationId,
        content,
        mediaUrl,
      });
    } else {
      // Fallback REST call (if backend online)
      try {
        await api.post(`/chat/conversations/${activeConversationId}/messages`, {
          content,
          mediaUrl,
        });
      } catch (err) {
        // Fallback automated reply simulation for offline/demo if socket & backend are unavailable
        setTimeout(() => {
          get().setCoachTyping(true);
        }, 800);

        setTimeout(() => {
          get().setCoachTyping(false);
          const replyText =
            content.toLowerCase().includes('form') || content.toLowerCase().includes('squat')
              ? "Great focus on mechanics! Make sure to stay braced through the bottom turn."
              : content.toLowerCase().includes('weight') || content.toLowerCase().includes('diet')
              ? "Your calories and protein look right on target. Keep prioritizing quality sleep tonight!"
              : "Got it! Keep pushing the intensity and let me know how the next sets feel.";

          const coachMsg: Message = {
            _id: 'msg_reply_' + Date.now(),
            conversationId: activeConversationId,
            senderId: 'user_coach_01',
            senderName: 'Coach Elena',
            content: replyText,
            createdAt: new Date().toISOString(),
          };
          get().receiveMessage(coachMsg);
        }, 2200);
      }
    }
  },

  receiveMessage: (message) => {
    const { messages, activeConversationId, conversations } = get();
    const convId = message.conversationId;
    const currentMsgs = messages[convId] || [];

    set({
      messages: {
        ...messages,
        [convId]: [...currentMsgs, message],
      },
      conversations: conversations.map((c) =>
        c._id === convId
          ? {
              ...c,
              lastMessage: message,
              unreadCount: c._id === activeConversationId ? 0 : (c.unreadCount || 0) + 1,
              updatedAt: message.createdAt,
            }
          : c
      ),
    });
  },

  setCoachTyping: (isTyping) => {
    set({ isCoachTyping: isTyping });
  },

  loadConversations: async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      if (Array.isArray(data)) {
        set({ conversations: data });
        if (!get().activeConversationId && data.length > 0) {
          set({ activeConversationId: data[0]._id });
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  },

  loadMessages: async (conversationId) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
      if (Array.isArray(data)) {
        set((state) => ({
          messages: { ...state.messages, [conversationId]: data },
        }));
      }
    } catch (err) {
      console.error(`Failed to load messages for conversation ${conversationId}:`, err);
    }
  },

  startConversationWithCoach: (coachUserId, coachName, coachAvatar) => {
    const { conversations } = get();
    const existing = conversations.find((c) => c.participant._id === coachUserId);
    if (existing) {
      set({ activeConversationId: existing._id });
      return existing._id;
    }

    const newConvId = 'conv_' + Date.now();
    const newConv: Conversation = {
      _id: newConvId,
      participant: {
        _id: coachUserId,
        name: coachName,
        role: 'Certified Coach',
        avatarUrl: coachAvatar,
        isOnline: true,
      },
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    };

    set({
      conversations: [newConv, ...conversations],
      activeConversationId: newConvId,
      messages: {
        ...get().messages,
        [newConvId]: [
          {
            _id: 'msg_welcome_' + Date.now(),
            conversationId: newConvId,
            senderId: coachUserId,
            senderName: coachName,
            content: `Hello! I'm ${coachName}. I'm excited to help you achieve your peak fitness goals. How can I assist your training today?`,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    return newConvId;
  },
}));
