import { useAuth } from '../../context/AuthContext';
import {
  formatPrice,
  formatDate,
  formatCategory1,
  formatCategory2,
  formatMoveInDate,
  formatContractPeriod,
  formatStatus
} from '../../utils/formatters';

const OptionListItem = ({
  option,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const isOwner = user && user.id === option.creator_id;
  const isAdmin = user && user.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

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
      <span className={`px-2 py-0.5 text-xs font-bold rounded ${styles[status] || 'bg-gray-100'}`}>
        {formatStatus(status)}
      </span>
    );
  };

  return (
    <div
      className={`relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition duration-200 ${
        selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
      } ${option.status === 'completed' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center">
        {/* 체크박스 */}
        <div className="pl-4 pr-2 py-4 flex-shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(!selected);
            }}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600"
          />
        </div>

        {/* 메인 콘텐츠 - 클릭 시 상세 보기 */}
        <div
          onClick={() => onView()}
          className="flex-1 flex items-center gap-4 py-3 pr-4 cursor-pointer hover:bg-gray-50 transition min-w-0"
        >
          {/* 브랜드/지점 */}
          <div className="w-32 lg:w-40 flex-shrink-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {option.branch?.brand?.name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {option.branch?.name}
            </div>
          </div>

          {/* 옵션명 & 카테고리 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {option.name}
              </h3>
              {getStatusBadge(option.status)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatCategory1(option.category1)}
              {option.category2 && ` / ${formatCategory2(option.category2)}`}
              <span className="ml-2 font-medium">{option.capacity}인</span>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="w-32 lg:w-40 flex-shrink-0 text-right">
            <div className="text-sm font-semibold text-blue-600">
              {formatPrice(option.monthly_fee)}
            </div>
            <div className="text-xs text-gray-500">
              보증금 {formatPrice(option.deposit)}
            </div>
            {option.capacity > 0 && (
              <div className="text-xs text-gray-400">
                인당 {formatPrice(Math.round(option.monthly_fee / option.capacity))}
              </div>
            )}
          </div>

          {/* 입주일/계약기간 */}
          <div className="hidden lg:block w-36 flex-shrink-0 text-xs text-gray-600">
            <div className="truncate">{formatMoveInDate(option.move_in_date_type, option.move_in_date_value)}</div>
            <div className="truncate">{formatContractPeriod(option.contract_period_type, option.contract_period_value)}</div>
          </div>

          {/* 생성일 / 수정일 */}
          <div className="hidden md:block w-28 flex-shrink-0 text-xs text-gray-400 text-right">
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

export default OptionListItem;
