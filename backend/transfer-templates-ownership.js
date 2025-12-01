require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

/**
 * 템플릿 소유권을 서비스 계정으로 이전
 * 또는 서비스 계정 Drive에 새로운 복사본 생성
 */
async function transferTemplatesOwnership() {
  try {
    console.log('📝 템플릿 소유권 이전 프로세스 시작...\n');

    const { drive } = await initializeGoogleAPI();

    if (!drive) {
      console.error('❌ Google Drive API 초기화 실패');
      return;
    }

    const templates = [
      { name: '표지', id: process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID },
      { name: '서비스안내', id: process.env.GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID },
      { name: '비교표', id: process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID },
      { name: '상세', id: process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID },
    ];

    const serviceAccountEmail = 'fastmatch-pdf-service@fastmatch-479006.iam.gserviceaccount.com';

    console.log('📋 방법 1: 각 템플릿의 복사본을 서비스 계정 Drive에 생성\n');

    for (const template of templates) {
      try {
        console.log(`\n🔄 ${template.name} 템플릿 처리 중...`);
        console.log(`   원본 ID: ${template.id}`);

        // 1. 복사본 생성 (서비스 계정 Drive의 루트에)
        const copyResponse = await drive.files.copy({
          fileId: template.id,
          requestBody: {
            name: `[서비스계정용] ${template.name} 템플릿`,
            // parents를 지정하지 않으면 서비스 계정의 루트 Drive에 생성
          },
        });

        const newFileId = copyResponse.data.id;
        console.log(`   ✅ 복사 완료: ${newFileId}`);

        // 2. 복사본에 대한 권한 확인
        const permissions = await drive.permissions.list({
          fileId: newFileId,
          fields: 'permissions(id, type, role, emailAddress)',
        });

        console.log('   📊 권한 목록:');
        permissions.data.permissions.forEach(perm => {
          console.log(`      - ${perm.emailAddress || perm.type}: ${perm.role}`);
        });

        // 3. 새 파일 정보 출력
        const fileInfo = await drive.files.get({
          fileId: newFileId,
          fields: 'id, name, webViewLink, owners',
        });

        console.log(`   📄 새 템플릿 정보:`);
        console.log(`      이름: ${fileInfo.data.name}`);
        console.log(`      ID: ${fileInfo.data.id}`);
        console.log(`      URL: ${fileInfo.data.webViewLink}`);
        console.log(`      소유자: ${fileInfo.data.owners?.[0]?.emailAddress || 'N/A'}`);

        console.log(`\n   ⚠️ .env 파일을 다음 ID로 업데이트하세요:`);
        if (template.name === '표지') {
          console.log(`   GOOGLE_DOCS_COVER_TEMPLATE_ID=${newFileId}`);
        } else if (template.name === '서비스안내') {
          console.log(`   GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID=${newFileId}`);
        } else if (template.name === '비교표') {
          console.log(`   GOOGLE_DOCS_COMPARISON_TEMPLATE_ID=${newFileId}`);
        } else if (template.name === '상세') {
          console.log(`   GOOGLE_DOCS_DETAIL_TEMPLATE_ID=${newFileId}`);
        }

      } catch (error) {
        console.error(`   ❌ ${template.name} 처리 실패:`, error.message);

        if (error.message.includes('quota')) {
          console.log('\n   💡 해결 방법:');
          console.log('   1. 개인 Gmail 계정의 Google Drive 공간 확보');
          console.log('   2. 또는 서비스 계정으로 직접 템플릿 생성 (아래 방법 2 참조)');
        }
      }
    }

    console.log('\n\n📌 다음 단계:');
    console.log('1. 위에서 생성된 새 ID들로 backend/.env 파일 업데이트');
    console.log('2. 백엔드 서버 재시작');
    console.log('3. PDF 생성 테스트');

    console.log('\n\n💡 방법 2: 템플릿을 서비스 계정에서 직접 생성하는 방법');
    console.log('1. https://docs.google.com 접속');
    console.log('2. 서비스 계정으로 공유된 기존 템플릿 열기');
    console.log('3. "파일" > "사본 만들기" 선택');
    console.log('4. 사본의 소유자가 서비스 계정인지 확인');
    console.log('5. 새 문서 ID로 .env 업데이트');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error);
  }
}

transferTemplatesOwnership();
