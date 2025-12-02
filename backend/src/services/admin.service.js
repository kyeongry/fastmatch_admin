const BrandModel = require('../models/brand.mongodb');
const ManagerModel = require('../models/manager.mongodb');
const BranchModel = require('../models/branch.mongodb');
const OptionModel = require('../models/option.mongodb');
const UserModel = require('../models/user.mongodb');
const ProposalRequestModel = require('../models/proposalRequest.mongodb');
const ProposalSendHistoryModel = require('../models/proposalSendHistory.mongodb');
const DeleteRequestModel = require('../models/deleteRequest.mongodb');
const cloudinary = require('cloudinary').v2;
const { getDatabase } = require('../config/mongodb');

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
    const [recentUsers, recentOptions, recentProposals, recentDeleteRequests] = await Promise.all([
      UserModel.findAll({}, { limit: Math.floor(limit / 3), sort: { created_at: -1 } }),
      OptionModel.findAll({}, { limit: 5, sort: { created_at: -1 } }),
      ProposalRequestModel.findAll({}, { limit: Math.floor(limit / 3), sort: { created_at: -1 } }),
      DeleteRequestModel.findAll({ status: 'pending' }, { limit: 5, sort: { request_at: -1 } }),
    ]);

    // 최근 옵션에 branch 정보 추가
    const populatedOptions = await Promise.all(
      recentOptions.map(async (option) => {
        try {
          const branchId = option.branch_id?.toString();
          if (!branchId) return { ...option, id: option._id.toString(), branch: null };

          const branch = await BranchModel.findById(branchId);
          let brand = null;
          if (branch && branch.brand_id) {
            brand = await BrandModel.findById(branch.brand_id.toString());
          }

          return {
            ...option,
            id: option._id.toString(),
            branch: branch ? {
              ...branch,
              id: branch._id.toString(),
              brand: brand ? { ...brand, id: brand._id.toString() } : null,
            } : null,
          };
        } catch (err) {
          console.error('옵션 populate 오류:', err);
          return { ...option, id: option._id.toString(), branch: null };
        }
      })
    );

    // 최근 삭제 요청에 옵션/요청자 정보 추가
    const populatedDeleteRequests = await Promise.all(
      recentDeleteRequests.map(async (request) => {
        try {
          const optionId = request.option_id?.toString();
          const requesterId = request.requester_id?.toString();

          const [option, requester] = await Promise.all([
            optionId ? OptionModel.findById(optionId) : null,
            requesterId ? UserModel.findById(requesterId) : null,
          ]);

          return {
            ...request,
            id: request._id.toString(),
            option: option ? {
              ...option,
              id: option._id.toString(),
              name: option.name || option.option_name,
            } : null,
            requester: requester ? {
              id: requester._id.toString(),
              name: requester.name,
            } : null,
          };
        } catch (err) {
          console.error('삭제 요청 populate 오류:', err);
          return null;
        }
      })
    );

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

    return {
      activities: activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit),
      recentOptions: populatedOptions,
      recentDeleteRequests: populatedDeleteRequests.filter(r => r !== null),
    };
  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    throw new Error('최근 활동 조회에 실패했습니다');
  }
};

const getUsageStats = async () => {
  try {
    // Cloudinary 사용량 조회 (무료: 25 Credits/month, 25GB storage)
    let cloudinaryUsage = {
      credits: { used: 0, limit: 25, unit: 'credits' },
      storage: { used: 0, limit: 25, unit: 'GB' },
      bandwidth: { used: 0, limit: 25, unit: 'GB' },
    };

    try {
      const cloudinaryResult = await cloudinary.api.usage();
      cloudinaryUsage = {
        credits: {
          used: parseFloat((cloudinaryResult.credits?.usage || 0).toFixed(2)),
          limit: cloudinaryResult.credits?.limit || 25,
          unit: 'credits',
        },
        storage: {
          used: parseFloat(((cloudinaryResult.storage?.usage || 0) / (1024 * 1024 * 1024)).toFixed(2)),
          limit: 25,
          unit: 'GB',
        },
        bandwidth: {
          used: parseFloat(((cloudinaryResult.bandwidth?.usage || 0) / (1024 * 1024 * 1024)).toFixed(2)),
          limit: 25,
          unit: 'GB',
        },
      };
    } catch (err) {
      console.error('Cloudinary 사용량 조회 실패:', err.message);
    }

    // MongoDB 사용량 조회 (무료: 512MB storage)
    let mongodbUsage = {
      storage: { used: 0, limit: 512, unit: 'MB' },
      documents: { count: 0 },
    };

    try {
      const db = await getDatabase();
      if (db) {
        const stats = await db.stats();
        mongodbUsage = {
          storage: {
            used: parseFloat((stats.dataSize / (1024 * 1024)).toFixed(2)),
            limit: 512,
            unit: 'MB',
          },
          documents: {
            count: stats.objects || 0,
          },
        };
      }
    } catch (err) {
      console.error('MongoDB 사용량 조회 실패:', err.message);
    }

    // Railway 사용량 (Hobby: $5/month credit, 실제 API 없으므로 예상값)
    const railwayUsage = {
      credit: { used: 0, limit: 5, unit: 'USD' },
      note: 'Railway API 미지원 - 대시보드에서 확인하세요',
    };

    // Vercel 사용량 (무료: 100GB bandwidth, 실제 API 없으므로 예상값)
    const vercelUsage = {
      bandwidth: { used: 0, limit: 100, unit: 'GB' },
      note: 'Vercel API 미지원 - 대시보드에서 확인하세요',
    };

    return {
      cloudinary: cloudinaryUsage,
      mongodb: mongodbUsage,
      railway: railwayUsage,
      vercel: vercelUsage,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('서비스 사용량 조회 오류:', error);
    throw new Error('서비스 사용량 조회에 실패했습니다');
  }
};

// 사용자 목록 조회
const getUsers = async (filters = {}) => {
  try {
    const { page = 1, pageSize = 20, search, status } = filters;
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const users = await UserModel.findAll(filter, { skip, limit: pageSize, sort: { created_at: -1 } });
    const total = await UserModel.count(filter);

    // 검색 필터 적용 (search가 있는 경우)
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(search)
      );
    }

    return {
      users: filteredUsers.map(user => ({
        ...user,
        id: user._id.toString(),
      })),
      total: search ? filteredUsers.length : total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    throw new Error('사용자 목록 조회에 실패했습니다');
  }
};

// 사용자 상세 조회
const getUserById = async (id) => {
  try {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 사용자가 등록한 옵션 수 조회
    const optionsCount = await OptionModel.count({ creator_id: user._id });

    return {
      ...user,
      id: user._id.toString(),
      optionsCount,
    };
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    throw error;
  }
};

// 사용자 정보 업데이트 (관리자 권한 부여 등)
const updateUser = async (id, updateData) => {
  try {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const updatedUser = await UserModel.updateById(id, updateData);
    return {
      ...updatedUser,
      id: updatedUser._id.toString(),
    };
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    throw error;
  }
};

module.exports = {
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
};
