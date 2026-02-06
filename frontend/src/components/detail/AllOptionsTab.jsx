import {
  formatPrice,
  formatCategory1,
  formatCategory2,
  formatMoveInDate,
  formatContractPeriod,
} from '../../utils/formatters';

/**
 * AllOptionsTab - 전체 공실 한 번에 보기 탭
 * 해당 지점의 모든 옵션을 요약 테이블로 표시
 *
 * @param {Array} options - 해당 지점의 전체 옵션 배열
 * @param {string} selectedOptionId - 현재 선택된 옵션 ID
 * @param {function} onSelectOption - 옵션 선택 콜백
 */
const AllOptionsTab = ({ options = [], selectedOptionId, onSelectOption }) => {
  if (options.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        등록된 옵션이 없습니다
      </div>
    );
  }

  const formatHvacType = (type) => {
    const map = { central: '중앙', individual: '개별' };
    return map[type] || '-';
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: '활성', cls: 'bg-green-100 text-green-700' },
      completed: { text: '거래완료', cls: 'bg-gray-100 text-gray-600' },
      delete_requested: { text: '삭제요청', cls: 'bg-red-100 text-red-700' },
      inactive: { text: '비활성', cls: 'bg-gray-100 text-gray-500' },
    };
    const badge = map[status] || { text: status, cls: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">전체 공실 한 번에 보기</h3>
        <span className="text-sm text-gray-500">{options.length}개 옵션</span>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">옵션명</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">분류</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600 whitespace-nowrap">인실</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 whitespace-nowrap">보증금</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 whitespace-nowrap">월임대료</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">면적</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">냉난방</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">입주</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 whitespace-nowrap">계약기간</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600 whitespace-nowrap">상태</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => {
              const optId = opt.id || opt._id;
              const isSelected = selectedOptionId === optId;

              return (
                <tr
                  key={optId}
                  onClick={() => onSelectOption(opt)}
                  className={`border-b border-gray-100 cursor-pointer transition ${
                    isSelected
                      ? 'bg-orange-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                    {opt.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {opt.category1 ? formatCategory1(opt.category1) : '-'}
                    {opt.category2 ? ` / ${formatCategory2(opt.category2)}` : ''}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {opt.capacity ? `${opt.capacity}인` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 whitespace-nowrap">
                    {opt.deposit ? `${formatPrice(opt.deposit)}원` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-orange-600 font-semibold whitespace-nowrap">
                    {opt.monthly_fee ? `${formatPrice(opt.monthly_fee)}원` : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {opt.exclusive_area?.value
                      ? `${opt.exclusive_area.value}${opt.exclusive_area.unit === 'pyeong' ? '평' : '㎡'}`
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {formatHvacType(opt.hvac_type)}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {formatMoveInDate(opt.move_in_date_type, opt.move_in_date_value)}
                  </td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                    {formatContractPeriod(opt.contract_period_type, opt.contract_period_value)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(opt.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllOptionsTab;
