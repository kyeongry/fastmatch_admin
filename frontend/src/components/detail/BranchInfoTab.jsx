import InfoTable from './InfoTable';
import ImageGallery from './ImageGallery';
import ReviewBoard from './ReviewBoard';

/**
 * BranchInfoTab - 지점 정보 탭
 * 지점 전체에 공통되는 정보 (위치, 브랜드, 공용 시설 등) + 리뷰 게시판
 *
 * @param {object} branch - 지점 데이터
 * @param {function} onImageClick - 이미지 클릭 콜백
 */
const BranchInfoTab = ({ branch, onImageClick }) => {
  if (!branch) {
    return (
      <div className="text-center py-12 text-gray-400">
        지점 정보가 없습니다
      </div>
    );
  }

  const branchId = branch.id || branch._id;

  // 지점 이미지 모음
  const allImages = [
    ...(branch.exterior_image_url ? [branch.exterior_image_url] : []),
    ...(branch.interior_image_urls || []),
  ];

  // 지점 기본 정보
  const basicInfoRows = [
    { label: '브랜드', value: branch.brand?.name || '-' },
    { label: '지점명', value: branch.name || '-' },
    { label: '주소', value: branch.address || '-', colSpan: true },
    {
      label: '최근접 지하철',
      value: branch.nearest_subway
        ? `${branch.nearest_subway} (${branch.is_transit ? '대중교통' : '도보'} ${branch.is_transit ? (branch.transit_distance || branch.walking_distance) : branch.walking_distance}분)`
        : '-',
    },
    { label: '상태', value: branch.status === 'active' ? '운영중' : '비활성' },
  ];

  // 추가 정보 (basic_info fields)
  const additionalInfoRows = [];
  if (branch.basic_info_1) {
    additionalInfoRows.push({ label: '기본정보 1', value: branch.basic_info_1, colSpan: true });
  }
  if (branch.basic_info_2) {
    additionalInfoRows.push({ label: '기본정보 2', value: branch.basic_info_2, colSpan: true });
  }
  if (branch.basic_info_3) {
    additionalInfoRows.push({ label: '기본정보 3', value: branch.basic_info_3, colSpan: true });
  }

  return (
    <div className="space-y-6">
      {/* 지점 사진 갤러리 */}
      {allImages.length > 0 && (
        <div className="mb-6">
          <ImageGallery
            images={allImages}
            title="지점 사진"
            onImageClick={onImageClick}
          />
        </div>
      )}

      {/* 지점 기본 정보 */}
      <InfoTable title="지점 기본 정보" rows={basicInfoRows} />

      {/* 추가 정보 */}
      {additionalInfoRows.length > 0 && (
        <InfoTable title="지점 상세 정보" rows={additionalInfoRows} />
      )}

      {/* 지점 리뷰 게시판 */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <ReviewBoard branchId={branchId} />
      </div>
    </div>
  );
};

export default BranchInfoTab;
