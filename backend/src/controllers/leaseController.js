const { getDatabase } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const geminiService = require('../services/geminiService');
const { generateContractNumber } = require('../models/LeaseContract');
const { DefaultSpecialTerms } = require('../models/SpecialTerm');
const cloudinary = require('cloudinary').v2;

/**
 * 임대차 계약 컨트롤러
 */
const leaseController = {
  // ============================================
  // 물건 정보 (STEP 1)
  // ============================================

  /**
   * 등기부등본에서 정보 추출
   */
  async extractRegistry(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '파일을 업로드해주세요.' });
      }

      const result = await geminiService.extractRegistryInfo(
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('등기부 추출 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 건축물대장 조회 (공공데이터 API)
   */
  async getBuildingLedger(req, res) {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ error: '주소를 입력해주세요.' });
      }

      // TODO: 공공데이터포털 건축물대장 API 연동
      // 기존 FastMatch에 이미 연동되어 있으면 재사용

      res.json({
        success: true,
        data: {
          // 건축물대장 정보
          completionYear: null,
          usage: null,
          structure: null,
          seismicDesign: null,
          seismicCapacity: null,
          isViolation: false,
          violationContent: null
        }
      });
    } catch (error) {
      console.error('건축물대장 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // 당사자 정보 (STEP 2)
  // ============================================

  /**
   * 사업자등록증/신분증에서 정보 추출
   */
  async extractPartyInfo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '파일을 업로드해주세요.' });
      }

      const docType = req.body.docType || 'business'; // business | individual

      const result = await geminiService.extractPartyInfo(
        req.file.buffer,
        req.file.mimetype,
        docType
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('당사자 정보 추출 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // 위치 정보
  // ============================================

  /**
   * 대중교통 정보 조회 (카카오맵 API)
   */
  async getTransitInfo(req, res) {
    try {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ error: '주소를 입력해주세요.' });
      }

      // TODO: 카카오맵 API 연동
      // 버스 정류장, 지하철역 정보 조회

      res.json({
        success: true,
        data: {
          bus: { station: '', time: 0, method: 'walk' },
          subway: { station: '', time: 0, method: 'walk' }
        }
      });
    } catch (error) {
      console.error('대중교통 정보 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // 특약 관리 (STEP 4)
  // ============================================

  /**
   * 특약 검색
   */
  async searchSpecialTerms(req, res) {
    try {
      const db = await getDatabase();
      const { keyword, category, limit = 10 } = req.query;

      const query = { isActive: true };

      if (keyword) {
        query.$or = [
          { keywords: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } },
          { title: { $regex: keyword, $options: 'i' } }
        ];
      }

      if (category) {
        query.category = category;
      }

      const terms = await db.collection('specialTerms')
        .find(query)
        .sort({ usageCount: -1 })
        .limit(parseInt(limit))
        .toArray();

      res.json({
        success: true,
        data: terms
      });
    } catch (error) {
      console.error('특약 검색 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * AI 특약 생성
   */
  async generateSpecialTerms(req, res) {
    try {
      const { situation, buildingType, transactionType } = req.body;

      if (!situation) {
        return res.status(400).json({ error: '상황 설명을 입력해주세요.' });
      }

      const result = await geminiService.generateSpecialTerms(situation, {
        buildingType,
        transactionType
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('특약 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 특약 저장
   */
  async saveSpecialTerm(req, res) {
    try {
      const db = await getDatabase();
      const { keywords, category, title, content, favorType, source, contractId } = req.body;

      const term = {
        keywords: keywords || [],
        category: category || '기타',
        title: title || '',
        content,
        favorType: favorType || 'neutral',
        source: source || 'manual',
        contractId: contractId ? new ObjectId(contractId) : null,
        usageCount: 0,
        isActive: true,
        createdAt: new Date(),
        createdBy: req.user?._id || null
      };

      const result = await db.collection('specialTerms').insertOne(term);

      res.json({
        success: true,
        data: { ...term, _id: result.insertedId }
      });
    } catch (error) {
      console.error('특약 저장 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 특약 사용 횟수 증가
   */
  async incrementSpecialTermUsage(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      await db.collection('specialTerms').updateOne(
        { _id: new ObjectId(id) },
        { $inc: { usageCount: 1 } }
      );

      res.json({ success: true });
    } catch (error) {
      console.error('특약 사용 횟수 업데이트 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // 계약서 CRUD
  // ============================================

  /**
   * 계약서 목록 조회
   */
  async getContracts(req, res) {
    try {
      const db = await getDatabase();
      const { status, page = 1, limit = 20 } = req.query;

      const query = {};
      if (status) query.status = status;

      const contracts = await db.collection('leaseContracts')
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();

      const total = await db.collection('leaseContracts').countDocuments(query);

      res.json({
        success: true,
        data: contracts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('계약서 목록 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 검색
   */
  async searchContracts(req, res) {
    try {
      const db = await getDatabase();
      const { keyword } = req.query;

      const contracts = await db.collection('leaseContracts')
        .find({
          $or: [
            { 'property.address': { $regex: keyword, $options: 'i' } },
            { contractNumber: { $regex: keyword, $options: 'i' } },
            { 'parties.lessors.name': { $regex: keyword, $options: 'i' } },
            { 'parties.lessees.name': { $regex: keyword, $options: 'i' } }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      console.error('계약서 검색 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 생성
   */
  async createContract(req, res) {
    try {
      const db = await getDatabase();

      const contract = {
        ...req.body,
        contractNumber: generateContractNumber(),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: req.user?._id || null
      };

      const result = await db.collection('leaseContracts').insertOne(contract);

      res.json({
        success: true,
        data: { ...contract, _id: result.insertedId }
      });
    } catch (error) {
      console.error('계약서 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 상세 조회
   */
  async getContract(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      const contract = await db.collection('leaseContracts').findOne({
        _id: new ObjectId(id)
      });

      if (!contract) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      console.error('계약서 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 수정
   */
  async updateContract(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      const result = await db.collection('leaseContracts').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...req.body,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('계약서 수정 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 삭제
   */
  async deleteContract(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      const result = await db.collection('leaseContracts').deleteOne({
        _id: new ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('계약서 삭제 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 계약서 완료 처리 (상태 변경 + PDF 생성)
   */
  async completeContract(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      const contract = await db.collection('leaseContracts').findOne({
        _id: new ObjectId(id)
      });

      if (!contract) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      // 상태를 completed로 변경
      await db.collection('leaseContracts').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // TODO: PDF 생성 서비스 연동
      res.json({
        success: true,
        data: {
          status: 'completed',
          pdfUrl: null
        }
      });
    } catch (error) {
      console.error('계약서 완료 처리 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * PDF 생성
   */
  async generatePdf(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      const contract = await db.collection('leaseContracts').findOne({
        _id: new ObjectId(id)
      });

      if (!contract) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다.' });
      }

      // TODO: PDF 생성 서비스 연동
      // leasePdfService.generatePdf(contract)

      res.json({
        success: true,
        data: {
          pdfUrl: null // PDF URL 반환
        }
      });
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ============================================
  // 관리자 기능
  // ============================================

  /**
   * 공제증서 업로드
   */
  async uploadInsuranceCert(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '파일을 업로드해주세요.' });
      }

      // Cloudinary 업로드
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'insurance-certs' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      const db = await getDatabase();
      const cert = {
        name: req.file.originalname,
        fileUrl: uploadResult.secure_url,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : null,
        validTo: req.body.validTo ? new Date(req.body.validTo) : null,
        isActive: false,
        uploadedAt: new Date(),
        uploadedBy: req.user?._id || null
      };

      const result = await db.collection('insuranceCerts').insertOne(cert);

      res.json({
        success: true,
        data: { ...cert, _id: result.insertedId }
      });
    } catch (error) {
      console.error('공제증서 업로드 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 공제증서 목록 조회
   */
  async getInsuranceCerts(req, res) {
    try {
      const db = await getDatabase();

      const certs = await db.collection('insuranceCerts')
        .find()
        .sort({ uploadedAt: -1 })
        .toArray();

      res.json({
        success: true,
        data: certs
      });
    } catch (error) {
      console.error('공제증서 목록 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 공제증서 활성화
   */
  async activateInsuranceCert(req, res) {
    try {
      const db = await getDatabase();
      const { id } = req.params;

      // 기존 활성화된 것 비활성화
      await db.collection('insuranceCerts').updateMany(
        { isActive: true },
        { $set: { isActive: false } }
      );

      // 선택한 것 활성화
      await db.collection('insuranceCerts').updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: true } }
      );

      res.json({ success: true });
    } catch (error) {
      console.error('공제증서 활성화 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 기본 특약 목록 조회
   */
  async getDefaultTerms(req, res) {
    try {
      const db = await getDatabase();
      const terms = await db.collection('specialTerms')
        .find({ source: 'manual', isActive: true })
        .sort({ category: 1, title: 1 })
        .toArray();

      res.json({
        success: true,
        data: terms
      });
    } catch (error) {
      console.error('기본 특약 조회 오류:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * 기본 특약 초기화 (시스템 시작 시 호출)
   */
  async initializeDefaultTerms() {
    try {
      const db = await getDatabase();

      for (const term of DefaultSpecialTerms) {
        const exists = await db.collection('specialTerms').findOne({
          title: term.title,
          source: 'manual'
        });

        if (!exists) {
          await db.collection('specialTerms').insertOne({
            ...term,
            usageCount: 0,
            isActive: true,
            createdAt: new Date()
          });
        }
      }

      console.log('기본 특약 초기화 완료');
    } catch (error) {
      console.error('기본 특약 초기화 오류:', error);
    }
  }
};

module.exports = leaseController;
