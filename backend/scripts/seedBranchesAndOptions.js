/**
 * MongoDB 지점 및 옵션 테스트 데이터 생성 스크립트
 * 실행: node scripts/seedBranchesAndOptions.js
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function seedBranchesAndOptions() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ MongoDB 연결 성공');

    const db = client.db('fastmatch');

    // 브랜드 조회
    const brands = await db.collection('brands').find({}).toArray();
    console.log(`📊 현재 브랜드 개수: ${brands.length}`);

    if (brands.length === 0) {
      console.log('❌ 브랜드 데이터가 없습니다. 먼저 브랜드를 생성해주세요.');
      return;
    }

    // 지점 생성 (각 브랜드마다 2개씩)
    const existingBranchCount = await db.collection('branches').countDocuments();
    console.log(`📊 현재 지점 개수: ${existingBranchCount}`);

    if (existingBranchCount === 0) {
      const branchesData = [];
      brands.forEach((brand, idx) => {
        branchesData.push({
          name: `${brand.name} 강남점`,
          address: '서울시 강남구 강남대로 456',
          brand_id: brand._id,
          status: 'active',
          creator_id: 'admin-user-id',
          created_at: new Date(),
          updated_at: new Date()
        });
        branchesData.push({
          name: `${brand.name} 서초점`,
          address: '서울시 서초구 강남대로 789',
          brand_id: brand._id,
          status: 'active',
          creator_id: 'admin-user-id',
          created_at: new Date(),
          updated_at: new Date()
        });
      });

      const branchResult = await db.collection('branches').insertMany(branchesData);
      console.log(`✅ ${branchResult.insertedCount}개의 지점이 추가되었습니다`);
    } else {
      console.log('⚠️ 이미 지점 데이터가 존재합니다. 추가 삽입을 건너뜁니다.');
    }

    // 옵션 생성 (각 지점마다 3개씩)
    const existingOptionCount = await db.collection('options').countDocuments();
    console.log(`📊 현재 옵션 개수: ${existingOptionCount}`);

    if (existingOptionCount === 0) {
      const branches = await db.collection('branches').find({}).toArray();
      const optionsData = [];

      branches.forEach((branch) => {
        for (let i = 1; i <= 3; i++) {
          optionsData.push({
            branch_id: branch._id,
            name: `${branch.name} 옵션 ${i}`,
            category1: ['Studio', '1Room', '2Room'][i - 1],
            category2: i === 1 ? 'Office' : 'Residential',
            capacity: i,
            monthly_fee: 1500000 + (i - 1) * 500000,
            deposit: 5000000 + (i - 1) * 2000000,
            list_price: null,
            one_time_fees: [],
            move_in_date_type: 'immediate',
            move_in_date_value: null,
            contract_period_type: 'twelve_months',
            contract_period_value: null,
            office_info: null,
            credits: null,
            hvac_type: 'central',
            parking_type: 'basement',
            memo: `${branch.name} 옵션 ${i}번`,
            floor_plan_url: null,
            status: 'active',
            creator_id: 'admin-user-id',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });

      const optionResult = await db.collection('options').insertMany(optionsData);
      console.log(`✅ ${optionResult.insertedCount}개의 옵션이 추가되었습니다`);
    } else {
      console.log('⚠️ 이미 옵션 데이터가 존재합니다. 추가 삽입을 건너뜁니다.');
    }

    // 전체 데이터 조회
    const finalBranchCount = await db.collection('branches').countDocuments();
    const finalOptionCount = await db.collection('options').countDocuments();

    console.log('\n📋 최종 데이터 상태:');
    console.log(`  - 브랜드: ${brands.length}개`);
    console.log(`  - 지점: ${finalBranchCount}개`);
    console.log(`  - 옵션: ${finalOptionCount}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB 연결 종료');
  }
}

// 실행
seedBranchesAndOptions();
