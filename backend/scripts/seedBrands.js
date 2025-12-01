/**
 * MongoDB 브랜드 테스트 데이터 생성 스크립트
 * 실행: node scripts/seedBrands.js
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function seedBrands() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ MongoDB 연결 성공');

    const db = client.db('fastmatch');

    // 기존 브랜드 컬렉션 확인
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('brands')) {
      console.log('📁 brands 컬렉션 생성 중...');
      await db.createCollection('brands');
    }

    // 테스트 브랜드 데이터
    const testBrands = [
      {
        name: 'Apple',
        status: 'active',
        creator_id: 'admin-user-id',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Microsoft',
        status: 'active',
        creator_id: 'admin-user-id',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Google',
        status: 'active',
        creator_id: 'admin-user-id',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Amazon',
        status: 'active',
        creator_id: 'admin-user-id',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Meta',
        status: 'active',
        creator_id: 'admin-user-id',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // 기존 데이터 확인
    const existingCount = await db.collection('brands').countDocuments();
    console.log(`📊 현재 브랜드 개수: ${existingCount}`);

    if (existingCount === 0) {
      // 새 데이터 삽입
      const result = await db.collection('brands').insertMany(testBrands);
      console.log(`✅ ${result.insertedCount}개의 테스트 브랜드가 추가되었습니다`);
      console.log('삽입된 ID:', Object.keys(result.insertedIds).map(k => result.insertedIds[k].toString()));
    } else {
      console.log('⚠️ 이미 브랜드 데이터가 존재합니다. 추가 삽입을 건너뜁니다.');
    }

    // 모든 브랜드 조회
    const allBrands = await db.collection('brands').find({}).toArray();
    console.log('\n📋 전체 브랜드 목록:');
    allBrands.forEach((brand, idx) => {
      console.log(`  ${idx + 1}. ${brand.name} (ID: ${brand._id.toString()})`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB 연결 종료');
  }
}

// 실행
seedBrands();
