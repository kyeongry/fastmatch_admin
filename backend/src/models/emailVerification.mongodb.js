const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'email_verifications';

class EmailVerificationModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ email: 1 });
        await collection.createIndex({ code: 1 });
        await collection.createIndex({ expires_at: 1 });
        await collection.createIndex({ verified: 1 });
        await collection.createIndex({ created_at: -1 });

        console.log('✅ EmailVerification MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const verification = {
            ...data,
            verified: false,
            created_at: new Date(),
        };

        const result = await collection.insertOne(verification);
        return { _id: result.insertedId, ...verification };
    }

    static async findByEmail(email) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ email });
    }

    static async findByEmailAndCode(email, code) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ email, code });
    }

    static async updateById(id, updateData) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        return result.value;
    }

    static async deleteByEmail(email) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.deleteMany({ email });
        return result.deletedCount > 0;
    }

    static async deleteExpired() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.deleteMany({
            expires_at: { $lt: new Date() }
        });
        return result.deletedCount;
    }
}

module.exports = EmailVerificationModel;
