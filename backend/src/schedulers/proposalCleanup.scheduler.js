/**
 * 제안서 자동 삭제 스케줄러
 * 생성일로부터 30일이 지난 제안서를 자동으로 삭제합니다.
 */

const { getDatabase } = require('../config/mongodb');

const COLLECTION_NAME = 'proposal_documents';
const RETENTION_DAYS = 30;

/**
 * 30일이 지난 제안서 삭제
 */
const deleteExpiredProposals = async () => {
    try {
        const db = await getDatabase();
        const collection = db.collection(COLLECTION_NAME);

        // 30일 전 날짜 계산
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

        // 삭제 대상 조회 (로깅용)
        const expiredProposals = await collection.find({
            created_at: { $lt: cutoffDate }
        }).toArray();

        if (expiredProposals.length === 0) {
            console.log(`[${new Date().toISOString()}] ✅ 삭제할 만료된 제안서가 없습니다.`);
            return { deleted: 0 };
        }

        console.log(`[${new Date().toISOString()}] 🗑️ ${expiredProposals.length}개의 만료된 제안서 삭제 시작...`);

        // 삭제 실행
        const result = await collection.deleteMany({
            created_at: { $lt: cutoffDate }
        });

        console.log(`[${new Date().toISOString()}] ✅ ${result.deletedCount}개의 제안서가 삭제되었습니다.`);

        return { deleted: result.deletedCount };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ 제안서 자동 삭제 오류:`, error);
        throw error;
    }
};

/**
 * 스케줄러 시작
 * 매일 자정(00:00)에 실행
 */
const startScheduler = () => {
    // 스케줄러 실행 간격 (24시간 = 86400000ms)
    const INTERVAL = 24 * 60 * 60 * 1000;

    // 다음 자정까지 남은 시간 계산
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;

    console.log(`[${new Date().toISOString()}] 📅 제안서 자동 삭제 스케줄러 시작됨`);
    console.log(`[${new Date().toISOString()}] ⏰ 다음 실행: ${nextMidnight.toLocaleString('ko-KR')} (${Math.round(msUntilMidnight / 1000 / 60)}분 후)`);

    // 첫 실행: 다음 자정
    setTimeout(() => {
        deleteExpiredProposals();

        // 이후 매일 자정에 실행
        setInterval(deleteExpiredProposals, INTERVAL);
    }, msUntilMidnight);

    // 서버 시작 시 즉시 한 번 실행 (테스트용, 필요시 주석 해제)
    // deleteExpiredProposals();
};

module.exports = {
    deleteExpiredProposals,
    startScheduler
};
