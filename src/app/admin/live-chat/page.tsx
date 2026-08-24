'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Send, User, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminLiveChatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/live-chat');
    } else if (status === 'authenticated') {
      fetchSessions();
      
      // Poll for new sessions and messages every 3 seconds
      pollingInterval.current = setInterval(() => {
        fetchSessions(false); // silent fetch
        if (activeSessionId) {
          syncMessages(activeSessionId);
        }
      }, 3000);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [status, router, activeSessionId]); // re-bind interval when activeSessionId changes

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const res = await fetch('/api/admin/chat/sessions?status=active');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]); // Clear old messages immediately for UI snap
    await syncMessages(sessionId, true);
  };

  const syncMessages = async (sid: string, fullSync = false) => {
    // If full sync, we fetch all. If not, we just fetch new ones if we already have some state
    // But since this is a simple polling, we can just fetch all or pass lastMessageId
    
    // Using full fetch for simplicity in this dashboard, or lastMessageId if we have them
    let url = `/api/chat/sync?sessionId=${sid}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Just overwrite with all messages to avoid complex local state diffing in a dashboard
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to sync messages:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId) return;

    const msgText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, message: msgText })
      });
      const data = await res.json();
      
      if (data.success) {
        // Refresh messages immediately
        syncMessages(activeSessionId);
      } else {
        setInputMessage(msgText);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputMessage(msgText);
    } finally {
      setIsSending(false);
    }
  };

  const closeSession = async () => {
    if (!activeSessionId || !confirm('Are you sure you want to end this chat?')) return;
    
    try {
      const res = await fetch('/api/admin/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, status: 'closed' })
      });
      const data = await res.json();
      
      if (data.success) {
        setActiveSessionId(null);
        setMessages([]);
        fetchSessions();
      }
    } catch (err) {
      console.error('Failed to close session:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Admin access only (sadmin, admin, support)
  if (session?.user?.role === 'customer' || session?.user?.role === 'rider') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-4">You do not have permission to view the admin live chat.</p>
      </div>
    );
  }

  const activeSessionDetails = sessions.find(s => s._id === activeSessionId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            Live Chat Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Chat with active customers in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
          
          {/* Active Sessions Sidebar */}
          <Card className="lg:col-span-1 card-shadow flex flex-col overflow-hidden h-full">
            <CardHeader className="bg-gray-50/50 border-b pb-4 px-4 pt-4">
              <CardTitle className="text-sm">Active Conversations ({sessions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No active chats.
                </div>
              ) : (
                sessions.map(s => (
                  <div 
                    key={s._id} 
                    onClick={() => selectSession(s._id)}
                    className={`p-4 border-b cursor-pointer transition-colors ${activeSessionId === s._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="font-medium text-gray-900 text-sm truncate">{s.customer?.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(s.lastMessageAt), { addSuffix: true })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-3 card-shadow flex flex-col overflow-hidden h-full">
            {!activeSessionId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageCircle size={48} className="mb-4 text-gray-300" />
                <p>Select a conversation from the left to start chatting.</p>
              </div>
            ) : (
              <>
                <CardHeader className="bg-white border-b py-3 px-4 flex flex-row items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{activeSessionDetails?.customer?.name}</CardTitle>
                      <CardDescription className="text-xs">{activeSessionDetails?.customer?.email}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={closeSession} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> End Chat
                  </Button>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderRole !== 'customer'; // Since this is admin dashboard
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] font-medium text-gray-500">
                              {isMe ? msg.senderId?.name || 'You' : msg.senderId?.name || 'Customer'}
                            </span>
                            <span className="text-[9px] text-gray-400">
                              {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div 
                            className={`max-w-[70%] px-4 py-2.5 text-sm rounded-2xl ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 bg-white border-t">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <Input
                      placeholder="Type your reply..."
                      className="flex-1 h-11"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      disabled={isSending || !inputMessage.trim()}
                      className="h-11 px-6 btn-modern"
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}