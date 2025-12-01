const {
  getDeleteRequests,
  getDeleteRequestById,
  approveDeleteRequest,
  rejectDeleteRequest,
} = require('../services/deleteRequest.service');

// 삭제 요청 목록 조회
const list = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    };

    const result = await getDeleteRequests(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 삭제 요청 상세 조회
const getById = async (req, res, next) => {
  try {
    const request = await getDeleteRequestById(req.params.id);
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// 삭제 요청 승인
const approve = async (req, res, next) => {
  try {
    const request = await approveDeleteRequest(req.params.id, req.user.id);
    res.json({
      success: true,
      message: '삭제 요청이 승인되었습니다',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// 삭제 요청 거부
const reject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await rejectDeleteRequest(req.params.id, reason, req.user.id);
    res.json({
      success: true,
      message: '삭제 요청이 거부되었습니다',
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getById,
  approve,
  reject,
};
