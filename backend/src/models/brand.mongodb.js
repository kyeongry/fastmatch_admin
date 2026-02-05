const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'brands';

class BrandModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ name: 1 }, { unique: true });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ created_at: -1 });

        console.log('✅ Brand MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const brand = {
            ...data,
            alias: data.alias || '',
            status: data.status || 'active',
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(brand);
        return { _id: result.insertedId, ...brand };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByName(name) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ name });
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 100, sort = { created_at: -1 } } = options;

        return collection
            .find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .toArray();
    }

    static async updateById(id, updateData) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updated_at: new Date() } },
            { returnDocument: 'after' }
        );

        return result;
    }

    static async deleteById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result.deletedCount > 0;
    }

    static async count(filter = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.countDocuments(filter);
    }
}

module.exports = BrandModel;
