const {
  getDashboardStats,
  getMonthlyStats,
  getBrandStats,
  getOptionStats,
  getProposalStats,
  getRecentActivities,
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

    const activities = await getRecentActivities(activityLimit);

    res.json({
      success: true,
      count: activities.length,
      activities,
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
};
