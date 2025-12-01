const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getAllManagers = async (filters = {}) => {
  try {
    const { brand_id, search } = filters;

    // 필터 조건 구성
    const query = {};

    if (brand_id) {
      query.brand_id = new ObjectId(brand_id);
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // 매니저 목록 조회
    const db = await getDatabase();
    const managers = await db
      .collection('managers')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand_id',
            foreignField: '_id',
            as: 'brand'
          }
        },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'creator_id',
            foreignField: '_id',
            as: 'creator'
          }
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } },
        {
          $project: {
            _id: 1,
            name: 1,
            position: 1,
            email: 1,
            cc_email: 1,
            phone: 1,
            'brand._id': 1,
            'brand.name': 1,
            'creator._id': 1,
            'creator.name': 1,
            'creator.email': 1,
            created_at: 1,
            updated_at: 1
          }
        }
      ])
      .toArray();

    return {
      success: true,
      data: managers.map(m => ({
        id: m._id.toString(),
        name: m.name,
        position: m.position,
        email: m.email,
        cc_email: m.cc_email,
        phone: m.phone,
        brand: m.brand ? { id: m.brand._id.toString(), name: m.brand.name } : null,
        creator: m.creator ? { id: m.creator._id.toString(), name: m.creator.name, email: m.creator.email } : null,
        created_at: m.created_at,
        updated_at: m.updated_at
      }))
    };
  } catch (error) {
    console.error('❌ Get all managers error:', error);
    throw error;
  }
};

const getManagerById = async (id) => {
  try {
    const db = await getDatabase();

    const manager = await db
      .collection('managers')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand_id',
            foreignField: '_id',
            as: 'brand'
          }
        },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'creator_id',
            foreignField: '_id',
            as: 'creator'
          }
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'updater_id',
            foreignField: '_id',
            as: 'updater'
          }
        },
        { $unwind: { path: '$updater', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();

    if (!manager || manager.length === 0) {
      throw new Error('매니저를 찾을 수 없습니다');
    }

    const m = manager[0];
    return {
      success: true,
      data: {
        id: m._id.toString(),
        name: m.name,
        position: m.position,
        email: m.email,
        cc_email: m.cc_email,
        phone: m.phone,
        brand: m.brand ? { id: m.brand._id.toString(), name: m.brand.name } : null,
        creator: m.creator ? { id: m.creator._id.toString(), name: m.creator.name, email: m.creator.email } : null,
        updater: m.updater ? { id: m.updater._id.toString(), name: m.updater.name, email: m.updater.email } : null,
        created_at: m.created_at,
        updated_at: m.updated_at
      }
    };
  } catch (error) {
    console.error('❌ Get manager by ID error:', error);
    throw error;
  }
};

const createManager = async (data, creatorId) => {
  try {
    const { brand_id, name, position, email, cc_email, phone } = data;
    const db = await getDatabase();

    // 브랜드 존재 확인
    const brand = await db
      .collection('brands')
      .findOne({ _id: new ObjectId(brand_id) });

    if (!brand) {
      throw new Error('브랜드를 찾을 수 없습니다');
    }

    // 매니저 생성
    const result = await db.collection('managers').insertOne({
      brand_id: new ObjectId(brand_id),
      name,
      position,
      email,
      cc_email: cc_email || null,
      phone,
      creator_id: new ObjectId(creatorId),
      created_at: new Date(),
      updated_at: new Date()
    });

    return {
      success: true,
      message: '매니저가 생성되었습니다',
      data: {
        id: result.insertedId.toString(),
        brand_id,
        name,
        position,
        email,
        cc_email: cc_email || null,
        phone,
        creator_id: creatorId,
        created_at: new Date()
      }
    };
  } catch (error) {
    console.error('❌ Create manager error:', error);
    throw error;
  }
};

const updateManager = async (id, data, updaterId) => {
  try {
    const db = await getDatabase();

    // 매니저 존재 확인
    const manager = await db
      .collection('managers')
      .findOne({ _id: new ObjectId(id) });

    if (!manager) {
      throw new Error('매니저를 찾을 수 없습니다');
    }

    // 매니저 수정
    const updateData = {};
    if (data.brand_id) updateData.brand_id = new ObjectId(data.brand_id);
    if (data.name !== undefined) updateData.name = data.name || '';
    if (data.position !== undefined) updateData.position = data.position || '';
    if (data.email) updateData.email = data.email;
    if (data.cc_email !== undefined) updateData.cc_email = data.cc_email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || '';
    updateData.updater_id = new ObjectId(updaterId);
    updateData.updated_at = new Date();

    const result = await db.collection('managers').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // MongoDB 드라이버 버전에 따라 result 또는 result.value
    const updatedManager = result?.value || result;

    if (!updatedManager) {
      throw new Error('매니저 수정에 실패했습니다');
    }

    return {
      success: true,
      message: '매니저가 수정되었습니다',
      data: {
        id: updatedManager._id.toString(),
        name: updatedManager.name,
        position: updatedManager.position,
        email: updatedManager.email,
        cc_email: updatedManager.cc_email,
        phone: updatedManager.phone,
        brand_id: updatedManager.brand_id?.toString(),
        creator_id: updatedManager.creator_id?.toString(),
        updater_id: updatedManager.updater_id?.toString(),
        created_at: updatedManager.created_at,
        updated_at: updatedManager.updated_at
      }
    };
  } catch (error) {
    console.error('❌ Update manager error:', error);
    throw error;
  }
};

const deleteManager = async (id) => {
  try {
    const db = await getDatabase();

    // 매니저 존재 확인
    const manager = await db
      .collection('managers')
      .findOne({ _id: new ObjectId(id) });

    if (!manager) {
      throw new Error('매니저를 찾을 수 없습니다');
    }

    // 매니저 삭제
    await db.collection('managers').deleteOne({ _id: new ObjectId(id) });

    return {
      success: true,
      message: '매니저가 삭제되었습니다'
    };
  } catch (error) {
    console.error('❌ Delete manager error:', error);
    throw error;
  }
};

module.exports = {
  getAllManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager
};
