const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

const getAllBranches = async (filters = {}) => {
  try {
    const { brand_id, status } = filters;

    // MongoDB 필터 조건 구성
    const query = {};

    if (brand_id) {
      query.brand_id = new ObjectId(brand_id);
    }

    if (status) {
      query.status = status;
    }

    const db = await getDatabase();
    
    // 지점 목록 조회 및 브랜드 정보 조인
    const branches = await db
      .collection('branches')
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
          $project: {
            _id: 1,
            name: 1,
            address: 1,
            latitude: 1,
            longitude: 1,
            nearest_subway: 1,
            walking_distance: 1,
            transit_distance: 1,
            is_transit: 1,
            exterior_image_url: 1,
            interior_image_urls: 1,
            branch_info: 1,
            approval_year: 1,
            floors_above: 1,
            floors_below: 1,
            total_area: 1,
            basic_info_1: 1,
            basic_info_2: 1,
            basic_info_3: 1,
            status: 1,
            creator_id: 1,
            created_at: 1,
            updated_at: 1,
            brand_id: 1,
            'brand._id': 1,
            'brand.name': 1
          }
        },
        { $sort: { created_at: -1 } }
      ])
      .toArray();

    return {
      success: true,
      data: branches.map(branch => ({
        id: branch._id.toString(),
        name: branch.name,
        address: branch.address,
        latitude: branch.latitude,
        longitude: branch.longitude,
        nearest_subway: branch.nearest_subway,
        walking_distance: branch.walking_distance,
        transit_distance: branch.transit_distance,
        is_transit: branch.is_transit || false,
        exterior_image_url: branch.exterior_image_url,
        interior_image_urls: branch.interior_image_urls,
        branch_info: branch.branch_info,
        approval_year: branch.approval_year,
        floors_above: branch.floors_above,
        floors_below: branch.floors_below,
        total_area: branch.total_area,
        basic_info_1: branch.basic_info_1 || '',
        basic_info_2: branch.basic_info_2 || '',
        basic_info_3: branch.basic_info_3 || '',
        brand_id: branch.brand_id?.toString(),
        brand: branch.brand ? {
          id: branch.brand._id.toString(),
          name: branch.brand.name
        } : null,
        status: branch.status || 'active',
        creator_id: branch.creator_id,
        created_at: branch.created_at,
        updated_at: branch.updated_at
      }))
    };
  } catch (error) {
    console.error('❌ Get all branches error:', error);
    throw error;
  }
};

const getBranchById = async (id) => {
  try {
    const db = await getDatabase();

    const branches = await db
      .collection('branches')
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
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } }
      ])
      .toArray();

    if (!branches || branches.length === 0) {
      throw new Error('지점을 찾을 수 없습니다');
    }

    const branch = branches[0];

    return {
      success: true,
      data: {
        id: branch._id.toString(),
        name: branch.name,
        address: branch.address,
        latitude: branch.latitude,
        longitude: branch.longitude,
        nearest_subway: branch.nearest_subway,
        walking_distance: branch.walking_distance,
        transit_distance: branch.transit_distance,
        is_transit: branch.is_transit || false,
        exterior_image_url: branch.exterior_image_url,
        interior_image_urls: branch.interior_image_urls,
        branch_info: branch.branch_info,
        approval_year: branch.approval_year,
        floors_above: branch.floors_above,
        floors_below: branch.floors_below,
        total_area: branch.total_area,
        basic_info_1: branch.basic_info_1 || '',
        basic_info_2: branch.basic_info_2 || '',
        basic_info_3: branch.basic_info_3 || '',
        brand_id: branch.brand_id?.toString(),
        brand: branch.brand ? {
          id: branch.brand._id.toString(),
          name: branch.brand.name
        } : null,
        status: branch.status,
        creator_id: branch.creator_id,
        created_at: branch.created_at,
        updated_at: branch.updated_at
      }
    };
  } catch (error) {
    console.error('❌ Get branch by ID error:', error);
    throw error;
  }
};

const createBranch = async (data, creatorId) => {
  try {
    const {
      name,
      address,
      brand_id,
      latitude,
      longitude,
      nearest_subway,
      walking_distance,
      transit_distance,  // 대중교통 시간 (도보 15분 초과 시)
      is_transit,        // 대중교통 사용 여부
      exterior_image_url,
      interior_image_urls,
      branch_info,
      approval_year,
      floors_above,
      floors_below,
      total_area,
      basic_info_1,
      basic_info_2,
      basic_info_3,
      status = 'active'
    } = data;
    
    const db = await getDatabase();

    // 브랜드 존재 확인
    const brand = await db
      .collection('brands')
      .findOne({ _id: new ObjectId(brand_id) });

    if (!brand) {
      throw new Error('브랜드를 찾을 수 없습니다');
    }

    // 지점 생성
    const branchData = {
      name,
      address,
      brand_id: new ObjectId(brand_id),
      status,
      creator_id: new ObjectId(creatorId),
      created_at: new Date(),
      updated_at: new Date()
    };

    // 선택적 필드 추가
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      branchData.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      branchData.longitude = parseFloat(longitude);
    }
    if (nearest_subway) {
      branchData.nearest_subway = nearest_subway;
    }
    if (walking_distance !== undefined && walking_distance !== null && walking_distance !== '') {
      branchData.walking_distance = parseInt(walking_distance);
    }
    // 대중교통 관련 필드 (도보 15분 초과 시 사용)
    if (transit_distance !== undefined && transit_distance !== null && transit_distance !== '') {
      branchData.transit_distance = parseInt(transit_distance);
    }
    if (is_transit !== undefined) {
      branchData.is_transit = Boolean(is_transit);
    }
    if (exterior_image_url) {
      branchData.exterior_image_url = exterior_image_url;
    }
    if (interior_image_urls && Array.isArray(interior_image_urls)) {
      branchData.interior_image_urls = interior_image_urls;
    }
    if (branch_info) {
      branchData.branch_info = branch_info;
    }
    if (approval_year !== undefined && approval_year !== null && approval_year !== '') {
      branchData.approval_year = parseInt(approval_year);
    }
    if (floors_above !== undefined && floors_above !== null && floors_above !== '') {
      branchData.floors_above = parseInt(floors_above);
    }
    if (floors_below !== undefined && floors_below !== null && floors_below !== '') {
      branchData.floors_below = parseInt(floors_below);
    }
    if (total_area !== undefined && total_area !== null && total_area !== '') {
      branchData.total_area = parseFloat(total_area);
    }
    if (basic_info_1 !== undefined) {
      branchData.basic_info_1 = basic_info_1 || '';
    }
    if (basic_info_2 !== undefined) {
      branchData.basic_info_2 = basic_info_2 || '';
    }
    if (basic_info_3 !== undefined) {
      branchData.basic_info_3 = basic_info_3 || '';
    }

    const result = await db.collection('branches').insertOne(branchData);

    return {
      success: true,
      message: '지점이 생성되었습니다',
      data: {
        id: result.insertedId.toString(),
        ...branchData,
        brand_id,
        creator_id: creatorId
      }
    };
  } catch (error) {
    console.error('❌ Create branch error:', error);
    throw error;
  }
};

const updateBranch = async (id, data, updaterId) => {
  try {
    const {
      brand_id,
      name,
      address,
      latitude,
      longitude,
      nearest_subway,
      walking_distance,
      transit_distance,  // 대중교통 시간 (도보 15분 초과 시)
      is_transit,        // 대중교통 사용 여부
      exterior_image_url,
      interior_image_urls,
      branch_info,
      approval_year,
      floors_above,
      floors_below,
      total_area,
      basic_info_1,
      basic_info_2,
      basic_info_3,
      status
    } = data;

    const db = await getDatabase();

    // 지점 존재 확인
    const branch = await db
      .collection('branches')
      .findOne({ _id: new ObjectId(id) });

    if (!branch) {
      throw new Error('지점을 찾을 수 없습니다');
    }

    // 브랜드 변경 시 존재 확인
    if (brand_id && brand_id !== branch.brand_id.toString()) {
      const brandExists = await db
        .collection('brands')
        .findOne({ _id: new ObjectId(brand_id) });

      if (!brandExists) {
        throw new Error('브랜드를 찾을 수 없습니다');
      }
    }

    // 지점 수정
    const updateData = {};
    if (brand_id) updateData.brand_id = new ObjectId(brand_id);
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (status) updateData.status = status;

    // 선택적 필드 업데이트
    if (latitude !== undefined && latitude !== null && latitude !== '') {
      updateData.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== '') {
      updateData.longitude = parseFloat(longitude);
    }
    if (nearest_subway !== undefined) {
      updateData.nearest_subway = nearest_subway || null;
    }
    if (walking_distance !== undefined && walking_distance !== null && walking_distance !== '') {
      updateData.walking_distance = parseInt(walking_distance);
    }
    // 대중교통 관련 필드 (도보 15분 초과 시 사용)
    if (transit_distance !== undefined && transit_distance !== null && transit_distance !== '') {
      updateData.transit_distance = parseInt(transit_distance);
    }
    if (is_transit !== undefined) {
      updateData.is_transit = Boolean(is_transit);
    }
    if (exterior_image_url !== undefined) {
      updateData.exterior_image_url = exterior_image_url;
    }
    if (interior_image_urls !== undefined && Array.isArray(interior_image_urls)) {
      updateData.interior_image_urls = interior_image_urls;
    }
    if (branch_info !== undefined) {
      updateData.branch_info = branch_info;
    }
    if (approval_year !== undefined && approval_year !== null && approval_year !== '') {
      updateData.approval_year = parseInt(approval_year);
    }
    if (floors_above !== undefined && floors_above !== null && floors_above !== '') {
      updateData.floors_above = parseInt(floors_above);
    }
    if (floors_below !== undefined && floors_below !== null && floors_below !== '') {
      updateData.floors_below = parseInt(floors_below);
    }
    if (total_area !== undefined && total_area !== null && total_area !== '') {
      updateData.total_area = parseFloat(total_area);
    }
    if (basic_info_1 !== undefined) {
      updateData.basic_info_1 = basic_info_1 || '';
    }
    if (basic_info_2 !== undefined) {
      updateData.basic_info_2 = basic_info_2 || '';
    }
    if (basic_info_3 !== undefined) {
      updateData.basic_info_3 = basic_info_3 || '';
    }

    updateData.updated_at = new Date();
    updateData.updater_id = new ObjectId(updaterId);

    const result = await db
      .collection('branches')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return {
      success: true,
      message: '지점이 수정되었습니다',
      data: result.value
    };
  } catch (error) {
    console.error('❌ Update branch error:', error);
    throw error;
  }
};

const deleteBranch = async (id) => {
  try {
    const db = await getDatabase();

    // 지점 존재 확인
    const branch = await db
      .collection('branches')
      .findOne({ _id: new ObjectId(id) });

    if (!branch) {
      throw new Error('지점을 찾을 수 없습니다');
    }

    // 지점 삭제
    await db
      .collection('branches')
      .deleteOne({ _id: new ObjectId(id) });

    return {
      success: true,
      message: '지점이 삭제되었습니다'
    };
  } catch (error) {
    console.error('❌ Delete branch error:', error);
    throw error;
  }
};

const getBranchesByBrandId = async (brand_id) => {
  try {
    const db = await getDatabase();

    const branches = await db
      .collection('branches')
      .find({ brand_id: new ObjectId(brand_id), status: 'active' })
      .sort({ name: 1 })
      .toArray();

    return {
      success: true,
      data: branches.map(branch => ({
        id: branch._id.toString(),
        name: branch.name,
        address: branch.address,
        brand_id: branch.brand_id.toString()
      }))
    };
  } catch (error) {
    console.error('❌ Get branches by brand ID error:', error);
    throw error;
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchesByBrandId
};
