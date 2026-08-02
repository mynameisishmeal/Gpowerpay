/**
 * Database Schema Mapper
 * Connects to MongoDB and maps all collections with sample documents
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb";

async function mapDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected!');
    console.log('');

    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections`);
    console.log('');
    console.log('='.repeat(80));

    const schemaMap: any = {};

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      // Get collection stats
      const count = await collection.countDocuments();
      
      console.log('');
      console.log(`Collection: ${collectionName}`);
      console.log(`Documents: ${count}`);
      
      if (count > 0) {
        // Get sample documents
        const samples = await collection.find({}).limit(2).toArray();
        
        // Extract schema from first document
        const schema: any = {};
        if (samples.length > 0) {
          const firstDoc = samples[0];
          
          // Analyze field types
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
          
          console.log('Schema:');
          for (const [key, info] of Object.entries(schema)) {
            const sample = typeof info.sample === 'string' && info.sample.length > 50 
              ? info.sample.substring(0, 50) + '...'
              : info.sample;
            console.log(`   - ${key}: ${info.type} (${JSON.stringify(sample)})`);
          }
        }
        
        schemaMap[collectionName] = {
          count,
          schema,
          sampleDocs: samples,
        };
      } else {
        console.log('(empty collection)');
        schemaMap[collectionName] = {
          count: 0,
          schema: {},
          sampleDocs: [],
        };
      }
      
      console.log('-'.repeat(80));
    }

    // Write detailed schema to file
    const outputPath = path.join(process.cwd(), 'docs', 'DATABASE_SCHEMA.json');
    fs.writeFileSync(outputPath, JSON.stringify(schemaMap, null, 2));
    console.log('');
    console.log(`Full schema written to: ${outputPath}`);

    // Generate markdown documentation
    let markdown = `# Database Schema Map\n\n`;
    markdown += `**Database:** mfvpos_test\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;

    for (const [collectionName, data] of Object.entries(schemaMap)) {
      markdown += `## ${collectionName}\n\n`;
      markdown += `- **Documents:** ${data.count}\n`;
      
      if (Object.keys(data.schema).length > 0) {
        markdown += `- **Fields:**\n\n`;
        markdown += `| Field | Type | Sample |\n`;
        markdown += `|-------|------|--------|\n`;
        
        for (const [key, info] of Object.entries(data.schema)) {
          const sample = typeof info.sample === 'string' && info.sample.length > 40 
            ? info.sample.substring(0, 40) + '...'
            : JSON.stringify(info.sample);
          markdown += `| \`${key}\` | ${info.type} | ${sample} |\n`;
        }
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    }

    const mdPath = path.join(process.cwd(), 'docs', 'DATABASE_SCHEMA.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(`Markdown docs written to: ${mdPath}`);
    console.log('');

    // Summary
    console.log('');
    console.log('SUMMARY');
    console.log('='.repeat(80));
    const sortedCollections = Object.entries(schemaMap)
      .sort((a: any, b: any) => b[1].count - a[1].count);
    
    for (const [name, data] of sortedCollections) {
      console.log(`${name.padEnd(30)} ${(data as any).count.toString().padStart(8)} docs`);
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('');
    console.log('Disconnected from MongoDB');
  }
}

mapDatabase().catch(console.error);
