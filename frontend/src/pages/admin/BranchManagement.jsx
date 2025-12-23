import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import { Button, Modal, Table, Pagination } from '../../components/common';
import FilterBar from '../../components/main/FilterBar';
import { branchAPI, brandAPI, externalAPI, uploadAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const BranchManagement = () => {
  const { success, error, warning } = useToast();
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [editBranch, setEditBranch] = useState(null);
  const [newBranch, setNewBranch] = useState({
    brand_id: '',
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    nearest_subway: '',
    walking_distance: '',
    transit_distance: '',  // 대중교통 시간 (도보 15분 초과 시)
    is_transit: false,     // 대중교통 사용 여부
    exterior_image_url: '',
    interior_image_urls: [],
    basic_info_1: '',
    basic_info_2: '',
    basic_info_3: '',
    approval_year: '',
    floors_above: '',
    floors_below: '',
    total_area: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 필터 및 페이지네이션 상태
  const [filters, setFilters] = useState({
    brands: [],
    branches: [], // FilterBar에서 사용하지만 여기서는 직접적으로 사용하지 않음 (지점명 검색은 search 텍스트로 처리)
    search: '',
    sort: 'latest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [paginatedBranches, setPaginatedBranches] = useState([]);

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (count) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  // 필터링 및 정렬 로직
  useEffect(() => {
    let result = [...branches];

    // 1. 브랜드 필터링
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter(branch =>
        filters.brands.includes(String(branch.brand_id)) ||
        (branch.brand && filters.brands.includes(String(branch.brand.id)))
      );
    }

    // 2. 검색어 필터링 (지점명)
    // FilterBar의 search 텍스트를 사용하거나, branches 필터가 있다면 그것도 고려
    // FilterBar 구현상 branches 필터는 지점 ID 목록임.
    // 여기서는 FilterBar의 일반 검색어(search)를 지점명 검색으로 사용
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(branch =>
        branch.name.toLowerCase().includes(searchLower) ||
        (branch.brand && branch.brand.name.toLowerCase().includes(searchLower)) ||
        (branch.address && branch.address.toLowerCase().includes(searchLower))
      );
    }

    // 3. 정렬
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'latest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        // 가격 정렬은 지점에 가격 정보가 없으므로 제외하거나 이름순 등으로 대체 가능
        // 여기서는 기본적으로 최신순/오래된순만 적용하고 나머지는 이름순으로 처리
        case 'price_high': // 임시로 이름 내림차순
        case 'price_low': // 임시로 이름 오름차순
        default:
          return 0;
      }
    });

    setFilteredBranches(result);
  }, [branches, filters]);

  // 페이지네이션 로직
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedBranches(filteredBranches.slice(startIndex, endIndex));
  }, [filteredBranches, currentPage, itemsPerPage]);

  // 주소 검색 관련 상태
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [focusedAddressIndex, setFocusedAddressIndex] = useState(-1);

  // 주소 검색 키보드 네비게이션
  const handleAddressKeyDown = (e, isEditMode) => {
    if (!showAddressResults || addressSearchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedAddressIndex(prev =>
        prev < addressSearchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedAddressIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedAddressIndex >= 0 && focusedAddressIndex < addressSearchResults.length) {
        handleSelectAddress(addressSearchResults[focusedAddressIndex], isEditMode);
      }
    } else if (e.key === 'Escape') {
      setShowAddressResults(false);
    }
  };

  // 지하철역 검색 관련 상태
  const [subwaySearchResults, setSubwaySearchResults] = useState([]);
  const [showSubwayResults, setShowSubwayResults] = useState(false);
  const [searchingSubway, setSearchingSubway] = useState(false);
  const [subwaySearchMessage, setSubwaySearchMessage] = useState(''); // 확장 검색 결과 메시지

  // 건축물대장 정보 조회 상태
  const [loadingBuildingInfo, setLoadingBuildingInfo] = useState(false);

  // 이미지 업로드 상태
  const [uploadingExterior, setUploadingExterior] = useState(false);
  const [uploadingInterior, setUploadingInterior] = useState([]);
  const exteriorFileInputRef = useRef(null);
  const interiorFileInputRef = useRef(null);

  // URL 입력 모달 상태
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlInputType, setUrlInputType] = useState('exterior'); // 'exterior' or 'interior'

  // 이미지 붙여넣기 타겟 섹션 상태 ('exterior' | 'interior' | null)
  const [hoveredSection, setHoveredSection] = useState(null);

  // 브랜드 자동완성 상태
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [focusedBrandIndex, setFocusedBrandIndex] = useState(-1);

  // 브랜드 검색 핸들러
  const handleBrandSearch = (e) => {
    const query = e.target.value;
    setBrandSearchQuery(query);
    setShowBrandDropdown(true);
    setFocusedBrandIndex(-1); // 검색어 변경 시 포커스 초기화

    if (!query.trim()) {
      setFilteredBrands(brands);
      return;
    }

    const filtered = brands.filter(brand =>
      brand.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBrands(filtered);
  };

  // 브랜드 선택 핸들러
  const handleSelectBrand = (brand, setBranch, branchState) => {
    setBranch({ ...branchState, brand_id: String(brand.id) });
    setBrandSearchQuery(brand.name);
    setShowBrandDropdown(false);
    setFocusedBrandIndex(-1);
  };

  // 키보드 네비게이션 핸들러
  const handleBrandKeyDown = (e, setBranch, branchState) => {
    if (!showBrandDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowBrandDropdown(true);
        setFilteredBrands(brands.filter(brand =>
          brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
        ));
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedBrandIndex(prev =>
        prev < filteredBrands.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedBrandIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedBrandIndex >= 0 && focusedBrandIndex < filteredBrands.length) {
        handleSelectBrand(filteredBrands[focusedBrandIndex], setBranch, branchState);
      }
    } else if (e.key === 'Escape') {
      setShowBrandDropdown(false);
    }
  };

  // 브랜드 입력 포커스 핸들러
  const handleBrandInputFocus = () => {
    setShowBrandDropdown(true);
    // 검색어가 없으면 전체 목록 표시, 있으면 필터링된 목록 표시
    if (!brandSearchQuery.trim()) {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand =>
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  };

  // 브랜드 입력 블러 핸들러
  const handleBrandInputBlur = () => {
    // 클릭 이벤트가 먼저 발생하도록 지연 처리
    setTimeout(() => {
      setShowBrandDropdown(false);

      // 입력된 값이 브랜드 목록에 없으면 초기화하거나 유지 (여기서는 선택 안된 것으로 처리하지 않음)
      // 하지만 brand_id가 설정되어 있는지 확인하는 것이 좋음
      // UX 결정: 사용자가 입력을 멈췄을 때, 정확히 일치하는 브랜드가 있으면 선택? 아니면 그냥 둠?
      // 여기서는 단순히 드롭다운만 닫음. 유효성 검사는 등록/수정 시 수행.
    }, 200);
  };

  useEffect(() => {
    fetchBranches();
    fetchBrands();
  }, []);

  // 위도/경도가 변경되면 지하철역 검색 및 자동 선택 (추가 모드에서만)
  useEffect(() => {
    // 추가 모드에서만 자동 검색
    if (showAddModal && newBranch.latitude && newBranch.longitude) {
      const lat = parseFloat(newBranch.latitude);
      const lng = parseFloat(newBranch.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        searchNearbySubway(lat, lng);
      }
    }
  }, [newBranch.latitude, newBranch.longitude, showAddModal]);

// 업로드 중복 방지를 위한 ref
  const uploadInProgressRef = useRef({
    exterior: false,
    interior: false,
  });


  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await branchAPI.getAll();
      const branchesArray = response.data?.branches || response.data?.data || [];
      setBranches(Array.isArray(branchesArray) ? branchesArray : []);
    } catch (err) {
      console.error('지점 목록 조회 실패:', err);
      error(err.response?.data?.message || '지점 목록을 불러오는데 실패했습니다');
      setBranches([]);
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

  // 주소 검색
  const handleAddressSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setAddressSearchResults([]);
      setShowAddressResults(false);
      setFocusedAddressIndex(-1);
      return;
    }

    setSearchingAddress(true);
    setFocusedAddressIndex(-1);
    try {
      const response = await externalAPI.searchAddress(query);
      const addresses = response.data?.addresses || [];
      setAddressSearchResults(addresses);
      setShowAddressResults(addresses.length > 0);
    } catch (err) {
      console.error('주소 검색 실패:', err);
      error('주소 검색에 실패했습니다');
      setAddressSearchResults([]);
      setShowAddressResults(false);
    } finally {
      setSearchingAddress(false);
    }
  };

  // 주소 선택
  const handleSelectAddress = async (address, isEditMode = false) => {
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    setBranch({
      ...branch,
      address: address.roadAddress || address.mainAddress,
      latitude: address.latitude.toString(),
      longitude: address.longitude.toString(),
    });
    setAddressSearchQuery(address.roadAddress || address.mainAddress);
    setShowAddressResults(false);
    setAddressSearchResults([]);
    setFocusedAddressIndex(-1);

    // 건축물대장 정보 조회 시도
    if (address.latitude && address.longitude) {
      fetchBuildingInfo(
        address.latitude,
        address.longitude,
        address.lotAddress,
        address.sigunguCode,
        address.bjdongCode,
        address.mainAddressNo,
        address.subAddressNo,
        address.mountainYn,
        isEditMode
      );
    }
  };

  // 근처 지하철역 검색 및 자동 선택 (확장 검색 API 사용)
  const searchNearbySubway = async (latitude, longitude) => {
    setSearchingSubway(true);
    setSubwaySearchMessage('');
    try {
      // 확장 검색 API 호출 (반경 자동 확대, 최대 20km)
      const response = await externalAPI.searchSubwayExtended(latitude, longitude, 20000);
      const data = response.data;

      if (data.found && data.subways && data.subways.length > 0) {
        setSubwaySearchResults(data.subways);
        setShowSubwayResults(data.subways.length > 0);

        // 검색 범위 메시지 설정 (1km 초과 시)
        if (data.message) {
          setSubwaySearchMessage(data.message);
        }

        // 가장 가까운 지하철역 자동 선택
        const branch = showEditModal ? editBranch : newBranch;
        if (!branch.nearest_subway) {
          const nearestSubway = data.subway || data.subways[0];
          handleSelectSubway(nearestSubway);
          setShowSubwayResults(false);
        }
      } else {
        // 지하철역을 찾지 못한 경우
        setSubwaySearchResults([]);
        setShowSubwayResults(false);
        setSubwaySearchMessage(data.message || '20km 반경 내에 지하철역이 없습니다');
      }
    } catch (err) {
      console.error('지하철역 검색 실패:', err);
      setSubwaySearchResults([]);
      setShowSubwayResults(false);
      setSubwaySearchMessage('지하철역 검색에 실패했습니다');
    } finally {
      setSearchingSubway(false);
    }
  };

  // 지하철역 선택
  const handleSelectSubway = (subway) => {
    const isEditMode = showEditModal;
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    // 역 이름에서 "역" 제거 (중복 방지)
    let stationName = subway.formattedName || subway.name;
    // "역"으로 끝나면 계속 제거 (역역 등 중복 방지)
    while (stationName.endsWith('역')) {
      stationName = stationName.slice(0, -1);
    }

    // 도보 15분 이상이면 대중교통 사용
    const walkingTime = subway.walkingTime ? Math.round(subway.walkingTime) : 0;
    const isLongDistance = subway.isLongDistance || walkingTime > 15;
    const transitTime = subway.transitTime ? Math.round(subway.transitTime) : walkingTime;

    setBranch({
      ...branch,
      nearest_subway: stationName + '역',
      walking_distance: walkingTime,  // 실제 도보 시간 (항상 저장)
      transit_distance: isLongDistance ? transitTime : '',  // 대중교통 시간 (15분 초과 시)
      is_transit: isLongDistance,  // 대중교통 사용 여부
    });
    setShowSubwayResults(false);
  };

  // 건축물대장 정보 조회
  const fetchBuildingInfo = async (latitude, longitude, lotAddress, sigunguCode, bjdongCode, mainAddressNo, subAddressNo, mountainYn, isEditMode = false) => {
    setLoadingBuildingInfo(true);
    try {
      const response = await externalAPI.getBuildingByLocation(
        latitude,
        longitude,
        lotAddress,
        sigunguCode,
        bjdongCode,
        mainAddressNo,
        subAddressNo,
        mountainYn
      );
      const building = response.data?.building;

      if (building) {
        const setBranch = isEditMode ? setEditBranch : setNewBranch;
        setBranch(prev => ({
          ...prev,
          approval_year: building.approvalYear || prev.approval_year,
          floors_above: building.floorsAbove || prev.floors_above,
          floors_below: building.floorsBelow || prev.floors_below,
          total_area: building.buildingArea || building.totalArea || prev.total_area,
        }));
      }
    } catch (err) {
      console.error('건축물대장 정보 조회 실패:', err);
    } finally {
      setLoadingBuildingInfo(false);
    }
  };

  // 공통 이미지 업로드 핸들러
  const handleImageUpload = async (file, type = 'exterior') => {
    if (!file) return;

    const isEditMode = showEditModal;
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    if (type === 'exterior') {
      setUploadingExterior(true);
    } else {
      setUploadingInterior(prev => [...prev, file.name]);
    }

    try {
      const response = await uploadAPI.image(file);
      const imageUrl = response.data?.image?.url || response.data?.url;
      if (imageUrl) {
        if (type === 'exterior') {
          setBranch({ ...branch, exterior_image_url: imageUrl });
          success('외관 이미지가 업로드되었습니다');
        } else {
          if (branch.interior_image_urls.length < 4) {
            setBranch({
              ...branch,
              interior_image_urls: [...branch.interior_image_urls, imageUrl],
            });
            success('내부 이미지가 업로드되었습니다');
          } else {
            warning('최대 4장까지 업로드 가능합니다');
          }
        }
      } else {
        error('이미지 URL을 가져올 수 없습니다');
      }
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      error(err.response?.data?.message || '이미지 업로드에 실패했습니다');
    } finally {
      if (type === 'exterior') {
        setUploadingExterior(false);
        if (exteriorFileInputRef.current) {
          exteriorFileInputRef.current.value = '';
        }
      } else {
        setUploadingInterior(prev => prev.filter(name => name !== file.name));
        if (interiorFileInputRef.current) {
          interiorFileInputRef.current.value = '';
        }
      }
    }
  };

  // 외관 이미지 업로드
  const handleExteriorImageUpload = async (e) => {
    const file = e.target.files?.[0];
    await handleImageUpload(file, 'exterior');
  };

  // 내부 이미지 업로드
  const handleInteriorImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const isEditMode = showEditModal;
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    const remainingSlots = 4 - branch.interior_image_urls.length;
    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      warning(`최대 4장까지 업로드 가능합니다. ${remainingSlots}장만 업로드됩니다.`);
    }

    setUploadingInterior(prev => [...prev, ...filesToUpload.map(f => f.name)]);

    try {
      const uploadPromises = filesToUpload.map(file => uploadAPI.image(file));
      const responses = await Promise.all(uploadPromises);

      const newImageUrls = responses
        .map(res => res.data?.image?.url || res.data?.url)
        .filter(url => url);

      if (newImageUrls.length === 0) {
        error('이미지 URL을 가져올 수 없습니다');
        return;
      }

      setBranch({
        ...branch,
        interior_image_urls: [...branch.interior_image_urls, ...newImageUrls],
      });

      success(`${newImageUrls.length}개의 이미지가 업로드되었습니다`);
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      error(err.response?.data?.message || '이미지 업로드에 실패했습니다');
    } finally {
      setUploadingInterior([]);
      if (interiorFileInputRef.current) {
        interiorFileInputRef.current.value = '';
      }
    }
  };

  // URL 입력 모달 열기
  const handleOpenUrlModal = (type) => {
    setUrlInputType(type);
    setUrlInput('');
    setShowUrlModal(true);
  };

  // URL로 이미지 추가
  const handleAddImageByUrl = async () => {
    if (!urlInput.trim()) {
      warning('URL을 입력해주세요');
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      error('유효한 URL을 입력해주세요');
      return;
    }

    const isEditMode = showEditModal;
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    if (urlInputType === 'exterior') {
      setBranch({ ...branch, exterior_image_url: urlInput });
      success('외관 이미지 URL이 설정되었습니다');
    } else {
      if (branch.interior_image_urls.length < 4) {
        setBranch({
          ...branch,
          interior_image_urls: [...branch.interior_image_urls, urlInput],
        });
        success('내부 이미지 URL이 추가되었습니다');
      } else {
        warning('최대 4장까지 업로드 가능합니다');
        return;
      }
    }

    setShowUrlModal(false);
    setUrlInput('');
  };

  // 내부 이미지 삭제
  const handleRemoveInteriorImage = (index) => {
    const isEditMode = showEditModal;
    const setBranch = isEditMode ? setEditBranch : setNewBranch;
    const branch = isEditMode ? editBranch : newBranch;

    setBranch({
      ...branch,
      interior_image_urls: branch.interior_image_urls.filter((_, i) => i !== index),
    });
  };

  const handleAddBranch = async () => {
    // 필수 항목 확인 (지하철역과 도보거리는 선택적 - 외곽지역 지원)
    if (
      !newBranch.brand_id ||
      !newBranch.name ||
      !newBranch.address ||
      !newBranch.latitude ||
      !newBranch.longitude
    ) {
      warning('모든 필수 항목을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...newBranch,
        walking_distance: newBranch.walking_distance !== '' ? parseInt(newBranch.walking_distance) : null,
        transit_distance: newBranch.transit_distance !== '' ? parseInt(newBranch.transit_distance) : null,
        is_transit: Boolean(newBranch.is_transit),
        latitude: parseFloat(newBranch.latitude),
        longitude: parseFloat(newBranch.longitude),
        nearest_subway: newBranch.nearest_subway || null,
        approval_year: newBranch.approval_year ? parseInt(newBranch.approval_year) : null,
        floors_above: newBranch.floors_above ? parseInt(newBranch.floors_above) : null,
        floors_below: newBranch.floors_below ? parseInt(newBranch.floors_below) : null,
        total_area: newBranch.total_area ? parseFloat(newBranch.total_area) : null,
        basic_info_1: newBranch.basic_info_1 || '',
        basic_info_2: newBranch.basic_info_2 || '',
        basic_info_3: newBranch.basic_info_3 || '',
        interior_image_urls: Array.isArray(newBranch.interior_image_urls)
          ? newBranch.interior_image_urls
          : [],
      };

      await branchAPI.create(payload);
      success('지점이 등록되었습니다');
      setShowAddModal(false);
      resetForm();
      fetchBranches();
    } catch (err) {
      console.error('지점 등록 실패:', err);
      error(err.response?.data?.message || '지점 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBranch = async () => {
    // 필수 항목 확인 (지하철역과 도보거리는 선택적 - 외곽지역 지원)
    if (
      !editBranch.brand_id ||
      !editBranch.name ||
      !editBranch.address ||
      !editBranch.latitude ||
      !editBranch.longitude
    ) {
      warning('모든 필수 항목을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...editBranch,
        walking_distance: editBranch.walking_distance !== '' ? parseInt(editBranch.walking_distance) : null,
        transit_distance: editBranch.transit_distance !== '' && editBranch.transit_distance !== undefined ? parseInt(editBranch.transit_distance) : null,
        is_transit: Boolean(editBranch.is_transit),
        latitude: parseFloat(editBranch.latitude),
        longitude: parseFloat(editBranch.longitude),
        nearest_subway: editBranch.nearest_subway || null,
        approval_year: editBranch.approval_year ? parseInt(editBranch.approval_year) : null,
        floors_above: editBranch.floors_above ? parseInt(editBranch.floors_above) : null,
        floors_below: editBranch.floors_below ? parseInt(editBranch.floors_below) : null,
        total_area: editBranch.total_area ? parseFloat(editBranch.total_area) : null,
        basic_info_1: editBranch.basic_info_1 || '',
        basic_info_2: editBranch.basic_info_2 || '',
        basic_info_3: editBranch.basic_info_3 || '',
        interior_image_urls: Array.isArray(editBranch.interior_image_urls)
          ? editBranch.interior_image_urls
          : [],
      };

      await branchAPI.update(editBranch.id, payload);
      success('지점이 수정되었습니다');
      setShowEditModal(false);
      setEditBranch(null);
      setSelectedBranch(null);
      setIsEditingMode(false);
      fetchBranches();
    } catch (err) {
      console.error('지점 수정 실패:', err);
      error(err.response?.data?.message || '지점 수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!editBranch?.id) return;

    setDeleting(true);
    try {
      await branchAPI.delete(editBranch.id);
      success('지점이 삭제되었습니다');
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      setEditBranch(null);
      setSelectedBranch(null);
      setIsEditingMode(false);
      fetchBranches();
    } catch (err) {
      console.error('지점 삭제 실패:', err);
      error(err.response?.data?.message || '지점 삭제에 실패했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = (branch) => {
    setSelectedBranch(branch);
    setEditBranch({
      ...branch,
      brand_id: String(branch.brand?.id || branch.brand_id || ''),
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      walking_distance: branch.walking_distance?.toString() || '',
      approval_year: branch.approval_year?.toString() || '',
      floors_above: branch.floors_above?.toString() || '',
      floors_below: branch.floors_below?.toString() || '',
      total_area: branch.total_area?.toString() || '',
      interior_image_urls: branch.interior_image_urls || [],
      basic_info_1: branch.basic_info_1 || '',
      basic_info_2: branch.basic_info_2 || '',
      basic_info_3: branch.basic_info_3 || '',
    });
    setAddressSearchQuery(branch.address);
    setBrandSearchQuery(branch.brand?.name || ''); // 브랜드명 설정
    setFocusedBrandIndex(-1);
    setIsEditingMode(false); // 읽기 전용 모드로 시작
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewBranch({
      brand_id: '',
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      nearest_subway: '',
      walking_distance: '',
      exterior_image_url: '',
      interior_image_urls: [],
      basic_info_1: '',
      basic_info_2: '',
      basic_info_3: '',
      approval_year: '',
      floors_above: '',
      floors_below: '',
      total_area: '',
      status: 'active',
    });
    setAddressSearchQuery('');
    setAddressSearchResults([]);
    setShowAddressResults(false);
    setFocusedAddressIndex(-1);
    setSubwaySearchResults([]);
    setShowSubwayResults(false);
    setBrandSearchQuery(''); // 브랜드 검색어 초기화
    setFocusedBrandIndex(-1);
  };

  const columns = [
    {
      header: '지점명',
      accessor: 'name',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      header: '브랜드',
      accessor: 'brand',
      render: (row) => (
        <span className="text-gray-600">{row.brand?.name || '-'}</span>
      ),
    },
    {
      header: '주소',
      accessor: 'address',
      render: (row) => <span className="text-gray-600 text-sm">{row.address}</span>,
    },
    {
      header: '지하철역',
      accessor: 'nearest_subway',
      render: (row) => (
        <span className="text-gray-600">
          {row.nearest_subway} ({row.walking_distance}분)
        </span>
      ),
    },
    {
      header: '상태',
      accessor: 'status',
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${row.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
            }`}
        >
          {row.status === 'active' ? '활성' : '비활성'}
        </span>
      ),
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
  ];

  const renderBranchForm = (branch, setBranch, isEditMode = false, disabled = false) => {
    // 렌더링 시점에 branchState를 캡처하기 위해 변수명 변경 (handleSelectBrand에서 사용)
    const branchState = branch;
    return (
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              브랜드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandSearchQuery}
              onChange={handleBrandSearch}
              onFocus={handleBrandInputFocus}
              onBlur={handleBrandInputBlur}
              onKeyDown={(e) => handleBrandKeyDown(e, setBranch, branchState)}
              placeholder="브랜드를 검색하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {showBrandDropdown && filteredBrands.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBrands.map((brand, index) => (
                  <button
                    key={brand.id}
                    type="button"
                    onMouseDown={() => handleSelectBrand(brand, setBranch, branchState)} // onMouseDown fires before onBlur
                    className={`w-full text-left px-4 py-2 border-b border-gray-200 last:border-b-0 ${index === focusedBrandIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
                      }`}
                  >
                    <div className="font-medium text-sm">{brand.name}</div>
                  </button>
                ))}
              </div>
            )}
            {showBrandDropdown && filteredBrands.length === 0 && brandSearchQuery && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-center text-gray-500 text-sm">
                검색 결과가 없습니다
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지점명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={branch.name}
              onChange={(e) => setBranch({ ...branch, name: e.target.value })}
              placeholder="지점명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 주소 검색 */}
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주소 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressSearchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setAddressSearchQuery(query);
                  setBranch({ ...branch, address: query });
                  handleAddressSearch(query);
                }}
                onFocus={() => {
                  if (addressSearchResults.length > 0) {
                    setShowAddressResults(true);
                  }
                }}
                onKeyDown={(e) => handleAddressKeyDown(e, isEditMode)}
                placeholder="주소를 검색하세요 (카카오맵 API)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {searchingAddress && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                </div>
              )}
              {showAddressResults && addressSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSearchResults.map((addr, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectAddress(addr, isEditMode)}
                      className={`w-full text-left px-4 py-2 border-b border-gray-200 last:border-b-0 ${index === focusedAddressIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
                        }`}
                    >
                      <div className="font-medium text-sm">{addr.roadAddress || addr.mainAddress}</div>
                      {addr.roadAddress && addr.mainAddress !== addr.roadAddress && (
                        <div className="text-xs text-gray-500">{addr.mainAddress}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {branch.address && (
              <p className="mt-1 text-xs text-gray-500">선택된 주소: {branch.address}</p>
            )}
          </div>

          {/* 인근 지하철역 */}
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인근 지하철역
              <span className="text-xs text-gray-500 ml-2">(자동 검색, 최대 20km)</span>
            </label>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={branch.nearest_subway}
                readOnly
                placeholder={searchingSubway ? '지하철역 검색 중...' : '위도/경도 입력 시 자동 검색됩니다'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              {/* 재검색 버튼 - 수정 모드에서만 표시 */}
              {!disabled && branch.latitude && branch.longitude && (
                <button
                  type="button"
                  onClick={() => {
                    const lat = parseFloat(branch.latitude);
                    const lng = parseFloat(branch.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      // 기존 값 초기화 후 재검색
                      setBranch(prev => ({ ...prev, nearest_subway: '', walking_distance: '' }));
                      searchNearbySubway(lat, lng);
                    }
                  }}
                  disabled={searchingSubway}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {searchingSubway ? '검색중...' : '재검색'}
                </button>
              )}
              {searchingSubway && (
                <div className="absolute right-20 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                </div>
              )}
              {showSubwayResults && subwaySearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {subwaySearchResults.map((subway, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSubway(subway)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{subway.formattedName || subway.name}</div>
                      <div className="text-xs text-gray-500">
                        거리: {subway.distance ? `${(subway.distance / 1000).toFixed(2)}km` : '-'}
                        {subway.isLongDistance ? (
                          <span className="text-blue-600"> (대중교통 약 {Math.round(subway.transitTime)}분)</span>
                        ) : (
                          subway.walkingTime && <span> (도보 약 {Math.round(subway.walkingTime)}분)</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!branch.latitude || !branch.longitude ? (
              <p className="mt-1 text-xs text-gray-500">주소를 선택하면 자동으로 검색됩니다</p>
            ) : subwaySearchMessage ? (
              <p className={`mt-1 text-xs ${branch.nearest_subway ? 'text-blue-600' : 'text-amber-600'}`}>
                {subwaySearchMessage}
              </p>
            ) : subwaySearchResults.length === 0 && !searchingSubway && !branch.nearest_subway ? (
              <p className="mt-1 text-xs text-amber-600">근처 지하철역을 찾을 수 없습니다</p>
            ) : null}
          </div>

          {/* 도보거리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              도보거리(분)
              <span className="text-xs text-gray-500 ml-2">(자동 계산, 15분 초과 시 대중교통)</span>
            </label>
            <input
              type="number"
              value={branch.walking_distance}
              readOnly
              placeholder="지하철역 선택 시 자동 계산됩니다"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* 외관 이미지 */}
          <div
            className={`md:col-span-2 p-4 rounded-lg border-2 border-dashed transition-colors ${hoveredSection === 'exterior' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
            onMouseEnter={() => setHoveredSection('exterior')}
            onMouseLeave={() => setHoveredSection(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoveredSection('exterior');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files && files[0] && files[0].type.startsWith('image/')) {
                await handleImageUpload(files[0], 'exterior');
              }
            }}
            onPaste={async (e) => {
              // 업로드 중이면 무시
              if (uploadInProgressRef.current.exterior) {
                e.preventDefault();
                warning('외관 이미지 업로드 중입니다. 완료 후 다시 시도해주세요.');
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
                    uploadInProgressRef.current.exterior = true;
                    try {
                      await handleImageUpload(blob, 'exterior');
                    } finally {
                      uploadInProgressRef.current.exterior = false;
                    }
                  }
                  return;
                }
                if (item.type === 'text/plain') {
                  item.getAsString((text) => {
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                      setBranch({ ...branch, exterior_image_url: text.trim() });
                      success('외관 이미지 URL이 설정되었습니다');
                    }
                  });
                }
              }
            }}
            tabIndex={0}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              외관 이미지 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(드래그앤드롭, 파일 선택, 클립보드 붙여넣기, URL 입력)</span>
            </label>
            <div className="flex gap-4 items-start flex-wrap">
              {branch.exterior_image_url ? (
                <div className="relative">
                  <img
                    src={branch.exterior_image_url}
                    alt="외관 이미지"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setBranch({ ...branch, exterior_image_url: '' })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 border border-gray-200">
                    <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">이미지 드롭</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={exteriorFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleExteriorImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => exteriorFileInputRef.current?.click()}
                  disabled={uploadingExterior}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {uploadingExterior ? '업로드 중...' : '파일 선택'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUrlModal('exterior')}
                  disabled={uploadingExterior}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  URL 입력
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              이미지를 드래그하거나, Ctrl+V로 붙여넣기하거나, 버튼을 클릭하세요
            </p>
          </div>

          {/* 내부 이미지 */}
          <div
            className={`md:col-span-2 p-4 rounded-lg border-2 border-dashed transition-colors ${hoveredSection === 'interior' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
            onMouseEnter={() => setHoveredSection('interior')}
            onMouseLeave={() => setHoveredSection(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoveredSection('interior');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              const remainingSlots = 4 - branch.interior_image_urls.length;
              if (remainingSlots <= 0) {
                warning('내부 이미지는 최대 4장까지만 등록 가능합니다.');
                return;
              }
              const filesToUpload = files.slice(0, remainingSlots);
              for (const file of filesToUpload) {
                await handleImageUpload(file, 'interior');
              }
              if (files.length > remainingSlots) {
                warning(`최대 4장까지 업로드 가능합니다. ${remainingSlots}장만 업로드되었습니다.`);
              }
            }}
            onPaste={async (e) => {
              // 업로드 중이면 무시
              if (uploadInProgressRef.current.interior) {
                e.preventDefault();
                warning('내부 이미지 업로드 중입니다. 완료 후 다시 시도해주세요.');
                return;
              }

              const items = e.clipboardData?.items;
              if (!items) return;
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (branch.interior_image_urls.length >= 4) {
                    warning('내부 이미지는 최대 4장까지만 등록 가능합니다.');
                    return;
                  }
                  const blob = item.getAsFile();
                  if (blob) {
                    uploadInProgressRef.current.interior = true;
                    try {
                      await handleImageUpload(blob, 'interior');
                    } finally {
                      uploadInProgressRef.current.interior = false;
                    }
                  }
                  return;
                }
                if (item.type === 'text/plain') {
                  item.getAsString((text) => {
                    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
                      if (branch.interior_image_urls.length >= 4) {
                        warning('내부 이미지는 최대 4장까지만 등록 가능합니다.');
                        return;
                      }
                      setBranch({ ...branch, interior_image_urls: [...branch.interior_image_urls, text.trim()] });
                      success('내부 이미지 URL이 추가되었습니다');
                    }
                  });
                }
              }
            }}
            tabIndex={0}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내부 이미지 (최대 4장) <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(드래그앤드롭, 파일 선택, 클립보드 붙여넣기, URL 입력)</span>
            </label>
            <div className="flex gap-4 flex-wrap items-start">
              {branch.interior_image_urls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`내부 이미지 ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInteriorImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 shadow"
                  >
                    ×
                  </button>
                </div>
              ))}
              {branch.interior_image_urls.length < 4 && (
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 border border-gray-200">
                    <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">이미지 드롭</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={interiorFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleInteriorImageUpload}
                      className="hidden"
                      disabled={uploadingInterior.length > 0}
                    />
                    <button
                      type="button"
                      onClick={() => interiorFileInputRef.current?.click()}
                      disabled={uploadingInterior.length > 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {uploadingInterior.length > 0 ? '업로드 중...' : '파일 선택'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenUrlModal('interior')}
                      disabled={uploadingInterior.length > 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      URL 입력
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              이미지를 드래그하거나, Ctrl+V로 붙여넣기하거나, 버튼을 클릭하세요 ({branch.interior_image_urls.length}/4)
            </p>
          </div>

          {/* 건축물대장 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용승인일(연도)
              <span className="text-xs text-gray-500 ml-2">(건축물대장 API)</span>
              {loadingBuildingInfo && (
                <span className="ml-2 text-xs text-blue-600">조회 중...</span>
              )}
            </label>
            <input
              type="number"
              value={branch.approval_year}
              onChange={(e) => setBranch({ ...branch, approval_year: e.target.value })}
              placeholder="자동 입력 또는 수동 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지상층수
              <span className="text-xs text-gray-500 ml-2">(건축물대장 API)</span>
            </label>
            <input
              type="number"
              value={branch.floors_above}
              onChange={(e) => setBranch({ ...branch, floors_above: e.target.value })}
              placeholder="자동 입력 또는 수동 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지하층수
              <span className="text-xs text-gray-500 ml-2">(건축물대장 API)</span>
            </label>
            <input
              type="number"
              value={branch.floors_below}
              onChange={(e) => setBranch({ ...branch, floors_below: e.target.value })}
              placeholder="자동 입력 또는 수동 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연면적(㎡)
              <span className="text-xs text-gray-500 ml-2">(건축물대장 API)</span>
            </label>
            <input
              type="number"
              step="any"
              value={branch.total_area}
              onChange={(e) => setBranch({ ...branch, total_area: e.target.value })}
              placeholder="자동 입력 또는 수동 입력"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 기본정보 */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기본정보 1
                <span className="text-xs text-gray-500 ml-2">(최대 100자)</span>
              </label>
              <input
                type="text"
                value={branch.basic_info_1}
                onChange={(e) => setBranch({ ...branch, basic_info_1: e.target.value })}
                placeholder="기본정보 1을 입력하세요"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기본정보 2
                <span className="text-xs text-gray-500 ml-2">(최대 100자)</span>
              </label>
              <input
                type="text"
                value={branch.basic_info_2}
                onChange={(e) => setBranch({ ...branch, basic_info_2: e.target.value })}
                placeholder="기본정보 2를 입력하세요"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기본정보 3
                <span className="text-xs text-gray-500 ml-2">(최대 100자)</span>
              </label>
              <input
                type="text"
                value={branch.basic_info_3}
                onChange={(e) => setBranch({ ...branch, basic_info_3: e.target.value })}
                placeholder="기본정보 3을 입력하세요"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </fieldset>
    );
  };

  // 작성 중인 내용 확인
  const checkUnsavedChanges = () => {
    // 필수 입력 필드 중 하나라도 값이 있으면 확인
    const hasChanges =
      newBranch.brand_id ||
      newBranch.name ||
      newBranch.address ||
      newBranch.basic_info_1 ||
      newBranch.basic_info_2 ||
      newBranch.basic_info_3 ||
      newBranch.exterior_image_url ||
      newBranch.interior_image_urls.length > 0;

    if (hasChanges) {
      return window.confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?');
    }
    return true;
  };

  const handleCloseAddModal = () => {
    if (checkUnsavedChanges()) {
      setShowAddModal(false);
      resetForm();
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">지점 관리</h1>
            <p className="text-sm text-gray-500 mt-1">지점을 추가하고 관리할 수 있습니다</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowAddModal(true);
              resetForm();
            }}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            지점 추가
          </Button>
        </div>

        {/* 필터 바 */}
        <div className="mb-6 rounded-lg border border-gray-200 shadow-sm bg-white">
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* 지점 목록 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table
              columns={columns}
              data={paginatedBranches}
              loading={loading}
              emptyMessage="등록된 지점이 없습니다"
              onRowClick={handleRowClick}
            />
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredBranches.length / itemsPerPage)}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={filteredBranches.length}
              />
            </div>
          </div>
        )}

        {/* 지점 추가 모달 */}
        <Modal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          title="지점 추가"
          size="5xl"
        >
          {renderBranchForm(newBranch, setNewBranch)}
          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              variant="outline"
              fullWidth
              onClick={handleCloseAddModal}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddBranch}
              disabled={
                submitting ||
                !newBranch.brand_id ||
                !newBranch.name ||
                !newBranch.address ||
                !newBranch.latitude ||
                !newBranch.longitude
              }
              loading={submitting}
            >
              등록
            </Button>
          </div>
        </Modal>

        {/* 지점 수정 모달 */}
        {editBranch && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditBranch(null);
              setSelectedBranch(null);
              setIsEditingMode(false);
            }}
            title={isEditingMode ? "지점 수정" : "지점 상세"}
            size="5xl"
            preventClose={isEditingMode}
            preventCloseMessage="수정 중인 내용이 있습니다. 정말 닫으시겠습니까?"
          >
            {renderBranchForm(editBranch, setEditBranch, true, !isEditingMode)}
            <div className="flex gap-3 pt-4 border-t mt-4">
              {!isEditingMode ? (
                <>
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setShowEditModal(false);
                      setEditBranch(null);
                      setSelectedBranch(null);
                      setIsEditingMode(false);
                    }}
                  >
                    닫기
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => setIsEditingMode(true)}
                  >
                    수정
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setIsEditingMode(false);
                      // 원본 데이터로 복원
                      setEditBranch({
                        ...selectedBranch,
                        brand_id: String(selectedBranch.brand?.id || selectedBranch.brand_id || ''),
                        latitude: selectedBranch.latitude?.toString() || '',
                        longitude: selectedBranch.longitude?.toString() || '',
                        walking_distance: selectedBranch.walking_distance?.toString() || '',
                        approval_year: selectedBranch.approval_year?.toString() || '',
                        floors_above: selectedBranch.floors_above?.toString() || '',
                        floors_below: selectedBranch.floors_below?.toString() || '',
                        total_area: selectedBranch.total_area?.toString() || '',
                        interior_image_urls: selectedBranch.interior_image_urls || [],
                        basic_info_1: selectedBranch.basic_info_1 || '',
                        basic_info_2: selectedBranch.basic_info_2 || '',
                        basic_info_3: selectedBranch.basic_info_3 || '',
                      });
                    }}
                    disabled={submitting}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleEditBranch}
                    disabled={
                      submitting ||
                      !editBranch.brand_id ||
                      !editBranch.name ||
                      !editBranch.address ||
                      !editBranch.latitude ||
                      !editBranch.longitude ||
                      !editBranch.nearest_subway ||
                      editBranch.walking_distance === ''
                    }
                    loading={submitting}
                  >
                    저장
                  </Button>
                </>
              )}
            </div>
          </Modal>
        )}

        {/* URL 입력 모달 */}
        <Modal
          isOpen={showUrlModal}
          onClose={() => {
            setShowUrlModal(false);
            setUrlInput('');
          }}
          title={urlInputType === 'exterior' ? '외관 이미지 URL 입력' : '내부 이미지 URL 입력'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 URL
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddImageByUrl();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput('');
                }}
              >
                취소
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddImageByUrl}
              >
                추가
              </Button>
            </div>
          </div>
        </Modal>

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="지점 삭제"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              <span className="font-semibold">{editBranch?.name}</span> 지점을 정말 삭제하시겠습니까?
            </p>
            <p className="text-sm text-red-600">
              삭제된 지점은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleDeleteBranch}
                disabled={deleting}
                loading={deleting}
              >
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default BranchManagement;
