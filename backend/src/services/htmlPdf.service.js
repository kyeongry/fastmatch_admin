/**
 * HTML 템플릿 기반 PDF 생성 서비스
 * Google Docs 대신 로컬 HTML 템플릿을 사용하여 PDF 생성
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const axios = require('axios');

// Puppeteer 실행 옵션 (Railway/Docker 환경 지원)
const getPuppeteerOptions = () => {
  const options = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
    ],
  };

  // Railway/Docker 환경에서 Chromium 경로 설정
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  return options;
};

// 템플릿 경로 동적 탐지 (Railway/Docker/로컬 환경 모두 지원)
const findPdfformPath = () => {
  const possiblePaths = [
    path.join(__dirname, '../../pdfform'),           // backend/src/services -> backend/pdfform
    path.join(__dirname, '../pdfform'),              // 다른 가능한 위치
    path.join(process.cwd(), 'pdfform'),             // CWD 기준
    '/app/pdfform',                                   // Docker/Railway 절대경로
  ];

  for (const p of possiblePaths) {
    if (fsSync.existsSync(p)) {
      console.log(`✅ pdfform found at: ${p}`);
      return p;
    }
  }

  console.error('❌ pdfform folder not found in any of:', possiblePaths);
  // 기본값 반환 (에러 메시지를 위해)
  return path.join(__dirname, '../../pdfform');
};

const PDFFORM_DIR = findPdfformPath();
const TEMPLATE_DIR = path.join(PDFFORM_DIR, 'templates');
const IMAGE_ASSET_DIR = path.join(PDFFORM_DIR, 'image-asset');

// 카카오 맵 API 키
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_JS_KEY = process.env.KAKAO_JS_KEY;

/**
 * 포맷팅 유틸리티 함수들
 */
const formatters = {
  // 금액 포맷 (콤마 + 원)
  currency: (value) => {
    if (!value && value !== 0) return '';
    return `${Number(value).toLocaleString('ko-KR')}원`;
  },

  // 금액 포맷 (콤마만)
  number: (value) => {
    if (!value && value !== 0) return '';
    return Number(value).toLocaleString('ko-KR');
  },

  // 년도 포맷 (YYYY년)
  year: (value) => {
    if (!value) return '';
    return `${value}년`;
  },

  // 면적 포맷 (평)
  areaPyeong: (value) => {
    if (!value && value !== 0) return '';
    return `${Number(value).toFixed(1)}평`;
  },

  // 면적 포맷 (㎡)
  areaSqm: (value) => {
    if (!value && value !== 0) return '';
    return `${Number(value).toFixed(1)}㎡`;
  },

  // 계약기간 포맷
  contractPeriod: (type, value) => {
    // type 기반 매핑
    const typeMap = {
      'six_months': '6개월',
      'twelve_months': '12개월',
      'custom': value ? `${value}개월` : '기간 협의',
    };
    if (typeMap[type]) return typeMap[type];

    // 숫자만 있으면 "개월" 추가
    if (value && /^\d+$/.test(String(value))) {
      return `${value}개월`;
    }
    if (type && /^\d+$/.test(String(type))) {
      return `${type}개월`;
    }
    return value || type || '';
  },

  // 입주 가능일 한글 포맷
  moveInDate: (value, type) => {
    if (type === 'immediate') return '즉시 입주 가능';
    if (type === 'negotiable') return '협의 가능';
    if (value) {
      // 날짜 형식이면 한글로 변환
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
      }
      return value;
    }
    return type || '';
  },

  // 옵션 구분1 한글 변환
  category1: (category) => {
    const map = {
      'exclusive_floor': '전용층',
      'separate_floor': '분리층',
      'connected_floor': '연층',
      'exclusive_room': '전용호실',
      'separate_room': '분리호실',
      'connected_room': '연접호실',
    };
    return map[category] || category || '';
  },

  // 옵션 구분2 한글 변환
  category2: (category) => {
    const map = {
      'window_side': '창측',
      'inner_side': '내측',
    };
    return map[category] || category || '';
  },

  // 브랜드 약어 변환 ('S사' 형태)
  brandAbbr: (brandName) => {
    const map = {
      '메리히어': 'M',
      '마이크로웨이브': 'M',
      '헬로먼데이': 'H',
      '메가프로젝트': 'M',
      '작심': 'J',
      '지랩스': 'G',
      '가라지': 'G',
      '테드스페이스': 'T',
      '스페이스에이드': 'S',
      '플레이스캠프': 'P',
      '무신사': 'M',
      '비전포트': 'V',
      '두드림': 'D',
      'SSC': 'S',
      '팀타운': 'T',
      'TEC': 'T',
      '스튜디오오스카': 'S',
      'CEO SUITE': 'C',
      '하품': 'H',
      '에그스테이션': 'E',
      '트리니티': 'T',
      '넥스트데이': 'N',
      '핀포인트': 'P',
      '캔버스랩': 'C',
      '워크플렉스': 'W',
      '워크앤올': 'W',
      '마이워크스페이스': 'M',
      '리저스': 'R',
      '스페이시즈': 'S',
      '스테이지나인': 'S',
      '저스트코': 'J',
      '위워크': 'W',
      '스파크플러스': 'S',
      '패스트파이브': 'F',
    };
    // 정확히 일치하는 것 먼저, 그 다음 포함 여부
    let abbr = '';
    if (map[brandName]) {
      abbr = map[brandName];
    } else {
      for (const [key, value] of Object.entries(map)) {
        if (brandName && brandName.includes(key)) {
          abbr = value;
          break;
        }
      }
    }
    // 매핑 없으면 첫 글자
    if (!abbr && brandName) {
      abbr = brandName.charAt(0).toUpperCase();
    }
    // 'S사' 형태로 반환
    return abbr ? `${abbr}사` : '';
  },

  // 크레딧 포맷팅 (배열 또는 문자열 처리)
  credits: (credits) => {
    if (!credits) return '';

    // 배열인 경우
    if (Array.isArray(credits)) {
      return credits.map(credit => {
        // 기타 크레딧 (커스텀 형식)
        if (credit.type === 'other' && credit.customName) {
          const unit = credit.unit || '크레딧';
          const amount = credit.amount || 0;
          let result = `${credit.customName} ${amount.toLocaleString()} ${unit} 제공`;
          if (credit.note) {
            result += ` / ${credit.note}`;
          }
          return result;
        }

        // 기존 크레딧 타입
        const typeMap = {
          'monthly': '월별 제공',
          'printing': '프린팅',
          'meeting_room': '미팅룸',
          'other': '기타',
        };
        const typeName = typeMap[credit.type] || credit.type || '기타';
        const amount = credit.amount || 0;
        const note = credit.note ? ` (${credit.note})` : '';
        return `${typeName} ${amount.toLocaleString()}크레딧${note}`;
      }).join(', ');
    }

    // 문자열인 경우
    if (typeof credits === 'string') {
      if (credits.includes(':')) {
        const [type, value] = credits.split(':');
        return `월별 ${type.trim()} 제공 : ${value.trim()}크레딧`;
      }
      return `월별 미팅룸 크레딧 : ${credits}크레딧`;
    }

    // 객체인 경우
    if (typeof credits === 'object') {
      // 기타 크레딧 (커스텀 형식)
      if (credits.type === 'other' && credits.customName) {
        const unit = credits.unit || '크레딧';
        const amount = credits.amount || 0;
        let result = `${credits.customName} ${amount.toLocaleString()} ${unit} 제공`;
        if (credits.note) {
          result += ` / ${credits.note}`;
        }
        return result;
      }

      const typeMap = {
        'monthly': '월별 제공',
        'printing': '프린팅',
        'meeting_room': '미팅룸',
        'other': '기타',
      };
      const typeName = typeMap[credits.type] || credits.type || '기타';
      const amount = credits.amount || 0;
      return `${typeName} ${amount.toLocaleString()}크레딧`;
    }

    return String(credits);
  },

  // 인실 포맷 (N인실(옵션구분1/옵션구분2))
  capacity: (capacity, category1, category2) => {
    const cap = capacity || 0;
    let result = `${cap}인실`;

    // 카테고리를 한글로 변환 후 추가
    const cat1Map = {
      'exclusive_floor': '전용층',
      'separate_floor': '분리층',
      'connected_floor': '연층',
      'exclusive_room': '전용호실',
      'separate_room': '분리호실',
      'connected_room': '연접호실',
    };
    const cat2Map = {
      'window_side': '창측',
      'inner_side': '내측',
    };

    const cat1 = cat1Map[category1] || category1;
    const cat2 = cat2Map[category2] || category2;

    const types = [cat1, cat2].filter(Boolean);
    if (types.length > 0) {
      result += `(${types.join('/')})`;
    }

    return result;
  },

  // 할인율 계산 ((정가 - 할인가) / 정가 * 100)
  discountRate: (regularPrice, discountedPrice) => {
    if (!regularPrice || regularPrice === 0) return '0%';
    const rate = Math.round(((regularPrice - discountedPrice) / regularPrice) * 100);
    return `${rate}%`;
  },
};

/**
 * 카카오 맵 정적 지도 URL 생성
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @param {number} width - 이미지 너비 (기본값: 400)
 * @param {number} height - 이미지 높이 (기본값: 300)
 * @returns {string|null} - 정적 지도 이미지 URL 또는 null
 */
const getKakaoStaticMapUrl = (latitude, longitude, width = 400, height = 300) => {
  if (!KAKAO_REST_API_KEY || !latitude || !longitude) {
    return null;
  }

  // 카카오 정적 지도 API URL
  const mapUrl = `https://dapi.kakao.com/v2/maps/staticImage?center=${longitude},${latitude}&level=3&width=${width}&height=${height}&marker=pos:${longitude},${latitude}`;

  return mapUrl;
};

/**
 * 카카오 맵 정적 이미지를 Puppeteer로 렌더링하여 가져오기
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @returns {Promise<string>} - Base64 인코딩된 이미지 또는 빈 문자열
 */
const fetchKakaoMapImage = async (latitude, longitude) => {
  if (!KAKAO_JS_KEY || !latitude || !longitude) {
    console.log('⚠️ 카카오 맵 JavaScript API 키 또는 좌표가 없습니다.');
    return '';
  }

  let browser = null;
  try {
    // 간단한 HTML로 카카오맵 렌더링
    // 박스 크기에 맞게 조정: 약 300x310px (2배 해상도로 렌더링)
    const mapHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 600px; height: 620px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"></script>
        <script>
          window.addEventListener('load', function() {
            if (typeof kakao === 'undefined' || typeof kakao.maps === 'undefined') {
              window.mapLoadFailed = true;
              return;
            }

            try {
              var container = document.getElementById('map');
              var options = {
                center: new kakao.maps.LatLng(${latitude}, ${longitude}),
                level: 3
              };
              var map = new kakao.maps.Map(container, options);

              // 마커 표시
              var markerPosition = new kakao.maps.LatLng(${latitude}, ${longitude});
              var marker = new kakao.maps.Marker({
                position: markerPosition
              });
              marker.setMap(map);

              window.mapLoaded = true;
            } catch (e) {
              console.error(e);
              window.mapLoadFailed = true;
            }
          });
        </script>
      </body>
      </html>
    `;

    browser = await puppeteer.launch(getPuppeteerOptions());

    const page = await browser.newPage();

    // 콘솔 로그 캡처 (디버깅용)
    page.on('console', msg => console.log('   [브라우저]', msg.text()));
    page.on('pageerror', error => console.error('   [브라우저 에러]', error.message));

    await page.setViewport({ width: 600, height: 620 });

    console.log('   HTML 설정 중...');
    await page.setContent(mapHtml, { waitUntil: 'load', timeout: 15000 });

    console.log('   카카오맵 SDK 로딩 대기 중...');
    // 약간 대기 (SDK 로드 시간)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 현재 상태 확인
    const status = await page.evaluate(() => {
      return {
        kakaoExists: typeof kakao !== 'undefined',
        kakaoMapsExists: typeof kakao !== 'undefined' && typeof kakao.maps !== 'undefined',
        mapLoaded: window.mapLoaded,
        mapLoadFailed: window.mapLoadFailed,
      };
    });
    console.log('   페이지 상태:', status);

    // 지도 로드 대기
    await page.waitForFunction(
      () => window.mapLoaded === true || window.mapLoadFailed === true,
      { timeout: 10000 }
    ).catch(() => {
      console.log('   ⚠️ 지도 로드 타임아웃');
    });

    // 지도가 로드되었는지 확인
    const mapLoaded = await page.evaluate(() => window.mapLoaded);
    if (!mapLoaded) {
      const failReason = await page.evaluate(() => window.mapLoadFailed);
      console.log('   ⚠️ 지도 로드 실패 (mapLoadFailed:', failReason, ')');
      return '';
    }

    console.log('   ✅ 지도 로드 성공');

    // 약간의 지연 (지도 타일 로딩 대기)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 지도 영역 스크린샷
    const mapElement = await page.$('#map');
    const screenshot = await mapElement.screenshot({ type: 'png' });

    const base64 = screenshot.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('❌ 카카오 맵 이미지 렌더링 실패:', error.message);
    return '';
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * HTML 템플릿 파일 읽기
 * @param {string} templateName - 템플릿 파일명 (예: '01_cover.html')
 * @returns {Promise<string>} - HTML 문자열
 */
const readTemplate = async (templateName) => {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  try {
    const html = await fs.readFile(templatePath, 'utf-8');
    return html;
  } catch (error) {
    console.error(`❌ 템플릿 읽기 실패: ${templateName}`, error.message);
    throw new Error(`템플릿을 찾을 수 없습니다: ${templateName}`);
  }
};

/**
 * 이미지 파일을 Base64로 변환
 * @param {string} imagePath - 이미지 파일 경로
 * @returns {Promise<string>} - Base64 데이터 URL
 */
const imageToBase64 = async (imagePath) => {
  try {
    const absolutePath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(IMAGE_ASSET_DIR, imagePath);

    const imageBuffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase().slice(1);
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.warn(`⚠️ 이미지 변환 실패: ${imagePath}`, error.message);
    return '';
  }
};

/**
 * URL 이미지를 Base64로 변환
 * @param {string} imageUrl - 이미지 URL
 * @returns {Promise<string>} - Base64 데이터 URL
 */
const urlImageToBase64 = async (imageUrl) => {
  if (!imageUrl || imageUrl.trim() === '') {
    return '';
  }

  try {
    console.log(`   🖼️ 이미지 다운로드 중: ${imageUrl.substring(0, 100)}...`);

    // 브라우저처럼 동작하도록 헤더 추가 (패스트파이브 등 일부 CDN에서 필요)
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': imageUrl.includes('fastfive') ? 'https://www.fastfive.co.kr/' : '',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      validateStatus: (status) => status < 500, // 4xx도 일단 받아서 처리
    });

    // 응답 상태 확인
    if (response.status !== 200) {
      console.warn(`   ⚠️ 이미지 다운로드 실패 (HTTP ${response.status}): ${imageUrl.substring(0, 80)}...`);
      return '';
    }

    const buffer = Buffer.from(response.data);

    // 버퍼가 너무 작으면 실패로 간주 (에러 페이지 HTML 등)
    if (buffer.length < 1000) {
      console.warn(`   ⚠️ 이미지가 너무 작음 (${buffer.length} bytes): ${imageUrl.substring(0, 80)}...`);
      return '';
    }

    // Content-Type 확인 및 보정
    let contentType = response.headers['content-type'] || '';

    // Content-Type이 없거나 이미지가 아닌 경우 URL 확장자로 추정
    if (!contentType.startsWith('image/')) {
      const urlLower = imageUrl.toLowerCase();
      if (urlLower.includes('.png')) contentType = 'image/png';
      else if (urlLower.includes('.gif')) contentType = 'image/gif';
      else if (urlLower.includes('.webp')) contentType = 'image/webp';
      else if (urlLower.includes('.svg')) contentType = 'image/svg+xml';
      else contentType = 'image/jpeg'; // 기본값
    }

    const base64 = buffer.toString('base64');

    console.log(`   ✅ 이미지 다운로드 성공 (${(buffer.length / 1024).toFixed(1)}KB, ${contentType})`);
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`   ⚠️ URL 이미지 변환 실패: ${imageUrl.substring(0, 80)}...`, error.message);
    return '';
  }
};

/**
 * HTML 템플릿의 이미지 경로를 Base64로 변환
 * @param {string} html - HTML 문자열
 * @returns {Promise<string>} - 이미지가 Base64로 변환된 HTML
 */
const convertImagesToBase64 = async (html) => {
  // ../image-asset/ 경로의 이미지를 찾아서 Base64로 변환
  const imgRegex = /src="\.\.\/image-asset\/([^"]+)"/g;
  let match;
  let result = html;

  while ((match = imgRegex.exec(html)) !== null) {
    const imageName = match[1];
    const base64 = await imageToBase64(imageName);
    if (base64) {
      result = result.replace(match[0], `src="${base64}"`);
    }
  }

  return result;
};

/**
 * 변수 치환
 * @param {string} html - HTML 문자열
 * @param {Object} variables - 치환할 변수 객체 { "변수명": "값" }
 * @returns {string} - 변수가 치환된 HTML
 */
const replaceVariables = (html, variables) => {
  let result = html;

  for (const [key, value] of Object.entries(variables)) {
    // {{변수명}} 형식의 플레이스홀더 치환
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value || '');
  }

  return result;
};

/**
 * 이미지 URL을 img 태그로 변환
 * @param {string} html - HTML 문자열
 * @param {Object} imageVariables - 이미지 변수 { "플레이스홀더": "이미지URL" }
 * @returns {string} - 이미지가 적용된 HTML
 */
const applyImages = (html, imageVariables) => {
  let result = html;

  for (const [placeholder, imageUrl] of Object.entries(imageVariables)) {
    if (imageUrl) {
      // 플레이스홀더를 img 태그로 교체
      const imgTag = `<img src="${imageUrl}" alt="" style="width:100%;height:100%;object-fit:contain;">`;
      result = result.replace(placeholder, imgTag);
    } else {
      // 이미지가 없으면 빈 문자열로
      result = result.replace(placeholder, '');
    }
  }

  return result;
};

/**
 * HTML을 PDF로 변환 (Puppeteer 사용)
 * @param {string} html - HTML 문자열
 * @param {Object} options - PDF 옵션
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
const htmlToPdf = async (html, options = {}) => {
  let browser = null;

  try {
    browser = await puppeteer.launch(getPuppeteerOptions());

    const page = await browser.newPage();

    // HTML 설정
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // 카카오맵은 서버 사이드에서 이미 이미지로 삽입되므로 별도 대기 불필요

    // PDF 생성
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      ...options,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('❌ HTML to PDF 변환 실패:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * 여러 PDF 버퍼를 하나로 병합
 * @param {Array<Buffer>} pdfBuffers - 병합할 PDF 버퍼 배열
 * @returns {Promise<Buffer>} - 병합된 PDF 버퍼
 */
const mergePDFs = async (pdfBuffers) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      if (!pdfBuffer) continue;

      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    return Buffer.from(mergedPdfBytes);
  } catch (error) {
    console.error('❌ PDF 병합 실패:', error);
    throw new Error('PDF 병합 중 오류가 발생했습니다.');
  }
};

/**
 * 표지 페이지 생성
 * @param {Object} proposalData - 제안서 데이터
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
const generateCoverPage = async (proposalData) => {
  console.log('📑 표지 생성 중...');

  let html = await readTemplate('01_cover.html');

  // 이미지를 Base64로 변환
  html = await convertImagesToBase64(html);

  // 변수 치환
  const today = new Date();
  const variables = {
    '업체명': proposalData.company_name || proposalData.document_name?.split('_')[0] || '고객사',
    'YYYYMMDD': today.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '').replace(/\s/g, ''),
    '작성일': today.toLocaleDateString('ko-KR'),
    '담당자명': proposalData.creator?.name || '',
    '담당자 연락처': proposalData.creator?.phone || '',
    '담당자 이메일': proposalData.creator?.email || '',
  };

  html = replaceVariables(html, variables);

  return await htmlToPdf(html);
};

/**
 * 서비스 안내 페이지 생성
 * @param {Object} proposalData - 제안서 데이터
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
const generateServicePage = async (proposalData) => {
  console.log('📘 서비스 안내 생성 중...');

  let html = await readTemplate('02_service.html');

  // 이미지를 Base64로 변환
  html = await convertImagesToBase64(html);

  // 변수 치환
  const variables = {
    '담당자명': proposalData.creator?.name || '',
    '담당자 연락처': proposalData.creator?.phone || '',
    '담당자 이메일': proposalData.creator?.email || '',
  };

  html = replaceVariables(html, variables);

  return await htmlToPdf(html);
};

/**
 * 비교표 페이지 생성 (최대 5개 옵션)
 * @param {Array} options - 옵션 배열 (최대 5개)
 * @param {Object} proposalData - 제안서 데이터
 * @param {number} startIndex - 전체 옵션 배열에서의 시작 인덱스 (0부터 시작)
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
const generateComparisonPage = async (options, proposalData, startIndex = 0) => {
  console.log(`📊 비교표 생성 중... (${options.length}개 옵션, 시작 인덱스: ${startIndex})`);

  let html = await readTemplate('03_comparison.html');

  // 이미지를 Base64로 변환
  html = await convertImagesToBase64(html);

  // 담당자 정보 치환
  const commonVariables = {
    '담당자명': proposalData.creator?.name || '',
    '담당자 연락처': proposalData.creator?.phone || '',
    '담당자 이메일': proposalData.creator?.email || '',
  };
  html = replaceVariables(html, commonVariables);

  // 각 옵션별 변수 치환 (최대 5개)
  for (let i = 0; i < 5; i++) {
    const option = options[i] || null;
    const idx = i + 1;

    if (option) {
      // 계산 로직
      const monthlyFee = option.monthly_fee || 0;
      const regularPrice = option.list_price || 0;
      const deposit = option.deposit || 0;
      const capacity = option.capacity || 1;

      // 면적 처리
      let dedicatedArea = 0;
      let dedicatedAreaPy = 0;
      if (option.exclusive_area) {
        if (option.exclusive_area.unit === 'pyeong') {
          dedicatedAreaPy = option.exclusive_area.value || 0;
          dedicatedArea = dedicatedAreaPy * 3.3058;
        } else {
          dedicatedArea = option.exclusive_area.value || 0;
          dedicatedAreaPy = dedicatedArea / 3.3058;
        }
      }

      // 인당 면적, 인단가
      const areaPerPerson = capacity > 0 ? (dedicatedAreaPy / capacity).toFixed(1) : '0';
      const pricePerPerson = capacity > 0 ? Math.round(monthlyFee / capacity) : 0;

      // 외관 사진 처리
      let exteriorImage = '';
      if (option.branch?.exterior_image_url) {
        const imgBase64 = await urlImageToBase64(option.branch.exterior_image_url);
        if (imgBase64) {
          exteriorImage = `<img src="${imgBase64}" alt="외관">`;
        }
      } else if (option.branch?.interior_image_urls?.length > 0) {
        const imgBase64 = await urlImageToBase64(option.branch.interior_image_urls[0]);
        if (imgBase64) {
          exteriorImage = `<img src="${imgBase64}" alt="외관">`;
        }
      }

      // 비고/특이사항 항목 - 최대 4개 항목을 줄바꿈으로 표시
      const remarkItems = [];

      // 1. 냉난방식
      if (option.hvac_type) {
        const hvacMap = {
          'central': '• 중앙냉난방',
          'individual': '• 개별냉난방',
        };
        if (hvacMap[option.hvac_type]) {
          remarkItems.push(hvacMap[option.hvac_type]);
        }
      }

      // 2. 주차방식
      if (option.parking_type) {
        const parkingTypeLabel = option.parking_type === 'self_parking' ? '자주식' : '기계식';
        let parkingText = `• ${parkingTypeLabel} 주차`;
        if (option.parking_count) {
          parkingText += ` ${option.parking_count}대`;
        }
        if (option.parking_cost) {
          parkingText += ` ${parseInt(option.parking_cost).toLocaleString()}원`;
        }
        remarkItems.push(parkingText);
      }

      // 3. 크레딧
      if (option.credits && Array.isArray(option.credits) && option.credits.length > 0) {
        const creditText = formatters.credits(option.credits);
        if (creditText) {
          remarkItems.push(`• ${creditText}`);
        }
      }

      // 4. 메모 (있으면 마지막에 추가)
      if (option.memo && option.memo.trim()) {
        remarkItems.push(`• ${option.memo.trim()}`);
      }

      // 최대 4개 항목을 줄바꿈으로 연결
      const remarkText = remarkItems.slice(0, 4).join('\n');

      // 브랜드 약어 생성
      const brandName = option.branch?.brand?.name || '';
      const brandAbbr = formatters.brandAbbr(brandName);
      const branchName = option.branch?.name || '';

      // 전역 옵션 번호 (1부터 시작)
      const globalOptionNumber = startIndex + i + 1;
      // 옵션명: "옵션n. S사 지점명" 형식
      const optionTitle = `옵션${globalOptionNumber}. ${brandAbbr} ${branchName}`;

      const optionVariables = {
        [`옵션명${idx}`]: optionTitle,
        [`브랜드${idx}`]: brandAbbr,
        [`지점${idx}`]: branchName,
        [`외관사진${idx}`]: exteriorImage,
        [`주소${idx}`]: option.branch?.address || '',
        [`사용승인일${idx}`]: formatters.year(option.branch?.approval_year),
        [`규모${idx}`]: option.branch?.floors_above ? `지상 ${option.branch.floors_above}층 / 지하 ${option.branch?.floors_below || 0}층` : '',
        [`인실${idx}`]: formatters.capacity(capacity, option.category1, option.category2),
        [`전용면적${idx}`]: formatters.areaPyeong(dedicatedAreaPy),
        [`전용면적㎡${idx}`]: formatters.areaSqm(dedicatedArea),
        [`인당면적${idx}`]: `${areaPerPerson}평/인`,
        [`계약기간${idx}`]: formatters.contractPeriod(option.contract_period_type, option.contract_period_value),
        [`입주가능일${idx}`]: formatters.moveInDate(option.move_in_date_value, option.move_in_date_type),
        [`보증금${idx}`]: formatters.currency(deposit),
        [`정가${idx}`]: formatters.currency(regularPrice),
        [`할인가${idx}`]: formatters.currency(monthlyFee),
        [`할인률${idx}`]: formatters.discountRate(regularPrice, monthlyFee),
        [`인단가${idx}`]: formatters.currency(pricePerPerson),
        [`기타${idx}`]: remarkText,
      };

      html = replaceVariables(html, optionVariables);
    } else {
      // 빈 옵션일 경우 모든 변수를 빈 문자열로
      const emptyVariables = {
        [`옵션명${idx}`]: '', [`브랜드${idx}`]: '', [`지점${idx}`]: '', [`외관사진${idx}`]: '',
        [`주소${idx}`]: '', [`사용승인일${idx}`]: '', [`규모${idx}`]: '',
        [`인실${idx}`]: '', [`전용면적${idx}`]: '', [`전용면적㎡${idx}`]: '',
        [`인당면적${idx}`]: '', [`계약기간${idx}`]: '', [`입주가능일${idx}`]: '',
        [`보증금${idx}`]: '', [`정가${idx}`]: '', [`할인가${idx}`]: '',
        [`할인률${idx}`]: '', [`인단가${idx}`]: '', [`기타${idx}`]: '',
      };
      html = replaceVariables(html, emptyVariables);
    }
  }

  return await htmlToPdf(html);
};

/**
 * 옵션 상세 페이지 생성 (상세정보 + 내부사진 페이지)
 * 평면도 페이지는 평면도 이미지가 있을 때만 생성
 * @param {Object} option - 옵션 데이터
 * @param {Object} proposalData - 제안서 데이터
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
const generateOptionDetailPage = async (option, proposalData, optionNumber = 1) => {
  console.log(`📝 옵션 상세 생성 중: ${option.name}`);
  console.log(`🔍 Branch basic_info 디버그:`, {
    basic_info_1: option.branch?.basic_info_1,
    basic_info_2: option.branch?.basic_info_2,
    basic_info_3: option.branch?.basic_info_3,
    branch_id: option.branch?._id?.toString() || option.branch?.id,
  });

  let html = await readTemplate('04_option_detail.html');

  // 평면도가 없으면 평면도 페이지 제거
  if (!option.floor_plan_url) {
    console.log(`   ⚠️ 평면도 없음 - 평면도 페이지 제거`);
    // 평면도 페이지 전체 블록 제거: <!-- 평면도 페이지 --> 부터 다음 <script> 또는 </body> 전까지
    html = html.replace(/\s*<!-- 평면도 페이지 -->[\s\S]*?<div class="page floorplan-page">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=\s*<script|\s*<\/body)/g, '');
  }

  // 이미지를 Base64로 변환
  html = await convertImagesToBase64(html);

  // 면적 처리
  let dedicatedArea = 0;
  let dedicatedAreaPy = 0;
  if (option.exclusive_area) {
    if (option.exclusive_area.unit === 'pyeong') {
      dedicatedAreaPy = option.exclusive_area.value || 0;
      dedicatedArea = dedicatedAreaPy * 3.3058;
    } else {
      dedicatedArea = option.exclusive_area.value || 0;
      dedicatedAreaPy = dedicatedArea / 3.3058;
    }
  }

  const monthlyFee = option.monthly_fee || 0;
  const regularPrice = option.list_price || 0;
  const deposit = option.deposit || 0;

  // 일회성 비용 텍스트
  let oneTimeCostsText = '없음';
  if (option.one_time_fees && option.one_time_fees.length > 0) {
    oneTimeCostsText = option.one_time_fees
      .map(cost => `${cost.type}: ${formatters.currency(cost.amount)}`)
      .join(', ');
  }

  // 카카오 JS SDK 키와 좌표 추가
  const latitude = option.branch?.latitude || '';
  const longitude = option.branch?.longitude || '';

  // 비고 항목 (냉난방식 → 주차방식 → 크레딧 → 메모 순서)
  const remarkItems = [];

  // 1. 냉난방식 - 상세 설명 포함
  if (option.hvac_type) {
    const hvacMap = {
      'central': '중앙 냉난방식 제공으로 건물 운영시간 외 냉난방 사용 협의 필요',
      'individual': '개별 냉난방식 제공으로 24시간 제한 없이 사용 가능'
    };
    if (hvacMap[option.hvac_type]) {
      remarkItems.push(hvacMap[option.hvac_type]);
    }
  }

  // 2. 주차방식 - 상세 설명 포함
  if (option.parking_type) {
    const parkingTypeLabel = option.parking_type === 'self_parking' ? '자주식' : '기계식';
    const countPart = option.parking_count ? ` ${option.parking_count}대` : '';

    // 주차방식에 따른 설명 문구
    const parkingDescription = option.parking_type === 'self_parking'
      ? '편리한 주차환경 제공'
      : '주차 가능한 제원 검토 필요';

    // 기본 문구 생성
    let parkingText = `${parkingTypeLabel} 주차${countPart} 제공으로 ${parkingDescription}`;

    // 추가 정보 (비용, 메모)
    const extras = [];
    if (option.parking_cost) {
      extras.push(`${parseInt(option.parking_cost).toLocaleString()}원`);
    }
    if (option.parking_note && option.parking_note.trim()) {
      extras.push(option.parking_note.trim());
    }

    if (extras.length > 0) {
      parkingText += ` / ${extras.join(', ')}`;
    }

    remarkItems.push(parkingText);
  }

  // 3. 크레딧
  if (option.credits && Array.isArray(option.credits) && option.credits.length > 0) {
    const creditText = formatters.credits(option.credits);
    if (creditText) {
      remarkItems.push(creditText);
    }
  }

  // 4. 메모 (있으면 마지막에 추가, 3번째 슬롯에)
  if (option.memo && option.memo.trim() && remarkItems.length < 3) {
    remarkItems.push(option.memo.trim());
  }

  // 브랜드 약어 생성
  const brandName = option.branch?.brand?.name || '';
  const brandAbbr = formatters.brandAbbr(brandName);

  // 변수 치환
  const variables = {
    'KAKAO_JS_KEY': KAKAO_JS_KEY || '',
    '옵션번호': optionNumber,
    '위도': latitude,
    '경도': longitude,
    '브랜드': brandAbbr,
    '지점': option.branch?.name || '',
    '담당자명': proposalData.creator?.name || '',
    '담당자 연락처': proposalData.creator?.phone || '',
    '담당자 이메일': proposalData.creator?.email || '',
    '주소': option.branch?.address || '',
    '교통': `${option.branch?.nearest_subway || ''} 도보 ${option.branch?.walking_distance || 0}분`,
    '인실': formatters.capacity(option.capacity, option.category1, option.category2),
    '보증금': formatters.currency(deposit),
    '정가': formatters.currency(regularPrice),
    '개월수': option.contract_period_value || '12',
    '할인가': formatters.currency(monthlyFee),
    '일회성 비용': oneTimeCostsText,
    '입주 가능일': formatters.moveInDate(option.move_in_date_value, option.move_in_date_type),
    '오피스 정보': option.office_info || '',
    '기본 정보1': option.branch?.basic_info_1 || '',
    '기본 정보2': option.branch?.basic_info_2 || '',
    '기본 정보3': option.branch?.basic_info_3 || '',
    '기타1': remarkItems[0] || '',
    '기타2': remarkItems[1] || '',
    '기타3': remarkItems[2] || '',
  };

  html = replaceVariables(html, variables);

  // 이미지 처리
  // 외관 사진
  let exteriorImgSrc = '';
  if (option.branch?.exterior_image_url) {
    console.log(`   📸 외관 사진 변환 중...`);
    exteriorImgSrc = await urlImageToBase64(option.branch.exterior_image_url);
  } else if (option.branch?.interior_image_urls?.length > 0) {
    console.log(`   📸 외관 사진 대체 (내부 사진 1번) 변환 중...`);
    exteriorImgSrc = await urlImageToBase64(option.branch.interior_image_urls[0]);
  }

  // img 태그의 src와 data-placeholder를 모두 교체
  if (exteriorImgSrc) {
    html = html.replace(
      /<img\s+src="[^"]*"\s+alt="지점 외관 사진"\s+data-placeholder="{{지점 외관 사진}}">/g,
      `<img src="${exteriorImgSrc}" alt="지점 외관 사진">`
    );
  }

  // 카카오 맵 이미지 서버 사이드에서 가져오기
  console.log(`   🗺️ 카카오맵 이미지 가져오는 중... (위도: ${latitude}, 경도: ${longitude})`);
  let mapContent = '';
  if (latitude && longitude) {
    try {
      const mapImageBase64 = await fetchKakaoMapImage(latitude, longitude);
      if (mapImageBase64) {
        mapContent = `<img src="${mapImageBase64}" alt="지도" style="width:100%;height:100%;object-fit:cover;">`;
        console.log(`   ✅ 카카오맵 이미지 가져오기 성공`);
      } else {
        mapContent = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#999;font-size:8pt;">지도 정보 없음</div>';
        console.log(`   ⚠️ 카카오맵 이미지 가져오기 실패 - 기본 메시지 표시`);
      }
    } catch (error) {
      console.error(`   ❌ 카카오맵 이미지 가져오기 오류:`, error.message);
      mapContent = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#999;font-size:8pt;">지도 로드 실패</div>';
    }
  } else {
    mapContent = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#999;font-size:8pt;">지도 정보 없음</div>';
    console.log(`   ⚠️ 좌표 정보 없음 - 지도 표시 안 함`);
  }

  // HTML에서 지도 div를 찾아 교체 (data-lat, data-lng 속성을 포함한 div)
  html = html.replace(
    /<div class="option-map-box" id="map" data-lat="[^"]*" data-lng="[^"]*"><\/div>/,
    `<div class="option-map-box">${mapContent}</div>`
  );

  // 내부 사진 1-4
  console.log(`   📸 내부 사진 변환 중...`);
  const interiorImages = option.branch?.interior_image_urls || [];
  for (let i = 1; i <= 4; i++) {
    const imgUrl = interiorImages[i - 1];
    if (imgUrl) {
      console.log(`   📸 내부 사진 ${i} 변환 중...`);
      const imgBase64 = await urlImageToBase64(imgUrl);
      if (imgBase64) {
        html = html.replace(
          new RegExp(`<img\\s+src="[^"]*"\\s+alt="내부 사진${i}"\\s+data-placeholder="{{내부 사진${i}}}">`,'g'),
          `<img src="${imgBase64}" alt="내부 사진${i}">`
        );
      }
    }
  }

  // 평면도 (평면도가 있을 때만)
  if (option.floor_plan_url) {
    console.log(`   📐 평면도 변환 중...`);
    const floorPlanBase64 = await urlImageToBase64(option.floor_plan_url);
    if (floorPlanBase64) {
      html = html.replace(
        /<img\s+src="[^"]*"\s+alt="평면도"\s+data-placeholder="{{평면도}}">/g,
        `<img src="${floorPlanBase64}" alt="평면도">`
      );
    }
  }

  return await htmlToPdf(html);
};

/**
 * 전체 제안서 PDF 생성
 * @param {Object} proposalData - 제안서 데이터 (options 포함)
 * @returns {Promise<Object>} - { pdfBuffer, fileName, pageCount }
 */
const generateFullProposalPDF = async (proposalData) => {
  console.log(`📄 제안서 PDF 생성 시작: ${proposalData.document_name}`);
  console.log(`📊 옵션 개수: ${proposalData.options?.length || 0}개`);

  const pdfBuffers = [];

  try {
    // 1. 표지 생성
    const coverPdf = await generateCoverPage(proposalData);
    pdfBuffers.push(coverPdf);

    // 2. 서비스 안내 생성
    const servicePdf = await generateServicePage(proposalData);
    pdfBuffers.push(servicePdf);

    // 3. 비교표 생성 (5개씩 나눠서)
    const options = proposalData.options || [];
    const pageSize = 5;
    for (let i = 0; i < options.length; i += pageSize) {
      const pageOptions = options.slice(i, i + pageSize);
      const comparisonPdf = await generateComparisonPage(pageOptions, proposalData, i);
      pdfBuffers.push(comparisonPdf);
    }

    // 4. 옵션 상세 페이지 생성 (각 옵션마다)
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const optionNumber = i + 1; // 1부터 시작
      const detailPdf = await generateOptionDetailPage(option, proposalData, optionNumber);
      pdfBuffers.push(detailPdf);
    }

    // 5. PDF 병합
    console.log('📦 PDF 병합 중...');
    const finalPdf = await mergePDFs(pdfBuffers);

    const fileName = `proposal_${proposalData.id || Date.now()}.pdf`;

    console.log('✅ 제안서 PDF 생성 완료');

    return {
      pdfBuffer: finalPdf,
      fileName,
      pageCount: pdfBuffers.length,
    };
  } catch (error) {
    console.error('❌ 제안서 PDF 생성 실패:', error.message);
    throw error;
  }
};

module.exports = {
  readTemplate,
  replaceVariables,
  applyImages,
  htmlToPdf,
  mergePDFs,
  generateCoverPage,
  generateServicePage,
  generateComparisonPage,
  generateOptionDetailPage,
  generateFullProposalPDF,
  formatters,
  fetchKakaoMapImage,
};
