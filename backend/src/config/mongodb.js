const { MongoClient, ServerApiVersion } = require('mongodb');

let mongoClient = null;
let db = null;

const getMongoClient = async () => {
  if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
    return mongoClient;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastmatch';

  try {
    mongoClient = new MongoClient(mongoUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });

    await mongoClient.connect();
    console.log('✅ MongoDB connected successfully');

    return mongoClient;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

const getDatabase = async () => {
  if (!db) {
    const client = await getMongoClient();
    db = client.db(process.env.MONGODB_DB || 'fastmatch');
  }
  return db;
};

const closeConnection = async () => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
};

module.exports = {
  getMongoClient,
  getDatabase,
  closeConnection,
};
