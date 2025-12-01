require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function testCreateDoc() {
  try {
    console.log('📝 Google Docs 생성 권한 테스트...\n');

    // 서비스 계정으로 인증
    const keyFilePath = path.join(__dirname, 'credentials/google-service-account.json');

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    const authClient = await auth.getClient();
    const docs = google.docs({ version: 'v1', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });

    console.log('✅ Google API 인증 성공\n');

    // 방법 1: Drive API로 빈 문서 생성
    console.log('1️⃣ Drive API로 문서 생성 시도...');
    try {
      const driveResponse = await drive.files.create({
        requestBody: {
          name: 'TEST - 서비스 계정 테스트 문서',
          mimeType: 'application/vnd.google-apps.document',
        },
        fields: 'id, name, webViewLink',
      });

      console.log('   ✅ Drive API 생성 성공!');
      console.log('   📄 문서 ID:', driveResponse.data.id);
      console.log('   📄 문서 이름:', driveResponse.data.name);
      console.log('   📄 URL:', driveResponse.data.webViewLink);

      // 생성된 문서에 내용 추가
      console.log('\n2️⃣ Docs API로 내용 추가 시도...');
      await docs.documents.batchUpdate({
        documentId: driveResponse.data.id,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: '테스트 내용\n\n변수 테스트: {{변수1}}, {{변수2}}',
              },
            },
          ],
        },
      });

      console.log('   ✅ 내용 추가 성공!\n');

      // 문서 삭제
      console.log('3️⃣ 테스트 문서 삭제...');
      await drive.files.delete({
        fileId: driveResponse.data.id,
      });
      console.log('   ✅ 삭제 완료\n');

      console.log('✅ 모든 테스트 통과!');
      console.log('\n💡 결과: 서비스 계정은 자신의 Drive에 문서를 생성할 수 있습니다.');
      console.log('📌 이제 create-templates-in-service-account.js를 다시 실행하세요.');

    } catch (error) {
      console.error('   ❌ 생성 실패:', error.message);

      if (error.message.includes('quota')) {
        console.log('\n⚠️ 용량 문제 발생:');
        console.log('   - 서비스 계정도 Drive 할당량의 영향을 받을 수 있습니다');
        console.log('   - Google Workspace 계정이 필요할 수 있습니다');
      } else if (error.message.includes('permission')) {
        console.log('\n⚠️ 권한 문제 발생:');
        console.log('   - Google Cloud Console에서 Google Docs API가 활성화되었는지 확인');
        console.log('   - 서비스 계정에 필요한 권한이 있는지 확인');
      }
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error);
  }
}

testCreateDoc();
