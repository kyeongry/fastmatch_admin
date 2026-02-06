import { useState, useEffect, useRef } from 'react';
import { brandAPI, branchAPI, optionAPI } from '../../services/api';
import { formatCategory1 } from '../../utils/formatters';

const CATEGORY1_OPTIONS = [
  { id: 'exclusive_floor', name: '전용층' },
  { id: 'separate_floor', name: '분리층' },
  { id: 'connected_floor', name: '연층' },
  { id: 'exclusive_room', name: '전용호실' },
  { id: 'separate_room', name: '분리호실' },
  { id: 'connected_room', name: '연접호실' },
];

const FilterBar = ({ filters, onFilterChange, pageSize, onPageSizeChange }) => {
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('filterSortBy') || 'latest';
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState(null);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [brandNames, setBrandNames] = useState({});
  const [branchNames, setBranchNames] = useState({});
  const [creatorNames, setCreatorNames] = useState({});

  const [minCapacity, setMinCapacity] = useState(filters.minCapacity || '');
  const [maxCapacity, setMaxCapacity] = useState(filters.maxCapacity || '');

  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  // 필터 상태 저장
  useEffect(() => {
    if (filters) {
      localStorage.setItem('filterState', JSON.stringify(filters));
    }
  }, [filters]);

  // 정렬 상태 저장
  useEffect(() => {
    localStorage.setItem('filterSortBy', sortBy);
  }, [sortBy]);

  // 외부 클릭 감지 (드롭다운 닫기)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 드롭다운 내부를 클릭한 경우 닫지 않음
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      
      // 드롭다운 외부 클릭 시 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveFilterType(null);
        setSearchText('');
        setSelectedIndex(-1);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 필터 옵션 데이터 로드 (카테고리는 로컬 데이터이므로 API 호출 불필요)
  useEffect(() => {
    if (activeFilterType && activeFilterType !== 'categories') {
      fetchFilterOptions();
    }
  }, [activeFilterType]);

  // 검색어 필터링 및 정렬 로직
  useEffect(() => {
    let items = [];

    if (activeFilterType === 'brands') {
      items = brands;
    } else if (activeFilterType === 'branches') {
      items = branches;
    } else if (activeFilterType === 'creators') {
      items = creators;
    } else if (activeFilterType === 'categories') {
      items = CATEGORY1_OPTIONS;
    }

    // 가나다순 정렬 (카테고리는 고정 순서 유지)
    if (activeFilterType !== 'categories') {
      items = [...items].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB, 'ko-KR');
      });
    }

    // 검색어로 리스트 필터링
    if (searchText.trim() === '') {
      setFilteredItems(items);
    } else {
      const searchLower = searchText.toLowerCase();
      setFilteredItems(
        items.filter((item) =>
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.email || '').toLowerCase().includes(searchLower) ||
          (item.address || '').toLowerCase().includes(searchLower)
        )
      );
    }
  }, [searchText, brands, branches, creators, activeFilterType]);

  // 선택된 필터 ID의 이름 조회
  useEffect(() => {
    if (
      filters.brands?.length > 0 ||
      filters.branches?.length > 0 ||
      filters.creators?.length > 0
    ) {
      fetchNames();
    }
  }, [filters.brands, filters.branches, filters.creators, creators]);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      let branchesPromise;
      if (activeFilterType === 'branches' && filters.brands && filters.brands.length > 0) {
        const branchPromises = filters.brands.map(brandId =>
          branchAPI.getAll({ brand_id: brandId })
        );
        branchesPromise = Promise.all(branchPromises).then(results => {
          const allBranches = results.flatMap(res => res.data?.branches || []);
          const uniqueBranches = allBranches.filter((branch, index, self) =>
            index === self.findIndex(b => b.id === branch.id)
          );
          return { data: { branches: uniqueBranches } };
        });
      } else {
        branchesPromise = branchAPI.getAll();
      }

      const [brandsRes, branchesRes, creatorsRes] = await Promise.all([
        brandAPI.getAll(),
        branchesPromise,
        optionAPI.getCreators(),
      ]);

      setBrands(brandsRes.data?.brands || []);
      setBranches(branchesRes.data?.branches || []);
      setCreators(creatorsRes.data?.creators || []);
    } catch (error) {
      console.error('필터 옵션 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNames = async () => {
    if (filters.brands?.length > 0) {
      for (const id of filters.brands) {
        if (!brandNames[id]) {
          try {
            const res = await brandAPI.getById(id);
            setBrandNames(prev => ({ ...prev, [id]: res.data.brand.name }));
          } catch (e) {
            setBrandNames(prev => ({ ...prev, [id]: '알 수 없는 브랜드' }));
          }
        }
      }
    }

    if (filters.branches?.length > 0) {
      for (const id of filters.branches) {
        if (!branchNames[id]) {
          try {
            const res = await branchAPI.getById(id);
            setBranchNames(prev => ({ ...prev, [id]: res.data.branch.name }));
          } catch (e) {
            setBranchNames(prev => ({ ...prev, [id]: '알 수 없는 지점' }));
          }
        }
      }
    }

    if (filters.creators?.length > 0 && creators.length > 0) {
      for (const id of filters.creators) {
        if (!creatorNames[id]) {
          const creator = creators.find(c => c.id === id);
          if (creator) {
            setCreatorNames(prev => ({ ...prev, [id]: creator.name }));
          } else {
            setCreatorNames(prev => ({ ...prev, [id]: '알 수 없는 작성자' }));
          }
        }
      }
    }
  };

  const handleToggleFilter = (type, id) => {
    const newFilters = { ...filters };
    const filterArray = newFilters[type] || [];

    if (filterArray.includes(id)) {
      newFilters[type] = filterArray.filter((item) => item !== id);
    } else {
      newFilters[type] = [...filterArray, id];
    }

    onFilterChange(newFilters);
  };

  // [수정 포인트 2] 아이템 선택 시 검색어를 초기화하지 않음 (검색 기능 유지)
  const handleItemSelect = (item) => {
    handleToggleFilter(activeFilterType, item.id);
    // setSearchText(''); // 이 줄을 삭제하여 검색어 유지
    // setSelectedIndex(-1);
    inputRef.current?.focus(); // 연속 선택을 위해 포커스 유지
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        handleItemSelect(selectedItem);
      }
    } else if (e.key === 'Escape') {
      setSearchText('');
      setSelectedIndex(-1);
      setActiveFilterType(null);
    }
  };

  const handleRemoveFilter = (type, id) => {
    const newFilters = { ...filters };
    if (type === 'brands') {
      newFilters.brands = newFilters.brands.filter((item) => item !== id);
    } else if (type === 'branches') {
      newFilters.branches = newFilters.branches.filter((item) => item !== id);
    } else if (type === 'creators') {
      newFilters.creators = newFilters.creators.filter((item) => item !== id);
    } else if (type === 'categories') {
      newFilters.categories = newFilters.categories.filter((item) => item !== id);
    }
    onFilterChange(newFilters);
  };

  const handleRefresh = () => {
    const resetFilters = {
      brands: [],
      branches: [],
      creators: [],
      categories: [],
      search: '',
      sort: sortBy,
      minCapacity: null,
      maxCapacity: null,
      refresh: Date.now(),
    };

    localStorage.removeItem('filterState');
    setBrandNames({});
    setBranchNames({});
    setCreatorNames({});
    setMinCapacity('');
    setMaxCapacity('');
    setActiveFilterType(null);
    setSearchText('');

    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const min = minCapacity ? parseInt(minCapacity, 10) : null;
      const max = maxCapacity ? parseInt(maxCapacity, 10) : null;

      if (min !== filters.minCapacity || max !== filters.maxCapacity) {
        onFilterChange({
          ...filters,
          minCapacity: min,
          maxCapacity: max,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [minCapacity, maxCapacity]);

  useEffect(() => {
    setMinCapacity(filters.minCapacity || '');
    setMaxCapacity(filters.maxCapacity || '');
  }, [filters.minCapacity, filters.maxCapacity]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    onFilterChange({ ...filters, sort: newSort });
  };

  const handleFilterTypeClick = (type) => {
    setActiveFilterType(type);
    setShowFilterDropdown(false);
    setSearchText('');
    setSelectedIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const hasFilters =
    (filters.brands?.length > 0) ||
    (filters.branches?.length > 0) ||
    (filters.creators?.length > 0) ||
    (filters.categories?.length > 0);

  const getFilterLabel = (type) => {
    if (type === 'brands') return '브랜드';
    if (type === 'branches') return '지점';
    if (type === 'creators') return '사용자';
    if (type === 'categories') return '옵션타입';
    return '';
  };

  const getPlaceholder = (type) => {
    if (type === 'brands') return '브랜드명을 입력하세요...';
    if (type === 'branches') return '지점명을 입력하세요...';
    if (type === 'creators') return '사용자명을 입력하세요...';
    if (type === 'categories') return '옵션타입을 검색하세요...';
    return '';
  };

  return (
    <div className="px-4 md:px-8 py-3 md:py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative" ref={filterDropdownRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition text-sm md:text-base flex items-center gap-2"
          >
            필터
            <svg
              className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={() => handleFilterTypeClick('brands')}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition first:rounded-t-lg"
              >
                브랜드
              </button>
              <button
                onClick={() => handleFilterTypeClick('branches')}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
              >
                지점
              </button>
              <button
                onClick={() => handleFilterTypeClick('creators')}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
              >
                사용자
              </button>
              <button
                onClick={() => handleFilterTypeClick('categories')}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-100 last:rounded-b-lg"
              >
                옵션타입
              </button>
            </div>
          )}
        </div>

        {activeFilterType && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
              <span>{getFilterLabel(activeFilterType)}</span>
              <button
                onClick={() => {
                  setActiveFilterType(null);
                  setSearchText('');
                }}
                className="text-primary-700 hover:text-primary-900"
              >
                ✕
              </button>
            </div>

            <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {loading ? (
                <div className="p-4 text-center text-gray-500">로딩 중...</div>
              ) : (
                <div>
                  <div className="p-3 border-b border-gray-200">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={getPlaceholder(activeFilterType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="p-2 max-h-96 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">
                        {searchText ? '검색 결과가 없습니다' : '항목이 없습니다'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {filteredItems.map((item, index) => (
                          // [수정 포인트 1] 영역 클릭 시 선택되도록 div로 감싸고 onClick 처리
                          <div
                            key={item.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${
                              index === selectedIndex ? 'bg-primary-100' : 'hover:bg-gray-50'
                            }`}
                            onClick={(e) => {
                              e.preventDefault(); // 기본 동작 방지
                              e.stopPropagation(); // 이벤트 전파 방지 (안전 장치)
                              handleItemSelect(item); // 선택 실행
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={filters[activeFilterType]?.includes(item.id) || false}
                              readOnly
                              // [핵심] pointer-events-none: 체크박스를 클릭해도 부모 div가 클릭된 것으로 처리됨
                              className="w-4 h-4 text-primary-500 rounded pointer-events-none"
                            />
                            <div className="flex-1 pointer-events-none">
                              <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                              {activeFilterType === 'branches' && item.address && (
                                <p className="text-xs text-gray-500">{item.address}</p>
                              )}
                              {activeFilterType === 'creators' && item.email && (
                                <p className="text-xs text-gray-500">{item.email}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleRefresh}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="새로고침"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">인원 범위:</span>
          <div className="relative">
            <input
              type="number"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
              placeholder="최소"
              min="1"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
            />
            {minCapacity && (
              <button
                onClick={() => setMinCapacity('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <span className="text-gray-400">~</span>
          <div className="relative">
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="최대"
              min="1"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
            />
            {maxCapacity && (
              <button
                onClick={() => setMaxCapacity('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {hasFilters && (
          <>
            {(filters.brands || []).map((brandId) => (
              <div
                key={`brand-${brandId}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm hover:bg-blue-200 transition"
              >
                <span>{brandNames[brandId] || brandId.substring(0, 8)}</span>
                <button
                  onClick={() => handleRemoveFilter('brands', brandId)}
                  className="text-blue-700 hover:text-blue-900 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}

            {(filters.branches || []).map((branchId) => (
              <div
                key={`branch-${branchId}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm hover:bg-green-200 transition"
              >
                <span>{branchNames[branchId] || branchId.substring(0, 8)}</span>
                <button
                  onClick={() => handleRemoveFilter('branches', branchId)}
                  className="text-green-700 hover:text-green-900 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}

            {(filters.creators || []).map((creatorId) => (
              <div
                key={`creator-${creatorId}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm hover:bg-purple-200 transition"
              >
                <span>{creatorNames[creatorId] || creatorId.substring(0, 8)}</span>
                <button
                  onClick={() => handleRemoveFilter('creators', creatorId)}
                  className="text-purple-700 hover:text-purple-900 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}

            {(filters.categories || []).map((categoryId) => (
              <div
                key={`category-${categoryId}`}
                className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs md:text-sm hover:bg-orange-200 transition"
              >
                <span>{formatCategory1(categoryId)}</span>
                <button
                  onClick={() => handleRemoveFilter('categories', categoryId)}
                  className="text-orange-700 hover:text-orange-900 font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <label className="text-gray-700 font-medium text-sm md:text-base whitespace-nowrap">정렬:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="recently_updated">업데이트순</option>
            <option value="price_low">가격 낮은순</option>
            <option value="price_high">가격 높은순</option>
            <option value="price_per_person_low">인당 평단가 낮은순</option>
            <option value="price_per_person_high">인당 평단가 높은순</option>
          </select>

          {onPageSizeChange && (
            <div className="flex items-center gap-2 ml-2 md:ml-4">
              <label className="text-gray-700 font-medium text-sm md:text-base whitespace-nowrap">표시:</label>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
