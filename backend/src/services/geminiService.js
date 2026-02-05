const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini 서비스
 * 등기부등본 정보 추출 및 특약 생성
 */
class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * 등기부등본에서 정보 추출
   * @param {Buffer} imageBuffer - 등기부등본 이미지/PDF
   * @param {string} mimeType - 파일 타입
   * @returns {Object} 추출된 정보
   */
  async extractRegistryInfo(imageBuffer, mimeType) {
    const prompt = `다음 등기부등본 이미지에서 아래 항목을 정확히 추출해주세요.
반드시 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요.

추출 항목:
1. 소재지: 등기부에 기재된 주소 전체 (그대로 추출)
2. 토지: 지목, 면적(㎡), 대지권 종류, 대지권 비율
3. 건물: 구조, 용도, 연면적(㎡)
4. 소유자: 성명/법인명, 주소, 등록번호, 지분(공동소유 시)
5. 소유권 외 권리: 근저당권, 전세권, 임차권 등 (권리자, 금액, 설정일)

응답 형식:
{
  "address": "소재지 전체 주소",
  "land": {
    "category": "지목",
    "area": 숫자,
    "rightType": "대지권 종류",
    "rightRatio": "대지권 비율 (예: 1439.34분의 187.51)"
  },
  "building": {
    "structure": "구조",
    "usage": "용도",
    "totalArea": 숫자
  },
  "owners": [
    {
      "name": "성명/법인명",
      "address": "주소",
      "regNumber": "등록번호",
      "share": "지분 (단독이면 빈 문자열)"
    }
  ],
  "encumbrances": [
    {
      "type": "권리 종류",
      "holder": "권리자",
      "amount": 숫자,
      "date": "YYYY-MM-DD"
    }
  ]
}`;

    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // JSON 파싱 (코드블록 제거)
      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini 등기부 추출 오류:', error);
      throw new Error('등기부등본 정보 추출에 실패했습니다.');
    }
  }

  /**
   * AI 특약 생성 (3가지 버전)
   * @param {string} situation - 상황 설명
   * @param {Object} context - 계약 컨텍스트 (건물유형, 거래유형 등)
   * @returns {Object} 3가지 버전의 특약
   */
  async generateSpecialTerms(situation, context = {}) {
    const { buildingType = '업무시설', transactionType = '임대차' } = context;

    const prompt = `부동산 임대차 계약의 특약사항을 생성해주세요.

상황: ${situation}
건물 유형: ${buildingType} (비주거용)
거래 유형: ${transactionType}

다음 3가지 버전으로 작성해주세요:
1. 임대인 유리 버전: 임대인의 권리와 이익을 보호하는 문구
2. 임차인 유리 버전: 임차인의 권리와 이익을 보호하는 문구
3. 중립 버전: 양측의 권리를 균형있게 보호하는 문구

각 버전은:
- 법적으로 유효하고 명확한 표현 사용
- 구체적인 조건과 절차 명시
- 실무에서 실제로 사용 가능한 수준

반드시 JSON 형식으로만 응답해주세요:
{
  "lessor": {
    "content": "임대인 유리 버전 특약 문구",
    "keywords": ["관련", "키워드", "목록"]
  },
  "lessee": {
    "content": "임차인 유리 버전 특약 문구",
    "keywords": ["관련", "키워드", "목록"]
  },
  "neutral": {
    "content": "중립 버전 특약 문구 (권장)",
    "keywords": ["관련", "키워드", "목록"]
  }
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini 특약 생성 오류:', error);
      throw new Error('특약 생성에 실패했습니다.');
    }
  }

  /**
   * 사업자등록증/신분증에서 정보 추출
   * @param {Buffer} imageBuffer - 이미지
   * @param {string} mimeType - 파일 타입
   * @param {string} docType - business | individual
   * @returns {Object} 추출된 정보
   */
  async extractPartyInfo(imageBuffer, mimeType, docType = 'business') {
    const businessPrompt = `다음 사업자등록증 이미지에서 정보를 추출해주세요.
JSON 형식으로만 응답해주세요.

{
  "companyName": "상호/법인명",
  "businessRegNumber": "사업자등록번호",
  "corpRegNumber": "법인등록번호 (있는 경우)",
  "address": "사업장 소재지",
  "representative": "대표자 성명"
}`;

    const individualPrompt = `다음 신분증 이미지에서 정보를 추출해주세요.
주민등록번호 뒷자리는 추출하지 마세요.
JSON 형식으로만 응답해주세요.

{
  "name": "성명",
  "idNumberFront": "주민등록번호 앞 6자리만",
  "address": "주소"
}`;

    const prompt = docType === 'business' ? businessPrompt : individualPrompt;

    try {
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini 당사자 정보 추출 오류:', error);
      throw new Error('당사자 정보 추출에 실패했습니다.');
    }
  }
}

module.exports = new GeminiService();
