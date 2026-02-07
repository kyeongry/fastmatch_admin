import { useState, useRef } from 'react';
import { useLeaseContract } from '../../../context/LeaseContractContext';
import { partyAPI } from '../../../services/leaseApi';

const PartyForm = ({ party, index, type, onUpdate, onRemove, canRemove }) => {
  const fileInputRef = useRef(null);
  const [extracting, setExtracting] = useState(false);

  const handleExtract = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const response = party.type === 'business'
        ? await partyAPI.extractBusiness(file)
        : await partyAPI.extractIndividual(file);

      const data = response.data.data;

      // 추출된 데이터로 업데이트
      if (party.type === 'business') {
        onUpdate(index, {
          ...party,
          name: data.companyName || party.name,
          idNumber: data.businessRegNumber || party.idNumber,
          corpRegNumber: data.corpRegNumber || party.corpRegNumber,
          address: data.address || party.address,
          representative: data.representative || party.representative,
        });
      } else {
        onUpdate(index, {
          ...party,
          name: data.name || party.name,
          idNumber: data.idNumberFront || party.idNumber,
          address: data.address || party.address,
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || '정보 추출에 실패했습니다');
    } finally {
      setExtracting(false);
    }
  };

  const typeLabel = type === 'lessors' ? '임대인' : '임차인';

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">
          {typeLabel} {index + 1}
          {party.isRepresentative && <span className="text-primary-600 text-sm ml-2">(대표)</span>}
        </h4>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            삭제
          </button>
        )}
      </div>

      {/* 당사자 유형 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">당사자 유형</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={party.type === 'business'}
              onChange={() => onUpdate(index, { ...party, type: 'business' })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm">법인/사업자</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={party.type === 'individual'}
              onChange={() => onUpdate(index, { ...party, type: 'individual' })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm">개인</span>
          </label>
        </div>
      </div>

      {/* 서류 업로드 */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleExtract}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {extracting ? '추출 중...' : party.type === 'business' ? '사업자등록증 업로드' : '신분증 업로드'}
        </button>
        <span className="text-xs text-gray-500 ml-2">Gemini AI가 자동으로 정보를 추출합니다</span>
      </div>

      {/* 입력 필드 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {party.type === 'business' ? '상호/법인명' : '성명'}
          </label>
          <input
            type="text"
            value={party.name}
            onChange={(e) => onUpdate(index, { ...party, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {party.type === 'business' ? '사업자등록번호' : '주민등록번호 앞자리'}
          </label>
          <input
            type="text"
            value={party.idNumber}
            onChange={(e) => onUpdate(index, { ...party, idNumber: e.target.value })}
            placeholder={party.type === 'business' ? '000-00-00000' : '000000'}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {party.type === 'business' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">법인등록번호</label>
              <input
                type="text"
                value={party.corpRegNumber}
                onChange={(e) => onUpdate(index, { ...party, corpRegNumber: e.target.value })}
                placeholder="(법인인 경우)"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자</label>
              <input
                type="text"
                value={party.representative}
                onChange={(e) => onUpdate(index, { ...party, representative: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
          <input
            type="text"
            value={party.address}
            onChange={(e) => onUpdate(index, { ...party, address: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
          <input
            type="tel"
            value={party.phone}
            onChange={(e) => onUpdate(index, { ...party, phone: e.target.value })}
            placeholder="010-0000-0000"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
          <select
            value={party.role}
            onChange={(e) => onUpdate(index, { ...party, role: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="owner">소유자/본인</option>
            <option value="agent">대리인</option>
            <option value="joint">공동명의자</option>
            <option value="legal_rep">법정대리인</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const PartiesStep = () => {
  const { contract, updateContract, addParty, removeParty } = useLeaseContract();

  const updateParty = (type, index, updatedParty) => {
    const newParties = [...contract.parties[type]];
    newParties[index] = updatedParty;
    updateContract({
      parties: {
        ...contract.parties,
        [type]: newParties,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 임대인 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">임대인 (건물주)</h2>
          <button
            onClick={() => addParty('lessors')}
            className="px-3 py-1 text-sm border border-primary-500 text-primary-600 rounded-lg hover:bg-blue-50"
          >
            + 임대인 추가
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          공동명의인 경우 임대인을 추가하세요. 2명 이상인 경우 별지로 출력됩니다.
        </p>

        {contract.parties.lessors.map((party, index) => (
          <PartyForm
            key={index}
            party={party}
            index={index}
            type="lessors"
            onUpdate={(idx, updated) => updateParty('lessors', idx, updated)}
            onRemove={(idx) => removeParty('lessors', idx)}
            canRemove={contract.parties.lessors.length > 1}
          />
        ))}
      </div>

      {/* 임차인 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">임차인 (세입자)</h2>
          <button
            onClick={() => addParty('lessees')}
            className="px-3 py-1 text-sm border border-primary-500 text-primary-600 rounded-lg hover:bg-blue-50"
          >
            + 임차인 추가
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          공동명의인 경우 임차인을 추가하세요. 2명 이상인 경우 별지로 출력됩니다.
        </p>

        {contract.parties.lessees.map((party, index) => (
          <PartyForm
            key={index}
            party={party}
            index={index}
            type="lessees"
            onUpdate={(idx, updated) => updateParty('lessees', idx, updated)}
            onRemove={(idx) => removeParty('lessees', idx)}
            canRemove={contract.parties.lessees.length > 1}
          />
        ))}
      </div>

      {/* 공동중개 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="jointBrokerage"
            checked={contract.jointBrokerage.enabled}
            onChange={(e) =>
              updateContract({
                jointBrokerage: {
                  ...contract.jointBrokerage,
                  enabled: e.target.checked,
                },
              })
            }
            className="w-4 h-4 text-primary-600 rounded"
          />
          <label htmlFor="jointBrokerage" className="text-lg font-semibold cursor-pointer">
            공동중개
          </label>
        </div>

        {contract.jointBrokerage.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">중개사무소명</label>
              <input
                type="text"
                value={contract.jointBrokerage.broker.officeName}
                onChange={(e) =>
                  updateContract({
                    jointBrokerage: {
                      ...contract.jointBrokerage,
                      broker: { ...contract.jointBrokerage.broker, officeName: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">등록번호</label>
              <input
                type="text"
                value={contract.jointBrokerage.broker.regNumber}
                onChange={(e) =>
                  updateContract({
                    jointBrokerage: {
                      ...contract.jointBrokerage,
                      broker: { ...contract.jointBrokerage.broker, regNumber: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">사무소 소재지</label>
              <input
                type="text"
                value={contract.jointBrokerage.broker.officeAddress}
                onChange={(e) =>
                  updateContract({
                    jointBrokerage: {
                      ...contract.jointBrokerage,
                      broker: { ...contract.jointBrokerage.broker, officeAddress: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자</label>
              <input
                type="text"
                value={contract.jointBrokerage.broker.representative}
                onChange={(e) =>
                  updateContract({
                    jointBrokerage: {
                      ...contract.jointBrokerage,
                      broker: { ...contract.jointBrokerage.broker, representative: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input
                type="tel"
                value={contract.jointBrokerage.broker.phone}
                onChange={(e) =>
                  updateContract({
                    jointBrokerage: {
                      ...contract.jointBrokerage,
                      broker: { ...contract.jointBrokerage.broker, phone: e.target.value },
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartiesStep;
