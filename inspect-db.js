const { MongoClient } = require('mongodb');

const uri = "mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin";

async function inspect() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log('DATABASE:', db.databaseName);
  console.log('');
  
  // Get all users
  const users = await db.collection('users').find({}).toArray();
  console.log('TOTAL USERS:', users.length);
  console.log('');
  
  // Group by role
  const byRole = {};
  users.forEach(u => {
    const role = u.role || 'NO_ROLE';
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push({ email: u.email, name: u.name });
  });
  
  console.log('USERS BY ROLE:');
  for (const role in byRole) {
    console.log(`  ${role}: ${byRole[role].length}`);
    byRole[role].slice(0, 3).forEach(u => {
      console.log(`    - ${u.email} (${u.name})`);
    });
  }
  console.log('');
  
  // Get collections
  const collections = await db.listCollections().toArray();
  console.log('ALL COLLECTIONS:');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count} docs`);
  }
  
  await client.close();
}

inspect().catch(console.error);
