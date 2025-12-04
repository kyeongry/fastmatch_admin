const {
  getDashboardStats,
  getMonthlyStats,
  getBrandStats,
  getOptionStats,
  getProposalStats,
  getRecentActivities,
  getUsageStats,
  getUsers,
  getUserById,
  updateUser,
} = require('../services/admin.service');

/**
 * 대시보드 통계 조회
 */
const getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 월별 통계 조회
 */
const getMonthlyData = async (req, res, next) => {
  try {
    const { months } = req.query;
    const monthCount = months ? parseInt(months) : 12;

    if (monthCount < 1 || monthCount > 24) {
      return res.status(400).json({
        success: false,
        message: '조회 개월 수는 1~24 사이여야 합니다',
      });
    }

    const stats = await getMonthlyStats(monthCount);

    res.json({
      success: true,
      months: monthCount,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 브랜드별 통계 조회
 */
const getBrandData = async (req, res, next) => {
  try {
    const stats = await getBrandStats();

    res.json({
      success: true,
      count: stats.length,
      brands: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 옵션 상태별 통계 조회
 */
const getOptionData = async (req, res, next) => {
  try {
    const stats = await getOptionStats();

    res.json({
      success: true,
      options: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 제안 요청 상태별 통계 조회
 */
const getProposalData = async (req, res, next) => {
  try {
    const stats = await getProposalStats();

    res.json({
      success: true,
      proposals: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 최근 활동 조회
 */
const getActivities = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const activityLimit = limit ? parseInt(limit) : 10;

    if (activityLimit < 1 || activityLimit > 50) {
      return res.status(400).json({
        success: false,
        message: '조회 개수는 1~50 사이여야 합니다',
      });
    }

    const result = await getRecentActivities(activityLimit);

    res.json({
      success: true,
      count: result.activities.length,
      activities: result.activities,
      recentOptions: result.recentOptions,
      recentDeleteRequests: result.recentDeleteRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 서비스 사용량 조회
 */
const getUsage = async (req, res, next) => {
  try {
    const usage = await getUsageStats();

    res.json({
      success: true,
      usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 목록 조회
 */
const getUserList = async (req, res, next) => {
  try {
    const { page, pageSize, search, status } = req.query;
    const filters = {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      search,
      status,
    };

    const result = await getUsers(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 상세 조회
 */
const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 사용자 정보 업데이트 (관리자 권한 등)
 */
const updateUserInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 허용된 필드만 업데이트
    const allowedFields = ['role', 'status', 'name', 'phone', 'affiliation'];
    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    const user = await updateUser(id, filteredData);

    res.json({
      success: true,
      user,
      message: '사용자 정보가 업데이트되었습니다',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getMonthlyData,
  getBrandData,
  getOptionData,
  getProposalData,
  getActivities,
  getUsage,
  getUserList,
  getUserDetail,
  updateUserInfo,
};
