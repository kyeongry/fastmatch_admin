require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

async function checkTemplateOwners() {
  try {
    console.log('📝 템플릿 소유자 확인...\n');

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

    for (const template of templates) {
      try {
        const fileInfo = await drive.files.get({
          fileId: template.id,
          fields: 'id, name, owners, permissions, driveId, capabilities',
        });

        console.log(`📄 ${template.name} 템플릿:`);
        console.log(`   파일명: ${fileInfo.data.name}`);
        console.log(`   소유자: ${fileInfo.data.owners?.[0]?.emailAddress || 'N/A'}`);
        console.log(`   소유자 이름: ${fileInfo.data.owners?.[0]?.displayName || 'N/A'}`);

        if (fileInfo.data.permissions) {
          console.log('   공유된 사용자:');
          fileInfo.data.permissions.forEach(perm => {
            console.log(`      - ${perm.emailAddress || perm.type}: ${perm.role}`);
          });
        }

        console.log('   복사 가능:', fileInfo.data.capabilities?.canCopy || false);
        console.log('');

      } catch (error) {
        console.error(`   ❌ ${template.name} 확인 실패:`, error.message);
        console.log('');
      }
    }

    console.log('\n💡 문제 분석:');
    console.log('템플릿이 개인 Gmail 계정 소유인 경우:');
    console.log('- 템플릿을 복사할 때 원본 소유자의 Drive 용량을 확인함');
    console.log('- 원본 소유자의 Drive가 가득 차면 복사 실패');
    console.log('');
    console.log('해결 방법:');
    console.log('1. 개인 Gmail Drive 공간 확보 (가장 빠른 방법)');
    console.log('2. 템플릿 소유권을 서비스 계정으로 이전 (복잡함)');
    console.log('3. 템플릿을 서비스 계정에서 처음부터 새로 만들기');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error);
  }
}

checkTemplateOwners();
