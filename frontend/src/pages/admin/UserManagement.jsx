import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Button, Modal, Table } from '../../components/common';
import { adminAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const UserManagement = () => {
  const { success, error, warning } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setUsers(response.data?.users || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      error(err.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (user) => {
    try {
      const response = await adminAPI.getUserById(user.id);
      setSelectedUser(response.data.user);
      setShowDetailModal(true);
    } catch (err) {
      console.error('사용자 상세 조회 실패:', err);
      error('사용자 정보를 불러오는데 실패했습니다');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`이 사용자의 권한을 "${newRole === 'admin' ? '관리자' : '일반 사용자'}"로 변경하시겠습니까?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      success('사용자 권한이 변경되었습니다');
      setSelectedUser(prev => ({ ...prev, role: newRole }));
      fetchUsers();
    } catch (err) {
      console.error('권한 변경 실패:', err);
      error(err.response?.data?.message || '권한 변경에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    const statusText = newStatus === 'active' ? '활성화' : '비활성화';
    if (!window.confirm(`이 사용자를 ${statusText}하시겠습니까?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.updateUser(userId, { status: newStatus });
      success(`사용자가 ${statusText}되었습니다`);
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
      fetchUsers();
    } catch (err) {
      console.error('상태 변경 실패:', err);
      error(err.response?.data?.message || '상태 변경에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAffiliation = async (userId, newAffiliation) => {
    const affiliationText = newAffiliation === 'in-house' ? 'In-house' : 'Partner';
    if (!window.confirm(`이 사용자의 소속을 "${affiliationText}"로 변경하시겠습니까?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.updateUser(userId, { affiliation: newAffiliation });
      success(`사용자 소속이 ${affiliationText}로 변경되었습니다`);
      setSelectedUser(prev => ({ ...prev, affiliation: newAffiliation }));
      fetchUsers();
    } catch (err) {
      console.error('소속 변경 실패:', err);
      error(err.response?.data?.message || '소속 변경에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // 검색 필터링
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      header: '이름',
      accessor: 'name',
      render: (row) => <span className="font-medium text-gray-900">{row.name || '-'}</span>,
    },
    {
      header: '이메일',
      accessor: 'email',
      render: (row) => <span className="text-gray-600">{row.email}</span>,
    },
    {
      header: '전화번호',
      accessor: 'phone',
      render: (row) => <span className="text-gray-600">{row.phone || '-'}</span>,
    },
    {
      header: '소속',
      accessor: 'affiliation',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.affiliation === 'in-house'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {row.affiliation === 'in-house' ? 'In-house' : 'Partner'}
        </span>
      ),
    },
    {
      header: '권한',
      accessor: 'role',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.role === 'admin'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.role === 'admin' ? '관리자' : '일반'}
        </span>
      ),
    },
    {
      header: '상태',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          row.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {row.status === 'active' ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      header: '가입일',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      header: '최근 로그인',
      accessor: 'last_login',
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {row.last_login ? new Date(row.last_login).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      header: '작업',
      accessor: 'actions',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          상세
        </button>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              회원가입한 사용자를 관리하고 권한을 부여할 수 있습니다
            </p>
          </div>
          <div className="text-sm text-gray-500">
            총 {pagination.total}명의 사용자
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="이름, 이메일, 전화번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 사용자 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table
              columns={columns}
              data={filteredUsers}
              loading={loading}
              emptyMessage={searchQuery ? "검색 결과가 없습니다" : "등록된 사용자가 없습니다"}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center mt-6 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              이전
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              다음
            </Button>
          </div>
        )}

        {/* 사용자 상세 모달 */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
          title="사용자 상세 정보"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">이름</p>
                    <p className="font-medium">{selectedUser.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">전화번호</p>
                    <p className="font-medium">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">이메일 인증</p>
                    <p className={`font-medium ${selectedUser.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.email_verified ? '인증됨' : '미인증'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">계정 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">가입일</p>
                    <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">최근 로그인</p>
                    <p className="font-medium">{formatDate(selectedUser.last_login)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">등록한 옵션 수</p>
                    <p className="font-medium">{selectedUser.optionsCount || 0}개</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">현재 상태</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedUser.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 권한 관리 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">권한 관리</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">현재 권한</p>
                    <span className={`px-3 py-1.5 rounded text-sm font-medium ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedUser.role === 'admin' ? '관리자' : '일반 사용자'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {selectedUser.role !== 'admin' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        관리자 권한 부여
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateRole(selectedUser.id, 'user')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        일반 사용자로 변경
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 소속 관리 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">소속 관리</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">현재 소속</p>
                    <span className={`px-3 py-1.5 rounded text-sm font-medium ${
                      selectedUser.affiliation === 'in-house'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedUser.affiliation === 'in-house' ? 'In-house' : 'Partner'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {selectedUser.affiliation !== 'in-house' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateAffiliation(selectedUser.id, 'in-house')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        In-house로 변경
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateAffiliation(selectedUser.id, 'partner')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        Partner로 변경
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 계정 상태 관리 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">계정 상태</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedUser.status === 'active'
                      ? '이 사용자는 현재 활성 상태입니다.'
                      : '이 사용자는 현재 비활성 상태입니다.'}
                  </p>
                  <div className="flex gap-2">
                    {selectedUser.status === 'active' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedUser.id, 'inactive')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        비활성화
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedUser.id, 'active')}
                        disabled={submitting}
                        loading={submitting}
                      >
                        활성화
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUser(null);
                  }}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default UserManagement;
