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

const OptionCard = ({
  option,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onComplete,
  onReactivate,
}) => {
  const { user } = useAuth();
  const isOwner = user && user.id === option.creator_id;
  const isAdmin = user && user.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;
  const canComplete = isOwner || isAdmin;
  const canReactivate = isOwner || isAdmin;

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

  return (
    <div className={`relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition duration-300 flex flex-col h-full ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
      {/* 거래완료 회색 오버레이 */}
      {option.status === 'completed' && (
        <div className="absolute inset-0 bg-gray-400 bg-opacity-60 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-white text-2xl font-bold">거래완료</span>
        </div>
      )}

      {/* 체크박스 (좌측 상단) */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(!selected);
          }}
          className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 cursor-pointer accent-blue-600"
        />
      </div>

      {/* 상태 배지 */}
      {getStatusBadge(option.status)}

      {/* 카드 본문 */}
      <div
        onClick={() => onView()}
        className="flex-1 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition pt-10"
      >
        {/* 브랜드 - 지점 */}
        <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate pr-16">
          <span className="font-medium">{option.branch?.brand?.name}</span> <span className="text-gray-400">-</span> {option.branch?.name}
        </div>

        {/* 옵션명 */}
        <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">{option.name}</h3>

        {/* 카테고리 */}
        <div className="text-xs text-gray-500 mb-2 sm:mb-3">
          <span className="text-gray-700">{formatCategory1(option.category1)}</span>
          {option.category2 && <span className="text-gray-400 mx-1">/</span>}
          {option.category2 && <span className="text-gray-700">{formatCategory2(option.category2)}</span>}
          <span className="ml-2 font-medium text-gray-700 whitespace-nowrap">{option.capacity}인</span>
        </div>

        {/* 가격 정보 */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 text-xs sm:text-sm">
          <div className="text-gray-700">
            <span className="font-medium">💰</span> <span className="font-semibold text-blue-600">{formatPrice(option.monthly_fee)}</span>
          </div>
          <div className="text-gray-600 text-xs">
            보증금 <span className="font-semibold">{formatPrice(option.deposit)}</span>
          </div>
        </div>

        {/* 계약 정보 */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 text-xs text-gray-600">
          <div>📅 {formatMoveInDate(option.move_in_date_type, option.move_in_date_value)}</div>
          <div>📝 {formatContractPeriod(option.contract_period_type, option.contract_period_value)}</div>
        </div>

        {/* 생성일 */}
        <div className="text-xs text-gray-400">
          {formatDate(option.created_at)}
        </div>
      </div>

      {/* 버튼 */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 flex flex-col gap-2">
        {canEdit || canDelete || canComplete || canReactivate ? (
          <>
            <div className="flex gap-2">
              {canEdit && option.status !== 'completed' && option.status !== 'delete_requested' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="flex-1 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition active:scale-95"
                >
                  수정
                </button>
              )}
              {canDelete && option.status !== 'completed' && option.status !== 'delete_requested' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className={`${canEdit && option.status !== 'completed' && option.status !== 'delete_requested' ? 'flex-1' : 'w-full'} px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-red-100 text-red-700 font-medium rounded hover:bg-red-200 transition active:scale-95`}
                >
                  {isAdmin && !isOwner ? '삭제 (관리자)' : '삭제'}
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="w-full px-3 py-1 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition active:scale-95"
          >
            상세 보기
          </button>
        )}
      </div>
    </div>
  );
};

export default OptionCard;
