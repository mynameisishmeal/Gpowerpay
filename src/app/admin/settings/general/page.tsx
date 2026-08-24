'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Loader2, Phone, Mail, Link as LinkIcon, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface Social {
  platform: string;
  url: string;
  icon?: string;
}

export default function GeneralSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [socials, setSocials] = useState<Social[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'sadmin') {
      toast.error('Only super admins can access this page');
      router.push('/admin/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, session, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSocials(data.settings.socials || []);
        setPhoneNumbers(data.settings.phoneNumbers || []);
        setEmails(data.settings.emails || []);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socials: socials.filter(s => s.platform.trim() && s.url.trim()),
          phoneNumbers: phoneNumbers.filter(p => p.trim()),
          emails: emails.filter(e => e.trim()),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }
      
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-500" />
              General Site Settings
            </h1>
            <p className="text-gray-400 mt-2">Manage your public contact information and social links.</p>
          </div>
          <Button 
            onClick={handleSave} 
            isLoading={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {!saving && <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Social Links */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Social Links
            </CardTitle>
            <CardDescription className="text-gray-400">
              Add links to your social media profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socials.map((social, index) => (
              <div key={index} className="flex gap-4 items-start">
                <Input
                  placeholder="Platform (e.g. Facebook)"
                  value={social.platform}
                  onChange={(e) => {
                    const newSocials = [...socials];
                    newSocials[index].platform = e.target.value;
                    setSocials(newSocials);
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="URL"
                  value={social.url}
                  onChange={(e) => {
                    const newSocials = [...socials];
                    newSocials[index].url = e.target.value;
                    setSocials(newSocials);
                  }}
                  className="bg-gray-700 border-gray-600 text-white flex-1"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setSocials(socials.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setSocials([...socials, { platform: '', url: '' }])}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Social Link
            </Button>
          </CardContent>
        </Card>

        {/* Phone Numbers */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-500" />
              Support Phone Numbers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Add phone numbers for customer support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex gap-4 items-start">
                <Input
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => {
                    const newPhones = [...phoneNumbers];
                    newPhones[index] = e.target.value;
                    setPhoneNumbers(newPhones);
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setPhoneNumbers([...phoneNumbers, ''])}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Phone Number
            </Button>
          </CardContent>
        </Card>

        {/* Emails */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-500" />
              Support Emails
            </CardTitle>
            <CardDescription className="text-gray-400">
              Add email addresses for customer support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-4 items-start">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmails = [...emails];
                    newEmails[index] = e.target.value;
                    setEmails(newEmails);
                  }}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setEmails(emails.filter((_, i) => i !== index))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed border-gray-600 hover:bg-gray-700 text-gray-300"
              onClick={() => setEmails([...emails, ''])}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Email Address
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
