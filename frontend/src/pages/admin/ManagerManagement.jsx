import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Button, Modal, Table } from '../../components/common';
import { managerAPI, brandAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const ManagerManagement = () => {
  const { success, error, warning } = useToast();
  const [managers, setManagers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [editManager, setEditManager] = useState(null);
  const [newManager, setNewManager] = useState({
    brand_id: '',
    name: '',
    position: '',
    email: '',
    cc_email: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchManagers();
    fetchBrands();
  }, []);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await managerAPI.getAll();
      console.log('매니저 API 응답:', response.data);
      // API 응답: { success: true, managers: [...] }
      const managersArray = response.data?.managers || [];
      setManagers(Array.isArray(managersArray) ? managersArray : []);
    } catch (err) {
      console.error('매니저 목록 조회 실패:', err);
      console.error('에러 상세:', err.response?.data);
      error(err.response?.data?.message || '매니저 목록을 불러오는데 실패했습니다');
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll({ status: 'active' });
      const brandsArray = response.data?.brands || [];
      setBrands(Array.isArray(brandsArray) ? brandsArray : []);
    } catch (err) {
      console.error('브랜드 목록 조회 실패:', err);
    }
  };

  const handleAddManager = async () => {
    if (!newManager.brand_id || !newManager.email) {
      warning('브랜드와 이메일은 필수 항목입니다');
      return;
    }

    setSubmitting(true);
    try {
      await managerAPI.create(newManager);
      success('매니저가 등록되었습니다');
      setShowAddModal(false);
      setNewManager({
        brand_id: '',
        name: '',
        position: '',
        email: '',
        cc_email: '',
        phone: '',
      });
      fetchManagers();
    } catch (err) {
      console.error('매니저 등록 실패:', err);
      error(err.response?.data?.message || '매니저 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (manager) => {
    setSelectedManager(manager);
    // brand_id는 brand 객체에서 가져오거나, manager.brand_id 사용
    const brandId = manager.brand?.id || manager.brand?._id || manager.brand_id;
    setEditManager({
      brand_id: brandId ? String(brandId) : '',
      name: manager.name || '',
      position: manager.position || '',
      email: manager.email || '',
      cc_email: manager.cc_email || '',
      phone: manager.phone || '',
    });
    setShowEditModal(true);
    setIsEditingMode(false);
  };

  // 원본 데이터와 현재 편집 데이터 비교하여 변경사항 확인
  const hasChanges = () => {
    if (!selectedManager || !editManager || !isEditingMode) return false;
    const originalBrandId = selectedManager.brand?.id || selectedManager.brand?._id || selectedManager.brand_id;
    return (
      String(editManager.brand_id) !== String(originalBrandId || '') ||
      editManager.name !== (selectedManager.name || '') ||
      editManager.position !== (selectedManager.position || '') ||
      editManager.email !== (selectedManager.email || '') ||
      editManager.cc_email !== (selectedManager.cc_email || '') ||
      editManager.phone !== (selectedManager.phone || '')
    );
  };

  const handleEditManager = async () => {
    if (!editManager.brand_id || !editManager.email) {
      warning('브랜드와 이메일은 필수 항목입니다');
      return;
    }

    setSubmitting(true);
    try {
      await managerAPI.update(selectedManager.id, editManager);
      success('매니저 정보가 수정되었습니다');
      setShowEditModal(false);
      setSelectedManager(null);
      setEditManager(null);
      setIsEditingMode(false);
      fetchManagers();
    } catch (err) {
      console.error('매니저 수정 실패:', err);
      error(err.response?.data?.message || '매니저 수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!window.confirm('정말 이 매니저를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await managerAPI.delete(managerId);
      success('매니저가 삭제되었습니다');
      setShowEditModal(false);
      setSelectedManager(null);
      setEditManager(null);
      fetchManagers();
    } catch (err) {
      console.error('매니저 삭제 실패:', err);
      error(err.response?.data?.message || '매니저 삭제에 실패했습니다');
    }
  };

  // 검색 필터링
  const filteredManagers = managers.filter((manager) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      manager.name?.toLowerCase().includes(query) ||
      manager.position?.toLowerCase().includes(query) ||
      manager.email?.toLowerCase().includes(query) ||
      manager.phone?.toLowerCase().includes(query) ||
      manager.brand?.name?.toLowerCase().includes(query)
    );
  });

  const columns = [
    {
      header: '이름',
      accessor: 'name',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      header: '직책',
      accessor: 'position',
      render: (row) => <span className="text-gray-600">{row.position}</span>,
    },
    {
      header: '브랜드',
      accessor: 'brand',
      render: (row) => (
        <span className="text-gray-600">{row.brand?.name || '-'}</span>
      ),
    },
    {
      header: '이메일',
      accessor: 'email',
      render: (row) => <span className="text-gray-600">{row.email}</span>,
    },
    {
      header: '전화번호',
      accessor: 'phone',
      render: (row) => <span className="text-gray-600">{row.phone}</span>,
    },
    {
      header: '등록일',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      header: '작업',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(row);
            }}
            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            상세
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteManager(row.id);
            }}
            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매니저 관리</h1>
            <p className="text-sm text-gray-500 mt-1">매니저를 추가하고 관리할 수 있습니다</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddModal(true)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            매니저 추가
          </Button>
        </div>

        {/* 검색 바 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="이름, 직책, 이메일, 전화번호, 브랜드로 검색..."
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

        {/* 매니저 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table
              columns={columns}
              data={filteredManagers}
              loading={loading}
              emptyMessage={searchQuery ? "검색 결과가 없습니다" : "등록된 매니저가 없습니다"}
              onRowClick={handleRowClick}
            />
          </div>
        )}

        {/* 매니저 추가 모달 */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setNewManager({
              brand_id: '',
              name: '',
              position: '',
              email: '',
              cc_email: '',
              phone: '',
            });
          }}
          title="매니저 추가"
          size="6xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드 <span className="text-red-500">*</span>
              </label>
              <select
                value={newManager.brand_id}
                onChange={(e) => setNewManager({ ...newManager, brand_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">브랜드를 선택하세요</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                value={newManager.name}
                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                placeholder="이름을 입력하세요 (선택)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직책
              </label>
              <input
                type="text"
                value={newManager.position}
                onChange={(e) => setNewManager({ ...newManager, position: e.target.value })}
                placeholder="직책을 입력하세요 (선택)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="이메일을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 이메일
              </label>
              <input
                type="email"
                value={newManager.cc_email}
                onChange={(e) => setNewManager({ ...newManager, cc_email: e.target.value })}
                placeholder="참조 이메일을 입력하세요 (선택)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                value={newManager.phone}
                onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                placeholder="010-1234-5678 (선택)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowAddModal(false);
                  setNewManager({
                    brand_id: '',
                    name: '',
                    position: '',
                    email: '',
                    cc_email: '',
                    phone: '',
                  });
                }}
                disabled={submitting}
              >
                취소
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddManager}
                disabled={submitting || !newManager.brand_id || !newManager.email}
                loading={submitting}
              >
                등록
              </Button>
            </div>
          </div>
        </Modal>

        {/* 매니저 상세/수정 모달 */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedManager(null);
            setEditManager(null);
            setIsEditingMode(false);
          }}
          title={isEditingMode ? "매니저 수정" : "매니저 상세"}
          size="6xl"
          preventClose={hasChanges()}
          preventCloseMessage="수정 중인 내용이 있습니다. 정말 닫으시겠습니까?"
        >
          {selectedManager && editManager && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  브랜드 <span className="text-red-500">*</span>
                </label>
                {isEditingMode ? (
                  <select
                    value={editManager.brand_id || ''}
                    onChange={(e) => setEditManager({ ...editManager, brand_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">브랜드를 선택하세요</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={String(brand.id)}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.brand?.name || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                {isEditingMode ? (
                  <input
                    type="text"
                    value={editManager.name}
                    onChange={(e) => setEditManager({ ...editManager, name: e.target.value })}
                    placeholder="이름을 입력하세요 (선택)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.name || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직책
                </label>
                {isEditingMode ? (
                  <input
                    type="text"
                    value={editManager.position}
                    onChange={(e) => setEditManager({ ...editManager, position: e.target.value })}
                    placeholder="직책을 입력하세요 (선택)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.position || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                {isEditingMode ? (
                  <input
                    type="email"
                    value={editManager.email}
                    onChange={(e) => setEditManager({ ...editManager, email: e.target.value })}
                    placeholder="이메일을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참조 이메일
                </label>
                {isEditingMode ? (
                  <input
                    type="email"
                    value={editManager.cc_email}
                    onChange={(e) => setEditManager({ ...editManager, cc_email: e.target.value })}
                    placeholder="참조 이메일을 입력하세요 (선택)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.cc_email || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                {isEditingMode ? (
                  <input
                    type="tel"
                    value={editManager.phone}
                    onChange={(e) => setEditManager({ ...editManager, phone: e.target.value })}
                    placeholder="010-1234-5678 (선택)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {selectedManager.phone || '-'}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {isEditingMode ? (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setIsEditingMode(false);
                        const brandId = selectedManager.brand?.id || selectedManager.brand?._id || selectedManager.brand_id;
                        setEditManager({
                          brand_id: brandId ? String(brandId) : '',
                          name: selectedManager.name || '',
                          position: selectedManager.position || '',
                          email: selectedManager.email || '',
                          cc_email: selectedManager.cc_email || '',
                          phone: selectedManager.phone || '',
                        });
                      }}
                      disabled={submitting}
                    >
                      취소
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleEditManager}
                      disabled={submitting || !editManager.brand_id || !editManager.email}
                      loading={submitting}
                    >
                      저장
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => setShowEditModal(false)}
                    >
                      닫기
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteManager(selectedManager.id)}
                    >
                      삭제
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => setIsEditingMode(true)}
                    >
                      수정
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default ManagerManagement;

