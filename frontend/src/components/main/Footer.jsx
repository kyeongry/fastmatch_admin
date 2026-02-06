const Footer = ({ selectedCount, onClearAll, onCreateProposal }) => {
  return (
    <div className="border-t border-gray-200/80 bg-white/95 backdrop-blur-sm px-6 py-3.5 shadow-nav">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* 선택 정보 */}
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
            {selectedCount}
          </span>
          <span>개 선택됨</span>
          <button
            onClick={onClearAll}
            className="ml-1 text-gray-400 hover:text-gray-600 transition p-1 rounded-md hover:bg-gray-100"
            title="선택 해제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2.5">
          <button
            onClick={onClearAll}
            className="px-5 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            즐겨찾기
          </button>
          <button
            onClick={onCreateProposal}
            className="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-medium shadow-sm hover:shadow"
          >
            제안서 생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
