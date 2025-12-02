/**
 * 삭제 요청 데이터 정리 스크립트
 * - 옵션이 이미 삭제된 삭제 요청 레코드를 정리합니다.
 *
 * 실행: node scripts/cleanupDeleteRequests.js
 */

require('dotenv').config();
const { getDatabase } = require('../src/config/mongodb');

async function cleanupDeleteRequests() {
  try {
    console.log('🔗 MongoDB 연결 중...');
    const db = await getDatabase();

    console.log('\n📋 현재 삭제 요청 데이터 확인 중...');

    // 모든 삭제 요청 조회
    const deleteRequests = await db.collection('delete_requests').find({}).toArray();
    console.log(`총 삭제 요청 수: ${deleteRequests.length}건`);

    // 각 삭제 요청에 대해 옵션 존재 여부 확인
    let orphanCount = 0;
    let validCount = 0;
    const orphanIds = [];

    for (const request of deleteRequests) {
      const option = await db.collection('options').findOne({ _id: request.option_id });

      if (!option) {
        orphanCount++;
        orphanIds.push(request._id);
        console.log(`❌ 고아 삭제 요청: ${request._id} (옵션 ID: ${request.option_id}, 상태: ${request.status})`);
      } else {
        validCount++;
        console.log(`✅ 유효한 삭제 요청: ${request._id} (옵션: ${option.name}, 상태: ${request.status})`);
      }
    }

    console.log(`\n📊 결과:`);
    console.log(`  - 유효한 삭제 요청: ${validCount}건`);
    console.log(`  - 고아 삭제 요청 (옵션 없음): ${orphanCount}건`);

    if (orphanCount > 0) {
      console.log('\n🗑️ 고아 삭제 요청 삭제 중...');

      const deleteResult = await db.collection('delete_requests').deleteMany({
        _id: { $in: orphanIds }
      });

      console.log(`✅ ${deleteResult.deletedCount}건의 고아 삭제 요청이 삭제되었습니다.`);
    } else {
      console.log('\n✨ 정리할 고아 삭제 요청이 없습니다.');
    }

    // cancelled 상태 삭제 요청도 정리
    const cancelledRequests = await db.collection('delete_requests').find({ status: 'cancelled' }).toArray();
    if (cancelledRequests.length > 0) {
      console.log(`\n🗑️ 취소된 삭제 요청 ${cancelledRequests.length}건 삭제 중...`);
      const cancelledResult = await db.collection('delete_requests').deleteMany({ status: 'cancelled' });
      console.log(`✅ ${cancelledResult.deletedCount}건의 취소된 삭제 요청이 삭제되었습니다.`);
    }

    // 정리 후 상태 확인
    const remainingRequests = await db.collection('delete_requests').find({}).toArray();
    console.log(`\n📋 정리 후 남은 삭제 요청: ${remainingRequests.length}건`);

    for (const request of remainingRequests) {
      const option = await db.collection('options').findOne({ _id: request.option_id });
      console.log(`  - ${request._id}: 옵션="${option?.name || 'N/A'}", 상태=${request.status}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

cleanupDeleteRequests();
