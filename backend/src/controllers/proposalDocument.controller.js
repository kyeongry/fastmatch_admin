const {
  getProposalDocuments,
  getProposalDocumentById,
  createProposalDocument,
  updateProposalDocument,
  deleteProposalDocument,
} = require('../services/proposalDocument.service');
const { generateProposalPDF, getExistingPDFUrl } = require('../services/proposalPDF.service');

// 제안서 목록 조회
const list = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 20,
    };

    const result = await getProposalDocuments(req.user.id, filters);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 제안서 상세 조회 (옵션 정보 포함)
const getById = async (req, res, next) => {
  try {
    const document = await getProposalDocumentById(req.params.id, req.user.id);
    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

const fs = require('fs');
const path = require('path');

// 제안서 생성
const create = async (req, res, next) => {
  try {
    const logMsg = `[${new Date().toISOString()}] 🚀 Controller received: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), logMsg);
    console.log('🚀 제안서 생성 요청 수신:', req.body);
    const document = await createProposalDocument(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: '제안서가 생성되었습니다',
      document,
    });
  } catch (error) {
    console.error('❌ 제안서 생성 오류:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

// 제안서 업데이트
const update = async (req, res, next) => {
  try {
    const document = await updateProposalDocument(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: '제안서가 수정되었습니다',
      document,
    });
  } catch (error) {
    next(error);
  }
};

// 제안서 삭제
const remove = async (req, res, next) => {
  try {
    const result = await deleteProposalDocument(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 제안서 PDF 생성 및 다운로드
const generatePDF = async (req, res, next) => {
  try {
    // PDF 생성은 옵션 수에 따라 수 분 소요 → 소켓 타임아웃 10분으로 연장
    req.setTimeout(600000);
    res.setTimeout(600000);

    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📄 PDF 생성 요청: 제안서 ID=${id}, 사용자 ID=${userId}`);

    // 기존 PDF가 있는지 확인
    const existingPDF = await getExistingPDFUrl(id, userId);

    if (existingPDF && req.query.regenerate !== 'true') {
      // 기존 PDF가 있고 재생성 요청이 아니면 기존 URL 반환
      // 단, URL이 '/raw/upload/'를 포함하면(구버전 비공개 링크) 재생성 강제
      if (!existingPDF.pdfUrl.includes('/raw/upload/')) {
        console.log('✅ 기존 PDF URL 반환:', existingPDF.pdfUrl);
        return res.json({
          success: true,
          message: '기존 제안서 PDF를 반환합니다',
          ...existingPDF,
        });
      } else {
        console.log('⚠️ 기존 PDF가 비공개(raw) 형식이므로 재생성합니다.');
      }
    }

    // 새로운 PDF 생성
    const result = await generateProposalPDF(id, userId);

    // 생성된 PDF URL을 제안서에 저장 (Cloudinary 미사용으로 주석 처리)
    // await updateProposalDocument(id, { pdf_url: result.pdfUrl }, userId);

    // PDF 스트림 전송
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.send(result.pdfBuffer);

    // res.json({
    //   success: true,
    //   message: '제안서 PDF가 생성되었습니다',
    //   ...result,
    // });
  } catch (error) {
    console.error('❌ PDF 생성 오류:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

// 제안서 생성 + PDF 생성 통합 (단일 요청으로 커넥션 리셋 방지)
const createAndGeneratePDF = async (req, res, next) => {
  try {
    req.setTimeout(600000);
    res.setTimeout(600000);

    console.log('🚀 제안서 생성+PDF 통합 요청 수신:', req.body);

    // 1. 제안서 문서 생성
    const document = await createProposalDocument(req.body, req.user.id);
    const docId = document.id || document._id;
    console.log(`✅ 제안서 문서 생성 완료: ${docId}`);

    // 2. PDF 생성
    const result = await generateProposalPDF(docId, req.user.id);

    // 3. PDF 버퍼 응답
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.send(result.pdfBuffer);
  } catch (error) {
    console.error('❌ 제안서 생성+PDF 오류:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  generatePDF,
  createAndGeneratePDF,
};
