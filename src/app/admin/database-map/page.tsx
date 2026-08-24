'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Database, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DatabaseMapPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [schemaMap, setSchemaMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    if (session?.user?.role !== 'sadmin') {
      router.push('/');
      return;
    }

    fetchDatabaseMap();
  }, [authStatus, session, router]);

  const fetchDatabaseMap = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database-map');
      const data = await response.json();

      if (data.success) {
        setSchemaMap(data);
      }
    } catch (error) {
      console.error('Failed to fetch database map:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(schemaMap, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'database-schema.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!schemaMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load database map</p>
      </div>
    );
  }

  const sortedCollections = Object.entries(schemaMap.schemaMap)
    .sort((a: any, b: any) => b[1].count - a[1].count);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Schema Map</h1>
              <p className="text-gray-600 mt-1">
                Database: <span className="font-mono">{schemaMap.database}</span> | 
                Collections: {schemaMap.collectionsCount}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadJSON} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Collections Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCollections.map(([name, data]: any) => (
                <div key={name} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{name}</span>
                    <span className="text-lg font-bold text-blue-600">{data.count}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{data.fields.length} fields</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Schema */}
        {sortedCollections.map(([collectionName, data]: any) => (
          <Card key={collectionName} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {collectionName}
                </CardTitle>
                <span className="text-sm text-gray-600">{data.count} documents</span>
              </div>
            </CardHeader>
            <CardContent>
              {data.fields.length === 0 ? (
                <p className="text-gray-500 text-sm">Empty collection</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 font-semibold text-gray-600 w-1/4">Field</th>
                        <th className="pb-3 font-semibold text-gray-600 w-1/6">Type</th>
                        <th className="pb-3 font-semibold text-gray-600">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(data.schema).map(([field, info]: any) => (
                        <tr key={field} className="hover:bg-gray-50">
                          <td className="py-2 font-mono text-xs">{field}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {info.type}
                            </span>
                          </td>
                          <td className="py-2 font-mono text-xs text-gray-600 truncate max-w-md">
                            {typeof info.sample === 'object' 
                              ? JSON.stringify(info.sample).substring(0, 100) 
                              : String(info.sample).substring(0, 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
