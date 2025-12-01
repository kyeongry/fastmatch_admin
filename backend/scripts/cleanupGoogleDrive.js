const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

/**
 * Google Drive 정리 스크립트
 *
 * 이 스크립트는 서비스 계정의 Google Drive에서 오래된 제안서 관련 파일들을 삭제합니다.
 * PDF 생성 과정에서 생성되었으나 삭제되지 않은 임시 파일들을 정리합니다.
 */

const initializeGoogleAPI = async () => {
  try {
    const keyFilePath = path.join(__dirname, '../credentials/google-service-account.json');

    await fs.access(keyFilePath);

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('✅ Google API 초기화 성공');
    return drive;
  } catch (error) {
    console.error('❌ Google API 초기화 실패:', error.message);
    throw error;
  }
};

/**
 * 모든 Google Docs 파일 목록 조회
 */
const listAllFiles = async (drive) => {
  try {
    const response = await drive.files.list({
      pageSize: 1000,
      fields: 'files(id, name, createdTime, size, mimeType)',
      orderBy: 'createdTime desc',
    });

    return response.data.files || [];
  } catch (error) {
    console.error('❌ 파일 목록 조회 실패:', error.message);
    throw error;
  }
};

/**
 * 제안서 관련 파일 필터링
 */
const filterProposalFiles = (files) => {
  return files.filter(file => {
    const name = file.name.toLowerCase();
    return (
      name.includes('제안서') ||
      name.includes('표지') ||
      name.includes('서비스') ||
      name.includes('매물비교표') ||
      name.includes('옵션상세') ||
      name.includes('proposal')
    );
  });
};

/**
 * 특정 일 이전의 파일 필터링
 */
const filterOldFiles = (files, daysOld = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return files.filter(file => {
    const createdDate = new Date(file.createdTime);
    return createdDate < cutoffDate;
  });
};

/**
 * 파일 삭제
 */
const deleteFiles = async (drive, files, dryRun = true) => {
  console.log(`\n${dryRun ? '🔍 [DRY RUN]' : '🗑️'} 삭제 대상 파일: ${files.length}개`);
  console.log('─'.repeat(80));

  let totalSize = 0;
  const deletedFiles = [];

  for (const file of files) {
    const size = parseInt(file.size || 0);
    totalSize += size;

    console.log(`${dryRun ? '  [예정]' : '  ✓'} ${file.name}`);
    console.log(`         생성일: ${new Date(file.createdTime).toLocaleString('ko-KR')}`);
    console.log(`         크기: ${(size / 1024).toFixed(2)} KB`);
    console.log(`         ID: ${file.id}`);

    if (!dryRun) {
      try {
        await drive.files.delete({ fileId: file.id });
        deletedFiles.push(file);
        console.log(`         ✅ 삭제 완료`);
      } catch (error) {
        console.log(`         ❌ 삭제 실패: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('─'.repeat(80));
  console.log(`${dryRun ? '예상' : '실제'} 삭제 용량: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`${dryRun ? '예상' : '실제'} 삭제 파일 수: ${dryRun ? files.length : deletedFiles.length}개`);

  return deletedFiles;
};

/**
 * 메인 함수
 */
const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const daysOld = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 7;
  const deleteAll = args.includes('--all');

  console.log('🧹 Google Drive 정리 시작\n');
  console.log(`모드: ${dryRun ? 'DRY RUN (실제 삭제 안 함)' : 'EXECUTE (실제 삭제)'}`);
  console.log(`대상: ${deleteAll ? '모든 제안서 파일' : `${daysOld}일 이상 된 제안서 파일`}\n`);

  try {
    const drive = await initializeGoogleAPI();

    console.log('📋 파일 목록 조회 중...\n');
    const allFiles = await listAllFiles(drive);
    console.log(`전체 파일 수: ${allFiles.length}개\n`);

    const proposalFiles = filterProposalFiles(allFiles);
    console.log(`제안서 관련 파일: ${proposalFiles.length}개\n`);

    const targetFiles = deleteAll ? proposalFiles : filterOldFiles(proposalFiles, daysOld);

    if (targetFiles.length === 0) {
      console.log('✨ 삭제할 파일이 없습니다.');
      return;
    }

    await deleteFiles(drive, targetFiles, dryRun);

    if (dryRun) {
      console.log('\n💡 실제로 삭제하려면 --execute 옵션을 사용하세요.');
      console.log('   예: node scripts/cleanupGoogleDrive.js --execute');
      console.log('\n💡 모든 제안서 파일을 삭제하려면 --all 옵션을 추가하세요.');
      console.log('   예: node scripts/cleanupGoogleDrive.js --execute --all');
      console.log('\n💡 특정 기간 이상 된 파일만 삭제하려면 --days 옵션을 사용하세요.');
      console.log('   예: node scripts/cleanupGoogleDrive.js --execute --days=30');
    } else {
      console.log('\n✅ 정리 완료!');
    }
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
};

main();
