require('dotenv').config();
const mongoose = require('mongoose');
const { generateProposalPDF } = require('./src/services/proposalPDF.service');

// MongoDB 스키마 간단히 정의 (테스트용)
const optionSchema = new mongoose.Schema({}, { strict: false });
const proposalDocumentSchema = new mongoose.Schema({}, { strict: false });

const Option = mongoose.model('Option', optionSchema);
const ProposalDocument = mongoose.model('ProposalDocument', proposalDocumentSchema);

async function testPDFGeneration() {
  try {
    console.log('📝 PDF 생성 테스트 시작...\n');

    // 1. MongoDB 연결
    console.log('1️⃣ MongoDB 연결 중...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB 연결 성공\n');

    // 2. 테스트용 옵션 3개 조회 (실제 DB에서)
    console.log('2️⃣ 옵션 데이터 조회 중...');
    const options = await Option.find().limit(3).populate('branch');

    if (options.length === 0) {
      console.error('❌ DB에 옵션이 없습니다. 먼저 옵션을 등록해주세요.');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ ${options.length}개 옵션 조회 완료`);
    options.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt.option_name || '이름 없음'}`);
    });
    console.log('');

    // 3. 테스트용 제안서 생성
    console.log('3️⃣ 테스트 제안서 생성 중...');
    const testProposal = new ProposalDocument({
      document_name: '테스트 제안서 - Google Docs',
      company_name: '테스트 고객사',
      created_by: {
        name: '테스트 담당자',
        username: 'test',
        email: 'test@fastmatch.com',
        phone: '010-1234-5678'
      },
      options: options.map(opt => opt._id),
      status: 'draft',
      created_at: new Date(),
    });

    await testProposal.save();
    console.log('✅ 제안서 생성 완료');
    console.log(`   제안서 ID: ${testProposal._id}\n`);

    // 4. PDF 생성 시작
    console.log('4️⃣ PDF 생성 시작...');
    console.log('   (Google Docs API 호출 - 시간이 걸릴 수 있습니다)\n');

    const result = await generateProposalPDF(
      testProposal._id.toString(),
      'test-user-id'
    );

    console.log('\n✅ PDF 생성 성공!');
    console.log('   PDF URL:', result.pdfUrl);
    console.log('   파일명:', result.fileName);
    console.log('   페이지 수:', result.pageCount);
    console.log('');

    console.log('📌 PDF 다운로드:');
    console.log(`   ${result.pdfUrl}`);
    console.log('');

    console.log('🎉 테스트 완료!');

    // 정리
    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);

    if (error.message.includes('permission')) {
      console.error('\n⚠️ 권한 오류 발생!');
      console.error('   템플릿이 서비스 계정과 공유되었는지 확인하세요:');
      console.error('   fastmatch-pdf-service@fastmatch-479006.iam.gserviceaccount.com');
    }

    console.error('\n전체 오류:');
    console.error(error);

    await mongoose.disconnect();
    process.exit(1);
  }
}

testPDFGeneration();
