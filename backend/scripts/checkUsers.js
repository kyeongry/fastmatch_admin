const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}

const checkUsers = async () => {
    let client;

    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const collection = db.collection('users');

        const users = await collection.find({}).toArray();
        console.log(`📊 Total users found: ${users.length}`);

        if (users.length > 0) {
            console.log('--- User Sample (Top 5) ---');
            users.slice(0, 5).forEach(user => {
                console.log(`User: ${user.name} (${user.email})`);
                console.log(`   - affiliation: ${user.affiliation}`);
                console.log(`   - role: ${user.role}`);
                console.log('---------------------------');
            });
        } else {
            console.log('⚠️ No users found in the database. This explains why migration modified 0 documents.');
        }

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('✅ Disconnected from MongoDB');
        }
    }
};

checkUsers();
