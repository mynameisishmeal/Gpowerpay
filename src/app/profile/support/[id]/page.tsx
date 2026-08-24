'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/profile/support/${params.id}`);
    } else if (status === 'authenticated') {
      fetchTicket();
    }
  }, [status, router, params.id]);

  useEffect(() => {
    // Scroll to bottom when messages load or change
    if (ticket?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
      } else {
        router.push('/profile/support');
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });
      const data = await res.json();
      
      if (data.success) {
        setReplyMessage('');
        // Append new message locally
        setTicket((prev: any) => ({
          ...prev,
          messages: [...prev.messages, data.message],
          status: prev.status === 'resolved' || prev.status === 'closed' ? 'open' : prev.status
        }));
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/profile/support" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketId}</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{ticket.subject}</p>
          </div>
        </div>

        <Card className="card-shadow flex flex-col h-[600px]">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <CardTitle className="text-lg">Conversation History</CardTitle>
            <CardDescription>We typically reply within 24 hours.</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
            {ticket.messages.map((msg: any, idx: number) => {
              const isMe = msg.sender._id === session?.user?.id;
              
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs font-medium text-gray-600">
                      {isMe ? 'You' : msg.sender.name}
                      {msg.sender.role !== 'customer' && !isMe && (
                        <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">STAFF</span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          {ticket.status !== 'closed' ? (
            <div className="p-4 bg-gray-50 border-t">
              <form onSubmit={handleReply} className="flex gap-3">
                <textarea
                  className="flex-1 min-h-[60px] max-h-[120px] p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e);
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={isReplying || !replyMessage.trim()}
                  className="btn-modern self-end"
                >
                  {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-t text-center text-gray-500 text-sm">
              This ticket has been closed. You cannot reply to a closed ticket.
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}