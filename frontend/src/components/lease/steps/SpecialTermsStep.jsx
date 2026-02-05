import { useState, useEffect } from 'react';
import { useLeaseContract } from '../../../context/LeaseContractContext';
import { specialTermsAPI } from '../../../services/leaseApi';

// 기본 특약 목록
const DEFAULT_TERMS = [
  {
    title: '현황임대',
    content: '본 계약은 현 시설물 상태(현장 방문 확인 완료)에서의 임대차 계약이다. 임대인은 잔금 지급일 전까지 현재의 시설 상태를 유지하여야 하며, 중대한 하자가 발생할 경우 이를 즉시 보수하여야 한다.',
  },
  {
    title: '임대면적',
    content: '임대할 부분의 면적은 공부상의 면적을 기준으로 한다.',
  },
  {
    title: '관리비',
    content: '고정 관리비는 월 금 ___원(부가세 별도)이며, 매월 임대료 지급일에 선납한다. 관리비 범위: 공용부 청소, 승강기 유지비 등 건물 관리 일체',
  },
  {
    title: '중도해지',
    content: '계약 기간 중 임차인의 사정으로 중도 해지할 경우, 임차인이 신규 임차인을 주선하여 임대인의 승인 하에 임대차 계약이 체결되고(임대인은 정당한 사유 없이 거절하지 않음), 중개보수 등 제반 비용을 부담하는 조건으로 계약을 해지할 수 있다. 단, 신규 임차인의 계약이 개시되기 전까지의 월 차임 및 관리비는 현 임차인이 부담한다.',
  },
  {
    title: '주차',
    content: '주차는 기계식 주차 1대를 무료로 제공한다.(단, 기계식 주차장에 입고 불가능한 차량의 경우 외부 주차 등을 임차인이 자체 해결해야 하며, 이에 대해 임대인은 책임지지 않는다.) 추가 주차 필요 시 협의 하에 월 ___원(부가세 별도)으로 추가할 수 있다.',
  },
];

const SpecialTermsStep = () => {
  const {
    contract,
    updateContract,
    searchSpecialTerms,
    generateSpecialTerms,
    addCustomTerm,
    removeCustomTerm,
    toggleStandardTerm,
    searchedTerms,
    generatedTerms,
    isLoading,
  } = useLeaseContract();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [aiSituation, setAiSituation] = useState('');
  const [manualTerm, setManualTerm] = useState('');
  const [activeTab, setActiveTab] = useState('standard'); // standard | search | ai | manual

  // 검색 실행
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    await searchSpecialTerms(searchKeyword);
  };

  // AI 특약 생성
  const handleGenerate = async () => {
    if (!aiSituation.trim()) return;
    await generateSpecialTerms(aiSituation);
  };

  // 수동 입력 특약 추가
  const handleAddManual = () => {
    if (!manualTerm.trim()) return;
    addCustomTerm({
      content: manualTerm,
      source: 'manual',
      keywords: [],
    });
    setManualTerm('');
  };

  // 검색/AI 결과에서 특약 추가
  const handleAddTerm = (term, source) => {
    addCustomTerm({
      content: term.content || term,
      source,
      keywords: term.keywords || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* 기본 특약 선택 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">기본 특약 선택</h2>
        <p className="text-sm text-gray-500 mb-4">
          자주 사용하는 기본 특약을 선택하세요. 선택한 특약은 계약서에 자동으로 포함됩니다.
        </p>

        <div className="space-y-3">
          {DEFAULT_TERMS.map((term) => (
            <label
              key={term.title}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                contract.specialTerms.standardTerms.includes(term.title)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={contract.specialTerms.standardTerms.includes(term.title)}
                onChange={() => toggleStandardTerm(term.title)}
                className="w-5 h-5 mt-0.5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{term.title}</span>
                <p className="text-sm text-gray-600 mt-1">{term.content}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 추가 특약 입력 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">추가 특약</h2>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-4 border-b">
          {[
            { id: 'search', label: '키워드 검색' },
            { id: 'ai', label: 'AI 생성' },
            { id: 'manual', label: '직접 입력' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 키워드 검색 */}
        {activeTab === 'search' && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="키워드로 특약 검색 (예: 원상복구, 인테리어, 보증금)"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>

            {/* 검색 결과 */}
            {searchedTerms.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">검색 결과 {searchedTerms.length}건</p>
                {searchedTerms.map((term, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{term.title}</span>
                      <button
                        onClick={() => handleAddTerm(term, 'existing')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + 추가
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">{term.content}</p>
                    {term.keywords?.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {term.keywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI 생성 */}
        {activeTab === 'ai' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상황 설명
              </label>
              <textarea
                value={aiSituation}
                onChange={(e) => setAiSituation(e.target.value)}
                placeholder="특약이 필요한 상황을 설명해주세요. 예: 임차인이 인테리어 공사를 원하는 경우, 반려동물 동반 입주, 주차 공간 추가 배정 등"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !aiSituation.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'AI 생성 중...' : '✨ AI로 특약 생성'}
            </button>

            {/* AI 생성 결과 */}
            {generatedTerms && (
              <div className="mt-4 space-y-4">
                <p className="text-sm font-medium text-gray-700">AI 생성 결과 (3가지 버전)</p>

                {/* 임대인 유리 */}
                <div className="p-4 border-l-4 border-orange-400 bg-orange-50 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-orange-800">임대인 유리 버전</span>
                    <button
                      onClick={() => handleAddTerm(generatedTerms.lessor, 'ai')}
                      className="text-orange-600 hover:text-orange-800 text-sm"
                    >
                      + 추가
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{generatedTerms.lessor.content}</p>
                </div>

                {/* 임차인 유리 */}
                <div className="p-4 border-l-4 border-green-400 bg-green-50 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-green-800">임차인 유리 버전</span>
                    <button
                      onClick={() => handleAddTerm(generatedTerms.lessee, 'ai')}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      + 추가
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{generatedTerms.lessee.content}</p>
                </div>

                {/* 중립 (권장) */}
                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-blue-800">중립 버전 (권장)</span>
                    <button
                      onClick={() => handleAddTerm(generatedTerms.neutral, 'ai')}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + 추가
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{generatedTerms.neutral.content}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 직접 입력 */}
        {activeTab === 'manual' && (
          <div>
            <textarea
              value={manualTerm}
              onChange={(e) => setManualTerm(e.target.value)}
              placeholder="특약 내용을 직접 입력하세요"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleAddManual}
              disabled={!manualTerm.trim()}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              특약 추가
            </button>
          </div>
        )}
      </div>

      {/* 추가된 특약 목록 */}
      {contract.specialTerms.customTerms.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            추가된 특약 ({contract.specialTerms.customTerms.length}건)
          </h2>
          <div className="space-y-3">
            {contract.specialTerms.customTerms.map((term, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      term.source === 'ai'
                        ? 'bg-purple-100 text-purple-700'
                        : term.source === 'existing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {term.source === 'ai' ? 'AI 생성' : term.source === 'existing' ? '라이브러리' : '직접 입력'}
                  </span>
                  <button
                    onClick={() => removeCustomTerm(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
                <p className="text-sm text-gray-700">{term.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 별지 사용 여부 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={contract.specialTerms.useAppendix}
            onChange={(e) =>
              updateContract({
                specialTerms: {
                  ...contract.specialTerms,
                  useAppendix: e.target.checked,
                },
              })
            }
            className="w-5 h-5 text-blue-600 rounded"
          />
          <div>
            <span className="font-medium text-gray-900">특약사항 별지 사용</span>
            <p className="text-sm text-gray-500">
              특약이 많을 경우 별도 페이지로 출력합니다
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default SpecialTermsStep;
