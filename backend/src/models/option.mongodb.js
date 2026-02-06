const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'options';

class OptionModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ branch_id: 1 });
        await collection.createIndex({ creator_id: 1 });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ category1: 1 });
        await collection.createIndex({ capacity: 1 });
        await collection.createIndex({ monthly_fee: 1 });
        await collection.createIndex({ created_at: -1 });
        await collection.createIndex({ updated_at: -1 });

        console.log('✅ Option MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const option = {
            ...data,
            branch_id: new ObjectId(data.branch_id),
            creator_id: new ObjectId(data.creator_id),
            updater_id: data.updater_id ? new ObjectId(data.updater_id) : null,
            processor_admin_id: data.processor_admin_id ? new ObjectId(data.processor_admin_id) : null,
            one_time_fees: data.one_time_fees || [],
            status: data.status || 'active',
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(option);
        return { _id: result.insertedId, ...option };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByBranchId(branchId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ branch_id: new ObjectId(branchId) }).toArray();
    }

    static async findByCreatorId(creatorId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ creator_id: new ObjectId(creatorId) }).toArray();
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 20, sort = { created_at: -1 } } = options;

        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (['branch_id', 'creator_id', 'processor_admin_id'].includes(key) && value) {
                mongoFilter[key] = new ObjectId(value);
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
        if (updateData.processor_admin_id) {
            updateFields.processor_admin_id = new ObjectId(updateData.processor_admin_id);
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

        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (['branch_id', 'creator_id'].includes(key) && value) {
                mongoFilter[key] = new ObjectId(value);
            } else {
                mongoFilter[key] = value;
            }
        }

        return collection.countDocuments(mongoFilter);
    }
}

module.exports = OptionModel;
