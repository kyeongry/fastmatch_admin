import { memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  formatPrice,
  formatDate,
  formatCategory1,
  formatCategory2,
  formatStatus
} from '../../utils/formatters';

const OptionCard = memo(({
  option,
  selected,
  onSelect,
  onView,
}) => {
  const getStatusBadge = (status) => {
    if (status === 'active') return null;

    const styles = {
      delete_requested: 'bg-red-50 text-red-600 border-red-100',
      deleted: 'bg-gray-100 text-gray-500 border-gray-200',
      inactive: 'bg-amber-50 text-amber-600 border-amber-100',
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };

    return (
      <span className={`absolute top-3 right-3 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${styles[status] || 'bg-gray-100'}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const pricePerPerson = option.capacity > 0 ? Math.round(option.monthly_fee / option.capacity) : 0;

  return (
    <div
      className={`relative bg-white border rounded-xl overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col h-full cursor-pointer group ${selected ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200 hover:border-gray-300'}`}
      onClick={() => onView()}
    >
      {option.status === 'completed' && (
        <div className="absolute inset-0 bg-gray-500/50 z-20 flex items-center justify-center pointer-events-none rounded-xl">
          <span className="text-white text-xl font-bold px-4 py-1.5 bg-black/30 rounded-lg backdrop-blur-sm">거래완료</span>
        </div>
      )}

      {getStatusBadge(option.status)}

      <div className="flex-1 p-4">
        {/* 체크박스 + 브랜드 - 지점 */}
        <div className="flex items-center gap-2.5 mb-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(!selected);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
          />
          <div className="text-xs text-gray-500 truncate">
            <span className="font-semibold text-gray-700">{option.branch?.brand?.name}</span>
            <span className="text-gray-300 mx-1">/</span>
            <span>{option.branch?.name}</span>
          </div>
        </div>

        {/* 옵션명 */}
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">{option.name}</h3>

        {/* 카테고리 태그 */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">
            {formatCategory1(option.category1)}
          </span>
          {option.category2 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-medium text-gray-600">
              {formatCategory2(option.category2)}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-[11px] font-semibold text-primary-600">
            {option.capacity}인
          </span>
        </div>

        {/* 가격 */}
        <div className="mb-3">
          <span className="text-base font-bold text-gray-900">{formatPrice(option.monthly_fee)}</span>
          <span className="text-xs text-gray-400 ml-0.5">원</span>
          {option.capacity > 0 && (
            <span className="text-xs text-gray-400 ml-1.5">
              (인당 {formatPrice(pricePerPerson)})
            </span>
          )}
        </div>

        {/* 등록자 / 등록일 */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-100">
          <span className="truncate max-w-[50%]">{option.creator?.name || option.creator?.email || '-'}</span>
          <div className="text-right">
            <div>{formatDate(option.created_at)}</div>
            {option.updated_at && option.updated_at !== option.created_at && (
              <div className="text-primary-400">수정 {formatDate(option.updated_at)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OptionCard.displayName = 'OptionCard';

export default OptionCard;
