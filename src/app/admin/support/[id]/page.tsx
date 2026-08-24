'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, Send, Save, User, Clock, AlertCircle, Paperclip, X } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { compressImage } from '@/lib/utils/imageCompression';

export default function AdminTicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  
  const [admins, setAdmins] = useState<any[]>([]);

  const [ticketStatus, setTicketStatus] = useState('');
  const [ticketPriority, setTicketPriority] = useState('');
  
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/admin/support/${params.id}`);
    } else if (status === 'authenticated') {
      fetchTicket();
      fetchAdmins();
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

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users?role=sadmin,admin,support');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    }
  };

  const reassignTicket = async (adminId: string) => {
    setIsReassigning(true);
    try {
      const res = await fetch(`/api/tickets/${params.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      });
      const data = await res.json();
      if (data.success) {
        fetchTicket(); // Refresh to show updated assignment
      } else {
        alert(data.error || 'Failed to reassign');
      }
    } catch (err) {
      console.error('Failed to reassign:', err);
    } finally {
      setIsReassigning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setAttachment(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() && !attachment) return;

    setIsReplying(true);
    const msgText = replyMessage.trim() || 'Sent an attachment';
    const currentAttachment = attachment;

    try {
      const payload: any = { message: msgText };
      if (currentAttachment) {
        payload.attachments = [currentAttachment];
      }

      const res = await fetch(`/api/tickets/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) {
        setReplyMessage('');
        setAttachment(null);
        setTicket((prev: any) => ({
          ...prev,
          messages: [...prev.messages, data.message],
        }));
      } else {
        alert(data.error || 'Failed to send reply');
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

  const isAssignedToOther = ticket.assignedTo && ticket.assignedTo?._id !== session?.user?.id;
  const canReply = session?.user?.role === 'sadmin' || !isAssignedToOther;
  const canReassign = session?.user?.role === 'sadmin' || (!isAssignedToOther && ticket.assignedTo);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketId}: {ticket.subject}</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Opened by <span className="font-medium text-gray-700">{ticket.customer?.name}</span> ({ticket.customer?.email})
              {ticket.assignedTo && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                  Assigned to: {ticket.assignedTo?.name || 'Admin'}
                </span>
              )}
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
                          {isMe ? 'You' : (msg.sender.name ? `${msg.sender.name} (${msg.sender.role})` : 'Customer')}
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
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 rounded overflow-hidden">
                            {msg.attachments.map((img: string, i: number) => (
                              <img key={i} src={img} alt="attachment" className="w-full h-auto max-h-64 object-cover rounded cursor-pointer" onClick={() => window.open(img, '_blank')} />
                            ))}
                          </div>
                        )}
                        {msg.message !== 'Sent an attachment' && msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 bg-gray-50 border-t flex flex-col gap-2">
                {attachment && (
                  <div className="relative inline-block self-start">
                    <img src={attachment} alt="Upload preview" className="h-16 w-16 object-cover rounded shadow-sm border border-gray-200" />
                    <button 
                      type="button" 
                      onClick={() => setAttachment(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleReply} className="flex gap-3 items-end">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                    disabled={!canReply}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-11 w-11 shrink-0 bg-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !canReply}
                  >
                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                  </Button>
                  <textarea
                    className="flex-1 min-h-[44px] max-h-[120px] p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    placeholder={canReply ? "Type your reply to the customer..." : "Ticket is locked by another admin..."}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={!canReply}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && canReply) {
                        e.preventDefault();
                        handleReply(e as any);
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    disabled={(!replyMessage.trim() && !attachment) || !canReply || isUploading}
                    isLoading={isReplying}
                    className="btn-modern self-end shrink-0 h-11"
                  >
                    {!isReplying && <Send className="h-4 w-4" />}
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
                  disabled={ticketStatus === ticket.status && ticketPriority === ticket.priority}
                  isLoading={isUpdating}
                >
                  {!isUpdating && <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>

                {canReassign && (
                  <div className="pt-4 mt-2 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-gray-400" /> Reassign Ticket
                    </label>
                    <select 
                      className="w-full h-10 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={ticket.assignedTo?._id || ''}
                      onChange={(e) => reassignTicket(e.target.value)}
                      disabled={isReassigning}
                    >
                      <option value="" disabled>Select Staff...</option>
                      {admins.map(a => (
                        <option key={a._id} value={a._id}>{a.name || a.email} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                )}
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