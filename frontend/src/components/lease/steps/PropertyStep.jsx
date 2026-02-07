import { useState, useRef } from 'react';
import { useLeaseContract } from '../../../context/LeaseContractContext';

const PropertyStep = () => {
  const {
    contract,
    updateContract,
    updateNestedContract,
    extractRegistryInfo,
    isLoading,
  } = useLeaseContract();

  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  // 등기부등본 파일 업로드 처리
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({ type: 'error', message: 'JPG, PNG, WEBP, PDF 파일만 업로드 가능합니다.' });
      return;
    }

    setUploadStatus({ type: 'loading', message: 'Gemini AI가 등기부등본을 분석중입니다...' });

    try {
      await extractRegistryInfo(file);
      setUploadStatus({ type: 'success', message: '등기부등본 정보가 추출되었습니다.' });
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message });
    }
  };

  // 숫자 입력 처리
  const handleNumberChange = (path, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    updateNestedContract(path, numValue);
  };

  return (
    <div className="space-y-6">
      {/* 등기부등본 업로드 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">등기부등본 업로드</h2>
        <p className="text-gray-600 text-sm mb-4">
          등기부등본 이미지 또는 PDF를 업로드하면 Gemini AI가 자동으로 정보를 추출합니다.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p>클릭하여 파일 선택 또는 드래그 앤 드롭</p>
            <p className="text-xs mt-1">JPG, PNG, WEBP, PDF (최대 10MB)</p>
          </div>
        </div>

        {/* 업로드 상태 */}
        {uploadStatus && (
          <div className={`mt-4 p-3 rounded-lg ${
            uploadStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
            uploadStatus.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {uploadStatus.type === 'loading' && (
              <span className="inline-block animate-spin mr-2">⏳</span>
            )}
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* 소재지 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">소재지</h2>
        <input
          type="text"
          value={contract.property.address}
          onChange={(e) => updateNestedContract('property.address', e.target.value)}
          placeholder="등기부등본에서 추출된 주소가 표시됩니다"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          등기부등본의 주소가 그대로 사용됩니다
        </p>
      </div>

      {/* 토지 정보 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">토지 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지목</label>
            <input
              type="text"
              value={contract.property.land.category}
              onChange={(e) => updateNestedContract('property.land.category', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면적 (㎡)</label>
            <input
              type="number"
              step="0.01"
              value={contract.property.land.area || ''}
              onChange={(e) => handleNumberChange('property.land.area', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대지권 종류</label>
            <input
              type="text"
              value={contract.property.land.rightType}
              onChange={(e) => updateNestedContract('property.land.rightType', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대지권 비율</label>
            <input
              type="text"
              value={contract.property.land.rightRatio}
              onChange={(e) => updateNestedContract('property.land.rightRatio', e.target.value)}
              placeholder="예: 1439.34분의 187.51"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 건물 정보 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">건물 정보</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">구조</label>
            <input
              type="text"
              value={contract.property.building.structure}
              onChange={(e) => updateNestedContract('property.building.structure', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">용도</label>
            <select
              value={contract.property.building.usage}
              onChange={(e) => updateNestedContract('property.building.usage', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">선택</option>
              <option value="업무시설">업무시설</option>
              <option value="상업시설">상업시설</option>
              <option value="공업시설">공업시설</option>
              <option value="근린생활시설">근린생활시설</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연면적 (㎡)</label>
            <input
              type="number"
              step="0.01"
              value={contract.property.building.totalArea || ''}
              onChange={(e) => handleNumberChange('property.building.totalArea', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">임대 층</label>
            <input
              type="text"
              value={contract.property.building.leaseFloor}
              onChange={(e) => updateNestedContract('property.building.leaseFloor', e.target.value)}
              placeholder="예: 5층"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">임대 면적 (㎡)</label>
            <input
              type="number"
              step="0.01"
              value={contract.property.building.leaseArea || ''}
              onChange={(e) => handleNumberChange('property.building.leaseArea', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">준공년도</label>
            <input
              type="number"
              value={contract.property.building.completionYear || ''}
              onChange={(e) => handleNumberChange('property.building.completionYear', e.target.value)}
              placeholder="예: 2020"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">방향</label>
            <select
              value={contract.property.building.direction}
              onChange={(e) => updateNestedContract('property.building.direction', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">선택</option>
              <option value="동향">동향</option>
              <option value="서향">서향</option>
              <option value="남향">남향</option>
              <option value="북향">북향</option>
              <option value="남동향">남동향</option>
              <option value="남서향">남서향</option>
              <option value="북동향">북동향</option>
              <option value="북서향">북서향</option>
            </select>
          </div>
        </div>

        {/* 내진설계 / 위반건축물 */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contract.property.building.seismicDesign}
                onChange={(e) => updateNestedContract('property.building.seismicDesign', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">내진설계 적용</span>
            </label>
            {contract.property.building.seismicDesign && (
              <input
                type="text"
                value={contract.property.building.seismicCapacity}
                onChange={(e) => updateNestedContract('property.building.seismicCapacity', e.target.value)}
                placeholder="내진능력 (예: VII-1)"
                className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={contract.property.building.isViolation}
                onChange={(e) => updateNestedContract('property.building.isViolation', e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">위반건축물</span>
            </label>
            {contract.property.building.isViolation && (
              <textarea
                value={contract.property.building.violationContent}
                onChange={(e) => updateNestedContract('property.building.violationContent', e.target.value)}
                placeholder="위반내용 입력"
                rows={2}
                className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* 소유권 및 권리관계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">소유권 및 권리관계</h2>

        {/* 소유자 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">소유자</h3>
          {contract.registry.owners.length === 0 ? (
            <p className="text-gray-500 text-sm">등기부등본에서 추출된 소유자 정보가 표시됩니다</p>
          ) : (
            <div className="space-y-2">
              {contract.registry.owners.map((owner, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{owner.name}</span>
                    {owner.share && <span className="text-gray-500">지분: {owner.share}</span>}
                  </div>
                  {owner.address && (
                    <p className="text-sm text-gray-600 mt-1">{owner.address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 소유권 외 권리 */}
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-2">소유권 외 권리 (근저당, 전세권 등)</h3>
          {contract.registry.encumbrances.length === 0 ? (
            <p className="text-gray-500 text-sm">등기부등본에서 추출된 권리 정보가 표시됩니다</p>
          ) : (
            <div className="space-y-2">
              {contract.registry.encumbrances.map((encumbrance, index) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-yellow-800">{encumbrance.type}</span>
                      <span className="text-gray-600 ml-2">{encumbrance.holder}</span>
                    </div>
                    <span className="font-semibold text-yellow-800">
                      {encumbrance.amount?.toLocaleString()}원
                    </span>
                  </div>
                  {encumbrance.date && (
                    <p className="text-sm text-gray-500 mt-1">
                      설정일: {new Date(encumbrance.date).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyStep;
