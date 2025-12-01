const branchService = require('../services/branch.service');

const getAllBranches = async (req, res) => {
  try {
    const { brand_id, status } = req.query;

    const filters = {};
    if (brand_id) filters.brand_id = brand_id;
    if (status) filters.status = status;

    const result = await branchService.getAllBranches(filters);

    return res.status(200).json({
      success: true,
      branches: result.data
    });
  } catch (error) {
    console.error('❌ Get all branches controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await branchService.getBranchById(id);

    return res.status(200).json({
      success: true,
      branch: result.data
    });
  } catch (error) {
    console.error('❌ Get branch by ID controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const createBranch = async (req, res) => {
  try {
    const {
      brand_id,
      name,
      address,
      latitude,
      longitude,
      nearest_subway,
      walking_distance,
      exterior_image_url,
      interior_image_urls,
      branch_info,
      approval_year,
      floors_above,
      floors_below,
      total_area,
      basic_info_1,
      basic_info_2,
      basic_info_3
    } = req.body;

    // 필수 항목 확인
    if (!brand_id || !name || !address || !latitude || !longitude || !nearest_subway || walking_distance === undefined) {
      return res.status(400).json({
        success: false,
        message: '모든 필수 항목을 입력해주세요'
      });
    }

    const result = await branchService.createBranch(
      {
        brand_id,
        name,
        address,
        latitude,
        longitude,
        nearest_subway,
        walking_distance,
        exterior_image_url,
        interior_image_urls,
        branch_info,
        approval_year,
        floors_above,
        floors_below,
        total_area,
        basic_info_1,
        basic_info_2,
        basic_info_3
      },
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: result.message,
      branch: result.data
    });
  } catch (error) {
    console.error('❌ Create branch controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      latitude,
      longitude,
      nearest_subway,
      walking_distance,
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
    } = req.body;

    // 수정할 정보 확인
    if (
      !name &&
      !address &&
      !latitude &&
      !longitude &&
      !nearest_subway &&
      walking_distance === undefined &&
      !exterior_image_url &&
      !interior_image_urls &&
      branch_info === undefined &&
      !approval_year &&
      !floors_above &&
      !floors_below &&
      !total_area &&
      basic_info_1 === undefined &&
      basic_info_2 === undefined &&
      basic_info_3 === undefined &&
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: '수정할 정보가 필요합니다'
      });
    }

    const result = await branchService.updateBranch(
      id,
      {
        name,
        address,
        latitude,
        longitude,
        nearest_subway,
        walking_distance,
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
      },
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      branch: result.data
    });
  } catch (error) {
    console.error('❌ Update branch controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await branchService.deleteBranch(id);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Delete branch controller error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};
