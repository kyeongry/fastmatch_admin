const ProposalDocumentModel = require('../models/proposalDocument.mongodb');
const OptionModel = require('../models/option.mongodb');
const BranchModel = require('../models/branch.mongodb');
const BrandModel = require('../models/brand.mongodb');
const UserModel = require('../models/user.mongodb');
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/mongodb');

// 제안서 목록 조회
// 제안서 목록 조회 (Aggregation으로 최적화)
const getProposalDocuments = async (userId, filters = {}) => {
  try {
    const { page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;
    const db = await getDatabase();

    const pipeline = [
      { $match: { creator_id: new ObjectId(userId) } },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      // Creator 정보 조인
      {
        $lookup: {
          from: 'users',
          localField: 'creator_id',
          foreignField: '_id',
          as: 'creator'
        }
      },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      // Selected Options (IDs)를 기반으로 Options 정보 조인
      {
        $lookup: {
          from: 'options',
          localField: 'selected_options',
          foreignField: '_id',
          as: 'options'
        }
      },
      // Options 내부의 Branch 조인 (Unwind 없이 배열 내부 처리 필요하지만, MongoDB 룩업의 한계로 복잡함)
      // 대신, 가져온 Options의 branch_id를 모아서 별도로 처리하거나, 
      // 여기서는 간단하게 options만 가져오고, map으로 후처리하는 방식이 효율적일 수 있음 (N+1 방지)
      // 하지만 PDF 생성을 위해 깊은 조인이 필요하므로, options를 풀어서 조인하고 다시 그룹화하는 방식을 사용
      { $unwind: { path: '$options', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'branches',
          localField: 'options.branch_id',
          foreignField: '_id',
          as: 'options.branch'
        }
      },
      { $unwind: { path: '$options.branch', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'brands',
          localField: 'options.branch.brand_id',
          foreignField: '_id',
          as: 'options.branch.brand'
        }
      },
      { $unwind: { path: '$options.branch.brand', preserveNullAndEmptyArrays: true } },
      // 다시 그룹화
      {
        $group: {
          _id: '$_id',
          document_name: { $first: '$document_name' },
          creator_id: { $first: '$creator_id' },
          creator: { $first: '$creator' },
          created_at: { $first: '$created_at' },
          updated_at: { $first: '$updated_at' },
          selected_options: { $first: '$selected_options' },
          option_order: { $first: '$option_order' },
          option_custom_info: { $first: '$option_custom_info' },
          options: { $push: '$options' }
        }
      },
      { $sort: { created_at: -1 } } // 그룹화 후 다시 정렬
    ];

    const [documents, total] = await Promise.all([
      db.collection('proposal_documents').aggregate(pipeline).toArray(),
      ProposalDocumentModel.count({ creator_id: new ObjectId(userId) }),
    ]);

    // ID 변환 및 데이터 정리
    const formattedDocuments = documents.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      creator: doc.creator ? {
        id: doc.creator._id.toString(),
        name: doc.creator.name,
        email: doc.creator.email,
        phone: doc.creator.phone,
      } : null,
      // 빈 객체 제거 (Unwind로 인해 options가 없는 경우 빈 객체가 생길 수 있음)
      options: doc.options.filter(opt => opt && opt._id).map(opt => ({
        ...opt,
        id: opt._id.toString(),
        branch: opt.branch ? {
          ...opt.branch,
          id: opt.branch._id.toString(),
          brand: opt.branch.brand ? {
            ...opt.branch.brand,
            id: opt.branch.brand._id.toString()
          } : null
        } : null
      }))
    }));

    return { documents: formattedDocuments, total, page, pageSize };
  } catch (error) {
    console.error('❌ Get proposal documents error:', error);
    throw error;
  }
};

// 제안서 상세 조회
const getProposalDocumentById = async (id, userId) => {
  try {
    const document = await ProposalDocumentModel.findById(id);

    if (!document) {
      throw new Error('제안서를 찾을 수 없습니다');
    }

    if (document.creator_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    // Helper function to check if string is valid ObjectId
    const isValidObjectId = (id) => {
      if (!id) return false;
      const idStr = typeof id === 'string' ? id : id.toString();
      return /^[0-9a-fA-F]{24}$/.test(idStr);
    };

    // Populate options
    const optionsWithDetails = await Promise.all(
      (document.selected_options || []).map(async (optionId) => {
        if (!isValidObjectId(optionId)) {
          console.warn(`⚠️ Invalid Option ID found in proposal ${id}: ${optionId}`);
          return null;
        }

        const option = await OptionModel.findById(optionId);
        if (!option) return null;

        const branchId = option.branch_id ? option.branch_id.toString() : null;
        const creatorId = option.creator_id ? option.creator_id.toString() : null;

        const [branch, creator] = await Promise.all([
          branchId && isValidObjectId(branchId) ? BranchModel.findById(branchId) : null,
          creatorId && isValidObjectId(creatorId) ? UserModel.findById(creatorId) : null,
        ]);

        let brand = null;
        if (branch && branch.brand_id) {
          const brandId = branch.brand_id.toString();
          if (isValidObjectId(brandId)) {
            brand = await BrandModel.findById(brandId);
          }
        }

        return {
          ...option,
          id: option._id.toString(),
          branch: branch ? {
            ...branch,
            id: branch._id.toString(),
            brand: brand ? {
              ...brand,
              id: brand._id.toString(),
            } : null,
          } : null,
          creator: creator ? {
            id: creator._id.toString(),
            name: creator.name,
            email: creator.email,
            phone: creator.phone,
          } : null,
        };
      })
    );

    const creator = await UserModel.findById(document.creator_id.toString());

    return {
      ...document,
      id: document._id.toString(),
      options: optionsWithDetails.filter(Boolean),
      creator: creator ? {
        id: creator._id.toString(),
        name: creator.name,
        email: creator.email,
        phone: creator.phone,
      } : null,
    };
  } catch (error) {
    console.error('❌ Get proposal document by ID error:', error);
    throw error;
  }
};

const fs = require('fs');
const path = require('path');

// 제안서 생성
const createProposalDocument = async (data, userId) => {
  try {
    const logMsg = `[${new Date().toISOString()}] 🛠️ Service received: ${JSON.stringify(data)}\n`;
    // fs.appendFileSync(path.join(__dirname, '../../debug_backend.log'), logMsg); // Logging to file disabled to prevent issues
    console.log('🛠️ createProposalDocument 호출됨:', data);
    const { document_name, selected_options, option_order, option_custom_info } = data;

    if (!document_name || !selected_options || selected_options.length === 0) {
      throw new Error('필수 필드를 모두 입력해주세요');
    }

    const proposalDocument = await ProposalDocumentModel.create({
      creator_id: userId,
      document_name,
      selected_options: selected_options || [],
      option_order: option_order || [],
      option_custom_info: option_custom_info || {},
    });

    return getProposalDocumentById(proposalDocument._id.toString(), userId);
  } catch (error) {
    console.error('❌ Create proposal document error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Data received:', { document_name: data.document_name, selected_options: data.selected_options, userId });
    throw error;
  }
};

// 제안서 수정
const updateProposalDocument = async (id, data, userId) => {
  try {
    const document = await ProposalDocumentModel.findById(id);

    if (!document) {
      throw new Error('제안서를 찾을 수 없습니다');
    }

    if (document.creator_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    const updateData = {};
    if (data.document_name) updateData.document_name = data.document_name;
    if (data.selected_options) updateData.selected_options = data.selected_options;
    if (data.option_order) updateData.option_order = data.option_order;
    if (data.option_custom_info) updateData.option_custom_info = data.option_custom_info;
    if (data.pdf_url) updateData.pdf_url = data.pdf_url;

    await ProposalDocumentModel.updateById(id, updateData);

    return getProposalDocumentById(id, userId);
  } catch (error) {
    console.error('❌ Update proposal document error:', error);
    throw error;
  }
};

// 제안서 삭제
const deleteProposalDocument = async (id, userId) => {
  try {
    const document = await ProposalDocumentModel.findById(id);

    if (!document) {
      throw new Error('제안서를 찾을 수 없습니다');
    }

    if (document.creator_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    await ProposalDocumentModel.deleteById(id);

    return { success: true, message: '제안서가 삭제되었습니다' };
  } catch (error) {
    console.error('❌ Delete proposal document error:', error);
    throw error;
  }
};

module.exports = {
  getProposalDocuments,
  getProposalDocumentById,
  createProposalDocument,
  updateProposalDocument,
  deleteProposalDocument,
};
