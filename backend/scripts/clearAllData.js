const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearAllData() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('MongoDB 연결 성공');

    const db = client.db('fastmatch');

    // 모든 컬렉션 목록 가져오기
    const collections = await db.listCollections().toArray();
    console.log('컬렉션 목록:', collections.map(c => c.name));

    // 각 컬렉션의 데이터 삭제
    for (const col of collections) {
      const result = await db.collection(col.name).deleteMany({});
      console.log(`${col.name}: ${result.deletedCount}개 삭제됨`);
    }

    console.log('\n모든 더미 데이터 삭제 완료!');
  } catch (error) {
    console.error('에러:', error.message);
  } finally {
    await client.close();
  }
}

clearAllData();
