import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeaseContract } from '../../../context/LeaseContractContext';

const PreviewStep = () => {
  const navigate = useNavigate();
  const { contract, completeContract, isLoading, error } = useLeaseContract();
  const [isCompleting, setIsCompleting] = useState(false);

  // 금액 포맷팅
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('ko-KR').format(value) + '원';
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 계약서 완료 처리
  const handleComplete = async () => {
    if (!window.confirm('계약서를 완료하시겠습니까? 완료 후에는 수정이 제한됩니다.')) return;

    setIsCompleting(true);
    try {
      await completeContract();
      alert('계약서가 완료되었습니다. PDF를 다운로드할 수 있습니다.');
      navigate('/lease');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  // 섹션 컴포넌트
  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow mb-4">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  // 정보 행 컴포넌트
  const InfoRow = ({ label, value, highlight }) => (
    <div className="flex py-2 border-b last:border-0">
      <span className="w-1/3 text-gray-600 text-sm">{label}</span>
      <span className={`w-2/3 text-sm ${highlight ? 'font-semibold text-blue-600' : 'text-gray-900'}`}>
        {value || '-'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 미리보기 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">계약서 미리보기</h2>
        <p className="text-blue-100">
          작성된 내용을 확인하고 계약서를 완료하세요. 완료 후 PDF가 생성됩니다.
        </p>
        {contract.contractNumber && (
          <p className="mt-2 font-mono text-sm bg-blue-700/50 inline-block px-3 py-1 rounded">
            {contract.contractNumber}
          </p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* 1. 물건 정보 */}
      <Section title="1. 물건 정보">
        <InfoRow label="소재지" value={contract.property.address} highlight />
        <InfoRow
          label="임대 층/면적"
          value={`${contract.property.building.leaseFloor || '-'} / ${contract.property.building.leaseArea || '-'}㎡`}
        />
        <InfoRow label="건물 용도" value={contract.property.building.usage} />
        <InfoRow label="건물 구조" value={contract.property.building.structure} />
        <InfoRow label="준공년도" value={contract.property.building.completionYear} />

        {/* 권리관계 경고 */}
        {contract.registry.encumbrances.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ 소유권 외 권리</h4>
            {contract.registry.encumbrances.map((enc, idx) => (
              <div key={idx} className="text-sm text-yellow-700">
                {enc.type}: {enc.holder} - {formatCurrency(enc.amount)}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 2. 당사자 정보 */}
      <Section title="2. 당사자 정보">
        <div className="grid grid-cols-2 gap-6">
          {/* 임대인 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">임대인</h4>
            {contract.parties.lessors.map((lessor, idx) => (
              <div key={idx} className="p-3 bg-orange-50 rounded-lg mb-2">
                <p className="font-medium">{lessor.name}</p>
                {lessor.representative && (
                  <p className="text-sm text-gray-600">대표: {lessor.representative}</p>
                )}
                <p className="text-sm text-gray-600">{lessor.address}</p>
                <p className="text-sm text-gray-500">
                  {lessor.type === 'business' ? '사업자' : '개인'} / {lessor.idNumber}
                </p>
              </div>
            ))}
          </div>

          {/* 임차인 */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">임차인</h4>
            {contract.parties.lessees.map((lessee, idx) => (
              <div key={idx} className="p-3 bg-green-50 rounded-lg mb-2">
                <p className="font-medium">{lessee.name}</p>
                {lessee.representative && (
                  <p className="text-sm text-gray-600">대표: {lessee.representative}</p>
                )}
                <p className="text-sm text-gray-600">{lessee.address}</p>
                <p className="text-sm text-gray-500">
                  {lessee.type === 'business' ? '사업자' : '개인'} / {lessee.idNumber}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 공동중개 */}
        {contract.jointBrokerage.enabled && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">공동중개</h4>
            <p className="text-sm">{contract.jointBrokerage.broker.officeName}</p>
            <p className="text-sm text-gray-600">{contract.jointBrokerage.broker.officeAddress}</p>
          </div>
        )}
      </Section>

      {/* 3. 계약 조건 */}
      <Section title="3. 계약 조건">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">보증금</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(contract.terms.deposit)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">월 임대료</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(contract.terms.monthlyRent)}
            </p>
          </div>
        </div>

        <InfoRow
          label="계약 기간"
          value={`${formatDate(contract.terms.contractPeriod.startDate)} ~ ${formatDate(contract.terms.contractPeriod.endDate)} (${contract.terms.contractPeriod.months}개월)`}
        />
        <InfoRow label="임대료 지급일" value={`매월 ${contract.terms.rentPayDay}일`} />

        {/* 지급 일정 */}
        {contract.terms.payments.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">지급 일정</h4>
            <div className="space-y-2">
              {contract.terms.payments.map((payment, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">
                    {payment.type === 'down' && '계약금'}
                    {payment.type === 'middle' && '중도금'}
                    {payment.type === 'balance' && '잔금'}
                    {payment.type === 'preliminary' && '가계약금'}
                  </span>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  <span className="text-sm text-gray-500">{formatDate(payment.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 중개보수 */}
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">중개보수</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">요율</p>
              <p className="font-medium">{contract.brokerage.rate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">중개보수</p>
              <p className="font-medium">{formatCurrency(contract.brokerage.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">합계</p>
              <p className="font-bold text-purple-600">{formatCurrency(contract.brokerage.total)}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. 특약사항 */}
      <Section title="4. 특약사항">
        {/* 기본 특약 */}
        {contract.specialTerms.standardTerms.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">선택된 기본 특약</h4>
            <div className="flex flex-wrap gap-2">
              {contract.specialTerms.standardTerms.map((term) => (
                <span key={term} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 추가 특약 */}
        {contract.specialTerms.customTerms.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">추가 특약</h4>
            <div className="space-y-2">
              {contract.specialTerms.customTerms.map((term, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <span
                    className={`text-xs px-2 py-0.5 rounded mr-2 ${
                      term.source === 'ai'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {term.source === 'ai' ? 'AI' : term.source === 'existing' ? '라이브러리' : '직접입력'}
                  </span>
                  <p className="text-sm mt-1">{term.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {contract.specialTerms.useAppendix && (
          <p className="mt-4 text-sm text-gray-500">※ 특약사항은 별지로 출력됩니다</p>
        )}
      </Section>

      {/* 5. 확인설명서 요약 */}
      <Section title="5. 확인설명서 (비주거용)">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="실제 토지 이용상태" value={contract.confirmation.actualLandUse} />
          <InfoRow label="실제 건물 이용상태" value={contract.confirmation.actualBuildingUse} />
          <InfoRow
            label="민간임대 등록"
            value={
              contract.confirmation.privateRental.type === 'none'
                ? '미등록'
                : contract.confirmation.privateRental.type
            }
          />
          <InfoRow
            label="계약갱신요구권"
            value={
              contract.confirmation.renewalRight.status === 'confirmed'
                ? '확인됨'
                : contract.confirmation.renewalRight.status === 'unconfirmed'
                ? '미확인'
                : '해당없음'
            }
          />
        </div>

        {/* 소방설비 확인 */}
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">🔥 소방설비</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">소화전: </span>
              <span className="text-sm font-medium">
                {contract.confirmation.facilities.fire.firePlug.exists
                  ? `있음 (${contract.confirmation.facilities.fire.firePlug.location || '위치 미입력'})`
                  : '없음'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">비상벨: </span>
              <span className="text-sm font-medium">
                {contract.confirmation.facilities.fire.emergencyBell.exists
                  ? `있음 (${contract.confirmation.facilities.fire.emergencyBell.location || '위치 미입력'})`
                  : '없음'}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* 완료 버튼 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">계약서 완료</h3>
            <p className="text-sm text-gray-500">
              모든 내용을 확인했다면 계약서를 완료하세요. PDF가 자동으로 생성됩니다.
            </p>
          </div>
          <button
            onClick={handleComplete}
            disabled={isLoading || isCompleting}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isCompleting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                PDF 생성 중...
              </span>
            ) : (
              '✅ 계약서 완료 및 PDF 생성'
            )}
          </button>
        </div>
      </div>

      {/* 출력 구성 안내 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">📄 PDF 출력 구성</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 임대차 계약서 (2페이지)</li>
          {(contract.parties.lessors.length > 1 || contract.parties.lessees.length > 1) && (
            <li>• 당사자 별지 (공동명의)</li>
          )}
          {contract.specialTerms.useAppendix && <li>• 특약사항 별지</li>}
          <li>• 확인설명서 - 비주거용 [별지 제20호의2서식] (4페이지)</li>
          <li>• 보증보험증권</li>
          <li>• 개인정보 수집동의서</li>
        </ul>
      </div>
    </div>
  );
};

export default PreviewStep;
