import { useState, useEffect } from 'react';
import { useLeaseContract } from '../../../context/LeaseContractContext';

const TermsStep = () => {
  const { contract, updateContract, updateNestedContract, calculateBrokerage } = useLeaseContract();
  const [paymentCount, setPaymentCount] = useState(contract.terms.payments.length || 2);

  // 보증금/월차임 변경 시 중개보수 자동 계산
  useEffect(() => {
    if (contract.terms.deposit > 0 || contract.terms.monthlyRent > 0) {
      calculateBrokerage();
    }
  }, [contract.terms.deposit, contract.terms.monthlyRent, contract.brokerage.rate]);

  // 금액 포맷팅
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  // 금액 입력 처리
  const handleCurrencyChange = (path, value) => {
    const numValue = value.replace(/[^0-9]/g, '');
    updateNestedContract(path, numValue ? parseInt(numValue) : 0);
  };

  // 계약금/중도금/잔금 업데이트
  const updatePayment = (index, field, value) => {
    const newPayments = [...contract.terms.payments];
    if (!newPayments[index]) {
      newPayments[index] = { type: '', amount: 0, date: null, recipient: '' };
    }
    newPayments[index][field] = field === 'amount' ? (value ? parseInt(value.replace(/[^0-9]/g, '')) : 0) : value;
    updateNestedContract('terms.payments', newPayments);
  };

  // 계약 기간 계산
  const calculateEndDate = () => {
    if (!contract.terms.contractPeriod.startDate || !contract.terms.contractPeriod.months) return;

    const startDate = new Date(contract.terms.contractPeriod.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + contract.terms.contractPeriod.months);

    // 초일 불산입 시 하루 전으로
    if (!contract.terms.contractPeriod.includeFirstDay) {
      endDate.setDate(endDate.getDate() - 1);
    }

    updateNestedContract('terms.contractPeriod.endDate', endDate.toISOString().split('T')[0]);
  };

  // 지급 회차 추가/제거
  const handlePaymentCountChange = (count) => {
    setPaymentCount(count);
    const newPayments = [...contract.terms.payments];

    if (count > newPayments.length) {
      // 추가
      for (let i = newPayments.length; i < count; i++) {
        const types = ['down', 'middle', 'balance'];
        newPayments.push({
          type: types[i] || 'middle',
          amount: 0,
          date: null,
          recipient: '',
        });
      }
    } else {
      // 삭제
      newPayments.splice(count);
    }

    updateNestedContract('terms.payments', newPayments);
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      preliminary: '가계약금',
      down: '계약금',
      middle: '중도금',
      balance: '잔금',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* 보증금 및 차임 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">보증금 및 차임</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보증금</label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(contract.terms.deposit)}
                onChange={(e) => handleCurrencyChange('terms.deposit', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월 임대료</label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(contract.terms.monthlyRent)}
                onChange={(e) => handleCurrencyChange('terms.monthlyRent', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">임대료 지급일</label>
            <div className="relative">
              <select
                value={contract.terms.rentPayDay}
                onChange={(e) => updateNestedContract('terms.rentPayDay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[...Array(28)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    매월 {i + 1}일
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 지급 일정 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">지급 일정</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">지급 회차:</label>
            <select
              value={paymentCount}
              onChange={(e) => handlePaymentCountChange(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2회 (계약금, 잔금)</option>
              <option value={3}>3회 (계약금, 중도금, 잔금)</option>
              <option value={4}>4회 이상</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(paymentCount)].map((_, index) => {
            const payment = contract.terms.payments[index] || {};
            return (
              <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                  <select
                    value={payment.type || ''}
                    onChange={(e) => updatePayment(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="preliminary">가계약금</option>
                    <option value="down">계약금</option>
                    <option value="middle">중도금</option>
                    <option value="balance">잔금</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrency(payment.amount)}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지급일</label>
                  <input
                    type="date"
                    value={payment.date ? payment.date.split('T')[0] : ''}
                    onChange={(e) => updatePayment(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수령인</label>
                  <input
                    type="text"
                    value={payment.recipient || ''}
                    onChange={(e) => updatePayment(index, 'recipient', e.target.value)}
                    placeholder="임대인"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 합계 표시 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-900">지급 합계</span>
            <span className="text-xl font-bold text-blue-900">
              {formatCurrency(
                contract.terms.payments.reduce((sum, p) => sum + (p?.amount || 0), 0)
              )}원
            </span>
          </div>
          {contract.terms.deposit > 0 &&
            contract.terms.payments.reduce((sum, p) => sum + (p?.amount || 0), 0) !== contract.terms.deposit && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ 지급 합계가 보증금과 일치하지 않습니다
              </p>
            )}
        </div>
      </div>

      {/* 계약 기간 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">계약 기간</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={contract.terms.contractPeriod.startDate?.split('T')[0] || ''}
              onChange={(e) => {
                updateNestedContract('terms.contractPeriod.startDate', e.target.value);
                setTimeout(calculateEndDate, 100);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">계약 기간</label>
            <select
              value={contract.terms.contractPeriod.months}
              onChange={(e) => {
                updateNestedContract('terms.contractPeriod.months', parseInt(e.target.value));
                setTimeout(calculateEndDate, 100);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={12}>12개월 (1년)</option>
              <option value={24}>24개월 (2년)</option>
              <option value={36}>36개월 (3년)</option>
              <option value={60}>60개월 (5년)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={contract.terms.contractPeriod.endDate?.split('T')[0] || ''}
              onChange={(e) => updateNestedContract('terms.contractPeriod.endDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={contract.terms.contractPeriod.includeFirstDay}
                onChange={(e) => {
                  updateNestedContract('terms.contractPeriod.includeFirstDay', e.target.checked);
                  setTimeout(calculateEndDate, 100);
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">초일 산입</span>
            </label>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * 초일 불산입 시 종료일은 시작일로부터 N개월 후 전날이 됩니다 (민법 제157조)
        </p>
      </div>

      {/* 기본 조항 설정 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">기본 조항 설정</h2>

        {/* 제4조 연체 기수 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제4조 - 연체 기수 (차임 또는 관리비 연체 시 해제 기준)
          </label>
          <select
            value={contract.clauses.overdueCount}
            onChange={(e) => updateNestedContract('clauses.overdueCount', parseInt(e.target.value))}
            className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}기
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            기본값: 3기 (임차인이 차임 또는 관리비를 3기에 달하도록 연체한 경우)
          </p>
        </div>

        {/* 제9조 교부일자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제9조 - 중개대상물 확인설명서 교부일자
          </label>
          <input
            type="date"
            value={contract.clauses.deliveryDate?.split('T')[0] || ''}
            onChange={(e) => updateNestedContract('clauses.deliveryDate', e.target.value)}
            className="w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            미입력 시 계약일자로 자동 설정됩니다
          </p>
        </div>
      </div>

      {/* 중개보수 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">중개보수</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요율 (%)</label>
            <input
              type="number"
              step="0.1"
              value={contract.brokerage.rate}
              onChange={(e) => updateNestedContract('brokerage.rate', parseFloat(e.target.value) || 0.9)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">업무용: 0.9% 이내</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">중개보수</label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(contract.brokerage.amount)}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">실비</label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(contract.brokerage.expense)}
                onChange={(e) => handleCurrencyChange('brokerage.expense', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">합계</label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(contract.brokerage.total)}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-blue-50 font-semibold pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={contract.brokerage.isNegotiated}
              onChange={(e) => updateNestedContract('brokerage.isNegotiated', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">협의 금액으로 변경</span>
          </label>
          {contract.brokerage.isNegotiated && (
            <input
              type="text"
              value={contract.brokerage.negotiatedNote}
              onChange={(e) => updateNestedContract('brokerage.negotiatedNote', e.target.value)}
              placeholder="협의 내용 입력"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsStep;
