const express = require('express');
const branchController = require('../controllers/branch.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const router = express.Router();

// GET /api/branches - 지점 목록 (인증 필수)
router.get('/', authMiddleware, branchController.getAllBranches);

// POST /api/branches - 지점 생성 (인증 + 관리자 필수)
router.post('/', authMiddleware, adminMiddleware, branchController.createBranch);

// GET /api/branches/:id - 지점 상세 (인증 필수)
router.get('/:id', authMiddleware, branchController.getBranchById);

// PUT /api/branches/:id - 지점 수정 (인증 + 관리자 필수)
router.put('/:id', authMiddleware, adminMiddleware, branchController.updateBranch);

// DELETE /api/branches/:id - 지점 삭제 (인증 + 관리자 필수)
router.delete('/:id', authMiddleware, adminMiddleware, branchController.deleteBranch);

module.exports = router;
