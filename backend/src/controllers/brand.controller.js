const brandService = require('../services/brand.service');

const getAllBrands = async (req, res) => {
  try {
    const { status, search } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;

    const result = await brandService.getAllBrands(filters);

    return res.status(200).json({
      success: true,
      brands: result.data
    });
  } catch (error) {
    console.error('❌ Get all brands controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await brandService.getBrandById(id);

    return res.status(200).json({
      success: true,
      brand: result.data
    });
  } catch (error) {
    console.error('❌ Get brand by ID controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, alias } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '브랜드명이 필요합니다'
      });
    }

    const result = await brandService.createBrand({ name, alias }, req.user.id);

    return res.status(201).json({
      success: true,
      message: result.message,
      brand: result.data
    });
  } catch (error) {
    console.error('❌ Create brand controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, alias, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({
        success: false,
        message: '수정할 정보가 필요합니다'
      });
    }

    const result = await brandService.updateBrand(id, { name, alias, status }, req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
      brand: result.data
    });
  } catch (error) {
    console.error('❌ Update brand controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await brandService.deleteBrand(id);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Delete brand controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const checkDuplicate = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '브랜드명이 필요합니다'
      });
    }

    const result = await brandService.checkDuplicate(name);

    return res.status(200).json({
      success: true,
      duplicate: result.duplicate
    });
  } catch (error) {
    console.error('❌ Check duplicate controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getAvailableBrandsForAddition = async (req, res) => {
  try {
    const { proposalId } = req.query;

    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: '제안 ID가 필요합니다'
      });
    }

    const result = await brandService.getAvailableBrandsForAddition(proposalId);

    return res.status(200).json({
      success: true,
      brands: result.data
    });
  } catch (error) {
    console.error('❌ Get available brands controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
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
