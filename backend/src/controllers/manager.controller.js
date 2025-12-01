const managerService = require('../services/manager.service');

const getAllManagers = async (req, res) => {
  try {
    const { brand_id, search } = req.query;

    const filters = {};
    if (brand_id) filters.brand_id = brand_id;
    if (search) filters.search = search;

    const result = await managerService.getAllManagers(filters);

    return res.status(200).json({
      success: true,
      managers: result.data
    });
  } catch (error) {
    console.error('❌ Get all managers controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await managerService.getManagerById(id);

    return res.status(200).json({
      success: true,
      manager: result.data
    });
  } catch (error) {
    console.error('❌ Get manager by ID controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createManager = async (req, res) => {
  try {
    const { brand_id, name, position, email, cc_email, phone } = req.body;

    // 필수 항목 확인 (브랜드와 이메일만 필수)
    if (!brand_id || !email) {
      return res.status(400).json({
        success: false,
        message: '브랜드와 이메일은 필수 항목입니다'
      });
    }

    const result = await managerService.createManager(
      { brand_id, name, position, email, cc_email, phone },
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: result.message,
      manager: result.data
    });
  } catch (error) {
    console.error('❌ Create manager controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_id, name, position, email, cc_email, phone } = req.body;

    // 최소한 하나의 필드가 정의되어 있는지 확인 (undefined가 아닌 값)
    const hasAnyField = brand_id !== undefined ||
                        name !== undefined ||
                        position !== undefined ||
                        email !== undefined ||
                        cc_email !== undefined ||
                        phone !== undefined;

    if (!hasAnyField) {
      return res.status(400).json({
        success: false,
        message: '수정할 정보가 필요합니다'
      });
    }

    const result = await managerService.updateManager(
      id,
      { brand_id, name, position, email, cc_email, phone },
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      manager: result.data
    });
  } catch (error) {
    console.error('❌ Update manager controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await managerService.deleteManager(id);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Delete manager controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager
};
