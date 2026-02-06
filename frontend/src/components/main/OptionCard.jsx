import { useAuth } from '../../context/AuthContext';
import {
  formatPrice,
  formatDate,
  formatCategory1,
  formatCategory2,
  formatStatus
} from '../../utils/formatters';

const OptionCard = ({
  option,
  selected,
  onSelect,
  onView,
}) => {
  // 상태에 따른 배지 스타일
  const getStatusBadge = (status) => {
    if (status === 'active') return null;

    const styles = {
      delete_requested: 'bg-red-100 text-red-700',
      deleted: 'bg-gray-200 text-gray-600',
      inactive: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };

    return (
      <span className={`absolute top-3 right-3 px-2 py-1 text-xs font-bold rounded ${styles[status] || 'bg-gray-100'}`}>
        {formatStatus(status)}
      </span>
    );
  };

  // 인당 평단가 계산
  const pricePerPerson = option.capacity > 0 ? Math.round(option.monthly_fee / option.capacity) : 0;

  return (
    <div
      className={`relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition duration-300 flex flex-col h-full cursor-pointer ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
      onClick={() => onView()}
    >
      {/* 거래완료 회색 오버레이 */}
      {option.status === 'completed' && (
        <div className="absolute inset-0 bg-gray-400 bg-opacity-60 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-white text-2xl font-bold">거래완료</span>
        </div>
      )}

      {/* 상태 배지 */}
      {getStatusBadge(option.status)}

      {/* 카드 본문 */}
      <div className="flex-1 p-3 sm:p-4 hover:bg-gray-50 transition">
        {/* 체크박스 + 브랜드 - 지점 */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(!selected);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 cursor-pointer accent-blue-600 flex-shrink-0"
          />
          <div className="text-xs sm:text-sm text-gray-600 truncate">
            <span className="font-medium">{option.branch?.brand?.name}</span>
            <span className="text-gray-400 mx-1">-</span>
            <span>{option.branch?.name}</span>
          </div>
        </div>

        {/* 옵션명 */}
        <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">{option.name}</h3>

        {/* 카테고리 */}
        <div className="text-xs text-gray-500 mb-2">
          <span className="text-gray-700">{formatCategory1(option.category1)}</span>
          {option.category2 && <span className="text-gray-400 mx-1">/</span>}
          {option.category2 && <span className="text-gray-700">{formatCategory2(option.category2)}</span>}
          <span className="ml-2 font-medium text-gray-700 whitespace-nowrap">{option.capacity}인</span>
        </div>

        {/* 월사용료 (인당가) */}
        <div className="text-sm sm:text-base mb-3">
          <span className="font-semibold text-blue-600">{formatPrice(option.monthly_fee)}</span>
          {option.capacity > 0 && (
            <span className="text-xs text-gray-500 ml-1">
              (인당 {formatPrice(pricePerPerson)})
            </span>
          )}
        </div>

        {/* 등록자 <-> 등록일자 / 수정일자 */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{option.creator?.name || option.creator?.email || '-'}</span>
          <div className="text-right">
            <div>{formatDate(option.created_at)}</div>
            {option.updated_at && option.updated_at !== option.created_at && (
              <div className="text-orange-400">수정 {formatDate(option.updated_at)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionCard;
