import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Dumbbell,
  Utensils,
  RotateCcw,
  Plus,
  Trash2,
  MessageSquare,
  PanelLeft,
  ChevronRight,
  Clock,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AIChatMessage } from '../../types';
import { AI_SERVICE_URL } from '../../config/constants';
import { useAIChatStore } from '../../stores/aiChatStore';
import { formatRelativeTime } from '../../lib/utils';
import api from '../../lib/axios';
import axios from 'axios';

const PRESET_PROMPTS = [
  'What is the optimal rest interval for hypertrophy?',
  'How do I program progressive overload on bench press?',
  'What should I eat 60 minutes before heavy leg day?',
  'Can you suggest a shoulder mobility routine for tight delts?',
];

export function AIChat() {
  const {
    sessions,
    activeSessionId,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    addMessage,
    clearSessionMessages,
    getActiveSession,
    syncWithBackend,
  } = useAIChatStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeSession = getActiveSession();
  const messages = activeSession?.messages || [];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    // Initial mount: ensure window is at top, sync sessions with backend, and scroll internal container to bottom
    window.scrollTo(0, 0);
    syncWithBackend();
    scrollToBottom('auto');
  }, [syncWithBackend]);

  useEffect(() => {
    // Scroll container to bottom when switching sessions
    scrollToBottom('auto');
  }, [activeSessionId]);

  useEffect(() => {
    if (messages.length > 1 || isLoading) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isLoading]);

  const handleCreateNewChat = () => {
    createSession();
    setInput('');
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleText(currentTitle);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitleText.trim()) {
      renameSession(id, editTitleText.trim());
    }
    setEditingSessionId(null);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const currentSessionId = activeSession.id;

    const userMessage: AIChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(currentSessionId, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Try Live Backend endpoint /ai/chat with session_id
      let aiReply = '';
      try {
        const res = await api.post('/ai/chat', {
          query: textToSend,
          session_id: currentSessionId,
        });
        aiReply = res.data.response || res.data.content || res.data.answer;
      } catch {
        // 2. Direct AI Service fallback to HF space /rag/query
        try {
          const directRes = await axios.post(`${AI_SERVICE_URL}/rag/query`, {
            query: textToSend,
            session_id: currentSessionId,
          });
          aiReply = directRes.data.response || directRes.data.answer;
        } catch {
          // 3. Fallback intelligent response generator
          aiReply = generateFallbackAIAnswer(textToSend);
        }
      }

      const aiMessage: AIChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      addMessage(currentSessionId, aiMessage);
    } catch {
      const errorMessage: AIChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        content:
          "I experienced a momentary connection interruption with the APEX AI service. Here is the core scientific guideline: For hypertrophy, maintain 3-4 sets per exercise between 8-12 reps with RPE 7-9, and ensure at least 1.6-2.2g protein per kg daily.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(currentSessionId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearSessionMessages(activeSession.id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Hub Nav / Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shadow-[0_0_15px_rgba(198,241,53,0.15)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary flex items-center gap-2">
              APEX AI Coach
              <span className="text-[10px] bg-accent text-black font-bold px-2 py-0.5 rounded-full">
                Apex Engine
              </span>
            </h1>
            <p className="text-xs text-text-muted">
              Peak athletic performance, biomechanics, and targeted nutrition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/ai/workout-plan">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Dumbbell className="w-3.5 h-3.5 text-accent" />
              <span>Routine Gen</span>
            </Button>
          </Link>
          <Link to="/ai/meal-plan">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Utensils className="w-3.5 h-3.5 text-accent" />
              <span>Meal Gen</span>
            </Button>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-main border-border text-text-muted hover:text-text-primary hover:bg-card-hover'
            }`}
            title="Toggle Sessions Sidebar"
            aria-label="Toggle Sessions"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Workspace with Sessions Sidebar */}
      <div className="h-[74vh] flex flex-col sm:flex-row rounded-2xl bg-card border border-border overflow-hidden shadow-2xl">
        {/* Left Sidebar: Saved Sessions */}
        {isSidebarOpen && (
          <aside className="w-full sm:w-72 border-b sm:border-b-0 sm:border-r border-border flex flex-col bg-main/60 shrink-0 max-h-48 sm:max-h-full">
            {/* Sidebar Header & New Chat Trigger */}
            <div className="p-3.5 border-b border-border/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>Sessions ({sessions.length})</span>
              </div>
              <Button
                variant="accent-glow"
                size="sm"
                onClick={handleCreateNewChat}
                className="gap-1 text-xs py-1 px-2.5 h-7 cursor-pointer"
                title="Start a fresh consultation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </Button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
              {sessions.map((session) => {
                const isActive = session.id === activeSession.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`group relative rounded-xl px-3 py-2.5 transition-all cursor-pointer border text-left ${
                      isActive
                        ? 'bg-accent/15 border-accent/40 text-text-primary shadow-[0_0_12px_rgba(198,241,53,0.1)]'
                        : 'bg-transparent border-transparent hover:bg-card/70 hover:border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(session.id, e)}
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          className="w-full bg-input-bg border border-accent rounded px-2 py-0.5 text-xs text-text-primary focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="p-1 hover:text-accent text-text-secondary"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSessionId(null)}
                          className="p-1 hover:text-status-declined text-text-secondary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {formatRelativeTime(session.updatedAt)}
                            </span>
                            <span>•</span>
                            <span>{session.messages.length} msgs</span>
                          </div>
                        </div>

                        {/* Session Actions on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleStartRename(session.id, session.title, e)}
                            className="p-1 rounded hover:bg-main text-text-muted hover:text-accent transition-colors"
                            title="Rename Session"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {sessions.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="p-1 rounded hover:bg-main text-text-muted hover:text-status-declined transition-colors"
                              title="Delete Session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Right Active Chat Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-card">
          {/* Active Session Header */}
          <div className="px-4 py-2.5 border-b border-border/80 bg-main/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0"></span>
              <h2 className="text-xs font-bold text-text-primary truncate">
                {activeSession.title}
              </h2>
              <Badge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px]">
                Active Session
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg bg-main/80 border border-border text-text-muted hover:text-text-primary hover:bg-card-hover transition-colors cursor-pointer"
                title="Clear current session messages"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-2xl ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? 'bg-accent text-black shadow-sm'
                        : 'bg-main border border-border text-accent'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-accent text-black font-medium shadow-[0_0_15px_rgba(198,241,53,0.15)] rounded-tr-none'
                          : 'bg-main border border-border text-text-primary rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[10px] text-text-muted px-1 ${
                        isUser ? 'text-right' : 'text-left'
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-main border border-border text-accent flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none bg-main border border-border text-text-muted text-xs flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent animate-bounce"></span>
                    <span
                      className="w-2 h-2 rounded-full bg-accent animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-accent animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></span>
                  </span>
                  <span className="text-text-secondary">Synthesizing sports science database...</span>
                </div>
              </div>
            )}
          </div>

          {/* Preset Prompt Chips */}
          <div className="px-4 py-2 border-t border-border/40 bg-main/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
            {PRESET_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-card border border-border hover:border-accent hover:text-accent text-text-secondary transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about programming, lifting mechanics, or nutrition..."
                className="flex-1 bg-input-bg text-text-primary rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-text-muted"
              />
              <Button
                type="submit"
                variant="accent-glow"
                size="md"
                disabled={!input.trim() || isLoading}
                className="cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

// Fallback intelligent domain response generator
function generateFallbackAIAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('rest') || q.includes('hypertrophy') || q.includes('between sets')) {
    return `### Optimal Rest Intervals for Hypertrophy & Strength

According to contemporary exercise physiology (Schoenfeld et al.):
1. **Compound Multi-Joint Movements** (Squats, Deadlifts, Incline Press):
   - Rest **2 to 3 minutes**. Adequate rest allows phosphocreatine replenishment, enabling you to maintain mechanical tension across subsequent sets.
2. **Isolation & Machine Movements** (Lateral Raises, Cable Pushdowns):
   - Rest **60 to 90 seconds** to maximize metabolic stress and muscle fiber fatigue.

**Key Rule:** Never start your next working set while cardiovascularly gasping. Take the necessary seconds to ensure high motor unit recruitment!`;
  }

  if (q.includes('progressive overload') || q.includes('bench')) {
    return `### Programming Progressive Overload for Bench Press

To systematically break through bench press plateaus:
1. **Double Progression Method:**
   - Pick a rep bracket (e.g. 3 sets of 6–8 reps).
   - Keep the weight fixed until you can execute 3 sets of 8 clean reps at RPE 8-9.
   - Then increase the load by 2.5 kg (5 lbs) and work back up from 6 reps.
2. **Setup Biomechanics:**
   - Pin your shoulder blades (scapular retraction & depression).
   - Create a stable leg drive arch by driving toes through the front of your shoes.
   - Grip width: 1.5x bi-acromial diameter to protect anterior delts.`;
  }

  if (q.includes('pre-workout') || q.includes('eat') || q.includes('meal')) {
    return `### Pre-Workout Fueling Protocol (60–90 Min Prior)

To maximize muscle glycogen and prevent mid-workout blood glucose drops:
- **Carbohydrates:** 35–50g fast-to-moderate digesting carbs (e.g., Cream of Rice, Banana with Honey, or Sourdough toast).
- **Protein:** 25–30g lean isolate or egg whites (low in fat/fiber for rapid gastric emptying).
- **Hydration & Electrolytes:** 500ml water with 500mg sodium to drive maximal cellular pump and vascular expansion.`;
  }

  return `### APEX Athletic AI Science Recommendation

Great question regarding "${query}".

Based on our sports science literature:
- **Mechanical Tension:** The single greatest driver of muscle growth. Always prioritize full active range of motion and 2-3 second eccentric control over ego lifting.
- **Volume Threshold:** Most athletes make optimal progress with 10–18 weekly hard sets per muscle group, distributed across 2 separate weekly sessions.
- **Recovery:** Muscle protein synthesis remains elevated for 24–48 hours post-stimulus. Ensure you hit your calculated daily protein threshold (1.8–2.2g/kg).

Would you like me to generate a tailored workout routine or meal plan for this specific goal?`;
}
