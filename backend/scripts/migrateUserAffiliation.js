/**
 * 사용자 소속(affiliation) 필드 마이그레이션 스크립트
 * 모든 기존 사용자의 affiliation을 'partner'로 설정
 *
 * 실행: node scripts/migrateUserAffiliation.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateUserAffiliation() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ MongoDB 연결 성공');

    const db = client.db();
    const usersCollection = db.collection('users');

    // affiliation 필드가 없는 사용자 수 확인
    const usersWithoutAffiliation = await usersCollection.countDocuments({
      affiliation: { $exists: false }
    });

    console.log(`📊 affiliation 필드가 없는 사용자: ${usersWithoutAffiliation}명`);

    if (usersWithoutAffiliation === 0) {
      console.log('✅ 모든 사용자가 이미 affiliation 필드를 가지고 있습니다.');
      return;
    }

    // affiliation 필드가 없는 모든 사용자에게 'partner' 설정
    const result = await usersCollection.updateMany(
      { affiliation: { $exists: false } },
      { $set: { affiliation: 'partner' } }
    );

    console.log(`✅ ${result.modifiedCount}명의 사용자에게 affiliation: 'partner' 설정 완료`);

    // 결과 확인
    const affiliationStats = await usersCollection.aggregate([
      { $group: { _id: '$affiliation', count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n📊 소속별 사용자 통계:');
    affiliationStats.forEach(stat => {
      console.log(`   - ${stat._id || '(없음)'}: ${stat.count}명`);
    });

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ 마이그레이션 완료');
  }
}

migrateUserAffiliation();
