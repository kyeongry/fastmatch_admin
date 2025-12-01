const cloudinary = require('../config/cloudinary');
const BranchModel = require('../models/branch.mongodb');
const OptionModel = require('../models/option.mongodb');

// 디버그: Cloudinary 설정 확인
console.log('🔧 Cloudinary 설정 로드됨:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? '***' + cloudinary.config().api_key.slice(-4) : 'undefined',
});

/**
 * 파일 업로드 (Cloudinary)
 * @param {Object} file - 업로드할 파일
 * @param {string} folder - Cloudinary 폴더
 * @returns {Promise<Object>} 업로드된 파일 정보
 */
const uploadFile = async (file, folder = 'fastmatch') => {
  try {
    if (!file || !file.buffer) {
      throw new Error('파일이 없습니다');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `fastmatch/${folder}`,
          resource_type: 'auto',
          public_id: `${Date.now()}-${file.originalname}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    throw new Error('파일 업로드에 실패했습니다');
  }
};

/**
 * 이미지 업로드
 * @param {Object} file - 이미지 파일
 * @param {string} type - 이미지 타입 (branch, option 등)
 * @returns {Promise<Object>} 업로드된 이미지 정보
 */
const uploadImage = async (file, type = 'general') => {
  try {
    console.log('=== uploadImage 시작 ===');
    console.log('파일 정보:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      hasBuffer: !!file?.buffer,
      bufferLength: file?.buffer?.length,
    });

    if (!file) {
      throw new Error('이미지 파일이 없습니다');
    }

    if (!file.buffer) {
      console.error('파일 버퍼가 없습니다. Multer 설정이나 파일 크기를 확인해주세요.', file);
      throw new Error('파일 데이터가 없습니다 (Buffer missing)');
    }

    // 이미지 파일 검증
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error(`지원하지 않는 이미지 형식입니다: ${file.mimetype} (JPG, PNG, GIF, WebP 지원)`);
    }

    // 파일 크기 검증 (최대 20MB) - buffer.length 사용
    const maxSize = 20 * 1024 * 1024; // 20MB
    const fileSize = file.buffer.length;
    if (fileSize > maxSize) {
      throw new Error(`이미지 크기가 20MB를 초과합니다 (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    const typeFolder = ['branch', 'option', 'profile', 'document'].includes(type)
      ? type
      : 'general';

    console.log('Cloudinary 업로드 시작:', {
      folder: `fastmatch/images/${typeFolder}`,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `fastmatch/images/${typeFolder}`,
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary 업로드 에러 상세:', JSON.stringify(error, null, 2));
            reject(new Error(`Cloudinary 업로드 실패: ${error.message || JSON.stringify(error)}`));
          } else {
            console.log('Cloudinary 업로드 성공:', result.secure_url);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              size: result.bytes,
              format: result.format,
              uploadedAt: new Date(),
            });
          }
        }
      );

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('이미지 업로드 오류 (uploadImage):', error.message);
    console.error('에러 스택:', error.stack);
    throw new Error(error.message || '이미지 업로드에 실패했습니다');
  }
};

/**
 * 여러 이미지 업로드 (배치)
 * @param {Array} files - 이미지 파일 배열
 * @param {string} type - 이미지 타입
 * @returns {Promise<Array>} 업로드된 이미지 정보 배열
 */
const uploadMultipleImages = async (files, type = 'general') => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('업로드할 이미지가 없습니다');
    }

    // 최대 10개 이미지
    if (files.length > 10) {
      throw new Error('한 번에 최대 10개까지 업로드할 수 있습니다');
    }

    const uploadPromises = files.map(file => uploadImage(file, type));
    const results = await Promise.all(uploadPromises);

    return results;
  } catch (error) {
    console.error('배치 이미지 업로드 오류:', error);
    throw new Error(error.message || '이미지 업로드에 실패했습니다');
  }
};

/**
 * 파일 삭제
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
const deleteFile = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('파일 ID가 없습니다');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new Error('파일 삭제에 실패했습니다');
    }

    return true;
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    throw new Error('파일 삭제에 실패했습니다');
  }
};

/**
 * 지점 이미지 저장
 * @param {string} branchId - 지점 ID
 * @param {Object} exteriorImage - 외부 이미지
 * @param {Array} interiorImages - 내부 이미지 배열
 * @returns {Promise<Object>} 저장된 이미지 정보
 */
const saveBranchImages = async (branchId, exteriorImage, interiorImages = []) => {
  try {
    const branch = await BranchModel.findById(branchId);

    if (!branch) {
      throw new Error('지점을 찾을 수 없습니다');
    }

    const updateData = {};

    // 외부 이미지 업로드
    if (exteriorImage) {
      const uploadedExterior = await uploadImage(exteriorImage, 'branch');
      updateData.exterior_image_url = uploadedExterior.url;
    }

    // 내부 이미지 업로드
    if (interiorImages && interiorImages.length > 0) {
      const uploadedInterior = await uploadMultipleImages(interiorImages, 'branch');
      updateData.interior_image_urls = uploadedInterior.map(img => img.url);
    }

    // 데이터베이스 업데이트
    const updatedBranch = await BranchModel.updateById(branchId, updateData);

    return {
      success: true,
      branch: updatedBranch,
    };
  } catch (error) {
    console.error('지점 이미지 저장 오류:', error);
    throw error;
  }
};

/**
 * 옵션 이미지 저장 (플로어 플랜)
 * @param {string} optionId - 옵션 ID
 * @param {Object} floorPlan - 플로어 플랜 이미지
 * @returns {Promise<Object>} 저장된 이미지 정보
 */
const saveOptionImage = async (optionId, floorPlan) => {
  try {
    const option = await OptionModel.findById(optionId);

    if (!option) {
      throw new Error('옵션을 찾을 수 없습니다');
    }

    if (!floorPlan) {
      throw new Error('이미지가 없습니다');
    }

    const uploadedImage = await uploadImage(floorPlan, 'option');

    // 기존 이미지 삭제
    if (option.floor_plan_url) {
      try {
        const publicId = option.floor_plan_url.split('/').pop().split('.')[0];
        await deleteFile(`fastmatch/images/option/${publicId}`);
      } catch (error) {
        console.warn('기존 이미지 삭제 실패:', error);
      }
    }

    // 데이터베이스 업데이트
    const updatedOption = await OptionModel.updateById(optionId, {
      floor_plan_url: uploadedImage.url
    });

    return {
      success: true,
      option: updatedOption,
    };
  } catch (error) {
    console.error('옵션 이미지 저장 오류:', error);
    throw error;
  }
};

/**
 * 사용자 프로필 이미지 저장
 * @param {string} userId - 사용자 ID
 * @param {Object} profileImage - 프로필 이미지
 * @returns {Promise<Object>} 저장된 이미지 정보
 */
const saveProfileImage = async (userId, profileImage) => {
  try {
    if (!profileImage) {
      throw new Error('이미지가 없습니다');
    }

    const uploadedImage = await uploadImage(profileImage, 'profile');

    return {
      success: true,
      url: uploadedImage.url,
      uploadedAt: uploadedImage.uploadedAt,
    };
  } catch (error) {
    console.error('프로필 이미지 저장 오류:', error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  uploadImage,
  uploadMultipleImages,
  deleteFile,
  saveBranchImages,
  saveOptionImage,
  saveProfileImage,
};
