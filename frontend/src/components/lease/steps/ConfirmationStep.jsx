import { useLeaseContract } from '../../../context/LeaseContractContext';

const ConfirmationStep = () => {
  const { contract, updateNestedContract } = useLeaseContract();
  const { confirmation } = contract;

  // 라디오/체크박스 변경 핸들러
  const handleChange = (path, value) => {
    updateNestedContract(`confirmation.${path}`, value);
  };

  return (
    <div className="space-y-6">
      {/* 안내 메시지 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>비주거용 건축물 확인설명서</strong> [별지 제20호의2서식]
        </p>
        <p className="text-xs text-primary-600 mt-1">
          * 표시 항목은 필수입력 항목입니다. 가능한 모든 항목을 입력해 주세요.
        </p>
      </div>

      {/* 1. 실제 이용상태 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">1. 실제 이용상태</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">토지 이용상태</label>
            <input
              type="text"
              value={confirmation.actualLandUse}
              onChange={(e) => handleChange('actualLandUse', e.target.value)}
              placeholder="예: 대지"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">건물 이용상태</label>
            <input
              type="text"
              value={confirmation.actualBuildingUse}
              onChange={(e) => handleChange('actualBuildingUse', e.target.value)}
              placeholder="예: 사무실"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 2. 민간임대 등록여부 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">2. 민간임대 등록여부</h2>
        <div className="space-y-3">
          {[
            { value: 'none', label: '미등록' },
            { value: 'long_term', label: '장기일반민간임대주택' },
            { value: 'public_support', label: '공공지원민간임대주택' },
            { value: 'other', label: '기타' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="privateRental"
                checked={confirmation.privateRental.type === option.value}
                onChange={() => handleChange('privateRental.type', option.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}

          {confirmation.privateRental.type === 'other' && (
            <input
              type="text"
              value={confirmation.privateRental.otherType}
              onChange={(e) => handleChange('privateRental.otherType', e.target.value)}
              placeholder="기타 유형 입력"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 mt-2"
            />
          )}

          {confirmation.privateRental.type !== 'none' && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의무기간</label>
                <input
                  type="text"
                  value={confirmation.privateRental.obligationPeriod}
                  onChange={(e) => handleChange('privateRental.obligationPeriod', e.target.value)}
                  placeholder="예: 8년"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">의무기간 시작일</label>
                <input
                  type="date"
                  value={confirmation.privateRental.startDate?.split('T')[0] || ''}
                  onChange={(e) => handleChange('privateRental.startDate', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. 계약갱신요구권 행사여부 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">3. 계약갱신요구권 행사여부</h2>
        <div className="space-y-3">
          {[
            { value: 'confirmed', label: '확인됨 (행사함)' },
            { value: 'unconfirmed', label: '미확인' },
            { value: 'not_applicable', label: '해당없음' },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="renewalRight"
                checked={confirmation.renewalRight.status === option.value}
                onChange={() => handleChange('renewalRight.status', option.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}

          {confirmation.renewalRight.status === 'confirmed' && (
            <label className="flex items-center gap-2 mt-2 ml-6">
              <input
                type="checkbox"
                checked={confirmation.renewalRight.hasDocument}
                onChange={(e) => handleChange('renewalRight.hasDocument', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-600">관련 서류 확인됨</span>
            </label>
          )}
        </div>
      </div>

      {/* 4. 입지조건 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">4. 입지조건</h2>

        {/* 도로 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">도로와의 관계</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">도로 폭 1</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={confirmation.location.road.width1 || ''}
                  onChange={(e) => handleChange('location.road.width1', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">m</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">도로 폭 2</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={confirmation.location.road.width2 || ''}
                  onChange={(e) => handleChange('location.road.width2', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">m</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">포장 여부</label>
              <select
                value={confirmation.location.road.paved ? 'paved' : 'unpaved'}
                onChange={(e) => handleChange('location.road.paved', e.target.value === 'paved')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="paved">포장</option>
                <option value="unpaved">비포장</option>
              </select>
            </div>
          </div>
        </div>

        {/* 접근성 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">차량 진출입</h3>
          <div className="flex gap-4">
            {[
              { value: 'easy', label: '용이' },
              { value: 'difficult', label: '불편' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="accessibility"
                  checked={confirmation.location.accessibility === option.value}
                  onChange={() => handleChange('location.accessibility', option.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 대중교통 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">대중교통</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* 버스 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-3">버스</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">정류장명</label>
                  <input
                    type="text"
                    value={confirmation.location.publicTransport.bus.station}
                    onChange={(e) => handleChange('location.publicTransport.bus.station', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">소요시간</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={confirmation.location.publicTransport.bus.time || ''}
                        onChange={(e) => handleChange('location.publicTransport.bus.time', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      />
                      <span className="text-xs text-gray-500">분</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">이동방법</label>
                    <select
                      value={confirmation.location.publicTransport.bus.method}
                      onChange={(e) => handleChange('location.publicTransport.bus.method', e.target.value)}
                      className="w-full px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="도보">도보</option>
                      <option value="차량">차량</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 지하철 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-600 mb-3">지하철</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">역명</label>
                  <input
                    type="text"
                    value={confirmation.location.publicTransport.subway.station}
                    onChange={(e) => handleChange('location.publicTransport.subway.station', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">소요시간</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={confirmation.location.publicTransport.subway.time || ''}
                        onChange={(e) => handleChange('location.publicTransport.subway.time', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-2 border rounded-lg text-sm"
                      />
                      <span className="text-xs text-gray-500">분</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">이동방법</label>
                    <select
                      value={confirmation.location.publicTransport.subway.method}
                      onChange={(e) => handleChange('location.publicTransport.subway.method', e.target.value)}
                      className="w-full px-2 py-2 border rounded-lg text-sm"
                    >
                      <option value="도보">도보</option>
                      <option value="차량">차량</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 주차 */}
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-3">주차시설</h3>
          <div className="flex gap-4 mb-3">
            {[
              { value: 'none', label: '없음' },
              { value: 'exclusive', label: '전용' },
              { value: 'shared', label: '공용' },
              { value: 'other', label: '기타' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="parking"
                  checked={confirmation.location.parking === option.value}
                  onChange={() => handleChange('location.parking', option.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {confirmation.location.parking === 'other' && (
            <input
              type="text"
              value={confirmation.location.parkingNote}
              onChange={(e) => handleChange('location.parkingNote', e.target.value)}
              placeholder="기타 주차시설 내용"
              className="w-full px-3 py-2 border rounded-lg"
            />
          )}
        </div>
      </div>

      {/* 5. 관리에 관한 사항 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">5. 관리에 관한 사항</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={confirmation.management.security}
              onChange={(e) => handleChange('management.security', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm">경비실 있음</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">관리 형태</label>
            <div className="flex gap-4">
              {[
                { value: 'outsourced', label: '위탁관리' },
                { value: 'self', label: '자체관리' },
                { value: 'other', label: '기타' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="managementType"
                    checked={confirmation.management.type === option.value}
                    onChange={() => handleChange('management.type', option.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {confirmation.management.type === 'other' && (
              <input
                type="text"
                value={confirmation.management.typeNote}
                onChange={(e) => handleChange('management.typeNote', e.target.value)}
                placeholder="기타 관리 형태"
                className="w-full px-3 py-2 border rounded-lg mt-2"
              />
            )}
          </div>
        </div>
      </div>

      {/* 6. 실제 권리관계 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">6. 실제 권리관계 또는 공시되지 않은 권리사항</h2>
        <textarea
          value={confirmation.actualRights}
          onChange={(e) => handleChange('actualRights', e.target.value)}
          placeholder="공시되지 않은 권리관계가 있는 경우 입력 (예: 선순위 임차인 정보 등)"
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* 7. 시설물 상태 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">7. 시설물 상태 (비주거용)</h2>

        {/* 수도 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">수도</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={confirmation.facilities.water.damaged}
                  onChange={(e) => handleChange('facilities.water.damaged', e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-sm">파손 있음</span>
              </label>
              {confirmation.facilities.water.damaged && (
                <input
                  type="text"
                  value={confirmation.facilities.water.damagedLocation}
                  onChange={(e) => handleChange('facilities.water.damagedLocation', e.target.value)}
                  placeholder="파손 위치"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={!confirmation.facilities.water.sufficient}
                  onChange={(e) => handleChange('facilities.water.sufficient', !e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-sm">수압 불량</span>
              </label>
              {!confirmation.facilities.water.sufficient && (
                <input
                  type="text"
                  value={confirmation.facilities.water.insufficientLocation}
                  onChange={(e) => handleChange('facilities.water.insufficientLocation', e.target.value)}
                  placeholder="불량 위치"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              )}
            </div>
          </div>
        </div>

        {/* 전기 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">전기 시설</h3>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={confirmation.facilities.electricity.normal}
              onChange={(e) => handleChange('facilities.electricity.normal', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm">정상</span>
          </label>
          {!confirmation.facilities.electricity.normal && (
            <input
              type="text"
              value={confirmation.facilities.electricity.replaceNote}
              onChange={(e) => handleChange('facilities.electricity.replaceNote', e.target.value)}
              placeholder="교체/수리 필요 내용"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>

        {/* 소방 설비 (비주거용 - 기본값: 있음) */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-md font-medium text-gray-700 mb-3">
            소방 설비 <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-yellow-700 mb-3">
            비주거용 건물의 소화전 및 비상벨 위치를 반드시 입력하세요.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={confirmation.facilities.fire.firePlug.exists}
                  onChange={(e) => handleChange('facilities.fire.firePlug.exists', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm font-medium">소화전 있음</span>
              </label>
              {confirmation.facilities.fire.firePlug.exists && (
                <input
                  type="text"
                  value={confirmation.facilities.fire.firePlug.location}
                  onChange={(e) => handleChange('facilities.fire.firePlug.location', e.target.value)}
                  placeholder="소화전 위치 (필수) *"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={confirmation.facilities.fire.emergencyBell.exists}
                  onChange={(e) => handleChange('facilities.fire.emergencyBell.exists', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm font-medium">비상벨 있음</span>
              </label>
              {confirmation.facilities.fire.emergencyBell.exists && (
                <input
                  type="text"
                  value={confirmation.facilities.fire.emergencyBell.location}
                  onChange={(e) => handleChange('facilities.fire.emergencyBell.location', e.target.value)}
                  placeholder="비상벨 위치 (필수) *"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm bg-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* 난방 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">난방 시설</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">공급방식</label>
              <select
                value={confirmation.facilities.heating.supply}
                onChange={(e) => handleChange('facilities.heating.supply', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="central">중앙공급</option>
                <option value="individual">개별공급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">작동상태</label>
              <select
                value={confirmation.facilities.heating.working}
                onChange={(e) => handleChange('facilities.heating.working', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="normal">정상</option>
                <option value="repair">수리필요</option>
                <option value="unknown">미확인</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">사용연수</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={confirmation.facilities.heating.yearsUsed || ''}
                  onChange={(e) => handleChange('facilities.heating.yearsUsed', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <span className="text-sm text-gray-500">년</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">연료</label>
              <select
                value={confirmation.facilities.heating.fuel}
                onChange={(e) => handleChange('facilities.heating.fuel', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="city_gas">도시가스</option>
                <option value="oil">기름</option>
                <option value="propane">프로판</option>
                <option value="coal">연탄</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>
        </div>

        {/* 승강기 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">승강기</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={confirmation.facilities.elevator.exists}
                onChange={(e) => handleChange('facilities.elevator.exists', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm">승강기 있음</span>
            </label>
            {confirmation.facilities.elevator.exists && (
              <input
                type="text"
                value={confirmation.facilities.elevator.condition}
                onChange={(e) => handleChange('facilities.elevator.condition', e.target.value)}
                placeholder="상태 (예: 양호, 수리필요)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            )}
          </div>
        </div>

        {/* 배수 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">배수</h3>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={confirmation.facilities.drainage.normal}
              onChange={(e) => handleChange('facilities.drainage.normal', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm">정상</span>
          </label>
          {!confirmation.facilities.drainage.normal && (
            <input
              type="text"
              value={confirmation.facilities.drainage.repairNote}
              onChange={(e) => handleChange('facilities.drainage.repairNote', e.target.value)}
              placeholder="수리 필요 내용"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>

        {/* 기타 시설물 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">기타 시설물</h3>
          <textarea
            value={confirmation.facilities.otherFacilities}
            onChange={(e) => handleChange('facilities.otherFacilities', e.target.value)}
            placeholder="기타 시설물 상태 (에어컨, 조명 등)"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* 8. 벽면/바닥 상태 (비주거용 - 도배 항목 없음) */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">8. 벽면/바닥 상태</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* 벽면 균열 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={confirmation.interior.wallCrack.exists}
                onChange={(e) => handleChange('interior.wallCrack.exists', e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm font-medium">벽면 균열 있음</span>
            </label>
            {confirmation.interior.wallCrack.exists && (
              <input
                type="text"
                value={confirmation.interior.wallCrack.location}
                onChange={(e) => handleChange('interior.wallCrack.location', e.target.value)}
                placeholder="균열 위치"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            )}
          </div>

          {/* 벽면 누수 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={confirmation.interior.wallLeak.exists}
                onChange={(e) => handleChange('interior.wallLeak.exists', e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm font-medium">벽면 누수 있음</span>
            </label>
            {confirmation.interior.wallLeak.exists && (
              <input
                type="text"
                value={confirmation.interior.wallLeak.location}
                onChange={(e) => handleChange('interior.wallLeak.location', e.target.value)}
                placeholder="누수 위치"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            )}
          </div>
        </div>

        {/* 바닥 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-3">바닥 상태</h3>
          <div className="flex gap-4 mb-3">
            {[
              { value: 'clean', label: '양호' },
              { value: 'normal', label: '보통' },
              { value: 'repair', label: '수리필요' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="floorStatus"
                  checked={confirmation.interior.floor === option.value}
                  onChange={() => handleChange('interior.floor', option.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          {confirmation.interior.floor === 'repair' && (
            <input
              type="text"
              value={confirmation.interior.floorNote}
              onChange={(e) => handleChange('interior.floorNote', e.target.value)}
              placeholder="수리 필요 내용"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;
