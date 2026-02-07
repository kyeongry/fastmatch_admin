import { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { Button, Modal, Table } from '../../components/common';
import { brandAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const BrandManagement = () => {
  const { success, error, warning } = useToast();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', alias: '', default_email: '', status: 'active' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await brandAPI.getAll();
      const brandsArray = response.data?.brands || [];
      setBrands(Array.isArray(brandsArray) ? brandsArray : []);
    } catch (err) {
      console.error('브랜드 목록 조회 실패:', err);
      error('브랜드 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      warning('브랜드명을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        await brandAPI.update(editingId, {
          name: formData.name.trim(),
          alias: formData.alias.trim(),
          default_email: formData.default_email.trim(),
          status: formData.status
        });
        success('브랜드가 수정되었습니다');
      } else {
        await brandAPI.create({
          name: formData.name.trim(),
          alias: formData.alias.trim(),
          default_email: formData.default_email.trim(),
          status: formData.status
        });
        success('브랜드가 등록되었습니다');
      }
      setIsModalOpen(false);
      fetchBrands();
      setFormData({ name: '', alias: '', default_email: '', status: 'active' });
      setIsEditMode(false);
      setEditingId(null);
    } catch (err) {
      console.error('브랜드 저장 실패:', err);
      error(err.response?.data?.message || (isEditMode ? '브랜드 수정 실패' : '브랜드 등록 실패'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name,
      alias: brand.alias || '',
      default_email: brand.default_email || '',
      status: brand.status
    });
    setEditingId(brand.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await brandAPI.delete(id);
      success('브랜드가 삭제되었습니다');
      fetchBrands();
    } catch (err) {
      console.error('브랜드 삭제 실패:', err);
      error(err.response?.data?.message || '브랜드 삭제 실패');
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', alias: '', default_email: '', status: 'active' });
    setIsEditMode(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (brandId, newStatus) => {
    try {
      await brandAPI.update(brandId, { status: newStatus });
      success('브랜드 상태가 변경되었습니다');
      fetchBrands();
    } catch (err) {
      console.error('브랜드 상태 변경 실패:', err);
      error('브랜드 상태 변경에 실패했습니다');
    }
  };

  const columns = [
    {
      header: '브랜드명',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.alias && <div className="text-xs text-gray-500">({row.alias})</div>}
        </div>
      ),
    },
    {
      header: '상태',
      accessor: 'status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      ),
    },
    {
      header: '기본 이메일',
      accessor: 'default_email',
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {row.default_email || <span className="text-gray-400">-</span>}
        </span>
      ),
    },
    {
      header: '매니저 수',
      accessor: 'managers_count',
      render: (row) => <span className="text-gray-600">{row.managers_count || 0}</span>,
    },
    {
      header: '지점 수',
      accessor: 'branches_count',
      render: (row) => <span className="text-gray-600">{row.branches_count || 0}</span>,
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
      header: '관리',
      accessor: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            수정
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">브랜드 관리</h1>
            <p className="text-sm text-gray-500 mt-1">브랜드를 추가하고 관리할 수 있습니다</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            브랜드 추가
          </Button>
        </div>

        {/* 브랜드 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table
              columns={columns}
              data={brands}
              loading={loading}
              emptyMessage="등록된 브랜드가 없습니다"
            />
          </div>
        )}

        {/* 브랜드 등록/수정 모달 */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setFormData({ name: '', alias: '', default_email: '', status: 'active' });
          }}
          title={isEditMode ? "브랜드 수정" : "브랜드 등록"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                브랜드명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 패스트파이브"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                약칭 (Alias)
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: F (알파벳 한 글자)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기본 이메일
              </label>
              <input
                type="email"
                value={formData.default_email}
                onChange={(e) => setFormData({ ...formData, default_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="담당자가 없을 때 사용할 이메일"
              />
              <p className="text-xs text-gray-500 mt-1">담당자가 지정되지 않은 경우 이 이메일로 제안요청이 발송됩니다.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={submitting}
              >
                {isEditMode ? '수정' : '등록'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default BrandManagement;
