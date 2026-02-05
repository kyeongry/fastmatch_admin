const { ObjectId } = require('mongodb');

/**
 * 특약 라이브러리 스키마
 * 키워드 기반 검색 및 재사용 가능
 */
const SpecialTermSchema = {
  keywords: [String],            // 검색 키워드/태그
  category: String,              // 분류 (보증금, 시설, 퇴거, 관리비, 주차, 기타)
  title: String,                 // 제목 (예: "원상복구", "중도해지")
  content: String,               // 특약 문구
  favorType: String,             // lessor | lessee | neutral
  usageCount: { type: Number, default: 0 },  // 사용 횟수
  source: String,                // manual | ai
  contractId: ObjectId,          // 원본 계약서 ID (있는 경우)
  createdAt: { type: Date, default: Date.now },
  createdBy: ObjectId,
  isActive: { type: Boolean, default: true }
};

// 기본 특약 프리셋 (시스템 제공)
const DefaultSpecialTerms = [
  {
    keywords: ['현황', '임대', '시설물', '상태'],
    category: '기타',
    title: '현황 임대',
    content: '본 계약은 현 시설물 상태(현장 방문 확인 완료)에서의 임대차 계약이다. 임대인은 잔금 지급일 전까지 현재의 시설 상태를 유지하여야 하며, 중대한 하자가 발생할 경우 이를 즉시 보수하여야 한다.',
    favorType: 'neutral',
    source: 'manual'
  },
  {
    keywords: ['면적', '공부상', '임대면적'],
    category: '기타',
    title: '임대 면적',
    content: '임대할 부분의 면적은 공부상의 면적을 기준으로 한다.',
    favorType: 'neutral',
    source: 'manual'
  },
  {
    keywords: ['관리비', '공과금', '전기', '수도', '가스'],
    category: '관리비',
    title: '관리비 및 공과금',
    content: '고정 관리비는 월 금 ___원(부가세 별도)이며, 매월 임대료 지급일에 선납한다. 관리비 범위: 공용부 청소, 승강기 유지비 등 건물 관리 일체',
    favorType: 'neutral',
    source: 'manual'
  },
  {
    keywords: ['중도해지', '승계', '해지'],
    category: '해지',
    title: '중도 해지 및 승계',
    content: '계약 기간 중 임차인의 사정으로 중도 해지할 경우, 임차인이 신규 임차인을 주선하여 임대인의 승인 하에 임대차 계약이 체결되고(임대인은 정당한 사유 없이 거절하지 않음), 중개보수 등 제반 비용을 부담하는 조건으로 계약을 해지할 수 있다. 단, 신규 임차인의 계약이 개시되기 전까지의 월 차임 및 관리비는 현 임차인이 부담한다.',
    favorType: 'neutral',
    source: 'manual'
  },
  {
    keywords: ['주차', '주차장', '차량'],
    category: '주차',
    title: '주차',
    content: '주차는 기계식 주차 1대를 무료로 제공한다.(단, 기계식 주차장에 입고 불가능한 차량의 경우 외부 주차 등을 임차인이 자체 해결해야 하며, 이에 대해 임대인은 책임지지 않는다.) 추가 주차 필요 시 협의 하에 월 ___원(부가세 별도)으로 추가할 수 있다.',
    favorType: 'neutral',
    source: 'manual'
  }
];

// 고정 포함 특약 (항상 포함)
const FixedSpecialTerms = [
  '기타사항은 상가건물임대차보호법 및 민법, 부동산 임대차 일반 관례에 따른다.',
  '첨부서류: 건축물대장, 등기사항전부증명서(토지, 건물), 확인설명서, 신탁원부'
];

// MongoDB Collection 인덱스
const SpecialTermIndexes = [
  { key: { keywords: 1 } },
  { key: { category: 1 } },
  { key: { usageCount: -1 } },
  { key: { content: 'text', title: 'text', keywords: 'text' } },
  { key: { isActive: 1 } }
];

module.exports = {
  SpecialTermSchema,
  SpecialTermIndexes,
  DefaultSpecialTerms,
  FixedSpecialTerms
};
