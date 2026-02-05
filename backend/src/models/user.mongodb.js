const { getDatabase } = require('../config/mongodb');

const COLLECTION_NAME = 'users';

class UserModel {
  static async createIndexes() {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    // 고유성 인덱스
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ phone: 1 });

    // 검색 인덱스
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ email_verified: 1 });

    // 날짜 인덱스
    await collection.createIndex({ created_at: -1 });
    await collection.createIndex({ updated_at: -1 });

    console.log('✅ User MongoDB indexes created');
  }

  static async create(userData) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const user = {
      ...userData,
      created_at: new Date(),
      updated_at: new Date(),
      status: userData.status || 'active',
      affiliation: userData.affiliation || 'partner',
    };

    const result = await collection.insertOne(user);

    return {
      _id: result.insertedId,
      ...user,
    };
  }

  static async findByEmail(email) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    return collection.findOne({ email });
  }

  static async findById(id) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const { ObjectId } = require('mongodb');
    return collection.findOne({ _id: new ObjectId(id) });
  }

  static async findByPhone(phone) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    return collection.findOne({ phone });
  }

  static async updateById(id, updateData) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result;
  }

  static async updateLastLogin(id) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const { ObjectId } = require('mongodb');
    return collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { last_login: new Date() } }
    );
  }

  static async findAll(filter = {}, options = {}) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const {
      skip = 0,
      limit = 10,
      sort = { created_at: -1 },
    } = options;

    const query = collection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    return query.toArray();
  }

  static async count(filter = {}) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    return collection.countDocuments(filter);
  }

  static async deleteById(id) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const { ObjectId } = require('mongodb');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    return result.deletedCount > 0;
  }

  static async deleteByEmail(email) {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const result = await collection.deleteOne({ email });

    return result.deletedCount > 0;
  }
}

module.exports = UserModel;
