import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { Button, Modal, Table } from '../../components/common';
import { deleteRequestAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const DeleteRequestManagement = () => {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeleteRequests();
  }, []);

  const fetchDeleteRequests = async () => {
    setLoading(true);
    try {
      // 삭제요청된 옵션만 조회 (status가 pending인 것만)
      const response = await deleteRequestAPI.getAll({ status: 'pending' });
      console.log('삭제요청 API 응답:', response.data);
      // API 응답: { success: true, requests: [...], total, page, pageSize }
      const requestsArray = response.data?.requests || [];
      // 옵션이 있는 요청만 필터링 (삭제요청된 옵션만)
      const validRequests = Array.isArray(requestsArray)
        ? requestsArray.filter((req) => req && req.option)
        : [];
      setRequests(validRequests);
    } catch (err) {
      console.error('삭제요청 목록 조회 실패:', err);
      console.error('에러 상세:', err.response?.data);
      error(err.response?.data?.message || '삭제요청 목록을 불러오는데 실패했습니다');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await deleteRequestAPI.approve(selectedRequest.id);
      success('삭제 요청이 승인되었습니다');
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchDeleteRequests();
    } catch (err) {
      console.error('삭제요청 승인 실패:', err);
      error(err.response?.data?.message || '삭제요청 승인에 실패했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      warning('거부 사유를 입력해주세요');
      return;
    }

    setProcessing(true);
    try {
      await deleteRequestAPI.reject(selectedRequest.id, { reason: rejectReason });
      success('삭제 요청이 거부되었습니다');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchDeleteRequests();
    } catch (err) {
      console.error('삭제요청 거부 실패:', err);
      error(err.response?.data?.message || '삭제요청 거부에 실패했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      header: '요청일시',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-gray-600 text-sm">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: '옵션명',
      accessor: 'option',
      render: (row) => (
        <div>
          <span className="font-medium text-gray-900">{row.option?.name || '-'}</span>
          {row.option?.branch?.brand?.name && (
            <span className="text-xs text-gray-500 ml-2">
              ({row.option.branch.brand.name} {row.option.branch?.name})
            </span>
          )}
        </div>
      ),
    },
    {
      header: '요청자',
      accessor: 'requester',
      render: (row) => (
        <span className="text-gray-600">{row.requester?.name || '-'}</span>
      ),
    },
    {
      header: '요청 사유',
      accessor: 'request_reason',
      render: (row) => (
        <span className="text-gray-600 text-sm max-w-xs truncate block" title={row.request_reason}>
          {row.request_reason || '-'}
        </span>
      ),
    },
    {
      header: '상태',
      accessor: 'status',
      render: (row) => {
        const statusMap = {
          pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
          approved: { label: '승인', color: 'bg-green-100 text-green-700' },
          rejected: { label: '거부', color: 'bg-red-100 text-red-700' },
        };
        const status = statusMap[row.status] || { label: row.status, color: 'bg-gray-100 text-gray-700' };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      header: '작업',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedRequest(row);
              setShowApproveModal(true);
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-medium"
            disabled={row.status !== 'pending'}
          >
            승인
          </button>
          <button
            onClick={() => {
              setSelectedRequest(row);
              setShowRejectModal(true);
            }}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium"
            disabled={row.status !== 'pending'}
          >
            거부
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">삭제요청 관리</h1>
          <p className="text-sm text-gray-500 mt-1">삭제요청된 옵션을 검토하고 승인/거부할 수 있습니다</p>
        </div>

        {/* 삭제요청 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table
              columns={columns}
              data={requests}
              loading={loading}
              emptyMessage="삭제요청된 옵션이 없습니다"
            />
          </div>
        )}

        {/* 승인 확인 모달 */}
        <Modal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          title="삭제 요청 승인"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                이 옵션을 삭제하시겠습니까? 승인하면 옵션이 삭제 상태로 변경됩니다.
              </p>
            </div>
            {selectedRequest && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">옵션명:</span>{' '}
                  <span className="text-gray-600">{selectedRequest.option?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">요청자:</span>{' '}
                  <span className="text-gray-600">{selectedRequest.requester?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">요청 사유:</span>{' '}
                  <span className="text-gray-600">{selectedRequest.request_reason}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                }}
                disabled={processing}
              >
                취소
              </Button>
              <Button
                variant="success"
                fullWidth
                onClick={handleApprove}
                disabled={processing}
                loading={processing}
              >
                승인
              </Button>
            </div>
          </div>
        </Modal>

        {/* 거부 모달 */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedRequest(null);
          }}
          title="삭제 요청 거부"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                삭제 요청을 거부하면 옵션이 활성 상태로 복구됩니다.
              </p>
            </div>
            {selectedRequest && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">옵션명:</span>{' '}
                  <span className="text-gray-600">{selectedRequest.option?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">요청자:</span>{' '}
                  <span className="text-gray-600">{selectedRequest.requester?.name}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거부 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거부 사유를 입력해주세요..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequest(null);
                }}
                disabled={processing}
              >
                취소
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                loading={processing}
              >
                거부
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default DeleteRequestManagement;






