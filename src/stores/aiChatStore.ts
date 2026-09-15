import { create } from 'zustand';
import { AIChatMessage, AIChatSession } from '../types';
import api from '../lib/axios';

interface AIChatState {
  sessions: AIChatSession[];
  activeSessionId: string;
  isLoadingSessions: boolean;
  createSession: (title?: string) => Promise<string>;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  addMessage: (sessionId: string, message: AIChatMessage) => void;
  clearSessionMessages: (sessionId: string) => void;
  getActiveSession: () => AIChatSession;
  syncWithBackend: () => Promise<void>;
}

const STORAGE_KEY = 'smartcoach_ai_sessions';

export const createWelcomeMessage = (): AIChatMessage => ({
  id: 'welcome_' + Date.now(),
  sender: 'assistant',
  content:
    "Hello Marcus! I am your APEX AI advisor, grounded in evidence-based exercise science and sports nutrition. What's on your training agenda today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});

const createInitialSession = (): AIChatSession => {
  const now = new Date().toISOString();
  return {
    id: 'session_' + Date.now(),
    title: 'General Consultation',
    createdAt: now,
    updatedAt: now,
    messages: [createWelcomeMessage()],
  };
};

const loadSavedSessions = (): { sessions: AIChatSession[]; activeId: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AIChatSession[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          sessions: parsed,
          activeId: parsed[0].id,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load saved AI chat sessions:', e);
  }

  const initial = createInitialSession();
  return {
    sessions: [initial],
    activeId: initial.id,
  };
};

const saveSessions = (sessions: AIChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save AI chat sessions to localStorage:', e);
  }
};

const initialData = loadSavedSessions();

export const useAIChatStore = create<AIChatState>((set, get) => ({
  sessions: initialData.sessions,
  activeSessionId: initialData.activeId,
  isLoadingSessions: false,

  syncWithBackend: async () => {
    try {
      set({ isLoadingSessions: true });
      const res = await api.get('/ai/sessions', { timeout: 2000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        const backendSessions: AIChatSession[] = res.data.map((s: any) => ({
          id: String(s._id || s.id),
          title: s.title || 'Consultation',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || new Date().toISOString(),
          messages: Array.isArray(s.messages) && s.messages.length > 0 ? s.messages : [createWelcomeMessage()],
        }));

        set((state) => {
          // Keep active session if it exists in backend list, else pick the first
          const activeExists = backendSessions.some((s) => s.id === state.activeSessionId);
          const activeId = activeExists ? state.activeSessionId : backendSessions[0].id;
          saveSessions(backendSessions);
          return {
            sessions: backendSessions,
            activeSessionId: activeId,
            isLoadingSessions: false,
          };
        });
        return;
      }
    } catch {
      // Offline, mock auth, or backend endpoint cold - use local cache silently
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    const found = sessions.find((s) => s.id === activeSessionId);
    if (found) return found;
    if (sessions.length > 0) return sessions[0];
    const fallback = createInitialSession();
    set({ sessions: [fallback], activeSessionId: fallback.id });
    saveSessions([fallback]);
    return fallback;
  },

  createSession: async (title?: string) => {
    const now = new Date().toISOString();
    const localId = 'session_' + Date.now();
    const newSession: AIChatSession = {
      id: localId,
      title: title || 'New Consultation',
      createdAt: now,
      updatedAt: now,
      messages: [createWelcomeMessage()],
    };

    set((state) => {
      const updated = [newSession, ...state.sessions];
      saveSessions(updated);
      return {
        sessions: updated,
        activeSessionId: newSession.id,
      };
    });

    // Sync with backend MongoDB in background
    try {
      const res = await api.post('/ai/sessions', { title: title || 'New Consultation' }, { timeout: 2500 });
      if (res.data?._id) {
        const backendId = String(res.data._id);
        set((state) => {
          const mapped = state.sessions.map((s) => (s.id === localId ? { ...s, id: backendId } : s));
          saveSessions(mapped);
          return {
            sessions: mapped,
            activeSessionId: state.activeSessionId === localId ? backendId : state.activeSessionId,
          };
        });
        return backendId;
      }
    } catch {
      // Kept in localStorage seamlessly
    }

    return localId;
  },

  selectSession: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  deleteSession: async (sessionId: string) => {
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== sessionId);
      let nextActiveId = state.activeSessionId;

      if (filtered.length === 0) {
        const fresh = createInitialSession();
        filtered.push(fresh);
        nextActiveId = fresh.id;
      } else if (state.activeSessionId === sessionId) {
        nextActiveId = filtered[0].id;
      }

      saveSessions(filtered);
      return {
        sessions: filtered,
        activeSessionId: nextActiveId,
      };
    });

    // Delete in backend MongoDB
    try {
      await api.delete(`/ai/sessions/${sessionId}`, { timeout: 2500 });
    } catch {
      // Handled silently
    }
  },

  renameSession: async (sessionId: string, newTitle: string) => {
    set((state) => {
      const updated = state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, title: newTitle.trim(), updatedAt: new Date().toISOString() }
          : s
      );
      saveSessions(updated);
      return { sessions: updated };
    });

    // Update in backend MongoDB
    try {
      await api.patch(`/ai/sessions/${sessionId}`, { title: newTitle.trim() }, { timeout: 2500 });
    } catch {
      // Handled silently
    }
  },

  addMessage: (sessionId: string, message: AIChatMessage) => {
    set((state) => {
      const updated = state.sessions.map((session) => {
        if (session.id !== sessionId) return session;

        let newTitle = session.title;
        if (
          message.sender === 'user' &&
          (session.title === 'New Consultation' || session.title === 'General Consultation')
        ) {
          const cleanPrompt = message.content.replace(/[^\w\s-]/gi, '').trim();
          newTitle = cleanPrompt.length > 34 ? cleanPrompt.slice(0, 34) + '...' : cleanPrompt;
          if (!newTitle) newTitle = session.title;
        }

        return {
          ...session,
          title: newTitle,
          updatedAt: new Date().toISOString(),
          messages: [...session.messages, message],
        };
      });

      saveSessions(updated);
      return { sessions: updated };
    });
  },

  clearSessionMessages: (sessionId: string) => {
    set((state) => {
      const updated = state.sessions.map((session) => {
        if (session.id !== sessionId) return session;
        return {
          ...session,
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: 'welcome_reset_' + Date.now(),
              sender: 'assistant' as const,
              content: 'Conversation history reset. What would you like to discuss next?',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };
      });

      saveSessions(updated);
      return { sessions: updated };
    });
  },
}));
