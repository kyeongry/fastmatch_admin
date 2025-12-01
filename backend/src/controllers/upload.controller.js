const {
  uploadImage,
  uploadMultipleImages,
  saveBranchImages,
  saveOptionImage,
  saveProfileImage,
} = require('../services/upload.service');

/**
 * 단일 이미지 업로드
 */
const uploadSingleImage = async (req, res, next) => {
  try {
    console.log('=== 이미지 업로드 요청 ===');
    console.log('파일 정보:', req.file);
    console.log('쿼리 타입:', req.query.type);

    if (!req.file) {
      console.error('파일이 없습니다');
      return res.status(400).json({
        success: false,
        message: '파일이 없습니다',
      });
    }

    const type = req.query.type || 'general';
    console.log('업로드 타입:', type);

    const result = await uploadImage(req.file, type);
    console.log('업로드 성공:', result.url);

    res.status(200).json({
      success: true,
      message: '이미지가 업로드되었습니다',
      image: result,
    });
  } catch (error) {
    console.error('이미지 업로드 실패 (Controller):', error);
    res.status(500).json({
      success: false,
      message: error.message || '이미지 업로드에 실패했습니다',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

/**
 * 여러 이미지 업로드
 */
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '파일이 없습니다',
      });
    }

    const type = req.query.type || 'general';
    const results = await uploadMultipleImages(req.files, type);

    res.status(200).json({
      success: true,
      message: '이미지들이 업로드되었습니다',
      images: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 지점 이미지 업로드
 */
const uploadBranchImages = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: '지점 ID가 필요합니다',
      });
    }

    const exteriorImage = req.files?.exterior?.[0];
    const interiorImages = req.files?.interior || [];

    const result = await saveBranchImages(branchId, exteriorImage, interiorImages);

    res.status(200).json({
      success: true,
      message: '지점 이미지가 업로드되었습니다',
      branch: result.branch,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 옵션 플로어 플랜 업로드
 */
const uploadOptionFloorPlan = async (req, res, next) => {
  try {
    const { optionId } = req.params;

    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: '옵션 ID가 필요합니다',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 없습니다',
      });
    }

    const result = await saveOptionImage(optionId, req.file);

    res.status(200).json({
      success: true,
      message: '플로어 플랜이 업로드되었습니다',
      option: result.option,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 프로필 이미지 업로드
 */
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 없습니다',
      });
    }

    const result = await saveProfileImage(req.user.id, req.file);

    res.status(200).json({
      success: true,
      message: '프로필 이미지가 업로드되었습니다',
      image: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultiple,
  uploadBranchImages,
  uploadOptionFloorPlan,
  uploadProfileImage,
};
