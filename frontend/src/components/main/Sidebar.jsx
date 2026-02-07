import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import BrandListModal from './BrandListModal';
import BranchListModal from './BranchListModal';

const Sidebar = ({ onFilterChange }) => {
  const navigate = useNavigate();
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setIsBrandModalOpen(true)}
          className="px-4 py-2 bg-blue-50 text-primary-600 rounded-lg hover:bg-blue-100 font-medium transition text-sm md:text-base"
        >
          📋 브랜드
        </button>

        <button
          onClick={() => setIsBranchModalOpen(true)}
          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition text-sm md:text-base"
        >
          🏢 지점
        </button>

        <button
          onClick={() => navigate('/my-options')}
          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-medium transition text-sm md:text-base"
        >
          📝 옵션관리
        </button>
      </div>

      {/* 브랜드 목록 모달 */}
      <BrandListModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onFilterChange={onFilterChange}
      />

      {/* 지점 목록 모달 */}
      <BranchListModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onFilterChange={onFilterChange}
      />
    </>
  );
};

export default Sidebar;
