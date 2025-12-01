require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

async function testDriveStatus() {
  try {
    console.log('📝 Google Drive 상태 확인...\n');

    const { drive } = await initializeGoogleAPI();

    if (!drive) {
      console.error('❌ Google Drive API 초기화 실패');
      return;
    }

    console.log('✅ Google Drive API 초기화 성공\n');

    // 1. Drive 파일 목록 조회
    console.log('1️⃣ Drive 파일 목록 조회 중...');
    const fileList = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, mimeType, size, createdTime, trashed)',
      q: 'trashed=false',
    });

    const files = fileList.data.files || [];
    console.log(`   파일 개수: ${files.length}개\n`);

    if (files.length > 0) {
      console.log('📁 파일 목록:');
      files.forEach((file, i) => {
        const size = file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'N/A';
        console.log(`   ${i + 1}. ${file.name}`);
        console.log(`      ID: ${file.id}`);
        console.log(`      크기: ${size}`);
        console.log(`      생성일: ${file.createdTime}`);
        console.log('');
      });
    } else {
      console.log('   파일이 없습니다.\n');
    }

    // 2. 저장 공간 정보 (About API)
    console.log('2️⃣ 저장 공간 정보 조회 중...');
    try {
      const about = await drive.about.get({
        fields: 'storageQuota, user',
      });

      if (about.data.storageQuota) {
        const quota = about.data.storageQuota;
        const used = parseInt(quota.usage || 0);
        const limit = parseInt(quota.limit || 0);
        const usedGB = (used / 1024 / 1024 / 1024).toFixed(2);
        const limitGB = limit > 0 ? (limit / 1024 / 1024 / 1024).toFixed(2) : '무제한';
        const percent = limit > 0 ? ((used / limit) * 100).toFixed(1) : 0;

        console.log(`   사용 중: ${usedGB} GB`);
        console.log(`   전체: ${limitGB} GB`);
        console.log(`   사용률: ${percent}%\n`);

        if (percent > 90) {
          console.log('⚠️ 저장 공간이 90% 이상 사용 중입니다!');
        }
      } else {
        console.log('   저장 공간 정보를 가져올 수 없습니다.\n');
      }
    } catch (error) {
      console.log('   저장 공간 정보 조회 실패 (서비스 계정은 제한적 정보만 제공)\n');
    }

    // 3. 템플릿 접근 테스트
    console.log('3️⃣ 템플릿 접근 테스트...');
    const templateIds = [
      { name: '표지', id: process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID },
      { name: '서비스안내', id: process.env.GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID },
      { name: '비교표', id: process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID },
      { name: '상세', id: process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID },
    ];

    for (const template of templateIds) {
      try {
        const file = await drive.files.get({
          fileId: template.id,
          fields: 'id, name, permissions, owners',
        });

        console.log(`   ✅ ${template.name}: 접근 가능`);
        console.log(`      이름: ${file.data.name}`);
        console.log('');
      } catch (error) {
        console.log(`   ❌ ${template.name}: 접근 불가`);
        console.log(`      에러: ${error.message}`);
        console.log('');
      }
    }

    console.log('✅ 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error);
  }
}

testDriveStatus();
