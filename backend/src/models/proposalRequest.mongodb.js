const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'proposal_requests';

class ProposalRequestModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ requester_id: 1 });
        await collection.createIndex({ send_status: 1 });
        await collection.createIndex({ created_at: -1 });
        await collection.createIndex({ company_name: 1 });

        console.log('✅ ProposalRequest MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const proposalRequest = {
            ...data,
            requester_id: new ObjectId(data.requester_id),
            selected_brands: data.selected_brands || [],
            send_status: data.send_status || 'sending',
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(proposalRequest);
        return { _id: result.insertedId, ...proposalRequest };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByRequesterId(requesterId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ requester_id: new ObjectId(requesterId) }).toArray();
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 100, sort = { created_at: -1 } } = options;

        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'requester_id' && value) {
                mongoFilter.requester_id = new ObjectId(value);
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

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { ...updateData, updated_at: new Date() } },
            { returnDocument: 'after' }
        );

        return result.value;
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
            if (key === 'send_status' && value) {
                mongoFilter.send_status = value;
            }
        }

        return collection.countDocuments(mongoFilter);
    }
}

module.exports = ProposalRequestModel;
