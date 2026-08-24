'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send, Save, User, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/support/${params.id}`);
    } else if (status === 'authenticated') {
      fetchTicket();
    }
  }, [status, router, params.id]);

  useEffect(() => {
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
        setTicketStatus(data.ticket.status);
        setTicketPriority(data.ticket.priority);
      } else {
        router.push('/admin/support');
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
        setTicket((prev: any) => ({
          ...prev,
          messages: [...prev.messages, data.message],
        }));
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsReplying(false);
    }
  };

  const handleUpdateMeta = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: ticketStatus, priority: ticketPriority }),
      });
      const data = await res.json();
      
      if (data.success) {
        setTicket((prev: any) => ({
          ...prev,
          status: ticketStatus,
          priority: ticketPriority
        }));
        // Optional: show a toast notification here
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setIsUpdating(false);
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

  // Admin access only (sadmin, admin, support)
  if (session?.user?.role === 'customer' || session?.user?.role === 'rider') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-4">You do not have permission to view the admin support dashboard.</p>
        <Link href="/profile/support">
          <Button>Go to My Tickets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketId}: {ticket.subject}</h1>
            <p className="text-gray-500 mt-1">
              Opened by <span className="font-medium text-gray-700">{ticket.customer?.name}</span> ({ticket.customer?.email})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="card-shadow flex flex-col h-[700px]">
              <CardHeader className="border-b bg-gray-50/50 pb-4">
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                {ticket.messages.map((msg: any, idx: number) => {
                  const isCustomer = msg.sender.role === 'customer';
                  const isMe = msg.sender._id === session?.user?.id;
                  
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs font-medium text-gray-600">
                          {isMe ? 'You' : msg.sender.name}
                          {!isCustomer && !isMe && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">STAFF</span>
                          )}
                          {isCustomer && (
                            <span className="ml-2 bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">CUSTOMER</span>
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
                            : isCustomer
                            ? 'bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200'
                            : 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 bg-gray-50 border-t">
                <form onSubmit={handleReply} className="flex gap-3">
                  <textarea
                    className="flex-1 min-h-[60px] max-h-[120px] p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    placeholder="Type your reply to the customer..."
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
            </Card>
          </div>

          {/* Sidebar Properties */}
          <div className="lg:col-span-1 space-y-6">
            
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Ticket Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-gray-400" /> Status
                  </label>
                  <select 
                    className="w-full h-10 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value)}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-gray-400" /> Priority
                  </label>
                  <select 
                    className="w-full h-10 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <Button 
                  className="w-full mt-2" 
                  onClick={handleUpdateMeta}
                  disabled={isUpdating || (ticketStatus === ticket.status && ticketPriority === ticket.priority)}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ticket.customer?.name}</p>
                    <p className="text-sm text-gray-500">{ticket.customer?.email}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> 
                    Ticket Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}