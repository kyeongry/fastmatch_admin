import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { optionAPI, uploadAPI } from '../../services/api';
import { formatNumberInput, parseNumberInput } from '../../utils/formatters';

const OptionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [newFee, setNewFee] = useState({ type: '', amount: '' });
  const [floorPlanFile, setFloorPlanFile] = useState(null);

  useEffect(() => {
    fetchOption();
  }, [id]);

  const fetchOption = async () => {
    try {
      const response = await optionAPI.getById(id);
      const option = response.data.option;
      setFormData({
        brand_id: option.branch?.brand?.id || '',
        branch_id: option.branch_id,
        name: option.name,
        category1: option.category1,
        category2: option.category2 || '',
        capacity: option.capacity,
        monthly_fee: option.monthly_fee,
        deposit: option.deposit,
        list_price: option.list_price || '',
        one_time_fees: option.one_time_fees || [],
        move_in_date_type: option.move_in_date_type,
        move_in_date_value: option.move_in_date_value || '',
        contract_period_type: option.contract_period_type,
        contract_period_value: option.contract_period_value || '',
        office_info: option.office_info || '',
        credits: option.credits || '',
        hvac_type: option.hvac_type || 'central',
        parking_type: option.parking_type || 'self_parking',
        memo: option.memo || '',
        floor_plan_url: option.floor_plan_url || '',
      });
    } catch (error) {
      console.error('옵션 조회 실패:', error);
      alert('옵션 정보를 불러올 수 없습니다');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = () => {
    if (newFee.type && newFee.amount) {
      setFormData((prev) => ({
        ...prev,
        one_time_fees: [
          ...prev.one_time_fees,
          { type: newFee.type, amount: parseFloat(newFee.amount) },
        ],
      }));
      setNewFee({ type: '', amount: '' });
    }
  };

  const handleRemoveFee = (index) => {
    setFormData((prev) => ({
      ...prev,
      one_time_fees: prev.one_time_fees.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let floorPlanUrl = formData.floor_plan_url;

      if (floorPlanFile) {
        const uploadResponse = await uploadAPI.image(floorPlanFile);
        floorPlanUrl = uploadResponse.data.url;
      }

      const submitData = {
        ...formData,
        monthly_fee: parseFloat(formData.monthly_fee),
        deposit: parseFloat(formData.deposit),
        list_price: formData.list_price ? parseFloat(formData.list_price) : null,
        credits: formData.credits ? parseInt(formData.credits) : null,
        floor_plan_url: floorPlanUrl,
        one_time_fees: formData.one_time_fees,
      };

      await optionAPI.update(id, submitData);
      alert('옵션이 성공적으로 수정되었습니다');
      navigate('/');
    } catch (error) {
      console.error('옵션 수정 실패:', error);
      alert('옵션 수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div>로딩 중...</div>
        </div>
      </Layout>
    );
  }

  if (!formData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div>옵션을 찾을 수 없습니다</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">옵션 수정</h1>

        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              옵션명
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              인실
            </label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              월사용료
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.monthly_fee)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  monthly_fee: numericValue ? parseInt(numericValue) : 0,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              보증금
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.deposit)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  deposit: numericValue ? parseInt(numericValue) : 0,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정가
            </label>
            <input
              type="text"
              value={formatNumberInput(formData.list_price)}
              onChange={(e) => {
                const numericValue = parseNumberInput(e.target.value);
                setFormData({
                  ...formData,
                  list_price: numericValue,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              일회성비용
            </label>
            <div className="space-y-3 mb-4">
              {formData.one_time_fees.map((fee, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">
                    {fee.type}: {parseInt(fee.amount).toLocaleString()}원
                  </span>
                  <button
                    onClick={() => handleRemoveFee(index)}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFee.type}
                onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
                placeholder="비용 종류"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newFee.amount}
                onChange={(e) =>
                  setNewFee({ ...newFee, amount: e.target.value })
                }
                placeholder="금액"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddFee}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              오피스정보
            </label>
            <textarea
              value={formData.office_info}
              onChange={(e) =>
                setFormData({ ...formData, office_info: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              냉난방식
            </label>
            <div className="space-y-2">
              {[
                { value: 'central', label: '중앙냉난방' },
                { value: 'individual', label: '개별냉난방' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hvac_type"
                    value={option.value}
                    checked={formData.hvac_type === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hvac_type: e.target.value,
                      })
                    }
                    className="w-4 h-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주차방식
            </label>
            <div className="space-y-2">
              {[
                { value: 'self_parking', label: '자주식' },
                { value: 'mechanical', label: '기계식' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="parking_type"
                    value={option.value}
                    checked={formData.parking_type === option.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parking_type: e.target.value,
                      })
                    }
                    className="w-4 h-4"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              평면도 이미지
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFloorPlanFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기타메모
            </label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? '수정 중...' : '수정'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OptionEdit;
