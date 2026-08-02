import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * GET /api/admin/database-map
 * Map all collections and their schemas
 */
export async function GET() {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const collections = await db.listCollections().toArray();
    const schemaMap: any = {};

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      const count = await collection.countDocuments();
      
      if (count > 0) {
        const samples = await collection.find({}).limit(2).toArray();
        
        const schema: any = {};
        if (samples.length > 0) {
          const firstDoc = samples[0];
          
          for (const [key, value] of Object.entries(firstDoc)) {
            schema[key] = {
              type: Array.isArray(value) ? 'array' : typeof value,
              sample: Array.isArray(value) 
                ? `[${value.length} items]` 
                : value !== null && typeof value === 'object' && !(value instanceof Date)
                  ? 'object'
                  : value,
            };
          }
        }
        
        schemaMap[collectionName] = {
          count,
          schema,
          fields: Object.keys(schema),
        };
      } else {
        schemaMap[collectionName] = {
          count: 0,
          schema: {},
          fields: [],
        };
      }
    }

    return NextResponse.json({
      success: true,
      database: db.databaseName,
      collectionsCount: collections.length,
      schemaMap,
    });
  } catch (error: any) {
    console.error('GET /api/admin/database-map error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
