const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'proposal_documents';

class ProposalDocumentModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ creator_id: 1 });
        await collection.createIndex({ created_at: -1 });
        await collection.createIndex({ document_name: 1 });

        console.log('✅ ProposalDocument MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const proposalDocument = {
            ...data,
            creator_id: new ObjectId(data.creator_id),
            selected_options: data.selected_options || [],
            option_order: data.option_order || [],
            option_custom_info: data.option_custom_info || {},
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(proposalDocument);
        return { _id: result.insertedId, ...proposalDocument };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByCreatorId(creatorId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.find({ creator_id: new ObjectId(creatorId) }).sort({ created_at: -1 }).toArray();
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 100, sort = { created_at: -1 } } = options;

        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (key === 'creator_id' && value) {
                mongoFilter.creator_id = new ObjectId(value);
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

module.exports = ProposalDocumentModel;
