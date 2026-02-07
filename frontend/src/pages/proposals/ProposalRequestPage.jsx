import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useToast } from '../../hooks/useToast';
import { brandAPI, proposalRequestAPI } from '../../services/api';

const ProposalRequestPage = () => {
    const navigate = useNavigate();
    const { success, error, warning } = useToast();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        contact_position: '',
        contact_phone: '',
        contact_email: '',
        preferred_subway: '',
        actual_users: '',
        preferred_capacity: '',
        move_in_date: '',
        move_in_period: 'early',
        lease_period: 12,
        additional_info: '',
        selected_brands: [],
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await brandAPI.getAll({ status: 'active' });
            setBrands(response.data.brands || []);
        } catch (err) {
            console.error('브랜드 목록 조회 실패:', err);
            error('브랜드 목록을 불러오는데 실패했습니다');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBrandToggle = (brandId) => {
        setFormData((prev) => {
            const selected = prev.selected_brands.includes(brandId)
                ? prev.selected_brands.filter((id) => id !== brandId)
                : [...prev.selected_brands, brandId];
            return { ...prev, selected_brands: selected };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 유효성 검증
        if (!formData.company_name) return warning('고객사명을 입력해주세요');
        if (!formData.contact_name) return warning('담당자 이름을 입력해주세요');
        if (!formData.contact_phone) return warning('연락처를 입력해주세요');
        if (!formData.contact_email) return warning('이메일을 입력해주세요');
        if (!formData.preferred_subway) return warning('희망 지하철역을 입력해주세요');
        if (!formData.actual_users) return warning('실사용 인원을 입력해주세요');
        if (!formData.move_in_date) return warning('입주 예정일을 입력해주세요');
        if (formData.selected_brands.length === 0) return warning('최소 1개 이상의 브랜드를 선택해주세요');

        setLoading(true);
        try {
            await proposalRequestAPI.create({
                ...formData,
                actual_users: parseInt(formData.actual_users),
                preferred_capacity: formData.preferred_capacity ? parseInt(formData.preferred_capacity) : null,
                lease_period: parseInt(formData.lease_period),
            });
            success('제안 요청이 성공적으로 발송되었습니다');
            navigate('/proposals/requests');
        } catch (err) {
            console.error('제안 요청 실패:', err);
            error('제안 요청 발송에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto p-8">
                <h1 className="text-2xl font-bold mb-6">제안 요청</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 고객사 정보 */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">고객사 정보</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">고객사명 *</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="(주)패스트매치"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름 *</label>
                                <input
                                    type="text"
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="홍길동"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">담당자 직책</label>
                                <input
                                    type="text"
                                    name="contact_position"
                                    value={formData.contact_position}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="매니저"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                                <input
                                    type="text"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="010-1234-5678"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 입주 조건 */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">입주 조건</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">희망 지하철역 *</label>
                                <input
                                    type="text"
                                    name="preferred_subway"
                                    value={formData.preferred_subway}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="강남역, 역삼역"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">실사용 인원 *</label>
                                <input
                                    type="number"
                                    name="actual_users"
                                    value={formData.actual_users}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">희망 인실</label>
                                <input
                                    type="number"
                                    name="preferred_capacity"
                                    value={formData.preferred_capacity}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="12 (미입력시 실사용 인원 기준)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">임대 기간 (개월) *</label>
                                <select
                                    name="lease_period"
                                    value={formData.lease_period}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="6">6개월</option>
                                    <option value="12">12개월</option>
                                    <option value="24">24개월</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">입주 예정일 *</label>
                                <input
                                    type="date"
                                    name="move_in_date"
                                    value={formData.move_in_date}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">입주 희망 시기 *</label>
                                <select
                                    name="move_in_period"
                                    value={formData.move_in_period}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="early">초 (1~10일)</option>
                                    <option value="mid">중 (11~20일)</option>
                                    <option value="late">말 (21~말일)</option>
                                    <option value="whole">무관</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">추가 요청사항</label>
                                <textarea
                                    name="additional_info"
                                    value={formData.additional_info}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="회의실 필수, 창측 선호 등"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 브랜드 선택 */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2">제안 요청할 브랜드 선택 *</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {brands.map((brand) => (
                                <div
                                    key={brand.id}
                                    onClick={() => handleBrandToggle(brand.id)}
                                    className={`
                    cursor-pointer p-3 rounded-lg border text-center transition
                    ${formData.selected_brands.includes(brand.id)
                                            ? 'bg-blue-50 border-primary-500 text-blue-700 ring-1 ring-primary-500'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'}
                  `}
                                >
                                    <div className="font-medium">{brand.name}</div>
                                </div>
                            ))}
                        </div>
                        {brands.length === 0 && (
                            <div className="text-center text-gray-500 py-4">
                                등록된 브랜드가 없습니다.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                px-6 py-3 bg-primary-500 text-white rounded-lg font-medium transition shadow-sm
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-600'}
              `}
                        >
                            {loading ? '발송 중...' : '제안 요청 보내기'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default ProposalRequestPage;
