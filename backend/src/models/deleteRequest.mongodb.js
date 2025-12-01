const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = 'delete_requests';

class DeleteRequestModel {
    static async createIndexes() {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        await collection.createIndex({ option_id: 1 }, { unique: true });
        await collection.createIndex({ requester_id: 1 });
        await collection.createIndex({ processor_id: 1 });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ request_at: -1 });

        console.log('✅ DeleteRequest MongoDB indexes created');
    }

    static async create(data) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const deleteRequest = {
            ...data,
            option_id: new ObjectId(data.option_id),
            requester_id: new ObjectId(data.requester_id),
            processor_id: data.processor_id ? new ObjectId(data.processor_id) : null,
            status: data.status || 'pending',
            request_at: new Date(),
        };

        const result = await collection.insertOne(deleteRequest);
        return { _id: result.insertedId, ...deleteRequest };
    }

    static async findById(id) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ _id: new ObjectId(id) });
    }

    static async findByOptionId(optionId) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);
        return collection.findOne({ option_id: new ObjectId(optionId) });
    }

    static async findAll(filter = {}, options = {}) {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const { skip = 0, limit = 100, sort = { request_at: -1 } } = options;

        const mongoFilter = {};
        for (const [key, value] of Object.entries(filter)) {
            if (['option_id', 'requester_id', 'processor_id'].includes(key) && value) {
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

        const updateFields = { ...updateData };
        if (updateData.processor_id) {
            // processor_id가 이미 ObjectId인지 확인
            if (updateData.processor_id instanceof ObjectId) {
                updateFields.processor_id = updateData.processor_id;
            } else {
                try {
                    updateFields.processor_id = new ObjectId(updateData.processor_id);
                } catch (error) {
                    console.error(`❌ processor_id 변환 실패: ${updateData.processor_id}`, error);
                    // processor_id 변환 실패 시 제거
                    delete updateFields.processor_id;
                }
            }
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateFields },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            console.error(`❌ 삭제 요청 업데이트 실패: ID=${id}, 문서를 찾을 수 없습니다`);
        }

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
            if (key === 'status' && value) {
                mongoFilter.status = value;
            }
        }

        return collection.countDocuments(mongoFilter);
    }
}

module.exports = DeleteRequestModel;
