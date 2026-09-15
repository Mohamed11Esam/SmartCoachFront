import { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Circle,
  Search,
  MessageSquare,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { formatRelativeTime } from '../../lib/utils';
import { connectSocket, getSocket } from '../../lib/socket';

export function CoachChat() {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isCoachTyping,
    selectConversation,
    sendMessage,
    loadConversations,
    loadMessages,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Initialize socket & load initial data
  useEffect(() => {
    connectSocket();
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    // Ensure window stays at top and scroll inner message container to bottom on conversation change
    window.scrollTo(0, 0);
    scrollToBottom('auto');
  }, [activeConversationId]);

  const activeConv = conversations.find((c) => c._id === activeConversationId) || conversations[0];
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    if (currentMessages.length > 0 || isCoachTyping) {
      scrollToBottom('smooth');
    }
  }, [currentMessages.length, isCoachTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const content = inputMessage.trim();
    setInputMessage('');
    await sendMessage(content);
  };

  const filteredConversations = conversations.filter((c) =>
    c.participant.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto h-[80vh] flex flex-col sm:flex-row rounded-2xl bg-card border border-border overflow-hidden shadow-2xl animate-fadeIn">
      {/* Left Sidebar: Conversations List */}
      <div className="w-full sm:w-80 border-r border-border flex flex-col bg-main/50">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span>Coach Messages</span>
            </h2>
            <Badge variant="accent" size="sm">
              Live
            </Badge>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-input-bg border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredConversations.map((conv) => {
            const isSelected = conv._id === activeConversationId;
            return (
              <button
                key={conv._id}
                onClick={() => selectConversation(conv._id)}
                className={`w-full p-4 flex items-start gap-3 text-left transition-all cursor-pointer ${
                  isSelected ? 'bg-card border-l-2 border-accent' : 'hover:bg-card/50'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      conv.participant.avatarUrl ||
                      'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={conv.participant.name}
                    className="w-10 h-10 rounded-xl object-cover border border-border"
                  />
                  {conv.participant.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-approved rounded-full border-2 border-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-text-primary truncate">
                      {conv.participant.name}
                    </h4>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-text-muted shrink-0">
                        {formatRelativeTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                    {conv.lastMessage ? conv.lastMessage.content : 'Started a conversation'}
                  </p>
                </div>

                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-accent text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                    {conv.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Area: Active Chat */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-card">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-main/30">
            <div className="flex items-center gap-3">
              <img
                src={
                  activeConv.participant.avatarUrl ||
                  'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200'
                }
                alt={activeConv.participant.name}
                className="w-10 h-10 rounded-xl object-cover border border-border"
              />
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                  {activeConv.participant.name}
                </h3>
                <p className="text-[11px] text-status-approved flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-status-approved" /> Online & Available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-main transition-colors cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-main transition-colors cursor-pointer"
                title="Video Session"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-main transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentMessages.map((msg) => {
              const isMe = msg.senderId === 'user_athlete_01' || msg.senderId === user?._id;

              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 max-w-lg ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      isMe ? 'bg-accent text-black' : 'bg-main border border-border text-accent'
                    }`}
                  >
                    {isMe ? 'Me' : activeConv.participant.name[0]}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-accent text-black font-medium shadow-sm rounded-tr-none'
                          : 'bg-main border border-border text-text-primary rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[10px] text-text-muted px-1 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{formatRelativeTime(msg.createdAt)}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-accent" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coach typing indicator */}
            {isCoachTyping && (
              <div className="flex gap-2 items-center text-xs text-text-muted pl-10 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span>{activeConv.participant.name} is typing...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-border bg-main/40">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button
                type="button"
                className="p-2.5 rounded-xl bg-card border border-border text-text-muted hover:text-text-primary hover:border-border-light cursor-pointer"
                title="Attach Workout Log or Video"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Message ${activeConv.participant.name}...`}
                className="flex-1 bg-input-bg border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />

              <Button
                type="submit"
                variant="accent-glow"
                size="md"
                disabled={!inputMessage.trim()}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-text-muted text-xs">
          Select a coach conversation to start messaging.
        </div>
      )}
    </div>
  );
}
