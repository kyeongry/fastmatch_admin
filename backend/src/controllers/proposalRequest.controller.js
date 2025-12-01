const {
  getProposalRequests,
  getProposalRequestById,
  createProposalRequest,
  addProposalBrands,
  modifyProposalRequest,
} = require('../services/proposalRequest.service');

// 제안 요청 목록 조회
const list = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
      status: req.query.status,
    };

    const result = await getProposalRequests(req.user.id, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 제안 요청 상세 조회
const getById = async (req, res, next) => {
  try {
    const request = await getProposalRequestById(req.params.id, req.user.id);
    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// 제안 요청 생성
const create = async (req, res, next) => {
  try {
    const request = await createProposalRequest(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: '제안 요청이 생성되었습니다',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// 추가 제안 요청
const addBrands = async (req, res, next) => {
  try {
    const { additional_brands } = req.body;
    const request = await addProposalBrands(req.params.id, additional_brands, req.user.id);
    res.json({
      success: true,
      message: '추가 제안 요청이 발송되었습니다',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// 제안 요청 수정 (조건 변경)
const modify = async (req, res, next) => {
  try {
    const request = await modifyProposalRequest(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: '제안 요청이 수정되었습니다',
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  getById,
  create,
  addBrands,
  modify,
};
