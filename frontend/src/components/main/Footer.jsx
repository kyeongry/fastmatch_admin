const Footer = ({ selectedCount, onClearAll, onCreateProposal }) => {
  return (
    <div className="border-t border-gray-200 bg-white px-8 py-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 선택 정보 */}
        <div className="text-sm text-gray-700 flex items-center gap-2">
          선택 <span className="font-bold text-lg text-orange-500">{selectedCount}</span>개
          <button
            onClick={onClearAll}
            className="ml-1 text-gray-400 hover:text-gray-600"
            title="선택 해제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onClearAll}
            className="flex-1 sm:flex-none px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            즐겨찾기
          </button>
          <button
            onClick={onCreateProposal}
            className="flex-1 sm:flex-none px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            제안서 생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
