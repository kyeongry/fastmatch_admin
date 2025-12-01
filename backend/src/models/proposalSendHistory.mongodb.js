const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'proposal_send_histories';

class ProposalSendHistoryModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ proposal_request_id: 1 });
        await collection.createIndex({ brand_id: 1 });
        await collection.createIndex({ send_type: 1 });
        await collection.createIndex({ sent_at: -1 });

        console.log('✅ ProposalSendHistory MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const sendHistory = {
            ...data,
            proposal_request_id: new ObjectId(data.proposal_request_id),
            brand_id: new ObjectId(data.brand_id),
            send_success: data.send_success !== undefined ? data.send_success : true,
            sent_at: new Date(),
        };

        const result = await collection.insertOne(sendHistory);
        return { _id: result.insertedId, ...sendHistory };
    }

    static async findByProposalRequestId(proposalRequestId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ proposal_request_id: new ObjectId(proposalRequestId) }).sort({ sent_at: -1 }).toArray();
    }

    static async findByBrandId(brandId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ brand_id: new ObjectId(brandId) }).sort({ sent_at: -1 }).toArray();
    }

    static async countByBrandId(brandId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.countDocuments({ brand_id: new ObjectId(brandId) });
    }

    static async count(filter = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.countDocuments(filter);
    }
}

module.exports = ProposalSendHistoryModel;
