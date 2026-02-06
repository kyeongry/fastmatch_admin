import { formatPrice, formatCategory1 } from '../../utils/formatters';

/**
 * DetailLeftPanel - 좌측 탐색 패널
 * 지점 정보 요약 + 옵션 리스트 네비게이션
 *
 * @param {object} branch - 지점 정보 객체
 * @param {Array} branchOptions - 해당 지점의 옵션 리스트
 * @param {string} selectedOptionId - 현재 선택된 옵션 ID
 * @param {function} onSelectOption - 옵션 선택 콜백
 * @param {boolean} loadingOptions - 옵션 로딩 상태
 */
const DetailLeftPanel = ({
  branch,
  branchOptions = [],
  selectedOptionId,
  onSelectOption,
  loadingOptions,
}) => {
  const getStatusBadge = (status) => {
    const map = {
      active: { text: '활성', cls: 'bg-green-100 text-green-700' },
      completed: { text: '거래완료', cls: 'bg-gray-100 text-gray-600' },
      delete_requested: { text: '삭제요청', cls: 'bg-red-100 text-red-700' },
    };
    const badge = map[status] || { text: status, cls: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="w-[250px] min-w-[250px] border-r border-gray-200 bg-white flex flex-col h-full">
      {/* 지점 정보 요약 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-900 mb-1">지점 정보</h3>
        {branch ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {branch.brand?.name && (
                <span className="text-xs text-orange-600 font-medium">
                  {branch.brand.name}
                </span>
              )}
              <span className="text-sm font-semibold text-gray-800">
                {branch.name}
              </span>
            </div>
            {branch.address && (
              <p className="text-xs text-gray-500 leading-relaxed">
                {branch.address}
              </p>
            )}
            {branch.nearest_subway && (
              <p className="text-xs text-gray-500">
                {branch.nearest_subway} ({branch.is_transit ? '대중교통' : '도보'}{' '}
                {branch.is_transit ? (branch.transit_distance || branch.walking_distance) : branch.walking_distance}분)
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">지점 정보 없음</p>
        )}
      </div>

      {/* 옵션 리스트 (매물 정보) */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">매물 정보</h4>
        </div>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : branchOptions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            등록된 옵션이 없습니다
          </div>
        ) : (
          <div className="py-1">
            {branchOptions.map((opt) => {
              const optId = opt.id || opt._id;
              const isSelected = selectedOptionId === optId;

              return (
                <button
                  key={optId}
                  onClick={() => onSelectOption(opt)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition ${
                    isSelected
                      ? 'bg-orange-50 border-l-3 border-l-orange-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-orange-700' : 'text-gray-800'
                      }`}
                    >
                      {opt.name || '이름 없음'}
                    </span>
                    {getStatusBadge(opt.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {opt.category1 && (
                      <span>{formatCategory1(opt.category1)}</span>
                    )}
                    {opt.capacity && <span>{opt.capacity}인</span>}
                    {opt.monthly_fee > 0 && (
                      <span className="text-orange-600 font-medium">
                        {formatPrice(opt.monthly_fee)}원
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 옵션 수 표시 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
        <span className="text-xs text-gray-500">
          총 {branchOptions.length}개 옵션
        </span>
      </div>
    </div>
  );
};

export default DetailLeftPanel;
