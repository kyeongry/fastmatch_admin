const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// 옵션 목록 조회
const getOptions = async (filters = {}) => {
  // [디버깅] 요청된 필터 확인
  console.log('----- [GET OPTIONS DEBUG] -----');
  console.log('Received Filters:', JSON.stringify(filters, null, 2));

  const {
    brand_ids,
    branch_ids,
    creator_ids,
    status,
    search,
    min_capacity,
    max_capacity,
    sort = 'latest',
    page = 1,
    pageSize = 20,
  } = filters;

  const skip = (page - 1) * pageSize;
  const db = await getDatabase();

  // 1. 기본 필터 쿼리
  const baseQuery = status
    ? { status: status }
    : { status: { $nin: ['deleted'] } };

  if (creator_ids && creator_ids.length > 0) {
    baseQuery.creator_id = { $in: creator_ids.map(id => new ObjectId(id)) };
  }

  if (min_capacity || max_capacity) {
    baseQuery.capacity = {};
    if (min_capacity) baseQuery.capacity.$gte = parseInt(min_capacity, 10);
    if (max_capacity) baseQuery.capacity.$lte = parseInt(max_capacity, 10);
  }

  // 브랜드/지점 ID 필터링
  if (brand_ids && brand_ids.length > 0) {
    const brandObjectIds = brand_ids.map(id => new ObjectId(id));
    const branches = await db.collection('branches')
      .find({ brand_id: { $in: brandObjectIds } })
      .toArray();
    const validBranchIds = branches.map(b => b._id);
    
    if (baseQuery.branch_id) {
       // 기존 필터와 교집합 (단순 할당)
       baseQuery.branch_id = { $in: validBranchIds };
    } else {
       baseQuery.branch_id = { $in: validBranchIds };
    }
  }

  if (branch_ids && branch_ids.length > 0) {
    const branchObjectIds = branch_ids.map(id => new ObjectId(id));
    if (baseQuery.branch_id && baseQuery.branch_id.$in) {
      baseQuery.branch_id.$in = baseQuery.branch_id.$in.filter(id =>
        branchObjectIds.some(bid => bid.toString() === id.toString())
      );
    } else {
      baseQuery.branch_id = { $in: branchObjectIds };
    }
  }

  console.log('Base Query:', JSON.stringify(baseQuery, null, 2));

  // 2. Aggregation Pipeline
  const pipeline = [
    { $match: baseQuery }, // 1차 필터링

    // Branch 조인
    {
      $lookup: {
        from: 'branches',
        localField: 'branch_id',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },

    // Brand 조인
    {
      $lookup: {
        from: 'brands',
        localField: 'branch.brand_id',
        foreignField: '_id',
        as: 'branch.brand'
      }
    },
    { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },

    // Creator 조인
    {
      $lookup: {
        from: 'users',
        localField: 'creator_id',
        foreignField: '_id',
        as: 'creator'
      }
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } }
  ];

  // 3. [핵심] 검색어 필터링 ($lookup 이후에 실행되어야 브랜드명 검색 가능)
  if (search) {
    console.log(`Applying Search Regex for: "${search}"`);
    const regex = new RegExp(search, 'i');
    pipeline.push({
      $match: {
        $or: [
          { name: regex },                  // 옵션명
          { 'branch.name': regex },         // 지점명
          { 'branch.brand.name': regex }    // 브랜드명
        ]
      }
    });
  }

  // 4. 정렬
  const needsPricePerPerson = sort === 'price_per_person_low' || sort === 'price_per_person_high';
  if (needsPricePerPerson) {
    pipeline.push({
      $addFields: {
        price_per_person: {
          $cond: {
            if: { $gt: ['$capacity', 0] },
            then: { $divide: ['$monthly_fee', '$capacity'] },
            else: '$monthly_fee'
          }
        }
      }
    });
  }

  const sortBy =
    sort === 'latest' ? { created_at: -1 } :
    sort === 'oldest' ? { created_at: 1 } :
    sort === 'price_low' ? { monthly_fee: 1 } :
    sort === 'price_high' ? { monthly_fee: -1 } :
    sort === 'price_per_person_low' ? { price_per_person: 1 } :
    sort === 'price_per_person_high' ? { price_per_person: -1 } :
    { created_at: -1 };

  pipeline.push({ $sort: sortBy });

  // 5. 페이징 및 카운트
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $skip: skip },
        { $limit: pageSize },
        { $project: { 'creator.password': 0 } }
      ]
    }
  });

  const result = await db.collection('options').aggregate(pipeline).toArray();
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
  const options = result[0].data || [];

  console.log(`Search Result Count: ${total}`);
  console.log('-------------------------------');

  return {
    options: options.map(opt => ({
      ...opt,
      id: opt._id.toString(),
      branch_id: opt.branch_id?.toString(),
      creator_id: opt.creator_id?.toString()
    })),
    total,
    page,
    pageSize
  };
};

// ... (아래는 기존 코드 유지 - 필요한 함수들은 그대로 둡니다)
const getOptionById = async (id) => {
  const db = await getDatabase();
  const option = await db.collection('options').aggregate([
    { $match: { _id: new ObjectId(id) } },
    { $lookup: { from: 'branches', localField: 'branch_id', foreignField: '_id', as: 'branch' } },
    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'brands', localField: 'branch.brand_id', foreignField: '_id', as: 'branch.brand' } },
    { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'creator_id', foreignField: '_id', as: 'creator' } },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
    { $project: { 'creator.password': 0 } }
  ]).toArray();
  if (!option || option.length === 0) throw new Error('옵션을 찾을 수 없습니다');
  return option[0];
};

const getMyOptions = async (userId, page = 1, pageSize = 20) => {
  // 기존 getMyOptions 로직 유지
  const skip = (page - 1) * pageSize;
  const db = await getDatabase();
  const userObjectId = new ObjectId(userId);
  const query = { creator_id: userObjectId, status: { $nin: ['deleted'] } };
  const [options, total] = await Promise.all([
    db.collection('options').aggregate([
      { $match: query },
      { $lookup: { from: 'branches', localField: 'branch_id', foreignField: '_id', as: 'branch' } },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'brands', localField: 'branch.brand_id', foreignField: '_id', as: 'branch.brand' } },
      { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: pageSize }
    ]).toArray(),
    db.collection('options').countDocuments(query)
  ]);
  return {
    options: options.map(opt => ({ ...opt, id: opt._id.toString(), branch_id: opt.branch_id?.toString() })),
    total, page, pageSize
  };
};

const createOption = async (data, userId) => {
  // 기존 createOption 로직 유지
  const { branch_id, name, category1, capacity, monthly_fee, deposit, move_in_date_type } = data;
  if (!branch_id || !name || !category1 || !capacity || !monthly_fee || !deposit) throw new Error('필수 필드를 모두 입력해주세요');
  const db = await getDatabase();
  const branch = await db.collection('branches').findOne({ _id: new ObjectId(branch_id) });
  if (!branch) throw new Error('지점을 찾을 수 없습니다');
  
  const result = await db.collection('options').insertOne({
    branch_id: new ObjectId(branch_id),
    name, category1, category2: data.category2 || null, capacity,
    monthly_fee: parseFloat(monthly_fee), deposit: parseFloat(deposit),
    list_price: data.list_price ? parseFloat(data.list_price) : null,
    one_time_fees: data.one_time_fees || [],
    move_in_date_type, move_in_date_value: data.move_in_date_value || null,
    contract_period_type: data.contract_period_type || 'twelve_months',
    contract_period_value: data.contract_period_value || null,
    office_info: data.office_info || null, credits: data.credits || null,
    hvac_type: data.hvac_type || null, parking_type: data.parking_type || null,
    parking_count: data.parking_count || null, parking_cost: data.parking_cost || null,
    parking_note: data.parking_note || null, memo: data.memo || null,
    floor_plan_url: data.floor_plan_url || null,
    floor_plan_urls: data.floor_plan_urls || (data.floor_plan_url ? [data.floor_plan_url] : []),
    exclusive_area: data.exclusive_area || null,
    status: 'active', creator_id: new ObjectId(userId),
    created_at: new Date(), updated_at: new Date()
  });
  return { id: result.insertedId.toString(), ...data, status: 'active', creator_id: userId };
};

const updateOption = async (id, data, userId, userRole) => {
  // 기존 updateOption 로직 유지
  const db = await getDatabase();
  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });
  if (!option) throw new Error('옵션을 찾을 수 없습니다');
  // 모든 사용자에게 옵션 수정 권한 적용 (권한 체크 제거)

  // undefined, null, 빈 문자열 값 필터링 (기존 값 보존)
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) =>
      value !== undefined && value !== null && value !== ''
    )
  );

  const updateData = { ...filteredData, updated_at: new Date(), updater_id: new ObjectId(userId) };
  delete updateData._id; // _id 수정 방지

  // branch_id가 있으면 ObjectId로 변환 (문자열 → ObjectId)
  if (updateData.branch_id) {
    updateData.branch_id = new ObjectId(updateData.branch_id);
  }

  const result = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result;
};

const requestDeleteOption = async (id, reason, userId, userRole) => {
    // 기존 로직 유지 (간략화)
    const db = await getDatabase();
    const result = await db.collection('options').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'delete_requested', delete_request_reason: reason } },
        { returnDocument: 'after' }
    );
    return result;
};

const cancelDeleteRequest = async (id, userId, userRole) => {
    // 기존 로직 유지
    const db = await getDatabase();
    const result = await db.collection('options').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'active' }, $unset: { delete_request_reason: "" } },
        { returnDocument: 'after' }
    );
    return result;
};

const markAsCompleted = async (id, userId, userRole) => {
    // 기존 로직 유지
    const db = await getDatabase();
    const result = await db.collection('options').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'completed' } },
        { returnDocument: 'after' }
    );
    return result;
};

const markAsActive = async (id, userId, userRole) => {
    // 기존 로직 유지
    const db = await getDatabase();
    const result = await db.collection('options').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'active' } },
        { returnDocument: 'after' }
    );
    return result;
};

module.exports = {
  getOptions,
  getOptionById,
  getMyOptions,
  createOption,
  updateOption,
  requestDeleteOption,
  cancelDeleteRequest,
  markAsCompleted,
  markAsActive,
};
