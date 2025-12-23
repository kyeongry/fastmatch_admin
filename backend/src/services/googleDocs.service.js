const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google API 클라이언트 초기화
let auth = null;
let docs = null;
let drive = null;

const initializeGoogleAPI = async () => {
  if (auth) return { auth, docs, drive };

  try {
    // OAuth 클라이언트 및 토큰 파일 경로
    const credentialsPath = path.join(__dirname, '../../credentials/oauth-client.json');
    const tokenPath = path.join(__dirname, '../../credentials/tokens.json');

    // 파일 존재 확인
    try {
      await fs.promises.access(credentialsPath);
      await fs.promises.access(tokenPath);
    } catch (error) {
      console.warn('⚠️ Google OAuth 자격 증명 또는 토큰 파일을 찾을 수 없습니다.');
      console.warn('Google Docs 기능을 사용하려면 OAuth 설정을 완료해주세요.');
      return { auth: null, docs: null, drive: null };
    }

    // 자격 증명 로드
    const content = await fs.promises.readFile(credentialsPath);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

    // OAuth2 클라이언트 생성
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      'http://localhost:3000' // 고정된 리디렉션 URI 사용
    );

    // 토큰 로드 및 설정
    const tokenContent = await fs.promises.readFile(tokenPath);
    const tokens = JSON.parse(tokenContent);
    oAuth2Client.setCredentials(tokens);

    auth = oAuth2Client;
    docs = google.docs({ version: 'v1', auth });
    drive = google.drive({ version: 'v3', auth });

    console.log('✅ Google API (OAuth 2.0) 초기화 성공');
    return { auth, docs, drive };
  } catch (error) {
    console.error('❌ Google API 초기화 실패:', error.message);
    return { auth: null, docs: null, drive: null };
  }
};

/**
 * 매물비교표 생성을 위한 데이터 준비
 * @param {Array} options - 옵션 배열 (최대 5개씩 페이지 분할)
 * @returns {Array} - 5개씩 나눈 페이지 배열
 */
const prepareComparisonTableData = (options) => {
  const pages = [];
  const pageSize = 5;

  for (let i = 0; i < options.length; i += pageSize) {
    const pageOptions = options.slice(i, i + pageSize);

    // 5개 미만이면 빈 칸으로 채우기
    while (pageOptions.length < pageSize) {
      pageOptions.push(null); // null은 빈 칸으로 표시
    }

    pages.push(pageOptions);
  }

  return pages;
};

/**
 * 옵션 상세 페이지 데이터 준비
 * @param {Object} option - 옵션 정보
 * @returns {Object} - 상세 페이지 데이터 (2-3페이지)
 */
const prepareOptionDetailData = (option) => {
  return {
    // 페이지 1: 기본 정보
    page1: {
      brand_name: option.branch?.brand?.name || '',
      branch_name: option.branch?.branch_info || '',
      option_name: option.optionName || '',
      classification: option.optionClassification1 || option.optionClassification2 || '',
      rooms: option.capacity || option.optionClassification2 || '',
      monthly_fee: option.monthlyFee ? option.monthlyFee.toLocaleString('ko-KR') : '0',
      deposit: option.security ? option.security.toLocaleString('ko-KR') : '0',
      list_price: option.regularPrice ? option.regularPrice.toLocaleString('ko-KR') : '0',
      area: option.dedicatedArea || '',
      cooling_heating: option.hvac || '',
      parking: option.parking || '',
      available_from: option.availableMoveInDate || '',
      contract_period: option.contractPeriod || '',
    },
    // 페이지 2: 추가 정보
    page2: {
      one_time_costs: option.one_time_costs || [],
      deposit_info: option.deposit_info || '',
      vat_included: option.vat_included ? '포함' : '별도',
      maintenance_fee_included: option.maintenance_fee_included ? '포함' : '별도',
      extra_info: option.extra_info || '',
    },
    // 페이지 3: 평면도 (있을 경우에만)
    page3: option.floor_plan_image_url ? {
      floor_plan_url: option.floor_plan_image_url,
    } : null,
  };
};

/**
 * 템플릿 문서 복사 (할당량 문제 우회 버전)
 * 템플릿의 내용을 읽어서 서비스 계정의 Drive에 새 문서를 생성
 * @param {string} templateId - 템플릿 문서 ID
 * @param {string} newTitle - 새 문서 제목
 * @returns {string} - 생성된 문서 ID
 */
const copyTemplate = async (templateId, newTitle) => {
  const { drive: driveClient } = await initializeGoogleAPI();

  if (!driveClient) {
    throw new Error('Google API가 초기화되지 않았습니다');
  }

  try {
    const logMsg1 = `[${new Date().toISOString()}] 📋 Copying Template (Native): ${templateId} -> ${newTitle}\n`;
    fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), logMsg1);
    console.log(`📋 템플릿 복사 시작: ${templateId}`);

    const newDoc = await driveClient.files.copy({
      fileId: templateId,
      requestBody: {
        name: newTitle,
      },
      fields: 'id, name',
    });

    const logMsg2 = `[${new Date().toISOString()}] ✅ New Doc Created: ${newDoc.data.id}\n`;
    fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), logMsg2);
    console.log(`✅ 새 문서 생성 완료: ${newDoc.data.id} (${newDoc.data.name})`);

    return newDoc.data.id;
  } catch (error) {
    console.error('❌ 템플릿 복사 실패:', error.message);
    console.error('   원본 템플릿 ID:', templateId);
    console.error('   새 문서 제목:', newTitle);

    if (error.response?.data) {
      console.error('   에러 상세:', JSON.stringify(error.response.data, null, 2));
    }

    throw new Error('템플릿 문서를 복사하는데 실패했습니다: ' + error.message);
  }
};

/**
 * 정규표현식 특수문자 이스케이프
 * @param {string} string 
 * @returns {string}
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 문서에서 변수 치환
 * @param {string} documentId - 문서 ID
 * @param {Object} variables - 치환할 변수 객체 { "{{변수명}}": "값" }
 */
const replaceVariables = async (documentId, variables) => {
  const { docs: docsClient } = await initializeGoogleAPI();

  if (!docsClient) {
    throw new Error('Google Docs API가 초기화되지 않았습니다');
  }

  try {
    // 변수 치환을 위한 요청 배열
    const requests = Object.entries(variables).map(([key, value]) => ({
      replaceAllText: {
        containsText: {
          text: key,
          matchCase: true,
        },
        replaceText: String(value || ''),
      },
    }));

    if (requests.length === 0) return;

    console.log(`🔄 변수 치환 시도: ${Object.keys(variables).length}개 항목`);
    // console.log('   치환 키 목록:', Object.keys(variables).join(', '));

    await docsClient.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });

    console.log(`✅ 변수 치환 완료: ${Object.keys(variables).length}개`);
  } catch (error) {
    console.error('❌ 변수 치환 실패:', error.message);
    throw new Error('문서 변수 치환에 실패했습니다');
  }
};

/**
 * 테이블 변수 치환 (Smart Table Replacement)
 * 열(Column) 인덱스를 기준으로 데이터를 맵핑합니다.
 * @param {string} documentId - 문서 ID
 * @param {Array<Object>} optionMaps - 옵션별 변수 맵 배열 [{ "{{변수}}": "값" }, ...]
 */
const replaceTableVariables = async (documentId, optionMaps) => {
  const { docs: docsClient } = await initializeGoogleAPI();

  if (!docsClient) {
    throw new Error('Google Docs API가 초기화되지 않았습니다');
  }

  try {
    const doc = await docsClient.documents.get({ documentId });
    const replacements = []; // { start, end, type: 'text'|'image', value: string }

    // 텍스트/이미지 치환 요소 찾기
    const processElement = (element, columnIndex) => {
      if (element.textRun && element.textRun.content) {
        const content = element.textRun.content;
        const startIndex = element.startIndex;

        const optionMap = optionMaps[columnIndex];
        if (!optionMap) return;

        const occupiedRanges = []; // [start, end] relative to content

        // Sort keys by length descending to prioritize specific variables (e.g. prevent {{IMAGE_BRUNCH}} matching inside {{IMAGE_BRUNCH_INTERIOR1}})
        const sortedKeys = Object.keys(optionMap).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
          const value = optionMap[key];
          const regex = new RegExp(escapeRegExp(key), 'g');
          let match;
          while ((match = regex.exec(content)) !== null) {
            const relStart = match.index;
            const relEnd = relStart + key.length;

            // Check overlap
            const isOverlapping = occupiedRanges.some(([s, e]) =>
              (relStart < e && relEnd > s)
            );

            if (!isOverlapping) {
              occupiedRanges.push([relStart, relEnd]);

              const absStart = startIndex + relStart;
              const absEnd = startIndex + relEnd;
              const isImage = key.startsWith('{{IMAGE_');

              replacements.push({
                start: absStart,
                end: absEnd,
                value: value,
                type: isImage ? 'image' : 'text'
              });
            }
          }
        }
      }
    };

    // 컨텐츠 순회
    const traverseContent = (elements, columnIndex) => {
      for (const element of elements) {
        if (element.paragraph) {
          for (const el of element.paragraph.elements) {
            processElement(el, columnIndex);
          }
        } else if (element.table) {
          // 중첩 테이블의 경우 부모 셀의 컬럼 인덱스를 유지
          for (const row of element.table.tableRows) {
            for (const cell of row.tableCells) {
              traverseContent(cell.content, columnIndex);
            }
          }
        }
      }
    };

    // 메인 테이블 순회
    const traverseTable = (table) => {
      for (const row of table.tableRows) {
        // 0번 컬럼은 라벨이므로 건너뛰고, 1번 컬럼부터 데이터 매핑
        // tableCells[1] -> optionMaps[0]
        for (let i = 1; i < row.tableCells.length; i++) {
          const cell = row.tableCells[i];
          const optionIndex = i - 1;
          if (optionIndex >= optionMaps.length) continue;

          traverseContent(cell.content, optionIndex);
        }
      }
    };

    // 문서 내의 모든 테이블에 대해 적용
    for (const element of doc.data.body.content) {
      if (element.table) {
        traverseTable(element.table);
      }
    }

    if (replacements.length === 0) return;

    // 인덱스가 밀리지 않도록 뒤에서부터 처리하기 위해 정렬
    replacements.sort((a, b) => b.start - a.start);

    const requests = [];
    for (const rep of replacements) {
      // 1. 기존 텍스트(플레이스홀더) 삭제
      requests.push({
        deleteContentRange: {
          range: { startIndex: rep.start, endIndex: rep.end }
        }
      });

      // 2. 새 컨텐츠 삽입
      if (rep.type === 'image') {
        if (rep.value) { // 이미지 URL이 있는 경우에만 삽입
          requests.push({
            insertInlineImage: {
              uri: rep.value,
              location: { index: rep.start },
              objectSize: {
                width: { magnitude: 80, unit: 'PT' } // 비교표 셀 너비에 맞게 조정 (약 2.8cm)
              }
            }
          });
        }
      } else {
        // 텍스트 삽입 (값이 있는 경우에만)
        const textToInsert = String(rep.value || '');
        if (textToInsert) {
          requests.push({
            insertText: {
              text: textToInsert,
              location: { index: rep.start }
            }
          });
        }
      }
    }

    if (requests.length > 0) {
      console.log(`🔄 테이블 변수 치환 시도: ${requests.length / 2}개 항목 (Smart Table)`);
      await docsClient.documents.batchUpdate({
        documentId,
        requestBody: { requests }
      });
      console.log(`✅ 테이블 변수 치환 완료`);
    }

  } catch (error) {
    console.error('❌ 테이블 변수 치환 실패:', error.message);
    throw new Error('테이블 변수 치환에 실패했습니다');
  }
};

/**
 * 문서에서 텍스트 변수를 이미지로 교체
 * @param {string} documentId - 문서 ID
 * @param {Object} imageVariables - 이미지 변수 객체 { "{{변수명}}": "이미지URL" }
 */
const replaceImages = async (documentId, imageVariables) => {
  const { docs: docsClient } = await initializeGoogleAPI();

  if (!docsClient) {
    throw new Error('Google Docs API가 초기화되지 않았습니다');
  }

  try {
    // 1. 문서 내용 조회하여 변수 위치 찾기
    const doc = await docsClient.documents.get({ documentId });
    const content = doc.data.body.content;
    const replacements = []; // { start, end, url }

    // 재귀적으로 구조를 탐색하여 텍스트 위치 찾기
    const findTextAndReplace = (elements) => {
      for (const element of elements) {
        if (element.paragraph) {
          for (const run of element.paragraph.elements) {
            if (run.textRun && run.textRun.content) {
              const text = run.textRun.content;
              const startIndex = run.startIndex;

              const occupiedRanges = []; // [start, end] relative to text

              // Sort keys by length descending to prioritize specific variables
              const sortedKeys = Object.keys(imageVariables).sort((a, b) => b.length - a.length);

              for (const key of sortedKeys) {
                const imageUrl = imageVariables[key];
                if (!imageUrl) continue;

                const regex = new RegExp(escapeRegExp(key), 'g');
                let match;
                while ((match = regex.exec(text)) !== null) {
                  const relStart = match.index;
                  const relEnd = relStart + key.length;

                  // Check overlap
                  const isOverlapping = occupiedRanges.some(([s, e]) =>
                    (relStart < e && relEnd > s)
                  );

                  if (!isOverlapping) {
                    occupiedRanges.push([relStart, relEnd]);

                    const absStart = startIndex + relStart;
                    const absEnd = startIndex + relEnd;

                    replacements.push({
                      start: absStart,
                      end: absEnd,
                      url: imageUrl
                    });
                  }
                }
              }
            }
          }
        } else if (element.table) {
          for (const row of element.table.tableRows) {
            for (const cell of row.tableCells) {
              findTextAndReplace(cell.content);
            }
          }
        } else if (element.tableOfContents) {
          findTextAndReplace(element.tableOfContents.content);
        }
      }
    };

    findTextAndReplace(content);

    if (replacements.length === 0) return;

    // 인덱스가 밀리지 않도록 뒤에서부터 처리하기 위해 정렬
    replacements.sort((a, b) => b.start - a.start);

    const requests = [];
    for (const rep of replacements) {
      // 1. 텍스트 삭제
      requests.push({
        deleteContentRange: {
          range: {
            startIndex: rep.start,
            endIndex: rep.end,
          },
        },
      });

      // 2. 이미지 삽입
      console.log(`🖼️ Inserting image at index ${rep.start}: ${rep.url}`);
      requests.push({
        insertInlineImage: {
          uri: rep.url,
          location: {
            index: rep.start,
          },
          objectSize: {
            height: { magnitude: 300, unit: 'PT' }, // 기본 높이 설정 (조정 가능)
            width: { magnitude: 400, unit: 'PT' },  // 기본 너비 설정
          }
        },
      });
    }

    console.log(`🔄 이미지 교체 시도: ${requests.length / 2}개 항목`);

    await docsClient.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });

    console.log(`✅ 이미지 교체 완료`);
  } catch (error) {
    console.error('❌ 이미지 교체 실패:', error.message);
    // 이미지가 없어도 문서는 생성되어야 하므로 에러를 던지지 않고 로그만 남김
  }
};

/**
 * 문서를 PDF로 내보내기
 * @param {string} documentId - 문서 ID
 * @returns {Buffer} - PDF 파일 버퍼
 */
const exportToPDF = async (documentId) => {
  const { drive: driveClient } = await initializeGoogleAPI();

  if (!driveClient) {
    throw new Error('Google Drive API가 초기화되지 않았습니다');
  }

  try {
    const response = await driveClient.files.export({
      fileId: documentId,
      mimeType: 'application/pdf',
    }, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ PDF 내보내기 실패:', error.message);
    throw new Error('PDF 생성에 실패했습니다');
  }
};

/**
 * 문서 삭제
 * @param {string} documentId - 삭제할 문서 ID
 */
const deleteDocument = async (documentId) => {
  const { drive: driveClient } = await initializeGoogleAPI();

  if (!driveClient) {
    console.warn('⚠️ Google Drive API가 초기화되지 않아 문서를 삭제할 수 없습니다');
    return;
  }

  try {
    await driveClient.files.delete({
      fileId: documentId,
    });
    console.log(`✅ 문서 삭제 완료: ${documentId}`);
  } catch (error) {
    console.error('❌ 문서 삭제 실패:', error.message);
  }
};

/**
 * 표지 생성
 * @param {Object} proposalData - 제안서 기본 정보
 * @param {string} templateId - 템플릿 문서 ID
 * @returns {Buffer} - PDF 버퍼
 */
const generateCoverPage = async (proposalData, templateId) => {
  const docTitle = `${proposalData.document_name} - 표지`;

  try {
    // 템플릿 복사 (Native Copy 사용)
    const docId = await copyTemplate(templateId, docTitle);

    // 변수 준비
    const variables = {
      '{{제안서명}}': proposalData.document_name || '',
      '{{고객사명}}': proposalData.company_name || '',
      '{{발행일}}': proposalData.created_at ? new Date(proposalData.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
      '{{YYYYMMDD}}': proposalData.created_at ? new Date(proposalData.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
      '{{담당자명}}': proposalData.created_by?.name || proposalData.created_by?.username || '',
      '{{담당자이메일}}': proposalData.created_by?.email || '',
      '{{담당자 이메일}}': proposalData.created_by?.email || '', // 공백 포함 버전
      '{{담당자연락처}}': proposalData.created_by?.phone || '',
      '{{담당자 연락처}}': proposalData.created_by?.phone || '', // 공백 포함 버전
    };

    // 변수 치환
    await replaceVariables(docId, variables);

    // PDF 생성
    const pdfBuffer = await exportToPDF(docId);

    // 문서 삭제
    await deleteDocument(docId);

    return pdfBuffer;
  } catch (error) {
    console.error('❌ 표지 생성 실패:', error.message);
    throw error;
  }
};

/**
 * 서비스 안내 페이지 생성
 * @param {string} templateId - 템플릿 문서 ID
 * @param {string} documentName - 제안서명
 * @returns {Buffer} - PDF 버퍼
 */
const generateServiceIntro = async (templateId, documentName) => {
  const docTitle = `${documentName} - 서비스 안내`;

  try {
    // 템플릿 복사 (Native Copy 사용)
    const docId = await copyTemplate(templateId, docTitle);

    // 서비스 안내는 변수가 거의 없을 수 있음 (회사 정보만 있을 수도 있음)
    const variables = {
      '{{회사명}}': 'FASTMATCH',
      '{{서비스명}}': 'FASTMATCH',
      '{{연락처}}': '02-1234-5678',
      '{{이메일}}': 'contact@fastmatch.com',
    };

    // 변수 치환
    await replaceVariables(docId, variables);

    // PDF 생성
    const pdfBuffer = await exportToPDF(docId);

    // 문서 삭제
    await deleteDocument(docId);

    return pdfBuffer;
  } catch (error) {
    console.error('❌ 서비스 안내 생성 실패:', error.message);
    throw error;
  }
};

/**
 * 매물비교표 생성
 * @param {Array} options - 옵션 배열
 * @param {string} templateId - 템플릿 문서 ID
 * @param {string} documentName - 제안서명
 * @param {Object} proposalData - 제안서 데이터 (담당자 정보 포함)
 * @returns {Buffer} - PDF 버퍼
 */
const generateComparisonTable = async (options, templateId, documentName, proposalData) => {
  const pages = prepareComparisonTableData(options);
  const documentIds = [];

  try {
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const pageOptions = pages[pageIndex];
      const docTitle = `${documentName} - 매물비교표 ${pageIndex + 1}`;

      // 템플릿 복사
      const docId = await copyTemplate(templateId, docTitle);

      // 1. 공통 변수 (담당자 정보 등) - 일반 치환 사용
      const commonVariables = {
        '{{담당자명}}': proposalData?.created_by?.name || '',
        '{{담당자 연락처}}': proposalData?.created_by?.phone || '',
        '{{담당자 이메일}}': proposalData?.created_by?.email || '',
      };
      await replaceVariables(docId, commonVariables);

      // 2. 옵션별 변수 맵 준비 (Smart Table Replacement용)
      const optionMaps = pageOptions.map(option => {
        // 빈 옵션일 경우에도 모든 키를 빈 문자열로 설정하여 플레이스홀더 제거
        if (!option) {
          return {
            '{{브랜드명}}': '', '{{지점명}}': '', '{{옵션명}}': '', '{{분류}}': '',
            '{{인실}}': '', '{{월사용료}}': '', '{{보증금}}': '', '{{정가}}': '',
            '{{면적}}': '', '{{전용면적(㎡)}}': '', '{{전용면적(평)}}': '', '{{인당 제공 면적}}': '',
            '{{냉난방}}': '', '{{주차}}': '', '{{주소}}': '', '{{사용승인일}}': '',
            '{{규모}}': '', '{{연면적}}': '', '{{계약기간}}': '', '{{입주가능일}}': '',
            '{{할인율}}': '', '{{인단가}}': '', '{{기타}}': '', '{{IMAGE_BRUNCH}}': ''
          };
        }

        // DB 필드명 매핑 (snake_case)
        const monthlyFee = option.monthly_fee || 0;
        const regularPrice = option.list_price || 0;
        const capacity = option.capacity || 1;

        // 면적 처리 (exclusive_area 객체)
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

        let discountRate = 0;
        if (regularPrice > 0) {
          discountRate = Math.round(((regularPrice - monthlyFee) / regularPrice) * 100);
        }

        const areaPerPerson = capacity > 0 ? (dedicatedAreaPy / capacity).toFixed(1) : '0';
        const pricePerPerson = capacity > 0 ? Math.round(monthlyFee / capacity) : 0;

        const etcItems = [];
        if (option.hvac_type) etcItems.push(option.hvac_type);
        if (option.parking_type) etcItems.push(option.parking_type);

        // 이미지 URL 처리
        let imageBrunch = '';
        if (option.branch?.interior_image_urls && option.branch.interior_image_urls.length > 0) {
          imageBrunch = option.branch.interior_image_urls[0];
        }

        // 접미사 없는 순수 변수명 사용
        return {
          '{{브랜드명}}': option.branch?.brand?.name || '',
          '{{지점명}}': option.branch?.name || '',
          '{{옵션명}}': `${option.branch?.brand?.name || ''} ${option.branch?.name || ''}`.trim(),
          '{{분류}}': `${option.name || ''}(${option.category1 || ''}/${option.category2 || ''})`,
          '{{인실}}': `${option.capacity || 0}인실`,
          '{{월사용료}}': monthlyFee.toLocaleString('ko-KR'),
          '{{보증금}}': (option.deposit || 0).toLocaleString('ko-KR'),
          '{{정가}}': regularPrice.toLocaleString('ko-KR'),
          '{{면적}}': dedicatedArea.toFixed(2),
          '{{전용면적(㎡)}}': dedicatedArea.toFixed(2),
          '{{전용면적(평)}}': dedicatedAreaPy.toFixed(1),
          '{{인당 제공 면적}}': `${areaPerPerson}평`,
          '{{냉난방}}': option.hvac_type || '',
          '{{주차}}': option.parking_type || '',
          '{{주소}}': option.branch?.address || '',
          '{{사용승인일}}': option.branch?.approval_year || '',
          '{{규모}}': `지상 ${option.branch?.floors_above || 0}층 / 지하 ${option.branch?.floors_below || 0}층`,
          '{{연면적}}': option.branch?.total_area ? `${option.branch.total_area.toLocaleString('ko-KR')}㎡` : '',
          '{{계약기간}}': option.contract_period_value || option.contract_period_type || '',
          '{{입주가능일}}': option.move_in_date_value || option.move_in_date_type || '',
          '{{할인율}}': `${discountRate}%`,
          '{{인단가}}': pricePerPerson.toLocaleString('ko-KR'),
          '{{기타}}': etcItems.join(', '),
          '{{IMAGE_BRUNCH}}': imageBrunch,
        };
      });

      // 3. 테이블 변수 치환 실행
      await replaceTableVariables(docId, optionMaps);

      // PDF 생성
      const pdfBuffer = await exportToPDF(docId);
      documentIds.push({ docId, pdfBuffer });
    }

    // 생성된 문서 삭제
    await Promise.all(documentIds.map(item => deleteDocument(item.docId)));

    // PDF 병합 로직
    const pdfBuffers = documentIds.map(item => item.pdfBuffer);

    if (pdfBuffers.length === 0) {
      throw new Error('생성된 PDF가 없습니다.');
    }

    if (pdfBuffers.length === 1) {
      return pdfBuffers[0];
    }

    // PDF 병합
    const { PDFDocument } = require('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    return Buffer.from(await mergedPdf.save());
  } catch (error) {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), `[${new Date().toISOString()}] ❌ generateComparisonTable Error: ${error.stack}\n`);
    console.error('❌ 매물비교표 생성 실패:', error.message);

    // 에러 발생 시 생성된 문서 삭제
    await Promise.all(documentIds.map(item => deleteDocument(item.docId)));

    throw error;
  }
};

/**
 * 옵션 상세 페이지 생성
 * @param {Object} option - 옵션 정보
 * @param {string} templateId - 템플릿 문서 ID
 * @param {string} documentName - 제안서명
 * @param {Object} proposalData - 제안서 데이터 (담당자 정보 포함)
 * @returns {Buffer} - PDF 버퍼
 */
const generateOptionDetail = async (option, templateId, documentName, proposalData) => {
  // 평면도 이미지가 없어도 생성 시도 (로그만 남김)
  if (!option.floor_plan_url) {
    console.log(`⚠️ 평면도 이미지가 없습니다: ${option.name} (상세 페이지 생성 계속 진행)`);
  }

  const docTitle = `${documentName} - ${option.name} 상세`;

  try {
    // 템플릿 복사 (Native Copy 사용)
    const docId = await copyTemplate(templateId, docTitle);

    // 계산 로직
    // 면적 처리 (exclusive_area 객체)
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

    // 일회성 비용 텍스트 변환
    let oneTimeCostsText = '없음';
    if (option.one_time_fees && option.one_time_fees.length > 0) {
      oneTimeCostsText = option.one_time_fees
        .map(cost => `${cost.type}: ${cost.amount.toLocaleString('ko-KR')}원`)
        .join(', ');
    }

    // 변수 준비
    const variables = {
      // 담당자 정보
      '{{담당자명}}': proposalData?.created_by?.name || '',
      '{{담당자 연락처}}': proposalData?.created_by?.phone || '',
      '{{담당자 이메일}}': proposalData?.created_by?.email || '',

      // 옵션 정보
      '{{브랜드명}}': option.branch?.brand?.name || '',
      '{{지점명}}': option.branch?.name || '',
      '{{옵션명}}': option.name || '',
      '{{주소}}': option.branch?.address || '',
      '{{교통}}': (() => {
        const subway = option.branch?.nearest_subway || '';
        const isTransit = option.branch?.is_transit || false;
        const walkingDistance = option.branch?.walking_distance || 0;
        const transitDistance = option.branch?.transit_distance || walkingDistance;

        // is_transit 필드가 있으면 그것을 우선 사용, 없으면 walking_distance > 15로 판단
        const useTransit = isTransit || walkingDistance > 15;
        const displayDistance = useTransit ? transitDistance : walkingDistance;
        const transportType = useTransit ? '대중교통' : '도보';

        return `${subway} ${transportType} ${displayDistance}분 거리`;
      })(),
      '{{전용면적}}': `${dedicatedArea.toFixed(2)}㎡ / ${dedicatedAreaPy.toFixed(1)}평`,
      '{{인실}}': `${option.name || ''}(${option.category1 || ''}/${option.category2 || ''})`,
      '{{층수}}': option.floor ? `${option.floor}층` : '',
      '{{월사용료}}': monthlyFee.toLocaleString('ko-KR'),
      '{{정가}}': regularPrice.toLocaleString('ko-KR'),
      '{{보증금}}': (option.deposit || 0).toLocaleString('ko-KR'),
      '{{할인가}}': monthlyFee.toLocaleString('ko-KR'),
      '{{관리비}}': option.maintenance_fee_included ? '포함' : '별도',
      '{{VAT}}': option.vat_included ? '포함' : '별도',
      '{{일회성비용}}': oneTimeCostsText,
      '{{일회성 비용}}': oneTimeCostsText, // 띄어쓰기 대응
      '{{냉난방}}': option.hvac_type || '',
      '{{주차}}': option.parking_type || '',
      '{{입주가능일}}': option.move_in_date_value || option.move_in_date_type || '',
      '{{계약기간}}': option.contract_period_value || option.contract_period_type || '',
      '{{입주가능시기}}': option.move_in_date_value || option.move_in_date_type || '',
      '{{입주 가능 시기}}': option.move_in_date_value || option.move_in_date_type || '', // 띄어쓰기 대응
      '{{오피스 정보}}': option.office_info || '',
      '{{기본 정보1}}': option.branch?.basic_info_1 || '',
      '{{기본 정보2}}': option.branch?.basic_info_2 || '',
      '{{기본 정보3}}': option.branch?.basic_info_3 || '',
    };

    // 기타: 비고 + 크레딧 + 냉난방 + 주차방식 (최대 2개)
    const etcItems = [];
    if (option.memo) etcItems.push(option.memo);
    if (option.credits) etcItems.push(option.credits);
    if (option.hvac_type) etcItems.push(option.hvac_type);
    if (option.parking_type) etcItems.push(option.parking_type);
    variables['{{기타}}'] = etcItems.slice(0, 2).join(' / ');

    // 이미지 변수 준비
    const imageVariables = {};

    // 지점 대표 이미지 (외관 -> 없으면 내부1)
    if (option.branch?.exterior_image_url) {
      imageVariables['{{IMAGE_BRUNCH}}'] = option.branch.exterior_image_url;
    } else if (option.branch?.interior_image_urls && option.branch.interior_image_urls.length > 0) {
      imageVariables['{{IMAGE_BRUNCH}}'] = option.branch.interior_image_urls[0];
    } else {
      variables['{{IMAGE_BRUNCH}}'] = '';
    }

    // 내부 이미지 1~4
    const interiorImages = option.branch?.interior_image_urls || [];
    for (let i = 0; i < 4; i++) {
      if (interiorImages[i]) {
        imageVariables[`{{IMAGE_BRUNCH_INTERIOR${i + 1}}}`] = interiorImages[i];
      } else {
        variables[`{{IMAGE_BRUNCH_INTERIOR${i + 1}}}`] = '';
      }
    }

    // 평면도
    if (option.floor_plan_url) {
      imageVariables['{{IMAGE_OPTION_PLAN}}'] = option.floor_plan_url;
    } else {
      variables['{{IMAGE_OPTION_PLAN}}'] = '';
    }

    // 지도 (카카오 Static Map) - 디버깅을 위해 임시 비활성화
    // if (option.branch?.latitude && option.branch?.longitude) {
    //   const { getStaticMapUrl } = require('./externalApi.service');
    //   const mapUrl = getStaticMapUrl(option.branch.latitude, option.branch.longitude);
    //   if (mapUrl) {
    //     imageVariables['{{IMAGE_MAP}}'] = mapUrl;
    //   } else {
    //     variables['{{IMAGE_MAP}}'] = '';
    //   }
    // } else {
    variables['{{IMAGE_MAP}}'] = '';
    // }

    // 변수 치환
    await replaceVariables(docId, variables);

    // 이미지 교체
    await replaceImages(docId, imageVariables);

    // PDF 생성
    const pdfBuffer = await exportToPDF(docId);

    // 문서 삭제
    await deleteDocument(docId);

    return pdfBuffer;
  } catch (error) {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), `[${new Date().toISOString()}] ❌ generateOptionDetail Error: ${error.stack}\n`);
    console.error('❌ 옵션 상세 생성 실패:', error.message);
    throw error;
  }
};

module.exports = {
  initializeGoogleAPI,
  prepareComparisonTableData,
  prepareOptionDetailData,
  copyTemplate,
  replaceVariables,
  replaceImages,
  replaceTableVariables,
  exportToPDF,
  deleteDocument,
  generateCoverPage,
  generateServiceIntro,
  generateComparisonTable,
  generateOptionDetail,
};
