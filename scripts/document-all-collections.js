/**
 * Document all collections with full structure
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;

async function documentCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    let documentation = `# Database Schema Documentation
Generated: ${new Date().toISOString()}
Database: mfvpos

## Collections Overview\n\n`;

    const collectionData = [];

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments({});
      
      console.log(`\n📚 Processing: ${collectionName} (${count} documents)`);
      
      const data = {
        name: collectionName,
        count: count,
        samples: []
      };

      if (count > 0) {
        // Get up to 3 samples
        const samples = await db.collection(collectionName).find({}).limit(3).toArray();
        data.samples = samples;
      }

      collectionData.push(data);
      
      documentation += `### ${collectionName}\n`;
      documentation += `- **Document Count**: ${count}\n`;
      
      if (count > 0) {
        documentation += `- **Sample Document**:\n\`\`\`json\n${JSON.stringify(data.samples[0], null, 2)}\n\`\`\`\n\n`;
        
        // Extract field types
        const fields = Object.keys(data.samples[0]);
        documentation += `- **Fields**:\n`;
        fields.forEach(field => {
          const value = data.samples[0][field];
          const type = Array.isArray(value) ? 'Array' : typeof value;
          documentation += `  - \`${field}\`: ${type}\n`;
        });
      } else {
        documentation += `- **Status**: Empty collection\n`;
      }
      documentation += `\n---\n\n`;
    }

    // Write to file
    fs.writeFileSync('docs/DATABASE_SCHEMA.md', documentation);
    console.log('\n✅ Documentation written to docs/DATABASE_SCHEMA.md');

    // Also write JSON for programmatic access
    fs.writeFileSync('docs/database-schema.json', JSON.stringify(collectionData, null, 2));
    console.log('✅ JSON written to docs/database-schema.json');

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log('═'.repeat(60));
    collectionData.forEach(col => {
      console.log(`${col.name.padEnd(25)} : ${col.count.toString().padStart(6)} documents`);
    });
    console.log('═'.repeat(60));
    console.log(`Total collections: ${collectionData.length}`);
    console.log(`Total documents: ${collectionData.reduce((sum, col) => sum + col.count, 0)}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

documentCollections();
