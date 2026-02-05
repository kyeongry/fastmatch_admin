import { createContext, useContext, useState, useCallback } from 'react';
import { contractAPI, registryAPI, specialTermsAPI } from '../services/leaseApi';

const LeaseContractContext = createContext();

export const useLeaseContract = () => {
  const context = useContext(LeaseContractContext);
  if (!context) {
    throw new Error('useLeaseContract는 LeaseContractProvider 내에서만 사용 가능합니다');
  }
  return context;
};

// 계약서 작성 단계
export const CONTRACT_STEPS = {
  PROPERTY: 1,      // 물건 정보 (등기부 추출)
  PARTIES: 2,       // 당사자 정보
  TERMS: 3,         // 계약 조건
  SPECIAL_TERMS: 4, // 특약사항
  CONFIRMATION: 5,  // 확인설명서
  PREVIEW: 6,       // 미리보기 및 완료
};

// 초기 계약서 상태
const initialContractState = {
  // 기본 정보
  contractNumber: '',
  status: 'draft',

  // STEP 1: 물건 정보
  property: {
    address: '',
    land: {
      category: '',
      area: 0,
      rightType: '',
      rightRatio: '',
    },
    building: {
      structure: '',
      usage: '',
      totalArea: 0,
      leaseFloor: '',
      leaseArea: 0,
      completionYear: null,
      direction: '',
      seismicDesign: false,
      seismicCapacity: '',
      isViolation: false,
      violationContent: '',
    },
  },

  // 등기부 정보
  registry: {
    owners: [],
    encumbrances: [],
  },

  // STEP 2: 당사자 정보 (기본: 법인/사업자)
  parties: {
    lessors: [{
      type: 'business',
      name: '',
      idNumber: '',
      corpRegNumber: '',
      address: '',
      phone: '',
      representative: '',
      role: 'owner',
      isRepresentative: true,
    }],
    lessees: [{
      type: 'business',
      name: '',
      idNumber: '',
      corpRegNumber: '',
      address: '',
      phone: '',
      representative: '',
      role: 'owner',
      isRepresentative: true,
    }],
  },

  // 공동중개
  jointBrokerage: {
    enabled: false,
    broker: {
      officeName: '',
      officeAddress: '',
      regNumber: '',
      phone: '',
      representative: '',
      agent: '',
    },
  },

  // STEP 3: 계약 조건
  terms: {
    deposit: 0,
    payments: [],
    monthlyRent: 0,
    rentPayDay: 25,
    contractPeriod: {
      startDate: null,
      endDate: null,
      months: 24,
      includeFirstDay: false,
    },
  },

  // 기본 조항 설정
  clauses: {
    overdueCount: 3,
    clause6Content: '',
    clause7Content: '',
    clause8Content: '',
    deliveryDate: null,
  },

  // STEP 4: 특약사항
  specialTerms: {
    useAppendix: false,
    standardTerms: ['현황임대', '임대면적', '관리비', '중도해지', '주차'],
    customTerms: [],
  },

  // STEP 5: 확인설명서
  confirmation: {
    actualLandUse: '',
    actualBuildingUse: '',
    privateRental: {
      type: 'none',
      otherType: '',
      obligationPeriod: '',
      startDate: null,
    },
    renewalRight: {
      status: 'not_applicable',
      hasDocument: false,
    },
    location: {
      road: { width1: 0, width2: 0, paved: true },
      accessibility: 'easy',
      publicTransport: {
        bus: { station: '', time: 0, method: '도보' },
        subway: { station: '', time: 0, method: '도보' },
      },
      parking: 'shared',
      parkingNote: '',
    },
    management: {
      security: true,
      type: 'outsourced',
      typeNote: '',
    },
    actualRights: '',
    facilities: {
      water: { damaged: false, damagedLocation: '', sufficient: true, insufficientLocation: '' },
      electricity: { normal: true, replaceNote: '' },
      gas: { type: 'city_gas', typeNote: '' },
      fire: {
        firePlug: { exists: true, location: '' },
        emergencyBell: { exists: true, location: '' },
      },
      heating: {
        supply: 'central',
        working: 'normal',
        repairNote: '',
        yearsUsed: 0,
        fuel: 'city_gas',
        fuelNote: '',
      },
      elevator: { exists: true, condition: '양호' },
      drainage: { normal: true, repairNote: '' },
      otherFacilities: '',
    },
    interior: {
      wallCrack: { exists: false, location: '' },
      wallLeak: { exists: false, location: '' },
      floor: 'clean',
      floorNote: '',
    },
  },

  // 중개보수
  brokerage: {
    rate: 0.9,
    amount: 0,
    expense: 0,
    total: 0,
    paymentTime: '잔금지급시',
    isNegotiated: false,
    negotiatedNote: '',
  },
};

export const LeaseContractProvider = ({ children }) => {
  // 현재 단계
  const [currentStep, setCurrentStep] = useState(CONTRACT_STEPS.PROPERTY);

  // 계약서 데이터
  const [contract, setContract] = useState(initialContractState);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 에러 상태
  const [error, setError] = useState(null);

  // 저장된 계약서 ID
  const [contractId, setContractId] = useState(null);

  // 특약 검색 결과
  const [searchedTerms, setSearchedTerms] = useState([]);

  // AI 생성 특약
  const [generatedTerms, setGeneratedTerms] = useState(null);

  // ============ 단계 이동 ============
  const goToStep = useCallback((step) => {
    if (step >= CONTRACT_STEPS.PROPERTY && step <= CONTRACT_STEPS.PREVIEW) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < CONTRACT_STEPS.PREVIEW) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > CONTRACT_STEPS.PROPERTY) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // ============ 계약서 데이터 업데이트 ============
  const updateContract = useCallback((updates) => {
    setContract((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // 중첩 객체 업데이트 (예: property.building.leaseFloor)
  const updateNestedContract = useCallback((path, value) => {
    setContract((prev) => {
      const keys = path.split('.');
      const newContract = { ...prev };
      let current = newContract;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newContract;
    });
  }, []);

  // ============ 등기부 정보 추출 ============
  const extractRegistryInfo = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registryAPI.extractInfo(file);
      const extractedData = response.data.data;

      // 추출된 정보로 계약서 업데이트
      setContract((prev) => ({
        ...prev,
        property: {
          ...prev.property,
          address: extractedData.address || '',
          land: extractedData.land || prev.property.land,
          building: {
            ...prev.property.building,
            ...extractedData.building,
          },
        },
        registry: {
          owners: extractedData.owners || [],
          encumbrances: extractedData.encumbrances || [],
        },
      }));

      return extractedData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '등기부 정보 추출에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ 특약 검색 ============
  const searchSpecialTerms = useCallback(async (keyword) => {
    setIsLoading(true);
    try {
      const response = await specialTermsAPI.search(keyword);
      setSearchedTerms(response.data.data || []);
      return response.data.data;
    } catch (err) {
      console.error('특약 검색 실패:', err);
      setSearchedTerms([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ AI 특약 생성 ============
  const generateSpecialTerms = useCallback(async (situation, context = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await specialTermsAPI.generate(situation, {
        buildingType: contract.property.building.usage || '업무시설',
        transactionType: '임대차',
        ...context,
      });
      setGeneratedTerms(response.data.data);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'AI 특약 생성에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract.property.building.usage]);

  // ============ 특약 추가 ============
  const addCustomTerm = useCallback((term) => {
    setContract((prev) => ({
      ...prev,
      specialTerms: {
        ...prev.specialTerms,
        customTerms: [
          ...prev.specialTerms.customTerms,
          {
            content: term.content,
            source: term.source || 'manual',
            keywords: term.keywords || [],
          },
        ],
      },
    }));
  }, []);

  // ============ 특약 제거 ============
  const removeCustomTerm = useCallback((index) => {
    setContract((prev) => ({
      ...prev,
      specialTerms: {
        ...prev.specialTerms,
        customTerms: prev.specialTerms.customTerms.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ============ 기본 특약 토글 ============
  const toggleStandardTerm = useCallback((termTitle) => {
    setContract((prev) => {
      const currentTerms = prev.specialTerms.standardTerms;
      const isSelected = currentTerms.includes(termTitle);

      return {
        ...prev,
        specialTerms: {
          ...prev.specialTerms,
          standardTerms: isSelected
            ? currentTerms.filter((t) => t !== termTitle)
            : [...currentTerms, termTitle],
        },
      };
    });
  }, []);

  // ============ 당사자 추가 ============
  const addParty = useCallback((type) => {
    const newParty = {
      type: 'business',
      name: '',
      idNumber: '',
      corpRegNumber: '',
      address: '',
      phone: '',
      representative: '',
      role: 'joint',
      isRepresentative: false,
    };

    setContract((prev) => ({
      ...prev,
      parties: {
        ...prev.parties,
        [type]: [...prev.parties[type], newParty],
      },
    }));
  }, []);

  // ============ 당사자 제거 ============
  const removeParty = useCallback((type, index) => {
    setContract((prev) => ({
      ...prev,
      parties: {
        ...prev.parties,
        [type]: prev.parties[type].filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ============ 계약서 저장 (초안) ============
  const saveContract = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (contractId) {
        response = await contractAPI.update(contractId, contract);
      } else {
        response = await contractAPI.create(contract);
        setContractId(response.data.data._id);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '계약서 저장에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, contractId]);

  // ============ 계약서 완료 및 PDF 생성 ============
  const completeContract = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 먼저 저장
      if (!contractId) {
        const saveResponse = await contractAPI.create(contract);
        setContractId(saveResponse.data.data._id);
      } else {
        await contractAPI.update(contractId, contract);
      }

      // 완료 처리
      const response = await contractAPI.complete(contractId);

      // 상태 업데이트
      setContract((prev) => ({
        ...prev,
        status: 'completed',
        pdfUrl: response.data.data.pdfUrl,
      }));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '계약서 완료 처리에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, contractId]);

  // ============ 계약서 불러오기 ============
  const loadContract = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contractAPI.getById(id);
      setContract(response.data.data);
      setContractId(id);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || '계약서 불러오기에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============ 초기화 ============
  const resetContract = useCallback(() => {
    setContract(initialContractState);
    setContractId(null);
    setCurrentStep(CONTRACT_STEPS.PROPERTY);
    setSearchedTerms([]);
    setGeneratedTerms(null);
    setError(null);
  }, []);

  // ============ 중개보수 계산 ============
  const calculateBrokerage = useCallback(() => {
    const { deposit, monthlyRent } = contract.terms;
    const rate = contract.brokerage.rate / 100;

    // 거래금액 = 보증금 + (월차임 × 100)
    const transactionAmount = deposit + monthlyRent * 100;
    const amount = Math.floor(transactionAmount * rate);

    setContract((prev) => ({
      ...prev,
      brokerage: {
        ...prev.brokerage,
        amount,
        total: amount + prev.brokerage.expense,
      },
    }));

    return amount;
  }, [contract.terms.deposit, contract.terms.monthlyRent, contract.brokerage.rate]);

  const value = {
    // 상태
    currentStep,
    contract,
    contractId,
    isLoading,
    error,
    searchedTerms,
    generatedTerms,

    // 단계 이동
    goToStep,
    nextStep,
    prevStep,

    // 데이터 업데이트
    updateContract,
    updateNestedContract,

    // 등기부 추출
    extractRegistryInfo,

    // 특약
    searchSpecialTerms,
    generateSpecialTerms,
    addCustomTerm,
    removeCustomTerm,
    toggleStandardTerm,

    // 당사자
    addParty,
    removeParty,

    // 저장/완료
    saveContract,
    completeContract,
    loadContract,
    resetContract,

    // 중개보수
    calculateBrokerage,

    // 상수
    CONTRACT_STEPS,
  };

  return (
    <LeaseContractContext.Provider value={value}>
      {children}
    </LeaseContractContext.Provider>
  );
};

export default LeaseContractContext;
