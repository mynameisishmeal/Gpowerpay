'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send, Minus, Loader2 } from 'lucide-react';

export function LiveChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize chat session when opening for the first time
  useEffect(() => {
    if (isOpen && !sessionId && !isInitializing && session?.user?.role === 'customer') {
      initChat();
    }
  }, [isOpen, sessionId, session]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Polling logic
  useEffect(() => {
    if (sessionId && isOpen && !isMinimized) {
      // Poll every 3 seconds
      pollingInterval.current = setInterval(() => {
        syncMessages();
      }, 3000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [sessionId, isOpen, isMinimized, messages]);

  const initChat = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/chat/init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        // Do an initial sync
        syncMessages(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to init chat', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const syncMessages = async (sid = sessionId) => {
    if (!sid) return;
    
    // Get the ID of the last message we have
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
    const url = `/api/chat/sync?sessionId=${sid}${lastMessageId ? `&lastMessageId=${lastMessageId}` : ''}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
      }
    } catch (err) {
      console.error('Failed to sync chat', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId) return;

    const msgText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: msgText })
      });
      const data = await res.json();
      
      if (data.success) {
        // Manually trigger a sync to grab our new message + any others
        syncMessages();
      } else {
        // Put the message back if it failed
        setInputMessage(msgText);
      }
    } catch (err) {
      console.error('Failed to send message', err);
      setInputMessage(msgText);
    } finally {
      setIsSending(false);
    }
  };

  // Only show the widget for logged-in customers
  if (!session || session.user.role !== 'customer') {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 z-50 p-0 flex items-center justify-center"
      >
        <MessageCircle size={28} className="text-white" />
      </Button>
    );
  }

  return (
    <div 
      className={`fixed right-6 z-50 flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out ${
        isMinimized ? 'bottom-6 h-14 w-[350px]' : 'bottom-6 h-[500px] w-[350px] sm:w-[400px]'
      }`}
    >
      {/* Header */}
      <div 
        className="bg-blue-600 text-white p-4 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h3 className="font-medium">Live Support</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-1 hover:bg-white/20 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            <Minus size={18} />
          </button>
          <button 
            className="p-1 hover:bg-white/20 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {isInitializing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Connecting to support...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center px-4">
                <MessageCircle size={40} className="mb-2 text-gray-300" />
                <p className="text-sm">Hi there! 👋 How can we help you today?</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderRole === 'customer';
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] text-gray-500 ml-1 mb-0.5">Support</span>}
                    <div 
                      className={`max-w-[85%] px-3 py-2 text-sm rounded-2xl ${
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
          </div>

          {/* Footer (Input) */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 h-10 px-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isInitializing}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10 rounded-full shrink-0 bg-blue-600 hover:bg-blue-700"
                disabled={!inputMessage.trim() || isSending || isInitializing}
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}