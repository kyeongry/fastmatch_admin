const DeleteRequestModel = require('../models/deleteRequest.mongodb');
const OptionModel = require('../models/option.mongodb');
const BranchModel = require('../models/branch.mongodb');
const BrandModel = require('../models/brand.mongodb');
const UserModel = require('../models/user.mongodb');
const { ObjectId } = require('mongodb');

// 삭제 요청 목록 조회
const getDeleteRequests = async (filters = {}) => {
  try {
    const { status, page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      DeleteRequestModel.findAll(filter, { skip, limit: pageSize }),
      DeleteRequestModel.count(filter),
    ]);

    // Populate related data
    const populatedRequests = await Promise.all(
      requests.map(async (request) => {
        try {
          // option_id 안전하게 처리
          let optionId;
          if (request.option_id) {
            optionId = request.option_id.toString ? request.option_id.toString() : request.option_id;
          } else {
            console.warn(`⚠️ 삭제 요청에 option_id가 없습니다: ${request._id}`);
            return null;
          }

          // requester_id 안전하게 처리
          let requesterId;
          if (request.requester_id) {
            requesterId = request.requester_id.toString ? request.requester_id.toString() : request.requester_id;
          } else {
            console.warn(`⚠️ 삭제 요청에 requester_id가 없습니다: ${request._id}`);
            return null;
          }

          // ObjectId 유효성 검사 함수
          const isValidObjectId = (id) => {
            if (!id || typeof id !== 'string') return false;
            return /^[0-9a-fA-F]{24}$/.test(id);
          };

          // requesterId 유효성 검사
          if (!isValidObjectId(requesterId)) {
            console.error(`❌ 유효하지 않은 requester_id: ${requesterId} (요청 ID: ${request._id})`);
            return null;
          }

          // processor_id 안전하게 처리
          let processorId = null;
          if (request.processor_id) {
            processorId = request.processor_id.toString ? request.processor_id.toString() : request.processor_id;
            // processorId도 유효성 검사
            if (!isValidObjectId(processorId)) {
              console.warn(`⚠️ 유효하지 않은 processor_id: ${processorId}, null로 처리합니다`);
              processorId = null;
            }
          }

          // optionId 유효성 검사
          if (!isValidObjectId(optionId)) {
            console.error(`❌ 유효하지 않은 option_id: ${optionId} (요청 ID: ${request._id})`);
            return null;
          }

          const [option, requester, processor] = await Promise.all([
            OptionModel.findById(optionId),
            UserModel.findById(requesterId),
            processorId ? UserModel.findById(processorId) : null,
          ]);

          // 옵션이 이미 삭제된 경우 null 반환 (필터링됨)
          if (!option) {
            console.log(`⚠️ 옵션이 삭제되었거나 찾을 수 없습니다: ${optionId}`);
            return null;
          }

          // requester가 없는 경우도 처리
          if (!requester) {
            console.warn(`⚠️ 요청자를 찾을 수 없습니다: ${requesterId}`);
          }

          let branch, brand, creator;

          // branch_id와 creator_id 안전하게 처리
          const branchId = option.branch_id ? (option.branch_id.toString ? option.branch_id.toString() : option.branch_id) : null;
          const creatorId = option.creator_id ? (option.creator_id.toString ? option.creator_id.toString() : option.creator_id) : null;

          [branch, creator] = await Promise.all([
            branchId && isValidObjectId(branchId) ? BranchModel.findById(branchId) : null,
            creatorId && isValidObjectId(creatorId) ? UserModel.findById(creatorId) : null,
          ]);

          if (branch && branch.brand_id) {
            const brandId = branch.brand_id.toString ? branch.brand_id.toString() : branch.brand_id;
            if (isValidObjectId(brandId)) {
              brand = await BrandModel.findById(brandId);
            }
          }

          return {
            ...request,
            id: request._id.toString(),
            option: {
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
              } : null,
            },
            requester: requester ? {
              id: requester._id.toString(),
              name: requester.name,
              email: requester.email,
            } : null,
            processor: processor ? {
              id: processor._id.toString(),
              name: processor.name,
            } : null,
          };
        } catch (error) {
          console.error(`❌ 삭제 요청 처리 중 오류 발생 (ID: ${request._id}):`, error);
          // 에러가 발생한 요청은 null로 반환하여 필터링
          return null;
        }
      })
    );

    // null 값 제거 (삭제된 옵션의 요청 제외)
    const validRequests = populatedRequests.filter(req => req !== null);

    return { requests: validRequests, total: validRequests.length, page, pageSize };
  } catch (error) {
    console.error('❌ Get delete requests error:', error);
    throw error;
  }
};

// 삭제 요청 상세 조회
const getDeleteRequestById = async (id) => {
  try {
    const request = await DeleteRequestModel.findById(id);

    if (!request) {
      throw new Error('삭제 요청을 찾을 수 없습니다');
    }

    // Populate related data
    const [option, requester, processor] = await Promise.all([
      OptionModel.findById(request.option_id.toString()),
      UserModel.findById(request.requester_id.toString()),
      request.processor_id ? UserModel.findById(request.processor_id.toString()) : null,
    ]);

    let branch, brand, creator;
    if (option) {
      [branch, creator] = await Promise.all([
        BranchModel.findById(option.branch_id.toString()),
        UserModel.findById(option.creator_id.toString()),
      ]);

      if (branch) {
        brand = await BrandModel.findById(branch.brand_id.toString());
      }
    }

    return {
      ...request,
      id: request._id.toString(),
      option: option ? {
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
        } : null,
      } : null,
      requester: requester ? {
        id: requester._id.toString(),
        name: requester.name,
        email: requester.email,
      } : null,
      processor: processor ? {
        id: processor._id.toString(),
        name: processor.name,
      } : null,
    };
  } catch (error) {
    console.error('❌ Get delete request by ID error:', error);
    throw error;
  }
};

// 삭제 요청 승인
const approveDeleteRequest = async (id, processorId) => {
  try {
    const request = await DeleteRequestModel.findById(id);

    if (!request) {
      throw new Error('삭제 요청을 찾을 수 없습니다');
    }

    console.log(`🔍 삭제 요청 상태 확인: ID=${id}, status=${request.status}`);

    // 옵션 ID 확인 및 변환 (상태 체크 전에 먼저 처리)
    let optionId;
    if (request.option_id) {
      optionId = request.option_id.toString ? request.option_id.toString() : request.option_id;
    } else {
      throw new Error('옵션 ID가 없습니다');
    }

    // 이미 처리된 요청인 경우 옵션 삭제 여부 확인
    if (request.status !== 'pending') {
      if (request.status === 'approved') {
        // 이미 승인된 요청인 경우, 옵션이 실제로 삭제되었는지 확인
        const option = await OptionModel.findById(optionId);
        if (!option) {
          // 옵션이 이미 삭제되었으므로 성공으로 처리
          console.log(`✅ 옵션이 이미 삭제되었습니다: ${optionId}`);
          return getDeleteRequestById(id);
        } else {
          // 옵션이 아직 존재하는 경우 다시 삭제 시도
          console.log(`⚠️ 옵션이 아직 존재합니다. 다시 삭제를 시도합니다: ${optionId}`);
          // 아래 삭제 로직으로 계속 진행
        }
      } else if (request.status === 'rejected') {
        throw new Error('이미 거부된 요청입니다. 거부된 요청은 승인할 수 없습니다');
      } else {
        throw new Error(`대기 중인 요청만 승인할 수 있습니다 (현재 상태: ${request.status})`);
      }
    }

    console.log(`🔍 삭제할 옵션 ID: ${optionId}`);
    console.log(`🔍 옵션 ID 타입: ${typeof optionId}, 값: ${optionId}`);

    // ObjectId로 변환 (안전하게)
    let optionObjectId;
    try {
      optionObjectId = new ObjectId(optionId);
    } catch (error) {
      console.error('❌ ObjectId 변환 실패:', error);
      throw new Error(`유효하지 않은 옵션 ID입니다: ${optionId}`);
    }

    // MongoDB 연결 가져오기
    const { getDatabase } = require('../config/mongodb');
    const db = await getDatabase();

    // 삭제 전 옵션 존재 확인 (직접 MongoDB 쿼리로)
    const optionBeforeDelete = await db.collection('options').findOne({ _id: optionObjectId });
    if (!optionBeforeDelete) {
      // OptionModel로도 확인해보기
      const optionByModel = await OptionModel.findById(optionId);
      if (!optionByModel) {
        throw new Error(`삭제할 옵션을 찾을 수 없습니다: ${optionId}`);
      }
      // OptionModel로 찾은 경우 실제 _id 사용
      const actualObjectId = optionByModel._id instanceof ObjectId ? optionByModel._id : new ObjectId(optionByModel._id);
      console.log(`⚠️ ObjectId로 찾지 못했지만 OptionModel로 찾았습니다. 실제 _id 사용: ${actualObjectId}`);
      optionObjectId = actualObjectId;
    } else {
      // 실제 찾은 옵션의 _id 사용 (혹시 모를 경우를 대비)
      const actualObjectId = optionBeforeDelete._id instanceof ObjectId ? optionBeforeDelete._id : new ObjectId(optionBeforeDelete._id);
      console.log(`✅ 삭제 전 옵션 확인됨: ${optionId}`);
      console.log(`🔍 옵션 실제 _id: ${actualObjectId}`);
      console.log(`🔍 옵션 정보:`, {
        _id: actualObjectId.toString(),
        name: optionBeforeDelete.name,
        status: optionBeforeDelete.status
      });
      optionObjectId = actualObjectId;
    }

    // 여러 방법으로 삭제 시도
    console.log(`🔍 삭제 쿼리 실행: { _id: ObjectId("${optionObjectId}") }`);

    // 방법 1: 직접 deleteOne
    let deleteResult = await db.collection('options').deleteOne({ _id: optionObjectId });

    console.log(`🔍 삭제 결과 (방법 1): deletedCount=${deleteResult.deletedCount}, acknowledged=${deleteResult.acknowledged}, ok=${deleteResult.ok}`);

    // 삭제가 실패한 경우 다른 방법 시도
    if (deleteResult.deletedCount === 0) {
      console.log(`⚠️ 첫 번째 삭제 시도 실패. 옵션이 여전히 존재하는지 확인...`);
      const stillExists = await db.collection('options').findOne({ _id: optionObjectId });

      if (stillExists) {
        console.log(`⚠️ 옵션이 여전히 존재합니다. 두 번째 삭제 시도...`);
        // 방법 2: OptionModel.deleteById 사용
        const deletedByModel = await OptionModel.deleteById(optionId);
        if (deletedByModel) {
          console.log(`✅ OptionModel.deleteById로 삭제 성공`);
          deleteResult = { deletedCount: 1, acknowledged: true, ok: 1 };
        } else {
          // 방법 3: 문자열 ID로도 시도
          console.log(`⚠️ OptionModel.deleteById도 실패. 문자열 ID로 시도...`);
          const deleteByString = await db.collection('options').deleteOne({ _id: new ObjectId(optionId) });
          deleteResult = deleteByString;
          console.log(`🔍 삭제 결과 (문자열 ID): deletedCount=${deleteResult.deletedCount}`);
        }
      } else {
        console.log(`✅ 옵션이 이미 삭제되었습니다`);
        deleteResult = { deletedCount: 1, acknowledged: true, ok: 1 };
      }
    }

    if (!deleteResult.acknowledged) {
      console.error(`❌ 삭제 요청이 승인되지 않았습니다. 옵션 ID: ${optionId}`);
      throw new Error('옵션 삭제 요청이 승인되지 않았습니다');
    }

    if (deleteResult.deletedCount === 0) {
      // 최종 확인
      const finalCheck = await db.collection('options').findOne({ _id: optionObjectId });
      console.error(`❌ 최종 확인: 옵션 존재 여부: ${finalCheck ? '존재함' : '없음'}`);
      if (finalCheck) {
        console.error(`❌ 옵션 정보:`, {
          _id: finalCheck._id.toString(),
          name: finalCheck.name,
          status: finalCheck.status
        });
        throw new Error(`옵션 삭제에 실패했습니다. 옵션이 여전히 존재합니다. 옵션 ID: ${optionId}`);
      } else {
        console.log(`✅ 옵션이 삭제되었습니다 (최종 확인)`);
      }
    } else {
      console.log(`✅ 옵션 삭제 완료: ${optionId} (deletedCount: ${deleteResult.deletedCount})`);
    }

    // 삭제 후 확인 (여러 방법으로)
    console.log(`🔍 삭제 후 확인 시작...`);

    // 방법 1: 직접 MongoDB 쿼리
    const optionAfterDelete1 = await db.collection('options').findOne({ _id: optionObjectId });

    // 방법 2: OptionModel 사용
    const optionAfterDelete2 = await OptionModel.findById(optionId);

    if (optionAfterDelete1 || optionAfterDelete2) {
      console.error(`⚠️ 경고: 옵션이 삭제되지 않았습니다: ${optionId}`);
      console.error(`⚠️ 직접 쿼리 결과: ${optionAfterDelete1 ? '존재함' : '없음'}`);
      console.error(`⚠️ OptionModel 결과: ${optionAfterDelete2 ? '존재함' : '없음'}`);

      // 한 번 더 삭제 시도
      console.log(`⚠️ 재삭제 시도...`);
      const retryDelete = await db.collection('options').deleteOne({ _id: optionObjectId });
      console.log(`🔍 재삭제 결과: deletedCount=${retryDelete.deletedCount}`);

      if (retryDelete.deletedCount === 0) {
        throw new Error(`옵션 삭제 확인에 실패했습니다. 옵션이 여전히 존재합니다. 옵션 ID: ${optionId}`);
      }
    }

    console.log(`✅ 옵션 삭제 확인됨: ${optionId}`);

    // processorId 안전하게 처리
    let processorIdForUpdate = null;
    if (processorId) {
      // processorId가 문자열인지 ObjectId인지 확인
      if (typeof processorId === 'string') {
        try {
          processorIdForUpdate = new ObjectId(processorId);
        } catch (error) {
          console.error(`❌ 유효하지 않은 processor_id: ${processorId}`);
          processorIdForUpdate = null;
        }
      } else if (processorId.toString) {
        processorIdForUpdate = processorId;
      }
    }

    console.log(`🔍 삭제 요청 업데이트 시도: ID=${id}, processorId=${processorIdForUpdate}`);

    // 삭제 요청 기록 삭제 (승인됨 상태로 남기지 않음)
    const deleteRequestResult = await DeleteRequestModel.deleteById(id);
    if (!deleteRequestResult) {
      console.warn(`⚠️ 삭제 요청 기록 삭제 실패: ${id}`);
    } else {
      console.log(`✅ 삭제 요청 기록 삭제 완료: ${id}`);
    }

    // 삭제된 옵션 정보는 포함하지 않고 삭제 요청 정보만 반환 (삭제되었으므로 기본 정보만)
    return {
      id: id,
      status: 'approved', // 클라이언트 응답용
      message: '삭제 요청이 승인되고 데이터가 삭제되었습니다.'
    };
  } catch (error) {
    console.error('❌ Approve delete request error:', error);
    throw error;
  }
};

// 삭제 요청 거부
const rejectDeleteRequest = async (id, reason, processorId) => {
  try {
    const request = await DeleteRequestModel.findById(id);

    if (!request) {
      throw new Error('삭제 요청을 찾을 수 없습니다');
    }

    if (request.status !== 'pending') {
      throw new Error('대기 중인 요청만 거부할 수 있습니다');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('거부 사유를 입력해주세요');
    }

    // 옵션 상태를 active로 복구하고 삭제 요청 관련 필드 초기화
    await OptionModel.updateById(request.option_id.toString(), {
      status: 'active',
      delete_request_at: null,
      delete_request_reason: null,
      delete_processed_at: null,
      delete_result: null,
      delete_process_reason: null,
      processor_admin_id: null,
    });

    // 삭제 요청 기록 삭제 (거부됨 상태로 남기지 않음)
    const deleteRequestResult = await DeleteRequestModel.deleteById(id);
    if (!deleteRequestResult) {
      console.warn(`⚠️ 삭제 요청 기록 삭제 실패: ${id}`);
    } else {
      console.log(`✅ 삭제 요청 기록 삭제 완료: ${id}`);
    }

    return {
      id: id,
      status: 'rejected', // 클라이언트 응답용
      message: '삭제 요청이 거부되고 데이터가 삭제되었습니다.'
    };
  } catch (error) {
    console.error('❌ Reject delete request error:', error);
    throw error;
  }
};

module.exports = {
  getDeleteRequests,
  getDeleteRequestById,
  approveDeleteRequest,
  rejectDeleteRequest,
};
