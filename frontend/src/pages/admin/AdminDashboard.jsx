import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchUsageData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getActivities()
      ]);

      setStats(statsRes.data.stats);
      setActivities({
        activities: activitiesRes.data.activities,
        recentOptions: activitiesRes.data.recentOptions,
        recentDeleteRequests: activitiesRes.data.recentDeleteRequests,
      });
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      const response = await adminAPI.getUsageStats();
      setUsageData(response.data.usage);
    } catch (error) {
      console.error('사용량 데이터 조회 실패:', error);
      // 기본값 설정
      setUsageData({
        cloudinary: {
          credits: { used: 0, limit: 25, unit: 'credits' },
          storage: { used: 0, limit: 25, unit: 'GB' },
          bandwidth: { used: 0, limit: 25, unit: 'GB' }
        },
        mongodb: {
          storage: { used: 0, limit: 512, unit: 'MB' },
          documents: { count: 0 }
        },
        railway: {
          credit: { used: 0, limit: 5, unit: 'USD' },
          note: 'Railway API 미지원'
        },
        vercel: {
          bandwidth: { used: 0, limit: 100, unit: 'GB' },
          note: 'Vercel API 미지원'
        }
      });
    } finally {
      setUsageLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 사용량 퍼센트 계산
  const calculatePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  // 사용량 바 색상 결정
  const getUsageBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>

        {/* 주요 통계 카드 - 클릭 가능 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* 총 브랜드 */}
          <Link
            to="/admin/brands"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">총 브랜드</p>
                <p className="text-2xl font-bold text-blue-600 hover:underline">{stats?.brands?.total || 0}</p>
              </div>
            </div>
          </Link>

          {/* 총 지점 */}
          <Link
            to="/admin/branches"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">총 지점</p>
                <p className="text-2xl font-bold text-green-600 hover:underline">{stats?.branches?.total || 0}</p>
              </div>
            </div>
          </Link>

          {/* 총 옵션 */}
          <Link
            to="/"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">총 옵션</p>
                <p className="text-2xl font-bold text-purple-600 hover:underline">{stats?.options?.total || 0}</p>
              </div>
            </div>
          </Link>

          {/* 활성 사용자 */}
          <Link
            to="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">활성 사용자</p>
                <p className="text-2xl font-bold text-yellow-600 hover:underline">{stats?.users?.total || 0}</p>
              </div>
            </div>
          </Link>

          {/* 삭제 요청 */}
          <Link
            to="/admin/delete-requests"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">삭제 요청</p>
                <p className="text-2xl font-bold text-red-600 hover:underline">{stats?.deleteRequests?.pending || 0}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 서비스 사용량 현황 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            서비스 사용량 현황
          </h2>

          {usageLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Cloudinary */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium">Cloudinary</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">무료</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">스토리지</span>
                      <span className="font-medium">
                        {usageData?.cloudinary?.storage?.used || 0} / {usageData?.cloudinary?.storage?.limit || 25} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageBarColor(calculatePercentage(usageData?.cloudinary?.storage?.used, usageData?.cloudinary?.storage?.limit))}`}
                        style={{ width: `${calculatePercentage(usageData?.cloudinary?.storage?.used, usageData?.cloudinary?.storage?.limit)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">크레딧</span>
                      <span className="font-medium">
                        {usageData?.cloudinary?.credits?.used || 0} / {usageData?.cloudinary?.credits?.limit || 25}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUsageBarColor(calculatePercentage(usageData?.cloudinary?.credits?.used, usageData?.cloudinary?.credits?.limit))}`}
                        style={{ width: `${calculatePercentage(usageData?.cloudinary?.credits?.used, usageData?.cloudinary?.credits?.limit)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MongoDB Atlas */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <span className="font-medium">MongoDB</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">무료</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">데이터</span>
                    <span className="font-medium">
                      {usageData?.mongodb?.storage?.used || 0} / {usageData?.mongodb?.storage?.limit || 512} MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getUsageBarColor(calculatePercentage(usageData?.mongodb?.storage?.used, usageData?.mongodb?.storage?.limit))}`}
                      style={{ width: `${calculatePercentage(usageData?.mongodb?.storage?.used, usageData?.mongodb?.storage?.limit)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    문서 수: {usageData?.mongodb?.documents?.count?.toLocaleString() || 0}개
                  </p>
                </div>
              </div>

              {/* Railway */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                      </svg>
                    </div>
                    <span className="font-medium">Railway</span>
                  </div>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Hobby</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">월 사용량</span>
                    <span className="font-medium">
                      ${usageData?.railway?.credit?.used || 0} / ${usageData?.railway?.credit?.limit || 5}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getUsageBarColor(calculatePercentage(usageData?.railway?.credit?.used, usageData?.railway?.credit?.limit))}`}
                      style={{ width: `${calculatePercentage(usageData?.railway?.credit?.used, usageData?.railway?.credit?.limit)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {usageData?.railway?.note || '월 $5 크레딧 (Hobby Plan)'}
                  </p>
                </div>
              </div>

              {/* Vercel */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 22.525H0l12-21.05 12 21.05z" />
                      </svg>
                    </div>
                    <span className="font-medium">Vercel</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">무료</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">대역폭</span>
                    <span className="font-medium">
                      {usageData?.vercel?.bandwidth?.used || 0} / {usageData?.vercel?.bandwidth?.limit || 100} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getUsageBarColor(calculatePercentage(usageData?.vercel?.bandwidth?.used, usageData?.vercel?.bandwidth?.limit))}`}
                      style={{ width: `${calculatePercentage(usageData?.vercel?.bandwidth?.used, usageData?.vercel?.bandwidth?.limit)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {usageData?.vercel?.note || 'Hobby Plan (월 100GB)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 등록 옵션 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">최근 등록 옵션</h2>
            <div className="space-y-3">
              {activities?.recentOptions && activities.recentOptions.length > 0 ? (
                activities.recentOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`/options/${option.id}`)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <p className="font-medium">{option.option_name || option.name}</p>
                    <p className="text-sm text-gray-600">
                      {option.branch?.brand?.name} - {option.branch?.name || option.branch?.branch_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(option.created_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">최근 등록 옵션이 없습니다</p>
              )}
            </div>
          </div>

          {/* 최근 삭제 요청 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">최근 삭제 요청</h2>
              {(stats?.deleteRequests?.pending || 0) > 0 && (
                <span className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded-full font-medium">
                  {stats.deleteRequests.pending}건 대기
                </span>
              )}
            </div>
            <div className="space-y-3">
              {activities?.recentDeleteRequests && activities.recentDeleteRequests.length > 0 ? (
                activities.recentDeleteRequests.map((request, index) => (
                  <div
                    key={index}
                    onClick={() => navigate('/admin/delete-requests')}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{request.option?.name || request.option?.option_name}</p>
                        <p className="text-sm text-gray-600">{request.requester?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(request.request_at || request.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? '대기중' :
                         request.status === 'approved' ? '승인' : '거부'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">최근 삭제 요청이 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <button
            onClick={() => navigate('/admin/brands')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="font-medium">브랜드 관리</p>
          </button>

          <button
            onClick={() => navigate('/admin/managers')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="font-medium">매니저 관리</p>
          </button>

          <button
            onClick={() => navigate('/admin/branches')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-center"
          >
            <svg className="w-8 h-8 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-medium">지점 관리</p>
          </button>

          <button
            onClick={() => navigate('/admin/delete-requests')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-center relative"
          >
            {(stats?.deleteRequests?.pending || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {stats.deleteRequests.pending}
              </span>
            )}
            <svg className="w-8 h-8 mx-auto mb-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p className="font-medium">삭제 요청 관리</p>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
