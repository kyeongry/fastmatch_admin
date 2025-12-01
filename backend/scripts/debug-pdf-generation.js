const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Current directory:', __dirname);
const servicePath = path.join(__dirname, '../src/services/googleDocs.service');
console.log('Service path:', servicePath);

const { generateCoverPage, generateComparisonTable, generateOptionDetail } = require('../src/services/googleDocs.service');
const fs = require('fs');

// Mock Data
const mockProposalData = {
    document_name: '테스트 제안서',
    company_name: '테스트 고객사',
    created_at: new Date(),
    created_by: {
        name: '홍길동',
        email: 'test@fastmatch.com',
        phone: '010-1234-5678',
    },
};

const mockBranch = {
    id: 'branch1',
    name: '강남점',
    address: '서울 강남구 테헤란로 123',
    latitude: 37.4979,
    longitude: 127.0276,
    transportation: '2호선 강남역 도보 5분',
    nearest_subway: '2호선 강남역',
    walking_distance: 5,
    approval_year: '2020',
    floors_above: 15,
    floors_below: 5,
    total_area: 5000,
    basic_info_1: '24시간 보안 시스템',
    basic_info_2: '최신식 냉난방 완비',
    basic_info_3: '입주사 전용 라운지 제공',
    exterior_image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
    interior_image_urls: [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
    ],
    brand: {
        name: '패스트파이브',
    },
};

const mockOption = {
    branch: mockBranch,
    optionName: '10인실',
    optionClassification1: '프라이빗',
    optionClassification2: '창측',
    capacity: 10,
    monthlyFee: 5000000,
    security: 10000000,
    regularPrice: 6000000,
    dedicatedArea: 33.0, // approx 10 pyung
    hvac: '개별냉난방',
    parking: '무료 1대',
    contractPeriod: '12개월',
    availableMoveInDate: '2023-12-01',
    vat_included: false,
    maintenance_fee_included: true,
    note: '특별 프로모션 진행 중',
    credits: '월 10만 크레딧',
    floor_plan_image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/640px-Image_created_with_a_mobile_phone.png',
    one_time_fees: [
        { name: '입주청소비', amount: 100000 },
        { name: '카드발급비', amount: 50000 },
    ],
};

const runDebug = async () => {
    try {
        console.log('🚀 PDF 생성 디버깅 시작...');

        // 1. 표지 생성 테스트
        console.log('\n📄 표지 생성 테스트...');
        const coverTemplateId = process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID;
        if (coverTemplateId) {
            const coverPdf = await generateCoverPage(mockProposalData, coverTemplateId);
            fs.writeFileSync(path.join(__dirname, 'debug_cover.pdf'), coverPdf);
            console.log('✅ 표지 생성 완료: debug_cover.pdf');
        } else {
            console.log('⚠️ GOOGLE_DOCS_COVER_TEMPLATE_ID가 없어 표지 생성 건너뜀');
        }

        // 2. 매물비교표 생성 테스트 (Smart Table Replacement)
        console.log('\n📊 매물비교표 생성 테스트 (Smart Table Replacement)...');
        const comparisonTemplateId = process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID;
        if (comparisonTemplateId) {
            const options = Array(5).fill(mockOption); // 5개 옵션 채우기
            const comparisonPdf = await generateComparisonTable(options, comparisonTemplateId, '테스트 제안서', mockProposalData);
            fs.writeFileSync(path.join(__dirname, 'debug_comparison.pdf'), comparisonPdf);
            console.log('✅ 매물비교표 생성 완료: debug_comparison.pdf');
        } else {
            console.log('⚠️ GOOGLE_DOCS_COMPARISON_TEMPLATE_ID가 없어 매물비교표 생성 건너뜀');
        }

        // 3. 옵션 상세 페이지 생성 테스트
        console.log('\n🏢 옵션 상세 페이지 생성 테스트...');
        const detailTemplateId = process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID;
        if (detailTemplateId) {
            const detailPdf = await generateOptionDetail(mockOption, detailTemplateId, '테스트 제안서');
            if (detailPdf) {
                fs.writeFileSync(path.join(__dirname, 'debug_detail.pdf'), detailPdf);
                console.log('✅ 옵션 상세 페이지 생성 완료: debug_detail.pdf');
            } else {
                console.log('⚠️ 옵션 상세 페이지가 생성되지 않았습니다 (평면도 없음 등)');
            }
        } else {
            console.log('⚠️ GOOGLE_DOCS_OPTION_DETAIL_TEMPLATE_ID가 없어 옵션 상세 페이지 생성 건너뜀');
        }

        console.log('\n✨ 모든 테스트 완료');

    } catch (error) {
        console.error('\n❌ 테스트 실패:', error);
    }
};

runDebug();
