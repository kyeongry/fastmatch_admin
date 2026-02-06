const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'reviews';

class ReviewModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ branch_id: 1 });
        await collection.createIndex({ author_id: 1 });
        await collection.createIndex({ created_at: -1 });

        console.log('Review MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const review = {
            branch_id: new ObjectId(data.branch_id),
            author_id: new ObjectId(data.author_id),
            author_name: data.author_name || '',
            content: data.content,
            rating: data.rating || 5,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const result = await collection.insertOne(review);
        return { _id: result.insertedId, ...review };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByBranchId(branchId, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 50, sort = { created_at: -1 } } = options;

        return collection
            .find({ branch_id: new ObjectId(branchId) })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    static async updateById(id, updateData) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

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

    static async deleteById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.deleteOne({ _id: new ObjectId(id) });
    }

    static async countByBranchId(branchId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.countDocuments({ branch_id: new ObjectId(branchId) });
    }
}

module.exports = ReviewModel;
