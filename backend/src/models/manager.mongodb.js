const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'managers';

class ManagerModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ brand_id: 1 });
        await collection.createIndex({ email: 1 });
        await collection.createIndex({ phone: 1 });
        await collection.createIndex({ created_at: -1 });

        console.log('✅ Manager MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const manager = {
            ...data,
            brand_id: new ObjectId(data.brand_id),
            creator_id: new ObjectId(data.creator_id),
            updater_id: data.updater_id ? new ObjectId(data.updater_id) : null,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(manager);
        return { _id: result.insertedId, ...manager };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByBrandId(brandId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ brand_id: new ObjectId(brandId) }).toArray();
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 100, sort = { created_at: -1 } } = options;

        // Convert string IDs to ObjectIds in filter
        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'brand_id' && value) {
                mongoFilter.brand_id = new ObjectId(value);
            } else {
                mongoFilter[key] = value;
            }
        }

        return collection
            .find(mongoFilter)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .toArray();
    }

    static async updateById(id, updateData) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const updateFields = { ...updateData, updated_at: new Date() };
        if (updateData.updater_id) {
            updateFields.updater_id = new ObjectId(updateData.updater_id);
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateFields },
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

module.exports = ManagerModel;
