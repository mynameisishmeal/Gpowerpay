import { Metadata } from 'next';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, Link as LinkIcon, HelpCircle, MessageCircle, MapPin } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help & Support | Gpowerpay',
  description: 'Get help and support for Gpowerpay services',
};

export const revalidate = 60; // Revalidate every 60 seconds to keep settings fresh

async function getSettings() {
  try {
    await connectDB();
    const settings = await Settings.findOne().lean();
    return settings;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return null;
  }
}

export default async function HelpPage() {
  const settings = await getSettings();

  const phoneNumbers = settings?.phoneNumbers || [];
  const emails = settings?.emails || [];
  const socials = settings?.socials || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">How can we help you?</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help! Reach out to us through any of the channels below or check our frequently asked questions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Phone Support */}
          <Card className="border-t-4 border-t-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Call Us</CardTitle>
              <CardDescription>Speak directly with our team</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {phoneNumbers.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {phoneNumbers.map((phone, idx) => (
                    <a 
                      key={idx} 
                      href={`tel:${phone}`}
                      className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4 italic">Phone support currently unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-t-4 border-t-red-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Email Us</CardTitle>
              <CardDescription>Get support straight to your inbox</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {emails.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {emails.map((email, idx) => (
                    <a 
                      key={idx} 
                      href={`mailto:${email}`}
                      className="block text-md font-semibold text-gray-900 hover:text-red-600 transition-colors break-all"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4 italic">Email support currently unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card className="border-t-4 border-t-purple-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Social Media</CardTitle>
              <CardDescription>Connect with us online</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {socials.length > 0 ? (
                <div className="space-y-4 mt-4 flex flex-col items-center">
                  {socials.map((social, idx) => (
                    <a 
                      key={idx} 
                      href={social.url.startsWith('http') ? social.url : `https://${social.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-md font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      {social.platform}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4 italic">Social links currently unavailable.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Office Location (Static for now, could be dynamic later) */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-10 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                Our Headquarters
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Prefer to talk in person? You can find us at our main office during regular business hours.
              </p>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <p className="text-gray-900 font-semibold text-lg">Gpower HQ</p>
                <p className="text-gray-700">123 Market Street, Suite 400</p>
                <p className="text-gray-700 mb-2">Lagos, Nigeria</p>
                <p className="text-blue-600 font-medium text-sm">Mon - Fri, 9:00 AM - 5:00 PM</p>
              </div>
            </div>
            <div className="bg-gray-100 min-h-[300px] h-full flex items-center justify-center border-l border-gray-200 relative">
              {/* Optional: Add a Google Maps iframe here later */}
              <div className="absolute inset-0 bg-blue-900/5 flex items-center justify-center">
                <MapPin className="w-24 h-24 text-blue-200/50" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
