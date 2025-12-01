const axios = require('axios');

/**
 * KakaoMap API - 주소 검색
 * @param {string} query - 검색 주소
 * @returns {Promise<Array>} 검색 결과 배열
 */
const searchAddress = async (query) => {
  try {
    if (!query || query.trim().length === 0) {
      throw new Error('검색어가 없습니다');
    }

    // REST API 키 확인 (서버 사이드용)
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      console.error('KAKAO_REST_API_KEY가 환경 변수에 설정되지 않았습니다');
      throw new Error('카카오맵 REST API 키가 설정되지 않았습니다. 환경 변수 KAKAO_REST_API_KEY를 확인해주세요.');
    }

    const response = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
      params: { query },
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
    });

    if (!response.data.documents || response.data.documents.length === 0) {
      return [];
    }

    return response.data.documents.map(doc => {
      // 카카오맵 API 응답 구조:
      // - doc.address: 지번 주소 정보 (address_name이 지번 주소)
      // - doc.road_address: 도로명 주소 정보 (address_name이 도로명 주소)
      // - doc.address_name: 우선순위가 높은 주소 (도로명 주소가 있으면 도로명, 없으면 지번)

      const lotAddress = doc.address?.address_name || null; // 지번 주소 (건축물대장용)
      const roadAddress = doc.road_address?.address_name || null; // 도로명 주소
      const mainAddress = doc.address_name || roadAddress || lotAddress; // 메인 주소

      // 카카오맵 API에서 본번/부번 직접 추출 (정확도 향상)
      const mainAddressNo = doc.address?.main_address_no || null; // 본번
      const subAddressNo = doc.address?.sub_address_no || null; // 부번
      const mountainYn = doc.address?.mountain_yn || 'N'; // 산 여부 (Y: 산, N: 일반)

      return {
        mainAddress: mainAddress,
        lotAddress: lotAddress, // 지번 주소 (건축물대장용)
        roadAddress: roadAddress, // 도로명 주소
        zonecode: doc.address?.b_code || null,
        bCode: doc.address?.b_code || null, // 법정동 코드 (10자리)
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
        // 건축물대장 API에 필요한 정보
        sigunguCode: doc.address?.b_code ? doc.address.b_code.substring(0, 5) : null, // 시군구 코드 (5자리)
        bjdongCode: doc.address?.b_code ? doc.address.b_code.substring(5, 10) : null, // 법정동 코드 (5자리)
        // 본번/부번 (카카오맵 API에서 직접 제공 - 정확도 높음)
        mainAddressNo: mainAddressNo, // 본번
        subAddressNo: subAddressNo, // 부번
        mountainYn: mountainYn, // 산 여부
        buildingName: doc.road_address?.building_name || null, // 건물명
      };
    });
  } catch (error) {
    if (error.response) {
      // API 응답 에러
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.message;

      if (status === 401) {
        console.error('KakaoMap API 인증 실패 (401):', {
          message: errorMessage,
          apiKey: process.env.KAKAO_API_KEY ? '설정됨' : '미설정',
          apiKeyLength: process.env.KAKAO_API_KEY?.length || 0,
        });
        throw new Error('카카오맵 API 인증에 실패했습니다. KAKAO_API_KEY를 확인해주세요.');
      } else if (status === 400) {
        console.error('KakaoMap API 요청 오류 (400):', errorMessage);
        throw new Error('주소 검색 요청이 잘못되었습니다.');
      } else {
        console.error('KakaoMap 주소 검색 오류:', {
          status,
          message: errorMessage,
          data: error.response.data,
        });
        throw new Error(`주소 검색에 실패했습니다 (${status})`);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함
      console.error('KakaoMap API 요청 실패:', error.message);
      throw new Error('카카오맵 API 서버에 연결할 수 없습니다.');
    } else {
      // 요청 설정 중 오류
      console.error('KakaoMap 주소 검색 오류:', error.message);
      throw error;
    }
  }
};

/**
 * KakaoMap API - 좌표로 주소 역검색
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @returns {Promise<Object>} 주소 정보
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      throw new Error('좌표가 없습니다');
    }

    // REST API 키 확인 (서버 사이드용)
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      throw new Error('카카오맵 REST API 키가 설정되지 않았습니다. 환경 변수 KAKAO_REST_API_KEY를 확인해주세요.');
    }

    const response = await axios.get(
      'https://dapi.kakao.com/v2/local/geo/coord2address.json',
      {
        params: {
          x: longitude,
          y: latitude,
          input_coord: 'WGS84',
        },
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    );

    if (!response.data.documents || response.data.documents.length === 0) {
      throw new Error('주소를 찾을 수 없습니다');
    }

    const doc = response.data.documents[0];
    return {
      mainAddress: doc.address?.address_name || null,
      roadAddress: doc.road_address?.address_name || null,
      latitude,
      longitude,
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error('KakaoMap API 인증 실패 (401)');
        throw new Error('카카오맵 API 인증에 실패했습니다. KAKAO_API_KEY를 확인해주세요.');
      }
      console.error('KakaoMap 역검색 오류:', error.response.data || error.message);
      throw new Error('주소 역검색에 실패했습니다');
    } else {
      console.error('KakaoMap 역검색 오류:', error.message);
      throw error;
    }
  }
};

/**
 * 지하철역 이름을 '0호선 OO역' 형식으로 변환
 * @param {string} placeName - 카카오맵에서 받은 지하철역 이름
 * @param {string} categoryName - 카테고리 이름 (호선 정보 포함 가능)
 * @returns {string} 포맷팅된 지하철역 이름
 */
const formatSubwayName = (placeName, categoryName = '') => {
  if (!placeName) return '';

  // 이미 "0호선 OO역" 형식인지 확인
  const alreadyFormatted = placeName.match(/^(\d+)호선\s+(.+?)(?:역)?$/);
  if (alreadyFormatted) {
    const lineNumber = alreadyFormatted[1];
    const stationName = alreadyFormatted[2].trim();
    // 역명 끝에 "역"이 없으면 추가
    return stationName.endsWith('역') ? `${lineNumber}호선 ${stationName}` : `${lineNumber}호선 ${stationName}역`;
  }

  // 역명에서 호선 정보가 포함된 경우 (예: "2호선 강남역", "강남역(2호선)")
  const lineMatch1 = placeName.match(/(\d+)호선\s*(.+?)(?:역)?/);
  if (lineMatch1) {
    const lineNumber = lineMatch1[1];
    const stationName = lineMatch1[2].trim();
    // 중복 제거: 역명에 이미 호선 정보가 있으면 제거
    const cleanStationName = stationName.replace(/\d+호선\s*/g, '').trim();
    return cleanStationName.endsWith('역') ? `${lineNumber}호선 ${cleanStationName}` : `${lineNumber}호선 ${cleanStationName}역`;
  }

  const lineMatch2 = placeName.match(/(.+?)\s*\((\d+)호선\)/);
  if (lineMatch2) {
    const stationName = lineMatch2[1].trim();
    const lineNumber = lineMatch2[2];
    return stationName.endsWith('역') ? `${lineNumber}호선 ${stationName}` : `${lineNumber}호선 ${stationName}역`;
  }

  // 카테고리 이름에서 호선 정보 추출 시도 (예: "지하철 2호선")
  const categoryLineMatch = categoryName.match(/(\d+)호선/);
  if (categoryLineMatch) {
    const lineNumber = categoryLineMatch[1];
    // 역명에서 "역"과 호선 정보 제거 후 정리
    let stationName = placeName.replace(/역$/, '').replace(/\d+호선\s*/g, '').trim();
    return `${lineNumber}호선 ${stationName}역`;
  }

  // 역명만 있는 경우, 역명 추출
  const stationMatch = placeName.match(/(.+?)(?:역|정류장)/);
  if (stationMatch) {
    let stationName = stationMatch[1].trim();
    // 호선 정보가 포함되어 있으면 제거
    stationName = stationName.replace(/\d+호선\s*/g, '').trim();
    // 기본적으로 2호선으로 설정 (가장 일반적)
    // 실제로는 카카오맵 API의 추가 정보를 활용하거나 별도 API 호출 필요
    return `${2}호선 ${stationName}역`;
  }

  // 그 외의 경우 원본 반환 (호선 정보 제거)
  return placeName.replace(/\d+호선\s*/g, '').trim();
};

/**
 * 거리를 도보 시간(분)으로 변환 (4km/h 속도 기준)
 * @param {number} distanceMeters - 거리 (미터)
 * @returns {number} 도보 시간 (분, 소수점 첫째자리까지)
 */
const calculateWalkingTime = (distanceMeters) => {
  if (!distanceMeters || distanceMeters <= 0) return 0;

  // 4km/h = 4000m/h = 4000/60 m/min = 약 66.67 m/min
  const walkingSpeedMetersPerMinute = 4000 / 60; // 약 66.67 m/min
  const walkingTimeMinutes = distanceMeters / walkingSpeedMetersPerMinute;

  // 소수점 첫째자리까지 반올림
  return Math.round(walkingTimeMinutes * 10) / 10;
};

/**
 * KakaoMap API - 지하철역 검색
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @param {number} radius - 검색 반경 (기본값: 1000m)
 * @returns {Promise<Array>} 근처 지하철역 배열
 */
const searchNearbySubway = async (latitude, longitude, radius = 1000) => {
  try {
    if (!latitude || !longitude) {
      throw new Error('좌표가 없습니다');
    }

    // REST API 키 확인 (서버 사이드용)
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      throw new Error('카카오맵 REST API 키가 설정되지 않았습니다. 환경 변수 KAKAO_REST_API_KEY를 확인해주세요.');
    }

    // KakaoMap 카테고리 검색 (지하철역: SW8)
    const response = await axios.get(
      'https://dapi.kakao.com/v2/local/search/category.json',
      {
        params: {
          category_group_code: 'SW8',
          x: longitude,
          y: latitude,
          radius,
          sort: 'distance',
          size: 15,
        },
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
      }
    );

    if (!response.data.documents || response.data.documents.length === 0) {
      return [];
    }

    return response.data.documents.map(doc => {
      const distance = doc.distance ? parseInt(doc.distance) : null;
      const formattedName = formatSubwayName(doc.place_name, doc.category_name || '');
      const walkingTime = distance ? calculateWalkingTime(distance) : null;

      return {
        name: doc.place_name, // 원본 이름
        formattedName: formattedName, // 포맷팅된 이름 (0호선 OO역 형식)
        address: doc.address_name,
        roadAddress: doc.road_address_name,
        phone: doc.phone,
        latitude: parseFloat(doc.y),
        longitude: parseFloat(doc.x),
        distance: distance, // 미터 단위
        walkingTime: walkingTime, // 분 단위 (4km/h 기준)
      };
    });
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error('KakaoMap API 인증 실패 (401)');
        throw new Error('카카오맵 API 인증에 실패했습니다. KAKAO_API_KEY를 확인해주세요.');
      }
      console.error('KakaoMap 지하철역 검색 오류:', error.response.data || error.message);
      throw new Error('지하철역 검색에 실패했습니다');
    } else {
      console.error('KakaoMap 지하철역 검색 오류:', error.message);
      throw error;
    }
  }
};

/**
 * 건축물대장 API - 건물 정보 조회
 * @param {string} sigunguCode - 시군구 코드
 * @param {string} buildingNumber - 건물번호 (본번-부번)
 * @returns {Promise<Object>} 건물 정보
 */
/**
 * 건축물대장 API - 건물 정보 조회 (표제부)
 * @param {string} sigunguCode - 시군구 코드 (5자리)
 * @param {string} bjdongCode - 법정동 코드 (5자리)
 * @param {string} bun - 본번
 * @param {string} ji - 부번
 * @returns {Promise<Object>} 건물 정보
 */
/**
 * 건축물대장 API - 건물 정보 조회 (표제부)
 * @param {string} sigunguCode - 시군구 코드 (5자리)
 * @param {string} bjdongCode - 법정동 코드 (5자리)
 * @param {string} bun - 본번
 * @param {string} ji - 부번
 * @param {string} mountainYn - 산 여부 (Y/N)
 * @param {string} buildingName - 건물명 (선택적, 매칭 보조용)
 * @returns {Promise<Object>} 건물 정보
 */
const getBuildingInfo = async (sigunguCode, bjdongCode, bun, ji, mountainYn, buildingName = null) => {
  try {
    if (!sigunguCode || !bjdongCode) {
      throw new Error('시군구 코드 또는 법정동 코드가 없습니다');
    }

    // API 키 확인
    const apiKey = process.env.BUILDING_REGISTRY_API_KEY || process.env.BUILDING_API_KEY;
    if (!apiKey || apiKey === 'your-building-registry-api-key') {
      console.warn('건축물대장 API 키가 설정되지 않았습니다. BUILDING_REGISTRY_API_KEY를 확인해주세요.');
      return null;
    }

    // 공공데이터포털 건축물대장 API 호출
    const apiUrl = 'http://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo';

    // 파라미터 구성
    const params = {
      serviceKey: decodeURIComponent(apiKey),
      sigunguCd: sigunguCode,
      bjdongCd: bjdongCode,
      numOfRows: 100, // 충분한 크기 설정
      pageNo: 1,
    };

    // 본번이 있으면 숫자로 변환하여 추가
    if (bun && bun.trim() !== '' && bun !== '0') {
      const bunNum = parseInt(bun);
      if (!isNaN(bunNum)) {
        params.bun = bunNum.toString().padStart(4, '0'); // 4자리 패딩 적용
      } else {
        params.bun = bun;
      }
    }

    // 부번이 있으면 숫자로 변환하여 추가
    if (ji && ji.trim() !== '' && ji !== '0') {
      const jiNum = parseInt(ji);
      if (!isNaN(jiNum)) {
        params.ji = jiNum.toString().padStart(4, '0'); // 4자리 패딩 적용
      } else {
        params.ji = ji;
      }
    }

    console.log('건축물대장 API 요청 파라미터:', params);

    let response = null;
    try {
      response = await axios.get(apiUrl, {
        params: params,
        timeout: 15000,
      });
    } catch (err) {
      console.error('건축물대장 API 호출 실패:', err.message);
      throw err;
    }

    // 응답 구조 확인
    let body = null;
    if (response.data && response.data.response && response.data.response.body) {
      body = response.data.response.body;
    } else if (response.data && response.data.body) {
      body = response.data.body;
    } else {
      // console.log('건축물대장 API 응답 status:', response.status);
      // console.log('건축물대장 API 응답:', JSON.stringify(response.data, null, 2));
      console.log('건축물대장 API 응답 형식 오류:', response.data);
      return null;
    }

    // items.item이 배열인지 단일 객체인지 확인
    let items = [];
    if (body.items) {
      if (Array.isArray(body.items.item)) {
        items = body.items.item;
      } else if (body.items.item && typeof body.items.item === 'object') {
        items = [body.items.item];
      }
    }

    if (items.length === 0) {
      console.log('건축물대장 정보를 찾을 수 없습니다 (결과 없음)');
      return null;
    }

    // 매칭 로직 개선
    let building = null;
    const bunNum = bun && bun.trim() !== '' ? parseInt(bun) : 0;
    const jiNum = ji && ji.trim() !== '' ? parseInt(ji) : 0;

    // 1. 정확한 매칭 (본번, 부번, 산 여부)
    const exactMatches = items.filter(item => {
      const itemBun = parseInt(item.bun) || 0;
      const itemJi = item.ji ? parseInt(item.ji) : 0;

      if (itemBun !== bunNum) return false;
      if (jiNum !== 0 && itemJi !== jiNum) return false;

      // 산 여부 확인
      if (mountainYn) {
        const itemPlatGbCd = item.platGbCd || '0';
        const expectedPlatGbCd = mountainYn === 'Y' ? '1' : '0';
        if (itemPlatGbCd !== expectedPlatGbCd) return false;
      }

      return true;
    });

    if (exactMatches.length > 0) {
      // 정확한 매칭이 여러 개일 경우
      // 1-1. 건물명 매칭 시도
      if (buildingName) {
        const nameMatch = exactMatches.find(item => item.bldNm && item.bldNm.includes(buildingName));
        if (nameMatch) {
          building = nameMatch;
          console.log('건축물대장 매칭 성공 (정확한 지번 + 건물명):', building.bldNm);
        }
      }

      // 1-2. 여전히 없으면 연면적이 가장 큰 것 선택 (주건물 추정)
      if (!building) {
        exactMatches.sort((a, b) => {
          const areaA = parseFloat(a.totArea || a.totDongTotArea || 0);
          const areaB = parseFloat(b.totArea || b.totDongTotArea || 0);
          return areaB - areaA;
        });
        building = exactMatches[0];
        console.log('건축물대장 매칭 성공 (정확한 지번 + 최대 면적):', building.bldNm);
      }
    } else {
      // 2. 지번 매칭 실패 시, 건물명으로 느슨한 매칭 시도 (본번은 맞아야 함)
      // 본번은 API 파라미터로 들어갔으므로, 결과 목록에 있는 것들은 본번이 맞을 가능성이 높음 (하지만 API가 무시했을 수도 있음)

      // 본번이 일치하는 후보군 필터링
      const bunMatches = items.filter(item => (parseInt(item.bun) || 0) === bunNum);

      if (bunMatches.length > 0 && buildingName) {
        const nameMatch = bunMatches.find(item => item.bldNm && item.bldNm.includes(buildingName));
        if (nameMatch) {
          building = nameMatch;
          console.log('건축물대장 매칭 성공 (본번 일치 + 건물명):', building.bldNm);
        }
      }

      // 3. 그래도 없으면 본번 일치하는 것 중 최대 면적
      if (!building && bunMatches.length > 0) {
        bunMatches.sort((a, b) => {
          const areaA = parseFloat(a.totArea || a.totDongTotArea || 0);
          const areaB = parseFloat(b.totArea || b.totDongTotArea || 0);
          return areaB - areaA;
        });
        building = bunMatches[0];
        console.log('건축물대장 매칭 성공 (본번 일치 + 최대 면적):', building.bldNm);
      }
    }

    if (!building) {
      console.log('적절한 건물을 찾지 못했습니다. (매칭 실패)');
      // 최후의 수단: 결과가 하나뿐이면 그것을 사용? 아니면 포기?
      // 정확도를 위해 포기하는 것이 나을 수 있음.
      return null;
    }

    // 데이터 추출
    const approvalYear = building.useAprDay && building.useAprDay.toString().trim().length >= 8
      ? building.useAprDay.toString().trim() // YYYYMMDD 전체 반환 (프론트에서 처리) 또는 YYYY만 반환
      : (building.useAprDay && building.useAprDay.toString().trim().length >= 4 ? building.useAprDay.toString().trim().substring(0, 4) : null);

    // YYYYMMDD 형식이면 YYYY-MM-DD로 변환하거나 그냥 둠. 여기서는 YYYY만 추출하던 기존 로직을 따르되, 좀 더 유연하게.
    // 기존 로직: parseInt(substring(0, 4)) -> 년도만 숫자.
    // 개선: 전체 날짜 문자열 반환 시도.

    let formattedApprovalDate = null;
    if (building.useAprDay && building.useAprDay.toString().length >= 4) {
      formattedApprovalDate = building.useAprDay.toString().substring(0, 4);
    }

    const floorsAbove = building.grndFlrCnt ? parseInt(building.grndFlrCnt) : null;
    const floorsBelow = building.ugrndFlrCnt ? parseInt(building.ugrndFlrCnt) : null;

    // 연면적 필드: totDongTotArea(총동연면적) 또는 totArea(연면적) 사용
    const totalArea = building.totDongTotArea
      ? parseFloat(building.totDongTotArea)
      : (building.totArea ? parseFloat(building.totArea) : null);

    console.log('건축물대장 파싱 결과:', {
      사용승인일: formattedApprovalDate,
      지상층수: floorsAbove,
      지하층수: floorsBelow,
      연면적: totalArea,
      건물명: building.bldNm
    });

    return {
      buildingName: building.bldNm || null,
      address: building.newPlatPlc || building.platPlc || null,
      buildingArea: totalArea,
      totalArea: totalArea,
      approvalYear: formattedApprovalDate ? parseInt(formattedName = formattedApprovalDate) : null, // 호환성 유지
      approvalDate: building.useAprDay || null, // 전체 날짜 추가
      floorsAbove: floorsAbove,
      floorsBelow: floorsBelow,
    };
  } catch (error) {
    console.error('건축물대장 API 오류:', error.message);
    return null;
  }
};

/**
 * 주소에서 본번/부번 추출 (다양한 형식 지원)
 * @param {string} address - 주소 문자열
 * @returns {Object} {bun: 본번, ji: 부번}
 */
const extractLotNumber = (address) => {
  if (!address) return { bun: '', ji: '' };

  // 다양한 주소 형식에서 본번/부번 추출
  // 형식 1: "서울 서초구 서초동 1328-10"
  // 형식 2: "서울 서초구 서초동 1328"
  // 형식 3: "1328-10"
  // 형식 4: "1328"

  // 주소 끝부분에서 번지 추출
  const patterns = [
    /(\d+)-(\d+)$/,           // "1328-10" 형식
    /\s(\d+)-(\d+)\s/,        // 공백으로 구분된 " 1328-10 "
    /(\d+)-(\d+)/,            // 일반적인 "1328-10"
    /\s(\d+)$/,               // 끝에 있는 " 1328"
    /(\d+)$/,                 // 끝에 있는 "1328"
  ];

  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      if (match[2]) {
        // 부번이 있는 경우
        return { bun: match[1], ji: match[2] };
      } else {
        // 본번만 있는 경우
        return { bun: match[1], ji: '' };
      }
    }
  }

  return { bun: '', ji: '' };
};

/**
 * 지역별 건물 정보 조회 (좌표 기반)
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @param {string} lotAddress - 지번 주소 (선택적)
 * @param {string} sigunguCode - 시군구 코드 (선택적)
 * @param {string} bjdongCode - 법정동 코드 (선택적)
 * @returns {Promise<Object>} 주변 건물 정보
 */
const getBuildingsByLocation = async (latitude, longitude, lotAddress, sigunguCode, bjdongCode, mainAddressNo, subAddressNo, mountainYn) => {
  try {
    if (!latitude || !longitude) {
      throw new Error('좌표가 없습니다');
    }

    // 주소 정보 초기화
    let addressInfo = null;
    let buildingInfo = null;

    // 주소 정보가 직접 전달된 경우 (프론트에서 카카오맵 API 결과를 전달)
    if (lotAddress && sigunguCode && bjdongCode) {
      console.log('전달받은 주소 정보 사용:', {
        lotAddress,
        sigunguCode,
        bjdongCode,
        mainAddressNo,
        subAddressNo,
        mountainYn
      });

      let bun = mainAddressNo; // 카카오맵 API에서 받은 본번 사용
      let ji = subAddressNo || ''; // 카카오맵 API에서 받은 부번 사용

      // 카카오맵 API에서 본번/부번을 받지 못한 경우 fallback으로 추출
      if (!bun) {
        console.log('카카오맵 API에서 본번/부번을 받지 못함, 주소에서 추출 시도');
        const extracted = extractLotNumber(lotAddress);
        bun = extracted.bun;
        ji = extracted.ji;
      }

      console.log('건축물대장 API 호출 시도 (전달받은 정보):', {
        sigunguCode,
        bjdongCode,
        bun: bun || '(없음)',
        ji: ji || '(없음)',
        lotAddress,
        mountainYn: mountainYn || 'N',
        source: mainAddressNo ? '카카오맵 API' : '주소 추출'
      });

      // 본번이 있으면 건축물대장 API 호출
      if (bun) {
        try {
          buildingInfo = await getBuildingInfo(sigunguCode, bjdongCode, bun, ji, mountainYn, null);
          console.log('건축물대장 API 응답 (전달받은 정보):', buildingInfo);
        } catch (err) {
          console.error('건축물대장 API 호출 실패 (전달받은 정보):', err.message);
        }
      } else {
        console.log('본번을 추출할 수 없습니다:', { lotAddress });
      }

      // 주소 정보 설정
      addressInfo = {
        mainAddress: lotAddress,
        roadAddress: lotAddress,
      };
    } else {
      // 주소 정보가 없으면 좌표로 역검색 (기존 방식)
      console.log('좌표로 주소 역검색 시작');
      addressInfo = await reverseGeocode(latitude, longitude);

      // 주소 검색으로 상세 정보 가져오기 (법정동 코드 등)
      try {
        // 도로명 주소와 지번 주소 모두 시도
        const searchQuery = addressInfo.roadAddress || addressInfo.mainAddress;
        const addressResults = await searchAddress(searchQuery);

        if (addressResults.length > 0) {
          // 여러 결과 중 지번 주소가 있는 것을 우선 선택
          let firstResult = addressResults.find(r => r.lotAddress) || addressResults[0];

          // 시군구 코드와 법정동 코드가 있으면 건축물대장 API 호출 시도
          if (firstResult.sigunguCode && firstResult.bjdongCode) {
            const resultLotAddress = firstResult.lotAddress || ''; // 지번 주소
            const roadAddress = firstResult.roadAddress || ''; // 도로명 주소

            // 카카오맵 API에서 받은 본번/부번 사용 (정확도 향상)
            let bun = firstResult.mainAddressNo || '';
            let ji = firstResult.subAddressNo || '';

            // 카카오맵 API에서 본번/부번을 받지 못한 경우 fallback으로 추출
            if (!bun) {
              console.log('카카오맵 API에서 본번/부번을 받지 못함, 주소에서 추출 시도');
              const extracted = extractLotNumber(resultLotAddress);
              bun = extracted.bun;
              ji = extracted.ji;

              // 지번 주소에서 찾지 못하면 도로명 주소에서 시도
              if (!bun && roadAddress) {
                const roadExtract = extractLotNumber(roadAddress);
                bun = roadExtract.bun;
                ji = roadExtract.ji;
              }
            }

            console.log('건축물대장 API 호출 시도 (역검색):', {
              sigunguCode: firstResult.sigunguCode,
              bjdongCode: firstResult.bjdongCode,
              bun: bun || '(없음)',
              ji: ji || '(없음)',
              lotAddress: resultLotAddress,
              roadAddress,
              source: firstResult.mainAddressNo ? '카카오맵 API' : '주소 추출'
            });

            // 본번이 있으면 API 호출 시도
            if (bun) {
              try {
                buildingInfo = await getBuildingInfo(
                  firstResult.sigunguCode,
                  firstResult.bjdongCode,
                  bun,
                  ji,
                  firstResult.mountainYn,
                  firstResult.buildingName // 건물명 전달
                );
                console.log('건축물대장 API 응답 (역검색):', buildingInfo);
              } catch (err) {
                console.error('건축물대장 API 호출 실패 (역검색):', err.message);
              }
            } else {
              console.log('본번을 추출할 수 없습니다:', { lotAddress: resultLotAddress, roadAddress });
            }
          } else {
            console.log('시군구 코드 또는 법정동 코드가 없습니다:', {
              sigunguCode: firstResult.sigunguCode,
              bjdongCode: firstResult.bjdongCode
            });
          }
        }
      } catch (err) {
        console.log('주소 검색 실패:', err.message);
      }
    }

    // 결과 반환
    if (buildingInfo) {
      return {
        address: addressInfo.mainAddress,
        roadAddress: addressInfo.roadAddress,
        latitude,
        longitude,
        approvalYear: buildingInfo.approvalYear,
        floorsAbove: buildingInfo.floorsAbove,
        floorsBelow: buildingInfo.floorsBelow,
        buildingArea: buildingInfo.buildingArea,
        totalArea: buildingInfo.totalArea || buildingInfo.buildingArea,
        buildingName: buildingInfo.buildingName,
      };
    }

    // 건축물대장 정보를 찾지 못한 경우 기본 주소 정보만 반환
    return {
      address: addressInfo.mainAddress,
      roadAddress: addressInfo.roadAddress,
      latitude,
      longitude,
      approvalYear: null,
      floorsAbove: null,
      floorsBelow: null,
      buildingArea: null,
      totalArea: null,
    };
  } catch (error) {
    console.error('위치 기반 건물 정보 조회 오류:', error.message);
    throw new Error('건물 정보 조회에 실패했습니다');
  }
};

/**
 * 주소로부터 시군구 코드 추출
 * @param {string} address - 주소
 * @returns {Promise<string>} 시군구 코드
 */
const getAdminCode = async (address) => {
  try {
    if (!address) {
      throw new Error('주소가 없습니다');
    }

    const results = await searchAddress(address);
    if (results.length === 0) {
      throw new Error('주소를 찾을 수 없습니다');
    }

    return results[0].zonecode || null;
  } catch (error) {
    console.error('시군구 코드 조회 오류:', error.message);
    throw new Error('시군구 코드 조회에 실패했습니다');
  }
};

/**
 * KakaoMap Static Map URL 생성
 * @param {number} latitude - 위도
 * @param {number} longitude - 경도
 * @returns {string} Static Map URL
 */
const getStaticMapUrl = (latitude, longitude) => {
  if (!latitude || !longitude) return '';

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    return '';
  }

  // 마커 설정: "MX" 스타일 (기본), 라벨 없음
  const marker = `MX:${longitude},${latitude}`;

  // 줌 레벨: 지하철역이 보일 정도 (3~4 정도가 적당)
  const level = 4;

  // 이미지 크기: 문서에 적합한 크기 (예: 600x400)
  const width = 600;
  const height = 400;

  return `https://dapi.kakao.com/v2/local/staticmap?appkey=${apiKey}&markers=${marker}&level=${level}&w=${width}&h=${height}&map_type=NORMAL`;
};

module.exports = {
  searchAddress,
  reverseGeocode,
  searchNearbySubway,
  getBuildingInfo,
  getBuildingsByLocation,
  getAdminCode,
  formatSubwayName,
  calculateWalkingTime,
  getStaticMapUrl,
};
