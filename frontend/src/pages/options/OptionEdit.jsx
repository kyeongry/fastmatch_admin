import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { optionAPI, uploadAPI, brandAPI, branchAPI } from '../../services/api';
import { formatNumberInput, parseNumberInput } from '../../utils/formatters';

const OptionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newFee, setNewFee] = useState({ type: '', amount: '' });
  const [floorPlanFile, setFloorPlanFile] = useState(null);

  // 브랜드/지점 상태
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [focusedBrandIndex, setFocusedBrandIndex] = useState(-1);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState(-1);

  useEffect(() => {
    fetchBrands();
    fetchOption();
  }, [id]);

  useEffect(() => {
    if (formData?.brand_id) {
      fetchBranches();
    }
  }, [formData?.brand_id]);

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data.brands || []);
      setFilteredBrands(response.data.brands || []);
    } catch (error) {
      console.error('브랜드 조회 실패:', error);
    }
  };

  const fetchBranches = async () => {
    if (!formData?.brand_id) {
      setBranches([]);
      setFilteredBranches([]);
      return;
    }
    try {
      const response = await branchAPI.getAll({ brand_id: formData.brand_id });
      setBranches(response.data.branches || []);
      setFilteredBranches(response.data.branches || []);
    } catch (error) {
      console.error('지점 조회 실패:', error);
    }
  };

  const fetchOption = async () => {
    try {
      const response = await optionAPI.getById(id);
      const option = response.data.option;
      const brandId = option.branch?.brand?.id || option.branch?.brand?._id || '';
      const brandName = option.branch?.brand?.name || '';
      const branchName = option.branch?.name || '';

      setFormData({
        brand_id: brandId,
        branch_id: option.branch_id,
        name: option.name,
        category1: option.category1,
        category2: option.category2 || '',
        capacity: option.capacity,
        monthly_fee: option.monthly_fee,
        deposit: option.deposit,
        list_price: option.list_price || '',
        one_time_fees: option.one_time_fees || [],
        move_in_date_type: option.move_in_date_type,
        move_in_date_value: option.move_in_date_value || '',
        contract_period_type: option.contract_period_type,
        contract_period_value: option.contract_period_value || '',
        office_info: option.office_info || '',
        credits: option.credits || '',
        hvac_type: option.hvac_type || 'central',
        parking_type: option.parking_type || 'self_parking',
        memo: option.memo || '',
        floor_plan_url: option.floor_plan_url || '',
      });

      setBrandSearchQuery(brandName);
      setBranchSearchQuery(branchName);
    } catch (error) {
      console.error('옵션 조회 실패:', error);
      alert('옵션 정보를 불러올 수 없습니다');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // 브랜드 검색 핸들러
  const handleBrandSearch = (e) => {
    const query = e.target.value;
    setBrandSearchQuery(query);
    setShowBrandDropdown(true);
    setFocusedBrandIndex(-1);

    if (!query.trim()) {
      setFilteredBrands(brands);
      return;
    }

    const filtered = brands.filter(brand =>
      brand.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  const handleSelectBrand = (brand) => {
    setFormData({ ...formData, brand_id: String(brand.id), branch_id: '' });
    setBrandSearchQuery(brand.name);
    setBranchSearchQuery('');
    setShowBrandDropdown(false);
    setFocusedBrandIndex(-1);
  };

  // 지점 검색 핸들러
  const handleBranchSearch = (e) => {
    const query = e.target.value;
    setBranchSearchQuery(query);
    setShowBranchDropdown(true);
    setFocusedBranchIndex(-1);

    if (!query.trim()) {
      setFilteredBranches(branches);
      return;
    }

    const filtered = branches.filter(branch =>
      branch.name.toLowerCase().includes(query.toLowerCase()) ||
      (branch.address && branch.address.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredBranches(filtered);
  };

  const handleSelectBranch = (branch) => {
    setFormData({ ...formData, branch_id: String(branch.id) });
    setBranchSearchQuery(branch.name);
    setShowBranchDropdown(false);
    setFocusedBranchIndex(-1);
  };

  // 키보드 네비게이션 (브랜드)
  const handleBrandKeyDown = (e) => {
    if (!showBrandDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowBrandDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBrandIndex(prev => prev < filteredBrands.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBrandIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedBrandIndex >= 0 && focusedBrandIndex < filteredBrands.length) {
        handleSelectBrand(filteredBrands[focusedBrandIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowBrandDropdown(false);
    }
  };

  // 키보드 네비게이션 (지점)
  const handleBranchKeyDown = (e) => {
    if (!showBranchDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowBranchDropdown(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBranchIndex(prev => prev < filteredBranches.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBranchIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedBranchIndex >= 0 && focusedBranchIndex < filteredBranches.length) {
        handleSelectBranch(filteredBranches[focusedBranchIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowBranchDropdown(false);
    }
  };

  const handleAddFee = () => {
    if (newFee.type && newFee.amount) {
      setFormData((prev) => ({
        ...prev,
        one_time_fees: [
          ...prev.one_time_fees,
          { type: newFee.type, amount: parseFloat(newFee.amount) },
        ],
      }));
      setNewFee({ type: '', amount: '' });
    }
  };

  const handleRemoveFee = (index) => {
    setFormData((prev) => ({
      ...prev,
      one_time_fees: prev.one_time_fees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let floorPlanUrl = formData.floor_plan_url;

      if (floorPlanFile) {
        const uploadResponse = await uploadAPI.image(floorPlanFile);
        floorPlanUrl = uploadResponse.data.url;
      }

      const submitData = {
        ...formData,
        monthly_fee: parseFloat(formData.monthly_fee),
        deposit: parseFloat(formData.deposit),
        list_price: formData.list_price ? parseFloat(formData.list_price) : null,
        credits: formData.credits ? parseInt(formData.credits) : null,
        floor_plan_url: floorPlanUrl,
        one_time_fees: formData.one_time_fees,
      };

      await optionAPI.update(id, submitData);
      alert('옵션이 성공적으로 수정되었습니다');
      navigate('/');
    } catch (error) {
      console.error('옵션 수정 실패:', error);
      alert('옵션 수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div>로딩 중...</div>
        </div>
      </Layout>
    );
  }

  if (!formData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div>옵션을 찾을 수 없습니다</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">옵션 수정</h1>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          {/* 브랜드 & 지점 섹션 */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              브랜드 & 지점
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 브랜드 선택 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">브랜드</label>
                <input
                  type="text"
                  value={brandSearchQuery}
                  onChange={handleBrandSearch}
                  onFocus={() => {
                    setShowBrandDropdown(true);
                    if (!brandSearchQuery) setFilteredBrands(brands);
                  }}
                  onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                  onKeyDown={handleBrandKeyDown}
                  placeholder="브랜드를 검색하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showBrandDropdown && filteredBrands.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredBrands.map((brand, index) => (
                      <button
                        key={brand.id}
                        type="button"
                        onMouseDown={() => handleSelectBrand(brand)}
                        className={`w-full text-left px-4 py-2 border-b border-gray-200 last:border-b-0 ${index === focusedBrandIndex ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                      >
                        <div className="font-medium text-sm">{brand.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* 지점 선택 */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">지점</label>
                <input
                  type="text"
                  value={branchSearchQuery}
                  onChange={handleBranchSearch}
                  onFocus={() => {
                    setShowBranchDropdown(true);
                    if (!branchSearchQuery) setFilteredBranches(branches);
                  }}
                  onBlur={() => setTimeout(() => setShowBranchDropdown(false), 200)}
                  onKeyDown={handleBranchKeyDown}
                  placeholder={!formData.brand_id ? "브랜드를 먼저 선택해주세요" : "지점을 검색하세요"}
                  disabled={!formData.brand_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                {showBranchDropdown && filteredBranches.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredBranches.map((branch, index) => (
                      <button
                        key={branch.id}
                        type="button"
                        onMouseDown={() => handleSelectBranch(branch)}
                        className={`w-full text-left px-4 py-2 border-b border-gray-200 last:border-b-0 ${index === focusedBranchIndex ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                      >
                        <div className="font-medium text-sm">{branch.name}</div>
                        {branch.address && <div className="text-xs text-gray-500">{branch.address}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              옵션명
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인실
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월사용료
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.monthly_fee)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  monthly_fee: numericValue ? parseInt(numericValue) : 0,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              보증금
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.deposit)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  deposit: numericValue ? parseInt(numericValue) : 0,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정가
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.list_price)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  list_price: numericValue,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              일회성비용
            </label>
            <div className="space-y-3 mb-4">
              {formData.one_time_fees.map((fee, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">
                    {fee.type}: {parseInt(fee.amount).toLocaleString()}원
                  </span>
                  <button
                    onClick={() => handleRemoveFee(index)}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFee.type}
                onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
                placeholder="비용 종류"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newFee.amount}
                onChange={(e) =>
                  setNewFee({ ...newFee, amount: e.target.value })
                }
                placeholder="금액"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddFee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              오피스정보
            </label>
            <textarea
              value={formData.office_info}
              onChange={(e) =>
                setFormData({ ...formData, office_info: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              냉난방식
            </label>
            <div className="space-y-2">
              {[
                { value: 'central', label: '중앙냉난방' },
                { value: 'individual', label: '개별냉난방' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hvac_type"
                    value={option.value}
                    checked={formData.hvac_type === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hvac_type: e.target.value,
                      })
                    }
                    className="w-4 h-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주차방식
            </label>
            <div className="space-y-2">
              {[
                { value: 'self_parking', label: '자주식' },
                { value: 'mechanical', label: '기계식' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="parking_type"
                    value={option.value}
                    checked={formData.parking_type === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parking_type: e.target.value,
                      })
                    }
                    className="w-4 h-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              평면도 이미지
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFloorPlanFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기타메모
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? '수정 중...' : '수정'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OptionEdit;
