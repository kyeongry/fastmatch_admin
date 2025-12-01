require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

/**
 * 서비스 계정 Drive에 직접 빈 템플릿 생성
 * 개인 계정의 Drive 용량 문제를 우회
 */
async function createTemplatesInServiceAccount() {
  try {
    console.log('📝 서비스 계정 Drive에 템플릿 생성 중...\n');

    const { drive, docs } = await initializeGoogleAPI();

    if (!drive || !docs) {
      console.error('❌ Google API 초기화 실패');
      return;
    }

    const templates = [
      {
        name: '표지',
        title: '[FASTMATCH] 표지 템플릿',
        content: `
제안서명: {{제안서명}}
고객사명: {{고객사명}}
발행일: {{발행일}}

담당자 정보:
이름: {{담당자명}}
이메일: {{담당자이메일}}
연락처: {{담당자연락처}}
        `.trim(),
        envKey: 'GOOGLE_DOCS_COVER_TEMPLATE_ID'
      },
      {
        name: '서비스안내',
        title: '[FASTMATCH] 서비스 안내 템플릿',
        content: `
회사명: {{회사명}}
서비스명: {{서비스명}}
연락처: {{연락처}}
이메일: {{이메일}}

FASTMATCH 서비스 소개

[여기에 서비스 안내 내용을 작성하세요]
        `.trim(),
        envKey: 'GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID'
      },
      {
        name: '비교표',
        title: '[FASTMATCH] 매물 비교표 템플릿',
        content: `
매물 비교표

옵션 1: {{option1_name}}
가격: {{option1_price}}
면적: {{option1_area}}
위치: {{option1_location}}

옵션 2: {{option2_name}}
가격: {{option2_price}}
면적: {{option2_area}}
위치: {{option2_location}}

[최대 5개 옵션까지 비교 가능]
        `.trim(),
        envKey: 'GOOGLE_DOCS_COMPARISON_TEMPLATE_ID'
      },
      {
        name: '상세',
        title: '[FASTMATCH] 옵션 상세 템플릿',
        content: `
옵션명: {{옵션명}}
브랜드: {{브랜드명}}
지점: {{지점명}}

가격 정보:
월 임대료: {{월임대료}}
보증금: {{보증금}}
관리비: {{관리비}}

기본 정보:
면적: {{면적}}
층: {{층}}
주소: {{주소}}

[여기에 옵션 상세 정보를 작성하세요]
        `.trim(),
        envKey: 'GOOGLE_DOCS_DETAIL_TEMPLATE_ID'
      },
    ];

    console.log('✅ 서비스 계정 Drive에 템플릿 생성을 시작합니다.\n');
    console.log('📋 생성 후 .env 파일에 추가할 내용:\n');

    const newIds = [];

    for (const template of templates) {
      try {
        console.log(`\n🔄 "${template.name}" 템플릿 생성 중...`);

        // 1. 빈 Google Docs 문서 생성
        const createResponse = await docs.documents.create({
          requestBody: {
            title: template.title,
          },
        });

        const docId = createResponse.data.documentId;
        console.log(`   ✅ 문서 생성 완료: ${docId}`);

        // 2. 템플릿 내용 삽입
        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: template.content,
                },
              },
            ],
          },
        });

        console.log(`   ✅ 내용 삽입 완료`);

        // 3. 파일 정보 확인
        const fileInfo = await drive.files.get({
          fileId: docId,
          fields: 'id, name, webViewLink, owners',
        });

        console.log(`   📄 템플릿 정보:`);
        console.log(`      이름: ${fileInfo.data.name}`);
        console.log(`      URL: ${fileInfo.data.webViewLink}`);
        console.log(`      소유자: ${fileInfo.data.owners?.[0]?.emailAddress || 'N/A'}`);

        // 4. .env 업데이트 정보 저장
        newIds.push({
          key: template.envKey,
          value: docId,
          name: template.name,
        });

        console.log(`   ✅ ${template.name} 템플릿 생성 완료!`);

      } catch (error) {
        console.error(`   ❌ ${template.name} 생성 실패:`, error.message);
      }
    }

    // 최종 .env 업데이트 가이드
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ 템플릿 생성 완료!\n');
    console.log('📋 backend/.env 파일에 다음 내용을 복사하세요:\n');
    console.log('-'.repeat(80));

    newIds.forEach(item => {
      console.log(`${item.key}=${item.value}`);
    });

    console.log('-'.repeat(80));

    console.log('\n📌 다음 단계:');
    console.log('1. 위 ID들을 backend/.env 파일에 붙여넣기 (기존 ID 덮어쓰기)');
    console.log('2. 각 템플릿 URL을 열어서 내용 확인 및 디자인 수정');
    console.log('3. 백엔드 서버 재시작');
    console.log('4. PDF 생성 테스트');

    console.log('\n💡 템플릿 디자인 수정 방법:');
    console.log('1. 위에 출력된 각 템플릿의 URL 클릭');
    console.log('2. Google Docs에서 디자인 편집 (폰트, 색상, 레이아웃 등)');
    console.log('3. 변수 {{변수명}}은 그대로 유지 (자동으로 실제 값으로 치환됨)');
    console.log('4. 저장은 자동으로 됨');

    console.log('\n⚠️ 중요:');
    console.log('- 이 템플릿들은 서비스 계정의 Drive에 생성되어 용량 제한이 없습니다');
    console.log('- 개인 계정의 Drive 공간을 사용하지 않습니다');
    console.log('- PDF 생성 시 이 템플릿들을 복사하여 사용합니다');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error);
  }
}

createTemplatesInServiceAccount();
