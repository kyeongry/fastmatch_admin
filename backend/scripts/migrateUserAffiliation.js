const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

const migrateUserAffiliation = async () => {
  let client;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('users');

    // affiliation 필드가 없는 사용자 찾기
    const filter = { affiliation: { $exists: false } };
    const update = { $set: { affiliation: 'partner' } };

    const result = await collection.updateMany(filter, update);

    console.log(`✅ Migration completed.`);
    console.log(`   Matched documents: ${result.matchedCount}`);
    console.log(`   Modified documents: ${result.modifiedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }
};

migrateUserAffiliation();
