const { getDatabase } = require('../config/mongodb');

const getAllBrands = async (filters = {}) => {
  try {
    const { status, search } = filters;

    // MongoDB 필터 조건 구성
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.name = new RegExp(search, 'i'); // 대소문자 무시 검색
    }

    const db = await getDatabase();
    const { ObjectId } = require('mongodb');

    // 브랜드 목록 조회 및 매니저/지점 수 집계
    const brands = await db
      .collection('brands')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'managers',
            localField: '_id',
            foreignField: 'brand_id',
            as: 'managers'
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: 'brand_id',
            as: 'branches'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            status: 1,
            creator_id: 1,
            created_at: 1,
            updated_at: 1,
            managers_count: { $size: '$managers' },
            branches_count: { $size: '$branches' }
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();

    return {
      success: true,
      data: brands.map(brand => ({
        id: brand._id.toString(),
        name: brand.name,
        alias: brand.alias || '',
        status: brand.status || 'active',
        managers_count: brand.managers_count || 0,
        branches_count: brand.branches_count || 0,
        creator_id: brand.creator_id,
        created_at: brand.created_at,
        updated_at: brand.updated_at
      }))
    };
  } catch (error) {
    console.error('❌ Get all brands error:', error);
    throw error;
  }
};

const getBrandById = async (id) => {
  try {
    const db = await getDatabase();
    const { ObjectId } = require('mongodb');

    const brands = await db
      .collection('brands')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'managers',
            localField: '_id',
            foreignField: 'brand_id',
            as: 'managers'
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: 'brand_id',
            as: 'branches'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            status: 1,
            creator_id: 1,
            created_at: 1,
            updated_at: 1,
            managers_count: { $size: '$managers' },
            branches_count: { $size: '$branches' }
          }
        }
      ])
      .toArray();

    if (!brands || brands.length === 0) {
      throw new Error('브랜드를 찾을 수 없습니다');
    }

    const brand = brands[0];

    return {
      success: true,
      data: {
        id: brand._id.toString(),
        name: brand.name,
        alias: brand.alias || '',
        status: brand.status,
        managers_count: brand.managers_count || 0,
        branches_count: brand.branches_count || 0,
        creator_id: brand.creator_id,
        created_at: brand.created_at,
        updated_at: brand.updated_at
      }
    };
  } catch (error) {
    console.error('❌ Get brand by ID error:', error);
    throw error;
  }
};

const createBrand = async (data, creatorId) => {
  try {
    const { name, alias } = data;
    const db = await getDatabase();

    // 브랜드명 중복 확인
    const existingBrand = await db
      .collection('brands')
      .findOne({ name });

    if (existingBrand) {
      throw new Error('이미 존재하는 브랜드입니다');
    }

    // 브랜드 생성
    const result = await db
      .collection('brands')
      .insertOne({
        name,
        status: 'active',
        creator_id: creatorId,
        created_at: new Date(),
        updated_at: new Date()
      });

    return {
      success: true,
      message: '브랜드가 생성되었습니다',
      data: {
        id: result.insertedId.toString(),
        name,
        status: 'active',
        creator_id: creatorId,
        created_at: new Date()
      }
    };
  } catch (error) {
    console.error('❌ Create brand error:', error);
    throw error;
  }
};

const updateBrand = async (id, data, updaterId) => {
  try {
    const { name, alias, status } = data;
    const db = await getDatabase();
    const { ObjectId } = require('mongodb');

    // 브랜드 존재 확인
    const brand = await db
      .collection('brands')
      .findOne({ _id: new ObjectId(id) });

    if (!brand) {
      throw new Error('브랜드를 찾을 수 없습니다');
    }

    // 브랜드명 변경 시 중복 확인
    if (name && name !== brand.name) {
      const existingBrand = await db
        .collection('brands')
        .findOne({ name });

      if (existingBrand) {
        throw new Error('이미 존재하는 브랜드입니다');
      }
    }

    // 브랜드 수정
    const updateData = {};
    if (name) updateData.name = name;
    if (alias !== undefined) updateData.alias = alias;
    if (status) updateData.status = status;
    updateData.updated_at = new Date();
    updateData.updater_id = updaterId;

    const result = await db
      .collection('brands')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return {
      success: true,
      message: '브랜드가 수정되었습니다',
      data: result.value
    };
  } catch (error) {
    console.error('❌ Update brand error:', error);
    throw error;
  }
};

const deleteBrand = async (id) => {
  try {
    const db = await getDatabase();
    const { ObjectId } = require('mongodb');

    // 브랜드 존재 확인
    const brand = await db
      .collection('brands')
      .findOne({ _id: new ObjectId(id) });

    if (!brand) {
      throw new Error('브랜드를 찾을 수 없습니다');
    }

    // 브랜드 삭제
    await db
      .collection('brands')
      .deleteOne({ _id: new ObjectId(id) });

    return {
      success: true,
      message: '브랜드가 삭제되었습니다'
    };
  } catch (error) {
    console.error('❌ Delete brand error:', error);
    throw error;
  }
};

const checkDuplicate = async (name) => {
  try {
    const db = await getDatabase();

    const brand = await db
      .collection('brands')
      .findOne({ name });

    return {
      success: true,
      duplicate: !!brand
    };
  } catch (error) {
    console.error('❌ Check duplicate error:', error);
    throw error;
  }
};

const getAvailableBrandsForAddition = async (proposalId) => {
  try {
    const db = await getDatabase();
    const { ObjectId } = require('mongodb');

    // 제안 요청 조회
    const proposalRequest = await db
      .collection('proposal_requests')
      .findOne({ _id: new ObjectId(proposalId) });

    if (!proposalRequest) {
      throw new Error('제안 요청을 찾을 수 없습니다');
    }

    // selected_brands 파싱
    const selectedBrandIds = Array.isArray(proposalRequest.selected_brands)
      ? proposalRequest.selected_brands.map(id => new ObjectId(id))
      : [];

    // 활성화된 모든 브랜드 조회 (선택되지 않은 것만)
    const brands = await db
      .collection('brands')
      .find({
        status: 'active',
        _id: { $nin: selectedBrandIds }
      })
      .sort({ name: 1 })
      .toArray();

    return {
      success: true,
      data: brands.map(brand => ({
        id: brand._id.toString(),
        name: brand.name
      }))
    };
  } catch (error) {
    console.error('❌ Get available brands error:', error);
    throw error;
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  checkDuplicate,
  getAvailableBrandsForAddition
};
