import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = "mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin";

async function generateMap() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const collections = await db.listCollections().toArray();
  const map = {
    database: db.databaseName,
    generatedAt: new Date().toISOString(),
    totalCollections: collections.length,
    collections: {}
  };

  for (const col of collections) {
    const collectionName = col.name;
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    map.collections[collectionName] = {
      documentCount: count,
      fields: {},
      sampleDocuments: []
    };

    if (count > 0) {
      const samples = await collection.find({}).limit(3).toArray();
      map.collections[collectionName].sampleDocuments = samples;
      
      // Extract all unique fields from samples
      const allFields = new Set();
      samples.forEach(doc => {
        Object.keys(doc).forEach(key => allFields.add(key));
      });

      // Analyze each field
      allFields.forEach(field => {
        const values = samples.map(doc => doc[field]).filter(v => v !== undefined);
        const types = [...new Set(values.map(v => {
          if (v === null) return 'null';
          if (Array.isArray(v)) return 'array';
          if (v instanceof Date) return 'date';
          return typeof v;
        }))];

        map.collections[collectionName].fields[field] = {
          types: types,
          sampleValues: values.slice(0, 2)
        };
      });
    }
  }

  // Write to file
  const outputPath = path.join(process.cwd(), 'docs', 'DATABASE_MAP.json');
  fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
  
  // Generate markdown
  let md = `# Database Schema Reference\n\n`;
  md += `**Database:** ${map.database}\n`;
  md += `**Generated:** ${map.generatedAt}\n`;
  md += `**Total Collections:** ${map.totalCollections}\n\n`;
  md += `---\n\n`;

  const sortedCollections = Object.entries(map.collections)
    .sort((a, b) => b[1].documentCount - a[1].documentCount);

  for (const [name, data] of sortedCollections) {
    md += `## ${name}\n\n`;
    md += `**Documents:** ${data.documentCount}\n\n`;
    
    if (Object.keys(data.fields).length > 0) {
      md += `### Fields\n\n`;
      md += `| Field | Types | Sample Values |\n`;
      md += `|-------|-------|---------------|\n`;
      
      for (const [field, info] of Object.entries(data.fields)) {
        const types = info.types.join(', ');
        const samples = info.sampleValues.map(v => {
          const str = JSON.stringify(v);
          return str.length > 50 ? str.substring(0, 50) + '...' : str;
        }).join('<br>');
        md += `| \`${field}\` | ${types} | ${samples} |\n`;
      }
      md += `\n`;
    }
    
    md += `---\n\n`;
  }

  const mdPath = path.join(process.cwd(), 'docs', 'DATABASE_MAP.md');
  fs.writeFileSync(mdPath, md);

  console.log('DATABASE MAP GENERATED');
  console.log('JSON:', outputPath);
  console.log('Markdown:', mdPath);
  console.log('');
  console.log('COLLECTIONS SUMMARY:');
  sortedCollections.forEach(([name, data]) => {
    console.log(`  ${name}: ${data.documentCount} docs`);
  });

  await client.close();
}

generateMap().catch(console.error);
