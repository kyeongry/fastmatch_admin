const { ObjectId } = require('mongodb');

/**
 * 임대차 계약서 스키마
 * 비주거용 건축물 전용 (업무용/상업용/공업용)
 */
const LeaseContractSchema = {
  // 기본 정보
  contractNumber: String,        // 자동생성 계약번호 (LC-YYYYMMDD-XXXX)
  createdAt: Date,
  updatedAt: Date,
  status: String,                // draft | completed | canceled

  // 물건 정보 (STEP 1 - Gemini 추출)
  property: {
    address: String,             // 소재지 (등기부등본 그대로)
    land: {
      category: String,          // 지목
      area: Number,              // 면적 (㎡)
      rightType: String,         // 대지권 종류
      rightRatio: String         // 대지권 비율
    },
    building: {
      structure: String,         // 구조
      usage: String,             // 용도 (업무시설, 상업시설 등)
      totalArea: Number,         // 연면적
      leaseFloor: String,        // 임대 층
      leaseArea: Number,         // 임대 면적
      completionYear: Number,    // 준공년도
      direction: String,         // 방향
      seismicDesign: Boolean,    // 내진설계 적용여부
      seismicCapacity: String,   // 내진능력
      isViolation: Boolean,      // 위반건축물 여부
      violationContent: String   // 위반내용
    }
  },

  // 등기부 정보 (Gemini 추출)
  registry: {
    owners: [{
      name: String,
      regNumber: String,
      address: String,
      share: String              // 지분 (공동소유 시)
    }],
    encumbrances: [{             // 소유권 외 권리
      type: String,              // 근저당, 전세권 등
      holder: String,
      amount: Number,
      date: Date
    }]
  },

  // 당사자 정보 (STEP 2) - 기본: 법인/사업자
  parties: {
    lessors: [{                  // 임대인 (배열 - 공동명의)
      type: String,              // individual | business (기본: business)
      name: String,              // 성명/법인명
      idNumber: String,          // 주민번호 or 사업자번호
      corpRegNumber: String,     // 법인등록번호 (법인인 경우)
      address: String,
      phone: String,
      representative: String,    // 대표자 (법인인 경우)
      role: String,              // owner | agent | joint | legal_rep
      isRepresentative: Boolean  // 대표자 여부 (공동명의 시)
    }],
    lessees: [{                  // 임차인 (배열 - 공동명의)
      type: String,
      name: String,
      idNumber: String,
      corpRegNumber: String,
      address: String,
      phone: String,
      representative: String,
      role: String,
      isRepresentative: Boolean
    }]
  },

  // 공동중개
  jointBrokerage: {
    enabled: Boolean,
    broker: {
      officeName: String,
      officeAddress: String,
      regNumber: String,
      phone: String,
      representative: String,
      agent: String
    }
  },

  // 계약 조건 (STEP 3)
  terms: {
    deposit: Number,             // 보증금
    payments: [{
      type: String,              // down | middle | balance | preliminary
      amount: Number,
      date: Date,
      recipient: String
    }],
    monthlyRent: Number,         // 월 임대료
    rentPayDay: Number,          // 임대료 지급일
    contractPeriod: {
      startDate: Date,
      endDate: Date,
      months: Number,
      includeFirstDay: Boolean   // 초일 산입 여부 (기본: false - 불산입)
    }
  },

  // 기본 조항 설정 (수정 가능 항목)
  clauses: {
    // 제4조 - 연체 기수 (기본: 3기)
    overdueCount: { type: Number, default: 3 },
    // 제6조 - 계약의 해제 (전체 수정 가능)
    clause6Content: String,
    // 제7조 - 채무불이행과 손해배상 (전체 수정 가능)
    clause7Content: String,
    // 제8조 - 중개보수 (전체 수정 가능)
    clause8Content: String,
    // 제9조 - 교부일자 (기본: 계약일자)
    deliveryDate: Date
  },

  // 특약사항 (STEP 4)
  specialTerms: {
    useAppendix: Boolean,        // 별지 사용 여부
    standardTerms: [String],     // 기본 특약 체크박스 (현황임대, 임대면적, 관리비, 중도해지, 주차)
    customTerms: [{
      content: String,
      source: String,            // existing | ai | manual
      keywords: [String]
    }]
  },

  // 확인설명서 (STEP 5) - 비주거용 [별지 제20호의2서식]
  confirmation: {
    // 대상물건 - 실제 이용상태
    actualLandUse: String,
    actualBuildingUse: String,

    // 민간임대 등록여부
    privateRental: {
      type: String,              // none | long_term | public_support | other
      otherType: String,
      obligationPeriod: String,
      startDate: Date
    },

    // 계약갱신요구권 행사여부
    renewalRight: {
      status: String,            // confirmed | unconfirmed | not_applicable
      hasDocument: Boolean
    },

    // 입지조건
    location: {
      road: {
        width1: Number,
        width2: Number,
        paved: Boolean
      },
      accessibility: String,     // easy | difficult
      publicTransport: {
        bus: { station: String, time: Number, method: String },
        subway: { station: String, time: Number, method: String }
      },
      parking: String,           // none | exclusive | shared | other
      parkingNote: String
    },

    // 관리에 관한 사항
    management: {
      security: Boolean,
      type: String,              // outsourced | self | other
      typeNote: String
    },

    // 실제 권리관계 또는 공시되지 않은 물건의 권리사항
    actualRights: String,

    // 시설물 상태 (비주거용 - 별지 제20호의2서식)
    facilities: {
      water: {
        damaged: Boolean,
        damagedLocation: String,
        sufficient: Boolean,
        insufficientLocation: String
      },
      electricity: { normal: Boolean, replaceNote: String },
      gas: { type: String, typeNote: String },
      // 비주거용: 소화전, 비상벨 (기본값: exists = true)
      fire: {
        firePlug: { exists: { type: Boolean, default: true }, location: String },
        emergencyBell: { exists: { type: Boolean, default: true }, location: String }
      },
      heating: {
        supply: String,          // central | individual
        working: String,         // normal | repair | unknown
        repairNote: String,
        yearsUsed: Number,
        fuel: String,            // city_gas | oil | propane | coal | other
        fuelNote: String
      },
      elevator: { exists: Boolean, condition: String },
      drainage: { normal: Boolean, repairNote: String },
      otherFacilities: String
    },

    // 벽면/바닥 (비주거용 - 도배 항목 없음)
    interior: {
      wallCrack: { exists: Boolean, location: String },
      wallLeak: { exists: Boolean, location: String },
      floor: String,             // clean | normal | repair
      floorNote: String
    }
  },

  // 중개보수
  brokerage: {
    rate: { type: Number, default: 0.9 },  // 요율 (기본 0.9%)
    amount: Number,
    expense: Number,
    total: Number,
    paymentTime: String,         // 기본: 잔금지급시
    isNegotiated: Boolean,
    negotiatedNote: String
  },

  // PDF
  pdfUrl: String,

  // 작성자
  createdBy: ObjectId
};

// 계약번호 생성 함수
function generateContractNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LC-${dateStr}-${random}`;
}

// MongoDB Collection 인덱스
const LeaseContractIndexes = [
  { key: { contractNumber: 1 }, unique: true },
  { key: { createdAt: -1 } },
  { key: { status: 1 } },
  { key: { 'property.address': 'text' } },
  { key: { createdBy: 1 } }
];

module.exports = {
  LeaseContractSchema,
  LeaseContractIndexes,
  generateContractNumber
};
