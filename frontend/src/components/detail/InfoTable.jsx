/**
 * InfoTable - 구조화된 키-값 테이블 컴포넌트
 * PC: 2열 테이블 형태, 모바일: 세로 카드 레이아웃
 *
 * @param {string} title - 섹션 제목
 * @param {Array<{label: string, value: any, highlight?: boolean, colSpan?: boolean}>} rows - 테이블 행 데이터
 * @param {React.ReactNode} [headerRight] - 제목 우측 추가 요소
 */
const InfoTable = ({ title, rows, headerRight }) => {
  if (!rows || rows.length === 0) return null;

  // PC용 2열 레이아웃
  const renderDesktopRows = () => {
    const result = [];
    let i = 0;

    while (i < rows.length) {
      const row = rows[i];
      if (!row || typeof row !== 'object') { i++; continue; }

      if (row.colSpan) {
        result.push(
          <tr key={i} className="border-b border-gray-100">
            <td className="py-3 px-4 text-sm text-gray-500 font-medium bg-gray-50 w-[140px] whitespace-nowrap align-top">
              {row.label}
            </td>
            <td colSpan={3} className="py-3 px-4 text-sm text-gray-900 whitespace-pre-wrap">
              {row.value || '-'}
            </td>
          </tr>
        );
        i++;
      } else {
        const nextRow = (i + 1 < rows.length && !rows[i + 1]?.colSpan) ? rows[i + 1] : null;
        result.push(
          <tr key={i} className="border-b border-gray-100">
            <td className="py-3 px-4 text-sm text-gray-500 font-medium bg-gray-50 w-[140px] whitespace-nowrap align-top">
              {row.label}
            </td>
            <td className={`py-3 px-4 text-sm ${row.highlight ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
              {row.value || '-'}
            </td>
            {nextRow ? (
              <>
                <td className="py-3 px-4 text-sm text-gray-500 font-medium bg-gray-50 w-[140px] whitespace-nowrap align-top">
                  {nextRow.label}
                </td>
                <td className={`py-3 px-4 text-sm ${nextRow.highlight ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
                  {nextRow.value || '-'}
                </td>
              </>
            ) : (
              <>
                <td className="bg-gray-50 w-[140px]"></td>
                <td></td>
              </>
            )}
          </tr>
        );
        i += nextRow ? 2 : 1;
      }
    }

    return result;
  };

  return (
    <div className="mb-6">
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}

      {/* 모바일: 세로 카드 레이아웃 */}
      <div className="sm:hidden border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
        {rows.map((row, idx) => {
          if (!row || typeof row !== 'object') return null;
          return (
            <div key={idx} className="px-4 py-3">
              <div className="text-xs text-gray-500 font-medium mb-1">{row.label}</div>
              <div className={`text-sm ${row.highlight ? 'text-orange-600 font-semibold' : 'text-gray-900'} whitespace-pre-wrap`}>
                {row.value || '-'}
              </div>
            </div>
          );
        })}
      </div>

      {/* PC: 2열 테이블 레이아웃 */}
      <table className="hidden sm:table w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
        <tbody>
          {renderDesktopRows()}
        </tbody>
      </table>
    </div>
  );
};

export default InfoTable;
