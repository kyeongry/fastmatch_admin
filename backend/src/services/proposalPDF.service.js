/**
 * 제안서 PDF 생성 통합 서비스
 * HTML 템플릿 기반 PDF 생성
 *
 * 구성 (4개 템플릿):
 * 1. 표지: 제안서 기본 정보, 고객사명, 발행일 등
 * 2. 서비스 안내: FASTMATCH 소개 및 서비스 설명
 * 3. 매물비교표: 선택된 옵션들을 5개씩 표로 구성 (5개 초과시 페이지 분할)
 * 4. 옵션상세: 각 옵션당 3페이지 (상세정보, 내부사진, 평면도)
 */

const { generateFullProposalPDF } = require('./htmlPdf.service');
const { getProposalDocumentById } = require('./proposalDocument.service');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs').promises;

/**
 * 제안서 전체 PDF 생성
 * @param {string} documentId - 제안서 ID
 * @param {string} userId - 사용자 ID
 * @returns {Object} - { pdfBuffer: Buffer, fileName: string, pageCount: number }
 */
const generateProposalPDF = async (documentId, userId) => {
  try {
    // 제안서 정보 조회 (옵션 정보 포함)
    const document = await getProposalDocumentById(documentId, userId);

    if (!document) {
      throw new Error('제안서를 찾을 수 없습니다');
    }

    if (!document.options || document.options.length === 0) {
      throw new Error('제안서에 옵션이 없습니다');
    }

    console.log(`📄 제안서 PDF 생성 시작: ${document.document_name}`);
    console.log(`📊 옵션 개수: ${document.options.length}개`);

    // 옵션 순서 정렬 (option_order가 있으면 해당 순서대로)
    let sortedOptions = [...document.options];
    if (document.option_order && document.option_order.length > 0) {
      sortedOptions = document.option_order
        .map(optionId => document.options.find(opt => opt.id === optionId))
        .filter(Boolean);
    }

    console.log(`🔍 정렬된 옵션 개수: ${sortedOptions.length}`);

    // HTML 템플릿 기반 PDF 생성
    const result = await generateFullProposalPDF({
      ...document,
      options: sortedOptions,
    });

    console.log('✅ 제안서 PDF 생성 완료 (버퍼 반환)');

    return result;
  } catch (error) {
    console.error('❌ 제안서 PDF 생성 실패:', error.message);
    throw error;
  }
};

/**
 * PDF 버퍼를 Cloudinary에 업로드
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} fileName - 파일명
 * @returns {Object} - Cloudinary 업로드 결과
 */
const uploadPDFToCloudinary = async (pdfBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'proposals',
        public_id: fileName.replace('.pdf', ''),
        format: 'pdf',
        type: 'upload',
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary 업로드 실패:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(pdfBuffer);
  });
};

/**
 * 제안서 PDF URL 조회 (이미 생성된 경우)
 * @param {string} documentId - 제안서 ID
 * @param {string} userId - 사용자 ID
 * @returns {Object|null} - { pdfUrl: string } 또는 null
 */
const getExistingPDFUrl = async (documentId, userId) => {
  try {
    const document = await getProposalDocumentById(documentId, userId);

    if (document && document.pdf_url) {
      return { pdfUrl: document.pdf_url };
    }

    return null;
  } catch (error) {
    console.error('❌ PDF URL 조회 실패:', error.message);
    return null;
  }
};

module.exports = {
  generateProposalPDF,
  uploadPDFToCloudinary,
  getExistingPDFUrl,
};
