const ProposalRequestModel = require('../models/proposalRequest.mongodb');
const ProposalSendHistoryModel = require('../models/proposalSendHistory.mongodb');
const BrandModel = require('../models/brand.mongodb');
const ManagerModel = require('../models/manager.mongodb');
const UserModel = require('../models/user.mongodb');
const { sendProposalRequestEmail } = require('./email.service');
const { ObjectId } = require('mongodb');

// 제안 요청 목록 조회
const getProposalRequests = async (userId, filters = {}) => {
  try {
    const { page = 1, pageSize = 20, status } = filters;
    const skip = (page - 1) * pageSize;
    const filter = { requester_id: new ObjectId(userId) };

    if (status) {
      filter.send_status = status;
    }

    const [requests, total] = await Promise.all([
      ProposalRequestModel.findAll(filter, { skip, limit: pageSize }),
      ProposalRequestModel.count(filter),
    ]);

    // Populate related data
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        const [requester, sendHistories] = await Promise.all([
          UserModel.findById(request.requester_id.toString()),
          ProposalSendHistoryModel.findByProposalRequestId(request._id.toString()),
        ]);

        const historiesWithBrands = await Promise.all(
          sendHistories.map(async (history) => {
            const brand = await BrandModel.findById(history.brand_id.toString());
            return {
              ...history,
              id: history._id.toString(),
              brand: brand ? {
                id: brand._id.toString(),
                name: brand.name,
              } : null,
            };
          })
        );

        return {
          ...request,
          id: request._id.toString(),
          requester: requester ? {
            id: requester._id.toString(),
            name: requester.name,
            email: requester.email,
          } : null,
          send_histories: historiesWithBrands,
        };
      })
    );

    return { requests: populatedRequests, total, page, pageSize };
  } catch (error) {
    console.error('❌ Get proposal requests error:', error);
    throw error;
  }
};

// 제안 요청 상세 조회
const getProposalRequestById = async (id, userId) => {
  try {
    const request = await ProposalRequestModel.findById(id);

    if (!request) {
      throw new Error('제안 요청을 찾을 수 없습니다');
    }

    // 본인 요청만 조회 가능
    if (request.requester_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    const [requester, sendHistories] = await Promise.all([
      UserModel.findById(request.requester_id.toString()),
      ProposalSendHistoryModel.findByProposalRequestId(id),
    ]);

    const historiesWithBrands = await Promise.all(
      sendHistories.map(async (history) => {
        const brand = await BrandModel.findById(history.brand_id.toString());
        return {
          ...history,
          id: history._id.toString(),
          brand: brand ? {
            id: brand._id.toString(),
            name: brand.name,
          } : null,
        };
      })
    );

    return {
      ...request,
      id: request._id.toString(),
      requester: requester ? {
        id: requester._id.toString(),
        name: requester.name,
        email: requester.email,
      } : null,
      send_histories: historiesWithBrands,
    };
  } catch (error) {
    console.error('❌ Get proposal request by ID error:', error);
    throw error;
  }
};

// 제안 요청 생성
const createProposalRequest = async (data, userId) => {
  try {
    const {
      company_name,
      contact_name,
      contact_position,
      contact_phone,
      contact_email,
      preferred_subway,
      actual_users,
      preferred_capacity,
      move_in_date,
      move_in_period,
      lease_period,
      additional_info,
      selected_brands,
    } = data;

    // 필수 필드 검증
    if (
      !company_name ||
      !contact_name ||
      !contact_phone ||
      !contact_email ||
      !preferred_subway ||
      !actual_users ||
      !move_in_date ||
      !move_in_period ||
      !lease_period ||
      !selected_brands ||
      selected_brands.length === 0
    ) {
      throw new Error('필수 필드를 모두 입력해주세요');
    }

    if (actual_users <= 0) {
      throw new Error('실사용 인원은 1명 이상이어야 합니다');
    }

    if (lease_period <= 0) {
      throw new Error('임대 기간은 1개월 이상이어야 합니다');
    }

    // 사용자 정보 조회
    const user = await UserModel.findById(userId);

    // 제안 요청 생성
    const proposalRequest = await ProposalRequestModel.create({
      requester_id: userId,
      company_name,
      contact_name,
      contact_position: contact_position || '',
      contact_phone,
      contact_email,
      preferred_subway,
      actual_users,
      preferred_capacity: preferred_capacity ? parseInt(preferred_capacity) : null,
      move_in_date: move_in_date,  // 텍스트 그대로 저장 (예: "2025년 3월")
      move_in_period,
      lease_period: parseInt(lease_period),
      additional_info: additional_info || '',
      selected_brands,
      send_status: 'sending',
    });

    // 이메일 발송
    try {
      await sendProposalEmails(proposalRequest, user, selected_brands, 'initial');
      await ProposalRequestModel.updateById(proposalRequest._id.toString(), {
        send_status: 'sent',
        sent_at: new Date(),
      });
    } catch (error) {
      await ProposalRequestModel.updateById(proposalRequest._id.toString(), {
        send_status: 'failed',
      });
      throw error;
    }

    return getProposalRequestById(proposalRequest._id.toString(), userId);
  } catch (error) {
    console.error('❌ Create proposal request error:', error);
    throw error;
  }
};

// 추가 제안 요청
const addProposalBrands = async (id, additionalBrands, userId) => {
  try {
    const request = await ProposalRequestModel.findById(id);

    if (!request) {
      throw new Error('제안 요청을 찾을 수 없습니다');
    }

    if (request.requester_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    if (!additionalBrands || additionalBrands.length === 0) {
      throw new Error('추가할 브랜드를 선택해주세요');
    }

    // 새로운 브랜드 추가
    const updatedBrands = [...new Set([...request.selected_brands, ...additionalBrands])];

    await ProposalRequestModel.updateById(id, {
      selected_brands: updatedBrands,
    });

    // 추가 브랜드에만 이메일 발송
    try {
      const user = await UserModel.findById(userId);
      await sendProposalEmails(request, user, additionalBrands, 'additional');
    } catch (error) {
      throw new Error('이메일 발송 중 오류가 발생했습니다');
    }

    return getProposalRequestById(id, userId);
  } catch (error) {
    console.error('❌ Add proposal brands error:', error);
    throw error;
  }
};

// 제안 요청 수정 (조건 변경)
const modifyProposalRequest = async (id, data, userId) => {
  try {
    const request = await ProposalRequestModel.findById(id);

    if (!request) {
      throw new Error('제안 요청을 찾을 수 없습니다');
    }

    if (request.requester_id.toString() !== userId) {
      throw new Error('권한이 없습니다');
    }

    const updateData = {};
    if (data.preferred_subway) updateData.preferred_subway = data.preferred_subway;
    if (data.actual_users) updateData.actual_users = parseInt(data.actual_users);
    if (data.preferred_capacity) updateData.preferred_capacity = parseInt(data.preferred_capacity);
    if (data.move_in_date) updateData.move_in_date = new Date(data.move_in_date);
    if (data.move_in_period) updateData.move_in_period = data.move_in_period;
    if (data.lease_period) updateData.lease_period = parseInt(data.lease_period);
    if (data.additional_info) updateData.additional_info = data.additional_info;

    await ProposalRequestModel.updateById(id, updateData);

    // 변경 사항이 있으면 발송 브랜드에 재발송
    try {
      const user = await UserModel.findById(userId);
      const brandIds = request.selected_brands;
      await sendProposalEmails({ ...request, ...updateData }, user, brandIds, 'modified');
    } catch (error) {
      throw new Error('이메일 발송 중 오류가 발생했습니다');
    }

    return getProposalRequestById(id, userId);
  } catch (error) {
    console.error('❌ Modify proposal request error:', error);
    throw error;
  }
};

// 이메일 발송 (공통 로직)
const sendProposalEmails = async (proposalRequest, user, brandIds, sendType) => {
  try {
    const brandIds_array = Array.isArray(brandIds) ? brandIds : [brandIds];

    const brands = await Promise.all(
      brandIds_array.map(async (brandId) => {
        const brand = await BrandModel.findById(brandId);
        if (!brand) return null;

        const managers = await ManagerModel.findByBrandId(brandId);
        return { ...brand, managers };
      })
    );

    const validBrands = brands.filter(Boolean);
    let emailsSent = 0;

    for (const brand of validBrands) {
      // 담당자가 있으면 첫 번째 매니저, 없으면 브랜드 기본 이메일 사용
      const manager = brand.managers.length > 0 ? brand.managers[0] : null;

      // 이메일 주소 결정: 담당자 이메일 > 브랜드 기본 이메일
      const toEmail = manager?.email || brand.default_email;

      // 이메일 주소가 없으면 건너뛰기
      if (!toEmail) {
        console.warn(`⚠️ 브랜드 ${brand.name}에 이메일 주소가 없어 발송을 건너뜁니다.`);
        continue;
      }

      try {
        await sendProposalRequestEmail(
          {
            to: toEmail,
            cc: [manager?.cc_email, 'official@fastmatch.kr'].filter(Boolean),
            replyTo: user.email,
            subject: generateEmailSubject(sendType, proposalRequest.company_name),
            brand: brand.name,
            manager: manager?.name || '', // 담당자가 없으면 빈 문자열
            ...proposalRequest,
            requester_name: user.name,
            requester_name_en: user.name_en,
            requester_position: user.position,
            requester_phone: user.phone,
            requester_email: user.email,
          },
          sendType
        );

        // 발송 이력 저장
        await ProposalSendHistoryModel.create({
          proposal_request_id: proposalRequest._id ? proposalRequest._id.toString() : proposalRequest.id,
          brand_id: brand._id.toString(),
          send_type: sendType,
        });

        emailsSent++;
      } catch (error) {
        console.error(`이메일 발송 실패 (${brand.name}):`, error);
      }
    }

    return emailsSent;
  } catch (error) {
    console.error('❌ Send proposal emails error:', error);
    throw error;
  }
};

// 이메일 제목 생성
const generateEmailSubject = (sendType, companyName) => {
  if (sendType === 'initial') {
    return `[제안 요청] ${companyName}`;
  } else if (sendType === 'additional') {
    return `[추가 제안 요청] ${companyName}`;
  } else if (sendType === 'modified') {
    return `[변경] [제안 요청] ${companyName}`;
  }
  return `[제안 요청] ${companyName}`;
};

module.exports = {
  getProposalRequests,
  getProposalRequestById,
  createProposalRequest,
  addProposalBrands,
  modifyProposalRequest,
};
