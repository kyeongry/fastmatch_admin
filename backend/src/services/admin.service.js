const BrandModel = require('../models/brand.mongodb');
const ManagerModel = require('../models/manager.mongodb');
const BranchModel = require('../models/branch.mongodb');
const OptionModel = require('../models/option.mongodb');
const UserModel = require('../models/user.mongodb');
const ProposalRequestModel = require('../models/proposalRequest.mongodb');
const ProposalSendHistoryModel = require('../models/proposalSendHistory.mongodb');
const DeleteRequestModel = require('../models/deleteRequest.mongodb');

const getDashboardStats = async () => {
  try {
    const [
      totalUsers,
      totalBrands,
      totalBranches,
      totalOptions,
      activeOptions,
      totalProposalRequests,
      sentProposals,
      failedProposals,
      totalDeleteRequests,
      pendingDeleteRequests,
    ] = await Promise.all([
      UserModel.count(),
      BrandModel.count(),
      BranchModel.count(),
      OptionModel.count(),
      OptionModel.count({ status: 'active' }),
      ProposalRequestModel.count(),
      ProposalRequestModel.count({ send_status: 'sent' }),
      ProposalRequestModel.count({ send_status: 'failed' }),
      DeleteRequestModel.count(),
      DeleteRequestModel.count({ status: 'pending' }),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      brands: {
        total: totalBrands,
      },
      branches: {
        total: totalBranches,
      },
      options: {
        total: totalOptions,
        active: activeOptions,
        inactive: totalOptions - activeOptions,
      },
      proposals: {
        total: totalProposalRequests,
        sent: sentProposals,
        failed: failedProposals,
        pending: totalProposalRequests - sentProposals - failedProposals,
      },
      deleteRequests: {
        total: totalDeleteRequests,
        pending: pendingDeleteRequests,
        processed: totalDeleteRequests - pendingDeleteRequests,
      },
    };
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    throw new Error('통계 조회에 실패했습니다');
  }
};

const getMonthlyStats = async (months = 12) => {
  try {
    const stats = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthLabel = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
      });

      const [users, proposals, options] = await Promise.all([
        UserModel.count({
          created_at: { $gte: date, $lt: nextMonth },
        }),
        ProposalRequestModel.count({
          created_at: { $gte: date, $lt: nextMonth },
        }),
        OptionModel.count({
          created_at: { $gte: date, $lt: nextMonth },
        }),
      ]);

      stats.push({
        month: monthLabel,
        users,
        proposals,
        options,
      });
    }

    return stats;
  } catch (error) {
    console.error('월별 통계 조회 오류:', error);
    throw new Error('월별 통계 조회에 실패했습니다');
  }
};

const getBrandStats = async () => {
  try {
    const brands = await BrandModel.findAll();

    const brandStats = await Promise.all(
      brands.map(async (brand) => {
        const [managers, branches, sendHistories] = await Promise.all([
          ManagerModel.count({ brand_id: brand._id.toString() }),
          BranchModel.count({ brand_id: brand._id.toString() }),
          ProposalSendHistoryModel.countByBrandId(brand._id.toString()),
        ]);

        return {
          id: brand._id.toString(),
          name: brand.name,
          managers,
          branches,
          proposalsSent: sendHistories,
        };
      })
    );

    return brandStats;
  } catch (error) {
    console.error('브랜드별 통계 조회 오류:', error);
    throw new Error('브랜드별 통계 조회에 실패했습니다');
  }
};

const getOptionStats = async () => {
  try {
    const [active, deleteRequested, deleted] = await Promise.all([
      OptionModel.count({ status: 'active' }),
      OptionModel.count({ status: 'delete_requested' }),
      OptionModel.count({ status: 'deleted' }),
    ]);

    const total = active + deleteRequested + deleted;

    return {
      total,
      active: {
        count: active,
        percentage: total > 0 ? ((active / total) * 100).toFixed(2) : 0,
      },
      deleteRequested: {
        count: deleteRequested,
        percentage: total > 0 ? ((deleteRequested / total) * 100).toFixed(2) : 0,
      },
      deleted: {
        count: deleted,
        percentage: total > 0 ? ((deleted / total) * 100).toFixed(2) : 0,
      },
    };
  } catch (error) {
    console.error('옵션 통계 조회 오류:', error);
    throw new Error('옵션 통계 조회에 실패했습니다');
  }
};

const getProposalStats = async () => {
  try {
    const [sent, failed, sending] = await Promise.all([
      ProposalRequestModel.count({ send_status: 'sent' }),
      ProposalRequestModel.count({ send_status: 'failed' }),
      ProposalRequestModel.count({ send_status: 'sending' }),
    ]);

    const total = sent + failed + sending;

    return {
      total,
      sent: {
        count: sent,
        percentage: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
      },
      failed: {
        count: failed,
        percentage: total > 0 ? ((failed / total) * 100).toFixed(2) : 0,
      },
      sending: {
        count: sending,
        percentage: total > 0 ? ((sending / total) * 100).toFixed(2) : 0,
      },
    };
  } catch (error) {
    console.error('제안 요청 통계 조회 오류:', error);
    throw new Error('제안 요청 통계 조회에 실패했습니다');
  }
};

const getRecentActivities = async (limit = 10) => {
  try {
    const [recentUsers, recentOptions, recentProposals] = await Promise.all([
      UserModel.findAll({}, { limit: Math.floor(limit / 3), sort: { created_at: -1 } }),
      OptionModel.findAll({}, { limit: Math.floor(limit / 3), sort: { created_at: -1 } }),
      ProposalRequestModel.findAll({}, { limit: Math.floor(limit / 3), sort: { created_at: -1 } }),
    ]);

    const activitiesPromises = [
      ...recentUsers.map(async (u) => ({
        type: 'user_signup',
        description: `${u.name}(${u.email}) 가입`,
        timestamp: u.created_at,
      })),
      ...(await Promise.all(
        recentOptions.map(async (o) => {
          const creator = await UserModel.findById(o.creator_id.toString());
          return {
            type: 'option_created',
            description: `${creator?.name || '알 수 없음'}이 "${o.name}" 옵션 등록`,
            timestamp: o.created_at,
          };
        })
      )),
      ...(await Promise.all(
        recentProposals.map(async (p) => {
          const requester = await UserModel.findById(p.requester_id.toString());
          return {
            type: 'proposal_created',
            description: `${requester?.name || '알 수 없음'}이 "${p.company_name}" 제안 요청`,
            timestamp: p.created_at,
          };
        })
      )),
    ];

    const activities = await Promise.all(activitiesPromises);

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    throw new Error('최근 활동 조회에 실패했습니다');
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyStats,
  getBrandStats,
  getOptionStats,
  getProposalStats,
  getRecentActivities,
};
