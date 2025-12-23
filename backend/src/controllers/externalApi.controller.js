const {
  searchAddress,
  reverseGeocode,
  searchNearbySubway,
  searchNearbySubwayExtended,
  getBuildingInfo,
  getBuildingsByLocation,
  getAdminCode,
} = require('../services/externalApi.service');

/**
 * 주소 검색
 */
const searchAddressHandler = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: '검색어가 필요합니다',
      });
    }

    const results = await searchAddress(query);

    res.json({
      success: true,
      count: results.length,
      addresses: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 좌표로 주소 역검색
 */
const reverseGeocodeHandler = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '위도와 경도가 필요합니다',
      });
    }

    const result = await reverseGeocode(parseFloat(latitude), parseFloat(longitude));

    res.json({
      success: true,
      address: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 근처 지하철역 검색
 */
const searchSubwayHandler = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '위도와 경도가 필요합니다',
      });
    }

    const searchRadius = radius ? parseInt(radius) : 1000;
    const results = await searchNearbySubway(
      parseFloat(latitude),
      parseFloat(longitude),
      searchRadius
    );

    res.json({
      success: true,
      count: results.length,
      subways: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 건물 정보 조회
 */
const getBuildingHandler = async (req, res, next) => {
  try {
    const { sigunguCode, buildingNumber } = req.query;

    if (!sigunguCode || !buildingNumber) {
      return res.status(400).json({
        success: false,
        message: '시군구 코드와 건물번호가 필요합니다',
      });
    }

    const result = await getBuildingInfo(sigunguCode, buildingNumber);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '건물 정보를 찾을 수 없습니다',
      });
    }

    res.json({
      success: true,
      building: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 위치 기반 건물 정보 조회
 */
const getBuildingByLocationHandler = async (req, res, next) => {
  try {
    const { latitude, longitude, lotAddress, sigunguCode, bjdongCode, mainAddressNo, subAddressNo, mountainYn } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '위도와 경도가 필요합니다',
      });
    }

    const result = await getBuildingsByLocation(
      parseFloat(latitude),
      parseFloat(longitude),
      lotAddress,
      sigunguCode,
      bjdongCode,
      mainAddressNo, // 본번 (카카오맵 API에서 직접 받음)
      subAddressNo,  // 부번 (카카오맵 API에서 직접 받음)
      mountainYn     // 산 여부 (카카오맵 API에서 직접 받음)
    );

    res.json({
      success: true,
      building: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 시군구 코드 조회
 */
const getAdminCodeHandler = async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: '주소가 필요합니다',
      });
    }

    const code = await getAdminCode(address);

    res.json({
      success: true,
      code,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 근처 지하철역 확장 검색 (반경 자동 확대)
 * 주변에 지하철역이 없을 경우 반경을 점진적으로 확대하여 검색
 */
const searchSubwayExtendedHandler = async (req, res, next) => {
  try {
    const { latitude, longitude, maxRadius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '위도와 경도가 필요합니다',
      });
    }

    const searchMaxRadius = maxRadius ? parseInt(maxRadius) : 20000;
    const result = await searchNearbySubwayExtended(
      parseFloat(latitude),
      parseFloat(longitude),
      searchMaxRadius
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAddressHandler,
  reverseGeocodeHandler,
  searchSubwayHandler,
  searchSubwayExtendedHandler,
  getBuildingHandler,
  getBuildingByLocationHandler,
  getAdminCodeHandler,
};
