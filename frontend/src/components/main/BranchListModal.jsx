import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { branchAPI } from '../../services/api';

const BranchListModal = ({ isOpen, onClose, onFilterChange }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await branchAPI.getAll();
      // API 응답: { success: true, branches: [...] }
      const branchesArray = response.data?.branches || [];
      setBranches(Array.isArray(branchesArray) ? branchesArray : []);
    } catch (error) {
      console.error('지점 목록 조회 실패:', error);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (branchId) => {
    const newSelected = selectedBranches.includes(branchId)
      ? selectedBranches.filter((id) => id !== branchId)
      : [...selectedBranches, branchId];
    setSelectedBranches(newSelected);
  };

  const handleApply = () => {
    onFilterChange({ branches: selectedBranches });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="지점 선택"
      size="md"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">지점이 없습니다</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {branches.map((branch) => (
              <label
                key={branch.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBranches.includes(branch.id)}
                  onChange={() => handleToggle(branch.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <div className="text-gray-900 font-medium">{branch.name}</div>
                  <div className="text-sm text-gray-500">{branch.address}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => {
              setSelectedBranches([]);
              onClose();
            }}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            적용
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BranchListModal;
