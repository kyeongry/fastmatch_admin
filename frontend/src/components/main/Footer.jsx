import { useNavigate } from 'react-router-dom';

const Footer = ({ selectedCount, onClearAll, onCreateProposal }) => {
  const navigate = useNavigate();

  return (
    <div className="border-t border-gray-200 bg-white px-8 py-4 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 선택 정보 */}
        <div className="text-sm text-gray-700 flex items-center gap-2">
          <span className="font-bold text-lg text-blue-600">{selectedCount}</span>
          <span>개 옵션이 선택되었습니다</span>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onClearAll}
            className="flex-1 sm:flex-none px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            전체 해제
          </button>
          <button
            onClick={onCreateProposal}
            className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            제안서 생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
