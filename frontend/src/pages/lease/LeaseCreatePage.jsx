import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLeaseContract, CONTRACT_STEPS } from '../../context/LeaseContractContext';

// Step Components
import PropertyStep from '../../components/lease/steps/PropertyStep';
import PartiesStep from '../../components/lease/steps/PartiesStep';
import TermsStep from '../../components/lease/steps/TermsStep';
import SpecialTermsStep from '../../components/lease/steps/SpecialTermsStep';
import ConfirmationStep from '../../components/lease/steps/ConfirmationStep';
import PreviewStep from '../../components/lease/steps/PreviewStep';

const STEP_LABELS = {
  [CONTRACT_STEPS.PROPERTY]: '물건 정보',
  [CONTRACT_STEPS.PARTIES]: '당사자 정보',
  [CONTRACT_STEPS.TERMS]: '계약 조건',
  [CONTRACT_STEPS.SPECIAL_TERMS]: '특약사항',
  [CONTRACT_STEPS.CONFIRMATION]: '확인설명서',
  [CONTRACT_STEPS.PREVIEW]: '미리보기',
};

const LeaseCreatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    currentStep,
    contract,
    isLoading,
    error,
    goToStep,
    nextStep,
    prevStep,
    loadContract,
    resetContract,
    saveContract,
  } = useLeaseContract();

  // 수정 모드: 기존 계약서 불러오기
  useEffect(() => {
    if (id) {
      loadContract(id);
    } else {
      resetContract();
    }
  }, [id]);

  // 현재 스텝 컴포넌트 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case CONTRACT_STEPS.PROPERTY:
        return <PropertyStep />;
      case CONTRACT_STEPS.PARTIES:
        return <PartiesStep />;
      case CONTRACT_STEPS.TERMS:
        return <TermsStep />;
      case CONTRACT_STEPS.SPECIAL_TERMS:
        return <SpecialTermsStep />;
      case CONTRACT_STEPS.CONFIRMATION:
        return <ConfirmationStep />;
      case CONTRACT_STEPS.PREVIEW:
        return <PreviewStep />;
      default:
        return null;
    }
  };

  // 임시 저장
  const handleSave = async () => {
    try {
      await saveContract();
      alert('저장되었습니다');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {id ? '계약서 수정' : '새 계약서 작성'}
              </h1>
              {contract.contractNumber && (
                <p className="text-sm text-gray-500 font-mono">
                  {contract.contractNumber}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                임시저장
              </button>
              <button
                onClick={() => navigate('/lease')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                목록으로
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {Object.entries(STEP_LABELS).map(([step, label], index) => {
              const stepNum = parseInt(step);
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;

              return (
                <div key={step} className="flex items-center">
                  {index > 0 && (
                    <div
                      className={`w-16 h-0.5 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <button
                    onClick={() => goToStep(stepNum)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        isActive
                          ? 'bg-white text-blue-600'
                          : isCompleted
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : stepNum}
                    </span>
                    <span className="text-sm font-medium hidden md:inline">
                      {label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* 스텝 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">처리 중...</p>
          </div>
        ) : (
          renderStepContent()
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === CONTRACT_STEPS.PROPERTY}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === CONTRACT_STEPS.PREVIEW}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === CONTRACT_STEPS.PREVIEW ? '완료' : '다음 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseCreatePage;
