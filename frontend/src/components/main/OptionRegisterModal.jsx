import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { brandAPI, branchAPI, optionAPI, uploadAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { formatNumberInput, parseNumberInput } from '../../utils/formatters';
import { MEMO_MAX_LENGTH } from '../pdf/OptionDetailPage';

// 비고 관련 텍스트 최대 글자 수
const TEXT_MAX_LENGTH = MEMO_MAX_LENGTH;

// 초기 폼 데이터
const initialFormData = {
  brand_id: '',
  branch_id: '',
  name: '',
  category1: 'exclusive_floor',
  category2: '',
  capacity: 1,
  monthly_fee: 0,
  deposit: 0,
  list_price: '',
  one_time_fees: [],
  move_in_date_type: 'immediate',
  move_in_date_value: '',
  contract_period_type: 'twelve_months',
  contract_period_value: '',
  office_info: '',
  credits: [],
  hvac_type: '',
  parking_type: '',
  parking_count: '',
  parking_cost: '',
  parking_note: '',
  memo: '',
  floor_plan_url: '',
  exclusive_area: { value: '', unit: 'pyeong' },
};

const OptionRegisterModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);

  const [branches, setBranches] = useState([]);

  // 브랜드 검색 상태
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [focusedBrandIndex, setFocusedBrandIndex] = useState(-1);

  // 지점 검색 상태
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [focusedBranchIndex, setFocusedBranchIndex] = useState(-1);

  const [formData, setFormData] = useState(initialFormData);

  const [newFee, setNewFee] = useState({ type: '', amount: '', customType: '' });
  const [newCredit, setNewCredit] = useState({ type: 'monthly', amount: '', note: '', customName: '', unit: '크레딧' });
  const [floorPlanFile, setFloorPlanFile] = useState(null);

  // 기타 정보 팝업 상태
  const [showOtherInfoModal, setShowOtherInfoModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // 업로드 중복 방지를 위한 ref
  const uploadInProgressRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // 수정 모드: 초기 데이터 설정
        setFormData({
          ...initialFormData,
          ...initialData,
          brand_id: initialData.branch?.brand?.id || '',
          branch_id: initialData.branch?.id || '',
          // 배열 데이터 매핑
          credits: initialData.credits || [],
          one_time_fees: initialData.one_time_fees || [],
          // 기타 정보 매핑
          hvac_type: initialData.hvac_type || '',
          parking_type: initialData.parking_type || '',
          parking_count: initialData.parking_count || '',
          parking_cost: initialData.parking_cost || '',
          parking_note: initialData.parking_note || '',
          memo: initialData.memo || '',
          floor_plan_url: initialData.floor_plan_url || '',
          office_info: initialData.office_info || '',
          exclusive_area: initialData.exclusive_area || { value: '', unit: 'pyeong' },
        });
        // 검색 필드 초기화 (선택된 상태로 표시하기 위해)
        setBrandSearchQuery(initialData.branch?.brand?.name || '');
        setBranchSearchQuery(initialData.branch?.name || '');
        // 평면도 URL이 있으면 파일명 표시용으로 설정
        if (initialData.floor_plan_url) {
          setFloorPlanFile({ name: '기존 이미지' });
        }
      } else {
        // 등록 모드: 초기화
        setFormData(initialFormData);
        setBrandSearchQuery('');
        setBranchSearchQuery('');
      }
      setNewFee({ type: '', amount: '', customType: '' });
      setNewCredit({ type: 'monthly', amount: '', note: '' });
      if (!initialData?.floor_plan_url) {
        setFloorPlanFile(null);
      }
      fetchBrands();
    }
  }, [isOpen, initialData]);

  // 서브 모달 ESC 키 처리
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showOtherInfoModal) {
        e.stopPropagation();
        setShowOtherInfoModal(false);
        setActiveSection(null);
      }
    };

    if (showOtherInfoModal) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showOtherInfoModal]);

  useEffect(() => {
    if (formData.brand_id) {
      fetchBranches();
    }
  }, [formData.brand_id]);

  // 전역 클립보드 붙여넣기 핸들러 제거됨 - 개별 영역의 onPaste 핸들러만 사용

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
    if (!formData.brand_id) {
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
    setBranchSearchQuery(''); // 지점 검색어 초기화
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
      branch.name.toLowerCase().includes(query.toLowerCase())
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
    const feeType = newFee.type === 'custom' ? newFee.customType : newFee.type;
    const amount = parseNumberInput(newFee.amount);
    if (feeType && amount) {
      setFormData((prev) => ({
        ...prev,
        one_time_fees: [...prev.one_time_fees, { type: feeType, amount: parseFloat(amount) }],
      }));
      setNewFee({ type: '', amount: '', customType: '' });
    }
  };

  const handleRemoveFee = (index) => {
    setFormData((prev) => ({
      ...prev,
      one_time_fees: prev.one_time_fees.filter((_, i) => i !== index),
    }));
  };

  const handleAddCredit = () => {
    if (newCredit.type && newCredit.amount) {
      const creditToAdd = {
        type: newCredit.type,
        amount: parseInt(newCredit.amount),
        note: newCredit.note,
        customName: newCredit.type === 'other' ? newCredit.customName : undefined,
        unit: newCredit.type === 'other' ? (newCredit.unit || '크레딧') : '크레딧'
      };
      setFormData((prev) => ({
        ...prev,
        credits: [...prev.credits, creditToAdd],
      }));
      setNewCredit({ type: 'monthly', amount: '', note: '', customName: '', unit: '크레딧' });
      setActiveSection(null); // 크레딧 추가 후 기타옵션 메뉴로 돌아감
    }
  };

  const handleRemoveCredit = (index) => {
    setFormData((prev) => ({
      ...prev,
      credits: prev.credits.filter((_, i) => i !== index),
    }));
  };

  const handleFloorPlanUpload = async (file) => {
    if (!file) {
      console.log('No file provided');
      return;
    }

    console.log('Starting upload for file:', file.name, file.size, file.type);

    try {
      const response = await uploadAPI.image(file);
      console.log('Upload API response:', response);
      console.log('Response data:', response.data);

      const imageUrl = response.data?.image?.url || response.data?.url || response.data?.data?.url;

      if (imageUrl) {
        console.log('Image URL extracted:', imageUrl);
        setFormData((prev) => ({ ...prev, floor_plan_url: imageUrl }));
        setFloorPlanFile(file);
        success('평면도 이미지가 업로드되었습니다');
      } else {
        console.error('No URL found in response:', response);
        error('이미지 URL을 가져올 수 없습니다');
      }
    } catch (err) {
      console.error('평면도 업로드 실패:', err);
      console.error('Error details:', err.response);
      error('평면도 업로드에 실패했습니다');
    }
  };

  // 입력된 데이터가 있는지 확인
  const hasFormData = () => {
    return (
      formData.name ||
      formData.branch_id ||
      formData.floor_plan_url ||
      formData.credits.length > 0 ||
      formData.one_time_fees.length > 0 ||
      formData.office_info ||
      formData.memo ||
      formData.hvac_type ||
      formData.parking_type ||
      formData.parking_note ||
      formData.exclusive_area.value ||
      formData.list_price ||
      (formData.monthly_fee && formData.monthly_fee !== 0) ||
      (formData.deposit && formData.deposit !== 0)
    );
  };

  // 모달 닫기 처리 (데이터 확인)
  const handleClose = () => {
    if (hasFormData()) {
      if (window.confirm('입력한 데이터가 있습니다. 정말 닫으시겠습니까?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branch_id) {
      warning('지점을 선택해주세요');
      return;
    }
    if (!formData.name) {
      warning('옵션명을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const { brand_id, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        capacity: parseInt(formData.capacity),
        monthly_fee: parseInt(formData.monthly_fee),
        deposit: parseInt(formData.deposit),
        list_price: formData.list_price ? parseInt(formData.list_price) : null,
        credits: formData.credits.length > 0 ? formData.credits : null,
        exclusive_area: formData.exclusive_area.value ? {
          value: parseFloat(formData.exclusive_area.value),
          unit: formData.exclusive_area.unit
        } : null,
        category2: formData.category2 || null,
        move_in_date_value: formData.move_in_date_value || null,
        contract_period_value: formData.contract_period_value || null,
        office_info: formData.office_info || null,
        hvac_type: formData.hvac_type || null,
        parking_type: formData.parking_type || null,
        parking_count: formData.parking_count ? parseInt(formData.parking_count) : null,
        parking_cost: formData.parking_cost ? parseInt(formData.parking_cost) : null,
        parking_note: formData.parking_note || null,
        memo: formData.memo || null,
        floor_plan_url: formData.floor_plan_url || null,
      };

      if (initialData) {
        await optionAPI.update(initialData.id, payload);
        success('옵션이 수정되었습니다');
      } else {
        await optionAPI.create(payload);
        success('옵션이 등록되었습니다');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('옵션 등록 실패:', err);
      error('옵션 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={initialData ? "옵션 수정" : "신규 옵션 등록"}
        size="5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. 브랜드/지점 선택 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              1. 브랜드 & 지점
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 *</label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">지점 *</label>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                        <div className="text-xs text-gray-500">{branch.address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 2. 기본 정보 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              2. 기본 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">옵션명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="옵션명을 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">옵션분류1 *</label>
                <select
                  value={formData.category1}
                  onChange={(e) => {
                    const newCategory1 = e.target.value;
                    setFormData({
                      ...formData,
                      category1: newCategory1,
                      category2: newCategory1 === 'exclusive_floor' ? '' : formData.category2
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exclusive_floor">전용층</option>
                  <option value="connected_floor">연층</option>
                  <option value="separate_floor">분리층</option>
                  <option value="exclusive_room">전용호실</option>
                  <option value="connected_room">연접호실</option>
                  <option value="separate_room">분리호실</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">옵션분류2</label>
                <select
                  value={formData.category2}
                  onChange={(e) => setFormData({ ...formData, category2: e.target.value })}
                  disabled={formData.category1 === 'exclusive_floor'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="">선택 안 함</option>
                  <option value="window_side">창측</option>
                  <option value="inner_side">내측</option>
                </select>
                {formData.category1 === 'exclusive_floor' && (
                  <p className="mt-1 text-xs text-gray-500">전용층 선택 시 옵션분류2는 사용할 수 없습니다</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">인실 *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* 3. 가격 정보 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              3. 가격 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">월사용료 *</label>
                <input
                  type="text"
                  value={formatNumberInput(formData.monthly_fee)}
                  onChange={(e) => {
                    const numericValue = parseNumberInput(e.target.value);
                    setFormData({ ...formData, monthly_fee: numericValue ? parseInt(numericValue) : 0 });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="월사용료를 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">보증금 *</label>
                <input
                  type="text"
                  value={formatNumberInput(formData.deposit)}
                  onChange={(e) => {
                    const numericValue = parseNumberInput(e.target.value);
                    setFormData({ ...formData, deposit: numericValue ? parseInt(numericValue) : 0 });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="보증금을 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정가</label>
                <input
                  type="text"
                  value={formatNumberInput(formData.list_price)}
                  onChange={(e) => {
                    const numericValue = parseNumberInput(e.target.value);
                    setFormData({ ...formData, list_price: numericValue });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="정가를 입력해주세요"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">일회성비용</label>
                <div className="space-y-2 mb-3">
                  {formData.one_time_fees.map((fee, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <span className="flex-1 text-sm font-medium">
                        {fee.type}: {parseInt(fee.amount).toLocaleString()}원
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFee(index)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  {formData.one_time_fees.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-2">등록된 일회성 비용이 없습니다</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newFee.type}
                    onChange={(e) => setNewFee({ ...newFee, type: e.target.value, customType: '' })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">종류 선택</option>
                    <option value="셋업비">셋업비</option>
                    <option value="셋팅비">셋팅비</option>
                    <option value="퇴실비">퇴실비</option>
                    <option value="custom">기타</option>
                  </select>
                  {newFee.type === 'custom' && (
                    <input
                      type="text"
                      value={newFee.customType}
                      onChange={(e) => setNewFee({ ...newFee, customType: e.target.value })}
                      placeholder="종류 입력"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <input
                    type="text"
                    value={formatNumberInput(newFee.amount)}
                    onChange={(e) => {
                      const numericValue = parseNumberInput(e.target.value);
                      setNewFee({ ...newFee, amount: numericValue });
                    }}
                    placeholder="금액"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFee}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition font-medium"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 계약 정보 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              4. 계약 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입주가능일 *</label>
                <select
                  value={formData.move_in_date_type}
                  onChange={(e) => setFormData({ ...formData, move_in_date_type: e.target.value, move_in_date_value: '' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="immediate">즉시입주</option>
                  <option value="negotiable">협의필요</option>
                  <option value="custom">직접입력</option>
                </select>
                {formData.move_in_date_type === 'custom' && (
                  <input
                    type="text"
                    value={formData.move_in_date_value}
                    onChange={(e) => setFormData({ ...formData, move_in_date_value: e.target.value })}
                    placeholder="예: 2025년 1월 1일"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">계약기간 *</label>
                <select
                  value={formData.contract_period_type}
                  onChange={(e) => setFormData({ ...formData, contract_period_type: e.target.value, contract_period_value: '' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="six_months">6개월</option>
                  <option value="twelve_months">12개월</option>
                  <option value="custom">직접입력</option>
                </select>
                {formData.contract_period_type === 'custom' && (
                  <input
                    type="text"
                    value={formData.contract_period_value}
                    onChange={(e) => setFormData({ ...formData, contract_period_value: e.target.value })}
                    placeholder="예: 24개월"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </section>

          {/* 5. 추가 정보 (선택입력사항) */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              5. 추가정보 <span className="text-base font-normal text-gray-500">(선택입력사항)</span>
            </h2>
            <div className="space-y-4">
              {/* 전용면적 */}
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 shrink-0">전용면적:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.exclusive_area.value}
                    onChange={(e) => setFormData({
                      ...formData,
                      exclusive_area: { ...formData.exclusive_area, value: e.target.value }
                    })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder=""
                  />
                  <select
                    value={formData.exclusive_area.unit}
                    onChange={(e) => setFormData({
                      ...formData,
                      exclusive_area: { ...formData.exclusive_area, unit: e.target.value }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pyeong">평</option>
                    <option value="sqm">㎡</option>
                  </select>
                </div>
              </div>

              {/* 냉난방 */}
              <div className="flex items-center gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 shrink-0">냉난방:</label>
                <select
                  value={formData.hvac_type}
                  onChange={(e) => setFormData({ ...formData, hvac_type: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="central">중앙냉난방</option>
                  <option value="individual">개별냉난방</option>
                </select>
              </div>

              {/* 주차 */}
              <div className="flex items-start gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 shrink-0 pt-2">주차:</label>
                <div className="flex-1 space-y-2">
                  <select
                    value={formData.parking_type}
                    onChange={(e) => setFormData({ ...formData, parking_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="self_parking">자주식</option>
                    <option value="mechanical">기계식</option>
                  </select>
                  {/* 주차 상세 입력 (주차 타입 선택 시 표시) */}
                  {formData.parking_type && (
                    <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          placeholder="대수"
                          value={formData.parking_count}
                          onChange={(e) => setFormData({ ...formData, parking_count: e.target.value })}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-sm text-gray-600">대</span>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="비용"
                            value={formatNumberInput(formData.parking_cost)}
                            onChange={(e) => {
                              const numericValue = parseNumberInput(e.target.value);
                              setFormData({ ...formData, parking_cost: numericValue });
                            }}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</span>
                        </div>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="주차 비고"
                          value={formData.parking_note}
                          onChange={(e) => {
                            if (e.target.value.length <= TEXT_MAX_LENGTH) {
                              setFormData({ ...formData, parking_note: e.target.value });
                            }
                          }}
                          maxLength={TEXT_MAX_LENGTH}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-400">{formData.parking_note?.length || 0}/{TEXT_MAX_LENGTH}자</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 크레딧 */}
              <div className="flex items-start gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 shrink-0 pt-2">크레딧:</label>
                <div className="flex-1 space-y-2">
                  {/* 등록된 크레딧 목록 */}
                  {formData.credits.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {formData.credits.map((credit, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg text-sm">
                          <span className="flex-1">
                            {credit.type === 'other'
                              ? `${credit.customName || '기타'} : 월 ${credit.amount.toLocaleString()} ${credit.unit || '크레딧'} 제공`
                              : `${credit.type === 'monthly' ? '크레딧' : credit.type === 'printing' ? '프린팅' : '미팅룸'} : 월 ${credit.amount.toLocaleString()} 크레딧 제공`
                            }
                            {credit.note && ` (${credit.note})`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCredit(index)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 새 크레딧 추가 입력 */}
                  <div className="flex gap-2 items-center flex-wrap">
                    <select
                      value={newCredit.type}
                      onChange={(e) => setNewCredit({ ...newCredit, type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="monthly">크레딧</option>
                      <option value="printing">프린팅</option>
                      <option value="meeting_room">미팅룸</option>
                      <option value="other">기타</option>
                    </select>
                    {/* 기타 선택 시 명칭 입력 */}
                    {newCredit.type === 'other' && (
                      <input
                        type="text"
                        value={newCredit.customName}
                        onChange={(e) => setNewCredit({ ...newCredit, customName: e.target.value })}
                        placeholder="명칭"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    )}
                    <input
                      type="number"
                      value={newCredit.amount}
                      onChange={(e) => setNewCredit({ ...newCredit, amount: e.target.value })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="수량"
                    />
                    {/* 기타 선택 시 단위 입력 */}
                    {newCredit.type === 'other' ? (
                      <input
                        type="text"
                        value={newCredit.unit}
                        onChange={(e) => setNewCredit({ ...newCredit, unit: e.target.value })}
                        placeholder="단위"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">크레딧</span>
                    )}
                    <div className="relative flex-1 min-w-[100px]">
                      <input
                        type="text"
                        value={newCredit.note}
                        onChange={(e) => {
                          if (e.target.value.length <= TEXT_MAX_LENGTH) {
                            setNewCredit({ ...newCredit, note: e.target.value });
                          }
                        }}
                        maxLength={TEXT_MAX_LENGTH}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`메모(${newCredit.note?.length || 0}/${TEXT_MAX_LENGTH}자)`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCredit}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium text-sm"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>

              {/* 오피스정보 */}
              <div className="flex items-start gap-4">
                <label className="w-24 text-sm font-medium text-gray-700 shrink-0 pt-2">오피스정보:</label>
                <textarea
                  value={formData.office_info}
                  onChange={(e) => setFormData({ ...formData, office_info: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="예: 8층 5인실 창측 전용호실 / 전용면적 3.6평"
                />
              </div>

              {/* 기타 옵션 (평면도, 텍스트 메모) 추가 버튼 */}
              <div className="border-t pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowOtherInfoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition text-sm"
                >
                  <span className="text-lg">+</span>
                  <span>평면도 / 메모 추가</span>
                </button>
                {(formData.floor_plan_url || floorPlanFile || formData.memo) && (
                  <div className="mt-3 space-y-2">
                    {(formData.floor_plan_url || floorPlanFile) && (
                      <div className="flex items-center justify-between px-3 py-2 bg-pink-50 text-pink-700 text-sm rounded-lg">
                        <span>평면도: <strong>{floorPlanFile ? floorPlanFile.name : '업로드됨'}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, floor_plan_url: '' });
                            setFloorPlanFile(null);
                          }}
                          className="ml-2 text-pink-600 hover:text-pink-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {formData.memo && (
                      <div className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">메모</span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, memo: '' })}
                            className="ml-2 text-gray-600 hover:text-gray-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="text-xs mt-1 line-clamp-2">{formData.memo}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (initialData ? '수정 중...' : '등록 중...') : (initialData ? '옵션 수정' : '옵션 등록')}
            </button>
          </div>
        </form>
      </Modal>

      {/* 기타 옵션 추가 서브 모달 */}
      {showOtherInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                기타 정보
              </h2>
              <button
                onClick={() => {
                  setShowOtherInfoModal(false);
                  setActiveSection(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 옵션 버튼들 */}
              {!activeSection && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection('floorplan')}
                    className="px-4 py-3 bg-pink-50 hover:bg-pink-100 border-2 border-pink-200 rounded-lg text-pink-700 font-semibold transition text-sm"
                  >
                    평면도
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('memo')}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold transition text-sm"
                  >
                    메모
                  </button>
                </div>
              )}

              {/* 평면도 섹션 */}
              {activeSection === 'floorplan' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">평면도 이미지</h3>
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← 뒤로
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.floor_plan_url ? (
                      <div className="relative inline-block">
                        <img
                          src={formData.floor_plan_url}
                          alt="평면도 미리보기"
                          className="h-32 w-auto rounded-lg shadow-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, floor_plan_url: '' }));
                            setFloorPlanFile(null);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:bg-blue-50 transition-colors outline-none cursor-pointer"
                        onClick={(e) => e.currentTarget.focus()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                          const files = e.dataTransfer.files;
                          if (files && files[0] && files[0].type.startsWith('image/')) {
                            await handleFloorPlanUpload(files[0]);
                          }
                        }}
                        onPaste={async (e) => {
                          if (uploadInProgressRef.current) {
                            e.preventDefault();
                            warning('이미지 업로드 중입니다. 완료 후 다시 시도해주세요.');
                            return;
                          }

                          const items = e.clipboardData?.items;
                          if (!items) return;

                          for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (item.type.startsWith('image/')) {
                              e.preventDefault();
                              e.stopPropagation();
                              const blob = item.getAsFile();
                              if (blob) {
                                uploadInProgressRef.current = true;
                                try {
                                  await handleFloorPlanUpload(blob);
                                } finally {
                                  uploadInProgressRef.current = false;
                                }
                              }
                              return;
                            }
                            if (item.type === 'text/plain') {
                              item.getAsString((text) => {
                                if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                                  setFormData(prev => ({ ...prev, floor_plan_url: text.trim() }));
                                  success('이미지 URL이 입력되었습니다');
                                }
                              });
                            }
                          }
                        }}
                        tabIndex={0}
                      >
                        <div className="flex gap-4 items-start flex-wrap">
                          <div className="w-32 h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 border border-gray-200">
                            <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">이미지 드롭</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <input
                              id="floorplan-file-input"
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFloorPlanUpload(e.target.files[0])}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById('floorplan-file-input').click()}
                              disabled={uploadInProgressRef.current}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {uploadInProgressRef.current ? '업로드 중...' : '파일 선택'}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          이미지를 드래그하거나, 이 영역 클릭 후 Ctrl+V로 붙여넣기하거나, 버튼을 클릭하세요
                        </p>
                      </div>
                    )}
                  </div>

                  {/* URL 직접 입력 */}
                  {!formData.floor_plan_url && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">또는 이미지 URL 직접 입력</label>
                      <input
                        type="text"
                        value={formData.floor_plan_url}
                        onChange={(e) => setFormData({ ...formData, floor_plan_url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 텍스트 섹션 */}
              {activeSection === 'memo' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">기타 메모</h3>
                    <button
                      type="button"
                      onClick={() => setActiveSection(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ← 뒤로
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메모 <span className="text-gray-400 text-xs">({formData.memo?.length || 0}/{TEXT_MAX_LENGTH}자)</span>
                    </label>
                    <textarea
                      value={formData.memo}
                      onChange={(e) => {
                        if (e.target.value.length <= TEXT_MAX_LENGTH) {
                          setFormData({ ...formData, memo: e.target.value });
                        }
                      }}
                      maxLength={TEXT_MAX_LENGTH}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      placeholder="추가 메모를 입력해주세요"
                    />
                  </div>
                </div>
              )}

              {/* 완료 버튼 */}
              <div className="flex justify-end pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtherInfoModal(false);
                    setActiveSection(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div >
      )}
    </>
  );
};

export default OptionRegisterModal;
