const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// 옵션 목록 조회
const getOptions = async (filters = {}) => {
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
  // status 파라미터가 명시적으로 전달되지 않은 경우, deleted 상태만 제외 (delete_requested는 포함)
  const query = status
    ? { status: status }
    : { status: { $nin: ['deleted'] } };

  const db = await getDatabase();

  // 여러 브랜드 필터링
  if (brand_ids && brand_ids.length > 0) {
    const brandObjectIds = brand_ids.map(id => new ObjectId(id));
    // 해당 브랜드들의 지점들을 찾아서 branch_id 목록 생성
    const branches = await db
      .collection('branches')
      .find({ brand_id: { $in: brandObjectIds } })
      .toArray();
    const branchIds = branches.map(b => b._id);
    if (branchIds.length > 0) {
      query.branch_id = { $in: branchIds };
    } else {
      // 해당 브랜드에 지점이 없으면 빈 결과 반환
      query.branch_id = { $in: [] };
    }
  }

  // 여러 지점 필터링
  if (branch_ids && branch_ids.length > 0) {
    const branchObjectIds = branch_ids.map(id => new ObjectId(id));
    if (query.branch_id && query.branch_id.$in) {
      // 브랜드 필터와 지점 필터가 모두 있으면 교집합
      query.branch_id.$in = query.branch_id.$in.filter(id =>
        branchObjectIds.some(bid => bid.toString() === id.toString())
      );
    } else {
      query.branch_id = { $in: branchObjectIds };
    }
  }
  // 여러 작성자 필터링
  if (creator_ids && creator_ids.length > 0) {
    const creatorObjectIds = creator_ids.map(id => new ObjectId(id));
    query.creator_id = { $in: creatorObjectIds };
  }
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { 'branch.name': new RegExp(search, 'i') }
    ];
  }

  // 인원 범위 필터링
  if (min_capacity || max_capacity) {
    query.capacity = {};
    if (min_capacity) {
      query.capacity.$gte = parseInt(min_capacity, 10);
    }
    if (max_capacity) {
      query.capacity.$lte = parseInt(max_capacity, 10);
    }
  }

  // 인당 평단가 정렬을 위한 플래그
  const needsPricePerPerson = sort === 'price_per_person_low' || sort === 'price_per_person_high';

  const sortBy =
    sort === 'latest'
      ? { created_at: -1 }
      : sort === 'oldest'
        ? { created_at: 1 }
        : sort === 'price_low'
          ? { monthly_fee: 1 }
          : sort === 'price_high'
            ? { monthly_fee: -1 }
            : sort === 'price_per_person_low'
              ? { price_per_person: 1 }
              : sort === 'price_per_person_high'
                ? { price_per_person: -1 }
                : { created_at: -1 };

  // aggregation 파이프라인 구성
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'branches',
        localField: 'branch_id',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'brands',
        localField: 'branch.brand_id',
        foreignField: '_id',
        as: 'branch.brand'
      }
    },
    { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'creator_id',
        foreignField: '_id',
        as: 'creator'
      }
    },
    { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
  ];

  // 인당 평단가 계산 필드 추가 (정렬에 필요한 경우)
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

  pipeline.push(
    { $sort: sortBy },
    { $skip: skip },
    { $limit: pageSize },
    {
      $project: {
        'creator.password': 0
      }
    }
  );

  const [options, total] = await Promise.all([
    db.collection('options').aggregate(pipeline).toArray(),
    db.collection('options').countDocuments(query)
  ]);

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

// 옵션 상세 조회
const getOptionById = async (id) => {
  const db = await getDatabase();

  const option = await db
    .collection('options')
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'branches',
          localField: 'branch_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'brands',
          localField: 'branch.brand_id',
          foreignField: '_id',
          as: 'branch.brand'
        }
      },
      { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },
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
        $project: {
          'creator.password': 0
        }
      }
    ])
    .toArray();

  if (!option || option.length === 0) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  return option[0];
};

// 내 옵션 목록 조회
const getMyOptions = async (userId, page = 1, pageSize = 20) => {
  const skip = (page - 1) * pageSize;
  const db = await getDatabase();
  const userObjectId = new ObjectId(userId);

  // 내 옵션 목록에서는 delete_requested 상태도 포함 (deleted 상태만 제외)
  const query = { creator_id: userObjectId, status: { $nin: ['deleted'] } };

  const [options, total] = await Promise.all([
    db.collection('options')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'branches',
            localField: 'branch_id',
            foreignField: '_id',
            as: 'branch'
          }
        },
        { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'brands',
            localField: 'branch.brand_id',
            foreignField: '_id',
            as: 'branch.brand'
          }
        },
        { $unwind: { path: '$branch.brand', preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: pageSize }
      ])
      .toArray(),
    db.collection('options').countDocuments(query)
  ]);

  return {
    options: options.map(opt => ({
      ...opt,
      id: opt._id.toString(),
      branch_id: opt.branch_id?.toString()
    })),
    total,
    page,
    pageSize
  };
};

// 옵션 생성
const createOption = async (data, userId) => {
  const { branch_id, name, category1, capacity, monthly_fee, deposit, move_in_date_type } = data;

  // 필수 필드 검증
  if (!branch_id || !name || !category1 || !capacity || !monthly_fee || !deposit) {
    throw new Error('필수 필드를 모두 입력해주세요');
  }

  if (capacity <= 0) {
    throw new Error('인실은 1 이상이어야 합니다');
  }

  if (monthly_fee <= 0 || deposit <= 0) {
    throw new Error('가격은 0 이상이어야 합니다');
  }

  const db = await getDatabase();

  // 브랜치 존재 확인
  const branch = await db
    .collection('branches')
    .findOne({ _id: new ObjectId(branch_id) });
  if (!branch) {
    throw new Error('지점을 찾을 수 없습니다');
  }

  const result = await db.collection('options').insertOne({
    branch_id: new ObjectId(branch_id),
    name,
    category1,
    category2: data.category2 || null,
    capacity,
    monthly_fee: parseFloat(monthly_fee),
    deposit: parseFloat(deposit),
    list_price: data.list_price ? parseFloat(data.list_price) : null,
    one_time_fees: data.one_time_fees || [],
    move_in_date_type,
    move_in_date_value: data.move_in_date_value || null,
    contract_period_type: data.contract_period_type || 'twelve_months',
    contract_period_value: data.contract_period_value || null,
    office_info: data.office_info || null,
    credits: data.credits || null,
    hvac_type: data.hvac_type || null,
    parking_type: data.parking_type || null,
    parking_count: data.parking_count || null,
    parking_cost: data.parking_cost || null,
    parking_note: data.parking_note || null,
    memo: data.memo || null,
    floor_plan_url: data.floor_plan_url || null,
    exclusive_area: data.exclusive_area || null,
    status: 'active',
    creator_id: new ObjectId(userId),
    created_at: new Date(),
    updated_at: new Date()
  });

  return {
    id: result.insertedId.toString(),
    branch_id,
    name,
    category1,
    capacity,
    monthly_fee,
    deposit,
    status: 'active',
    creator_id: userId,
    created_at: new Date()
  };
};

// 옵션 수정
const updateOption = async (id, data, userId, userRole) => {
  const db = await getDatabase();

  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });

  if (!option) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  // 권한 확인: 본인 또는 Admin만 수정 가능
  if (option.creator_id.toString() !== userId && userRole !== 'admin') {
    throw new Error('권한이 없습니다');
  }

  // 삭제 요청 중인 옵션은 수정 불가
  if (option.status === 'delete_requested') {
    throw new Error('삭제 요청 중인 옵션은 수정할 수 없습니다');
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category1 !== undefined) updateData.category1 = data.category1;
  if (data.category2 !== undefined) updateData.category2 = data.category2;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.monthly_fee !== undefined) updateData.monthly_fee = parseFloat(data.monthly_fee);
  if (data.deposit !== undefined) updateData.deposit = parseFloat(data.deposit);
  if (data.list_price !== undefined) updateData.list_price = data.list_price ? parseFloat(data.list_price) : null;
  if (data.one_time_fees !== undefined) updateData.one_time_fees = data.one_time_fees;
  if (data.move_in_date_type !== undefined) updateData.move_in_date_type = data.move_in_date_type;
  if (data.move_in_date_value !== undefined) updateData.move_in_date_value = data.move_in_date_value;
  if (data.contract_period_type !== undefined) updateData.contract_period_type = data.contract_period_type;
  if (data.contract_period_value !== undefined) updateData.contract_period_value = data.contract_period_value;
  if (data.office_info !== undefined) updateData.office_info = data.office_info;
  if (data.credits !== undefined) updateData.credits = data.credits;
  if (data.hvac_type !== undefined) updateData.hvac_type = data.hvac_type;
  if (data.parking_type !== undefined) updateData.parking_type = data.parking_type;
  if (data.parking_count !== undefined) updateData.parking_count = data.parking_count;
  if (data.parking_cost !== undefined) updateData.parking_cost = data.parking_cost;
  if (data.parking_note !== undefined) updateData.parking_note = data.parking_note;
  if (data.exclusive_area !== undefined) updateData.exclusive_area = data.exclusive_area;
  if (data.memo !== undefined) updateData.memo = data.memo;
  if (data.floor_plan_url !== undefined) updateData.floor_plan_url = data.floor_plan_url;
  updateData.updater_id = new ObjectId(userId);
  updateData.updated_at = new Date();

  const result = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return result.value;
};

// 옵션 삭제 요청
const requestDeleteOption = async (id, reason, userId, userRole) => {
  const db = await getDatabase();

  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });

  if (!option) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  // 권한 확인: 본인 또는 관리자만 삭제 요청 가능
  if (option.creator_id.toString() !== userId && userRole !== 'admin') {
    throw new Error('본인의 옵션만 삭제 요청할 수 있습니다');
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('삭제 사유를 입력해주세요');
  }

  // 관리자와 일반 사용자 모두 동일하게 삭제 요청 처리
  // 삭제 요청 업데이트
  const updatedOption = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'delete_requested',
        delete_request_at: new Date(),
        delete_request_reason: reason
      }
    },
    { returnDocument: 'after' }
  );

  // DeleteRequest 레코드 생성 (관리자도 pending 상태로 생성)
  await db.collection('delete_requests').insertOne({
    option_id: new ObjectId(id),
    requester_id: new ObjectId(userId),
    request_reason: reason,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
  });

  return updatedOption.value;
};

// 옵션 삭제 요청 취소
const cancelDeleteRequest = async (id, userId, userRole) => {
  const db = await getDatabase();

  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });

  if (!option) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  // 권한 확인: 본인 또는 관리자만 삭제 요청 취소 가능
  if (option.creator_id.toString() !== userId && userRole !== 'admin') {
    throw new Error('본인의 옵션만 삭제 요청을 취소할 수 있습니다');
  }

  // 삭제 요청 상태가 아니면 취소 불가
  if (option.status !== 'delete_requested') {
    throw new Error('삭제 요청 상태가 아닙니다');
  }

  // 옵션 상태를 active로 변경
  const updatedOption = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'active',
        updated_at: new Date()
      },
      $unset: {
        delete_request_at: '',
        delete_request_reason: ''
      }
    },
    { returnDocument: 'after' }
  );

  // 해당 옵션의 삭제 요청 레코드 삭제
  await db.collection('delete_requests').deleteMany({
    option_id: new ObjectId(id)
  });

  return updatedOption.value;
};

// 옵션 거래완료 처리
const markAsCompleted = async (id, userId, userRole) => {
  const db = await getDatabase();

  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });

  if (!option) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  // 권한 확인: 본인만 거래완료 처리 가능
  if (option.creator_id.toString() !== userId && userRole !== 'admin') {
    throw new Error('본인의 옵션만 거래완료 처리할 수 있습니다');
  }

  // 이미 거래완료 상태인 경우
  if (option.status === 'completed') {
    throw new Error('이미 거래완료 상태입니다');
  }

  // 삭제 요청 중이거나 삭제된 옵션은 거래완료 처리 불가
  if (option.status === 'delete_requested' || option.status === 'deleted') {
    throw new Error('삭제 요청 중이거나 삭제된 옵션은 거래완료 처리할 수 없습니다');
  }

  const updatedOption = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'completed',
        completed_at: new Date(),
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  return updatedOption.value;
};

// 옵션 거래재개 처리
const markAsActive = async (id, userId, userRole) => {
  const db = await getDatabase();

  const option = await db.collection('options').findOne({ _id: new ObjectId(id) });

  if (!option) {
    throw new Error('옵션을 찾을 수 없습니다');
  }

  // 권한 확인: 본인만 거래재개 처리 가능
  if (option.creator_id.toString() !== userId && userRole !== 'admin') {
    throw new Error('본인의 옵션만 거래재개 처리할 수 있습니다');
  }

  // 거래완료 상태가 아닌 경우
  if (option.status !== 'completed') {
    throw new Error('거래완료 상태인 옵션만 거래재개 처리할 수 있습니다');
  }

  const updatedOption = await db.collection('options').findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: 'active',
        reactivated_at: new Date(),
        updated_at: new Date()
      },
      $unset: {
        completed_at: ''
      }
    },
    { returnDocument: 'after' }
  );

  return updatedOption.value;
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
