const express = require('express');
const managerController = require('../controllers/manager.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

const router = express.Router();

// GET /api/managers - 매니저 목록 (인증 필수)
router.get('/', authMiddleware, managerController.getAllManagers);

// POST /api/managers - 매니저 생성 (인증 + 관리자 필수)
router.post('/', authMiddleware, adminMiddleware, managerController.createManager);

// GET /api/managers/:id - 매니저 상세 (인증 필수)
router.get('/:id', authMiddleware, managerController.getManagerById);

// PUT /api/managers/:id - 매니저 수정 (인증 + 관리자 필수)
router.put('/:id', authMiddleware, adminMiddleware, managerController.updateManager);

// DELETE /api/managers/:id - 매니저 삭제 (인증 + 관리자 필수)
router.delete('/:id', authMiddleware, adminMiddleware, managerController.deleteManager);

module.exports = router;
