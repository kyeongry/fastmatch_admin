import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { brandAPI } from '../../services/api';

const BrandListModal = ({ isOpen, onClose, onFilterChange }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await brandAPI.getAll();
      // API 응답: { success: true, brands: [...] }
      const brandsArray = response.data?.brands || [];
      setBrands(Array.isArray(brandsArray) ? brandsArray : []);
    } catch (error) {
      console.error('브랜드 목록 조회 실패:', error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (brandId) => {
    const newSelected = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];
    setSelectedBrands(newSelected);
  };

  const handleApply = () => {
    onFilterChange({ brands: selectedBrands });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="브랜드 선택"
      size="md"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-gray-500">브랜드가 없습니다</div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => handleToggle(brand.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-gray-700">{brand.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => {
              setSelectedBrands([]);
              onClose();
            }}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            적용
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BrandListModal;
