/**
 * InfoTable - 구조화된 키-값 테이블 컴포넌트
 * 상세 정보를 2열 테이블 형태로 표시
 *
 * @param {string} title - 섹션 제목
 * @param {Array<{label: string, value: any, highlight?: boolean, colSpan?: boolean}>} rows - 테이블 행 데이터
 * @param {React.ReactNode} [headerRight] - 제목 우측 추가 요소
 */
const InfoTable = ({ title, rows, headerRight }) => {
  if (!rows || rows.length === 0) return null;

  // 2열 레이아웃: rows를 2개씩 짝지어 렌더링
  const renderRows = () => {
    const result = [];
    let i = 0;

    while (i < rows.length) {
      const row = rows[i];
      if (!row) { i++; continue; }

      // colSpan이 true이면 한 행에 하나의 항목만 표시
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
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
        <tbody>
          {renderRows()}
        </tbody>
      </table>
    </div>
  );
};

export default InfoTable;
