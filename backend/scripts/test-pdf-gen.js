/**
 * HTML 템플릿 기반 PDF 생성 테스트 스크립트
 * 모의 데이터를 사용하여 PDF 생성 기능 검증
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs').promises;
const htmlPdfService = require('../src/services/htmlPdf.service');

// 모의 데이터
const mockProposalData = {
  id: 'test-proposal-001',
  document_name: '테스트고객사_제안서_20251127',
  company_name: '테스트고객사',
  creator: {
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'hong@fastmatch.kr',
  },
  options: [
    {
      name: '위워크 삼성역점 10인실',
      capacity: 10,
      category1: '연접호실',
      category2: '',
      monthly_fee: 2700000,
      list_price: 3600000,
      deposit: 5400000,
      exclusive_area: { value: 25, unit: 'pyeong' },
      contract_period_value: 12,
      contract_period_type: '12개월',
      move_in_date_type: 'immediate',
      move_in_date_value: null,
      memo: '주차 2대 무료 제공',
      floor_plan_url: null, // 평면도 없음 테스트
      one_time_fees: [
        { type: '인테리어비', amount: 500000 },
      ],
      office_info: '프리미엄 코너 오피스',
      branch: {
        name: '삼성역점',
        address: '서울특별시 강남구 테헤란로 152 강남파이낸스센터',
        brand: { name: '위워크' },
        approval_year: 2019,
        floors_above: 25,
        floors_below: 5,
        nearest_subway: '삼성역 2번출구',
        walking_distance: 3,
        latitude: 37.5089,
        longitude: 127.0639,
        exterior_image_url: 'https://via.placeholder.com/400x300?text=외관사진1',
        interior_image_urls: [
          'https://via.placeholder.com/400x300?text=내부사진1',
          'https://via.placeholder.com/400x300?text=내부사진2',
          'https://via.placeholder.com/400x300?text=내부사진3',
          'https://via.placeholder.com/400x300?text=내부사진4',
        ],
        basic_info_1: '24시간 출입 가능',
        basic_info_2: '회의실 월 10시간 무료',
        basic_info_3: '무료 커피/음료 제공',
      },
    },
    {
      name: '패스트파이브 역삼점 8인실',
      capacity: 8,
      category1: '내측',
      category2: '',
      monthly_fee: 2200000,
      list_price: 2800000,
      deposit: 4400000,
      exclusive_area: { value: 20, unit: 'pyeong' },
      contract_period_value: 12,
      contract_period_type: '12개월',
      move_in_date_type: 'specific',
      move_in_date_value: '2025-02-01',
      memo: '',
      floor_plan_url: 'https://via.placeholder.com/800x600?text=평면도', // 평면도 있음 테스트
      one_time_fees: [],
      office_info: '스탠다드 오피스',
      branch: {
        name: '역삼점',
        address: '서울특별시 강남구 역삼로 134',
        brand: { name: '패스트파이브' },
        approval_year: 2020,
        floors_above: 12,
        floors_below: 3,
        nearest_subway: '역삼역 3번출구',
        walking_distance: 2,
        latitude: 37.5001,
        longitude: 127.0365,
        exterior_image_url: 'https://via.placeholder.com/400x300?text=외관사진2',
        interior_image_urls: [
          'https://via.placeholder.com/400x300?text=내부사진5',
          'https://via.placeholder.com/400x300?text=내부사진6',
          'https://via.placeholder.com/400x300?text=내부사진7',
          'https://via.placeholder.com/400x300?text=내부사진8',
        ],
        basic_info_1: '주 5일 청소 서비스',
        basic_info_2: '라운지 이용 가능',
        basic_info_3: '',
      },
    },
    {
      name: '스파크플러스 선릉점 6인실',
      capacity: 6,
      category1: '',
      category2: '',
      monthly_fee: 1800000,
      list_price: 2200000,
      deposit: 3600000,
      exclusive_area: { value: 50, unit: 'sqm' },
      contract_period_value: 6,
      contract_period_type: '6개월',
      move_in_date_type: 'negotiable',
      move_in_date_value: null,
      memo: '창가 위치, 조망 우수',
      floor_plan_url: null,
      one_time_fees: [
        { type: '세팅비', amount: 300000 },
        { type: '청소비', amount: 100000 },
      ],
      office_info: '',
      branch: {
        name: '선릉점',
        address: '서울특별시 강남구 선릉로 433',
        brand: { name: '스파크플러스' },
        approval_year: 2018,
        floors_above: 15,
        floors_below: 2,
        nearest_subway: '선릉역 1번출구',
        walking_distance: 5,
        latitude: 37.5045,
        longitude: 127.0488,
        exterior_image_url: null,
        interior_image_urls: [
          'https://via.placeholder.com/400x300?text=내부사진9',
          'https://via.placeholder.com/400x300?text=내부사진10',
        ],
        basic_info_1: '공용 주방 이용 가능',
        basic_info_2: '',
        basic_info_3: '',
      },
    },
  ],
};

async function testFormatters() {
  console.log('\n========== 포맷터 테스트 ==========\n');
  const { formatters } = htmlPdfService;

  // 금액 포맷
  console.log('금액 포맷:');
  console.log(`  currency(2700000) = ${formatters.currency(2700000)}`);
  console.log(`  number(5400000) = ${formatters.number(5400000)}`);

  // 년도 포맷
  console.log('\n년도 포맷:');
  console.log(`  year(2019) = ${formatters.year(2019)}`);

  // 면적 포맷
  console.log('\n면적 포맷:');
  console.log(`  areaPyeong(25) = ${formatters.areaPyeong(25)}`);
  console.log(`  areaSqm(82.6) = ${formatters.areaSqm(82.6)}`);

  // 계약기간 포맷
  console.log('\n계약기간 포맷:');
  console.log(`  contractPeriod(12) = ${formatters.contractPeriod(12)}`);
  console.log(`  contractPeriod('12개월') = ${formatters.contractPeriod('12개월')}`);

  // 입주가능일 포맷
  console.log('\n입주가능일 포맷:');
  console.log(`  moveInDate(null, 'immediate') = ${formatters.moveInDate(null, 'immediate')}`);
  console.log(`  moveInDate(null, 'negotiable') = ${formatters.moveInDate(null, 'negotiable')}`);
  console.log(`  moveInDate('2025-02-01', 'specific') = ${formatters.moveInDate('2025-02-01', 'specific')}`);

  // 인실 포맷
  console.log('\n인실 포맷:');
  console.log(`  capacity(10, '연접호실', '') = ${formatters.capacity(10, '연접호실', '')}`);
  console.log(`  capacity(8, '내측', '') = ${formatters.capacity(8, '내측', '')}`);
  console.log(`  capacity(6, '', '') = ${formatters.capacity(6, '', '')}`);

  // 할인율 계산
  console.log('\n할인율 계산:');
  console.log(`  discountRate(3600000, 2700000) = ${formatters.discountRate(3600000, 2700000)}`);
  console.log(`  discountRate(2800000, 2200000) = ${formatters.discountRate(2800000, 2200000)}`);
  console.log(`  discountRate(2200000, 1800000) = ${formatters.discountRate(2200000, 1800000)}`);

  console.log('\n✅ 포맷터 테스트 완료');
}

async function testCoverPage() {
  console.log('\n========== 표지 페이지 테스트 ==========\n');

  try {
    const coverPdf = await htmlPdfService.generateCoverPage(mockProposalData);
    const outputPath = path.join(__dirname, 'test_cover.pdf');
    await fs.writeFile(outputPath, coverPdf);
    console.log(`✅ 표지 PDF 생성 완료: ${outputPath}`);
    console.log(`   파일 크기: ${(coverPdf.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ 표지 생성 실패:', error.message);
  }
}

async function testServicePage() {
  console.log('\n========== 서비스 안내 페이지 테스트 ==========\n');

  try {
    const servicePdf = await htmlPdfService.generateServicePage(mockProposalData);
    const outputPath = path.join(__dirname, 'test_service.pdf');
    await fs.writeFile(outputPath, servicePdf);
    console.log(`✅ 서비스 안내 PDF 생성 완료: ${outputPath}`);
    console.log(`   파일 크기: ${(servicePdf.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ 서비스 안내 생성 실패:', error.message);
  }
}

async function testComparisonPage() {
  console.log('\n========== 비교표 페이지 테스트 ==========\n');

  try {
    const comparisonPdf = await htmlPdfService.generateComparisonPage(
      mockProposalData.options,
      mockProposalData
    );
    const outputPath = path.join(__dirname, 'test_comparison.pdf');
    await fs.writeFile(outputPath, comparisonPdf);
    console.log(`✅ 비교표 PDF 생성 완료: ${outputPath}`);
    console.log(`   파일 크기: ${(comparisonPdf.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ 비교표 생성 실패:', error.message);
  }
}

async function testOptionDetailPage() {
  console.log('\n========== 옵션 상세 페이지 테스트 ==========\n');

  try {
    // 첫 번째 옵션 (평면도 없음)
    const option1 = mockProposalData.options[0];
    const detail1Pdf = await htmlPdfService.generateOptionDetailPage(option1, mockProposalData);
    const outputPath1 = path.join(__dirname, 'test_detail_no_floorplan.pdf');
    await fs.writeFile(outputPath1, detail1Pdf);
    console.log(`✅ 옵션 상세 PDF (평면도 없음) 생성 완료: ${outputPath1}`);
    console.log(`   파일 크기: ${(detail1Pdf.length / 1024).toFixed(1)} KB`);

    // 두 번째 옵션 (평면도 있음)
    const option2 = mockProposalData.options[1];
    const detail2Pdf = await htmlPdfService.generateOptionDetailPage(option2, mockProposalData);
    const outputPath2 = path.join(__dirname, 'test_detail_with_floorplan.pdf');
    await fs.writeFile(outputPath2, detail2Pdf);
    console.log(`✅ 옵션 상세 PDF (평면도 있음) 생성 완료: ${outputPath2}`);
    console.log(`   파일 크기: ${(detail2Pdf.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ 옵션 상세 생성 실패:', error.message);
  }
}

async function testFullProposal() {
  console.log('\n========== 전체 제안서 PDF 테스트 ==========\n');

  try {
    const result = await htmlPdfService.generateFullProposalPDF(mockProposalData);
    const outputPath = path.join(__dirname, 'test_full_proposal.pdf');
    await fs.writeFile(outputPath, result.pdfBuffer);
    console.log(`✅ 전체 제안서 PDF 생성 완료: ${outputPath}`);
    console.log(`   파일 이름: ${result.fileName}`);
    console.log(`   페이지 수: ${result.pageCount}개 (표지 + 서비스 + 비교표 + 옵션상세)`);
    console.log(`   파일 크기: ${(result.pdfBuffer.length / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error('❌ 전체 제안서 생성 실패:', error.message);
    console.error(error.stack);
  }
}

async function testKakaoMap() {
  console.log('\n========== 카카오 맵 API 테스트 ==========\n');

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.log('⚠️ KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    console.log('   .env 파일에 KAKAO_REST_API_KEY를 설정하세요.');
    return;
  }

  console.log(`✅ KAKAO_REST_API_KEY 확인: ${apiKey.substring(0, 8)}...`);

  try {
    const mapBase64 = await htmlPdfService.fetchKakaoMapImage(37.5089, 127.0639);
    if (mapBase64) {
      console.log('✅ 카카오 맵 이미지 가져오기 성공');
      console.log(`   Base64 길이: ${mapBase64.length} 문자`);
    } else {
      console.log('⚠️ 카카오 맵 이미지 가져오기 실패 (빈 문자열 반환)');
    }
  } catch (error) {
    console.error('❌ 카카오 맵 API 테스트 실패:', error.message);
  }
}

async function runAllTests() {
  console.log('====================================');
  console.log('HTML 템플릿 기반 PDF 생성 테스트');
  console.log('====================================');
  console.log(`실행 시간: ${new Date().toLocaleString('ko-KR')}`);

  // 포맷터 테스트
  await testFormatters();

  // 카카오 맵 API 테스트
  await testKakaoMap();

  // 개별 페이지 테스트
  await testCoverPage();
  await testServicePage();
  await testComparisonPage();
  await testOptionDetailPage();

  // 전체 제안서 테스트
  await testFullProposal();

  console.log('\n====================================');
  console.log('모든 테스트 완료');
  console.log('====================================');
  console.log('\n생성된 파일들:');
  console.log('  - test_cover.pdf (표지)');
  console.log('  - test_service.pdf (서비스 안내)');
  console.log('  - test_comparison.pdf (비교표)');
  console.log('  - test_detail_no_floorplan.pdf (옵션 상세 - 평면도 없음)');
  console.log('  - test_detail_with_floorplan.pdf (옵션 상세 - 평면도 있음)');
  console.log('  - test_full_proposal.pdf (전체 제안서)');
  console.log('\n위 파일들을 열어 다음 사항을 확인하세요:');
  console.log('  1. 표지 제목이 상단 25% 위치에 있는지');
  console.log('  2. 모든 페이지에 올바른 푸터가 표시되는지');
  console.log('  3. 담당자 전화번호가 표시되는지');
  console.log('  4. 헤더가 모든 페이지에서 통일되어 있는지');
  console.log('  5. 이미지가 contain 방식으로 표시되는지');
  console.log('  6. 할인율이 올바르게 계산되는지 (25%, 21%, 18%)');
  console.log('  7. 평면도 없는 옵션에서 평면도 페이지가 제거되는지');
}

// 메인 실행
runAllTests().catch(console.error);
