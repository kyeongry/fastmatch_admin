const {
  getOptions,
  getOptionById,
  getMyOptions,
  createOption,
  updateOption,
  requestDeleteOption,
  cancelDeleteRequest,
  markAsCompleted,
  markAsActive,
} = require('../services/option.service');

// 옵션 목록 조회
const list = async (req, res, next) => {
  try {
    // 여러 브랜드/지점/작성자 필터 지원
    const brandIds = req.query.brand_ids || req.query.brand_id;
    const branchIds = req.query.branch_ids || req.query.branch_id;
    const creatorIds = req.query.creator_ids || req.query.creator_id;
    
    const category1Values = req.query.category1_list || req.query.category1;

    const filters = {
      brand_ids: Array.isArray(brandIds) ? brandIds : brandIds ? [brandIds] : undefined,
      branch_ids: Array.isArray(branchIds) ? branchIds : branchIds ? [branchIds] : undefined,
      creator_ids: Array.isArray(creatorIds) ? creatorIds : creatorIds ? [creatorIds] : undefined,
      category1_list: Array.isArray(category1Values) ? category1Values : category1Values ? [category1Values] : undefined,
      status: req.query.status,
      search: req.query.search,
      min_capacity: req.query.min_capacity,
      max_capacity: req.query.max_capacity,
      sort: req.query.sort || 'latest',
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    };

    const result = await getOptions(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 옵션 상세 조회
const getById = async (req, res, next) => {
  try {
    const option = await getOptionById(req.params.id);
    res.json({ success: true, option });
  } catch (error) {
    next(error);
  }
};

// 내 옵션 목록 조회
const getMy = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const result = await getMyOptions(req.user.id, page, pageSize);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 옵션 생성
const create = async (req, res, next) => {
  try {
    const option = await createOption(req.body, req.user.id);
    res.status(201).json({ success: true, option });
  } catch (error) {
    next(error);
  }
};

// 옵션 수정
const update = async (req, res, next) => {
  try {
    const option = await updateOption(req.params.id, req.body, req.user.id, req.user.role);
    res.json({ success: true, option });
  } catch (error) {
    next(error);
  }
};

// 옵션 삭제 요청
const requestDelete = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const option = await requestDeleteOption(req.params.id, reason, req.user.id, req.user.role);
    res.json({ success: true, message: '삭제 요청이 접수되었습니다', option });
  } catch (error) {
    next(error);
  }
};

// 옵션 삭제 요청 취소
const cancelDelete = async (req, res, next) => {
  try {
    const option = await cancelDeleteRequest(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: '삭제 요청이 취소되었습니다', option });
  } catch (error) {
    next(error);
  }
};

// 옵션 작성자 목록 조회
const getCreators = async (req, res, next) => {
  try {
    const { getDatabase } = require('../config/mongodb');
    const db = await getDatabase();

    // 옵션을 등록한 사용자들의 고유 ID 목록 조회
    const creators = await db.collection('options').aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$creator_id' } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          id: { $toString: '$_id' },
          name: '$user.name',
          email: '$user.email'
        }
      },
      { $sort: { name: 1 } }
    ]).toArray();

    res.json({
      success: true,
      creators: creators.map(c => ({
        id: c.id,
        name: c.name || '알 수 없음',
        email: c.email || ''
      }))
    });
  } catch (error) {
    next(error);
  }
};

// 옵션 거래완료 처리
const complete = async (req, res, next) => {
  try {
    const option = await markAsCompleted(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: '거래가 완료되었습니다', option });
  } catch (error) {
    next(error);
  }
};

// 옵션 거래재개 처리
const reactivate = async (req, res, next) => {
  try {
    const option = await markAsActive(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: '거래가 재개되었습니다', option });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getById,
  getMy,
  create,
  update,
  requestDelete,
  cancelDelete,
  getCreators,
  complete,
  reactivate,
};
