import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { proposalRequestAPI, brandAPI } from '../../services/api';

const ProposalRequestCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
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
        lease_period: '6',
        lease_period_custom: '',
        additional_info: '',
        selected_brands: []
    });

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            const response = await brandAPI.getAll();
            setBrands(response.data.brands || response.data || []);
        } catch (error) {
            console.error('브랜드 조회 실패:', error);
            alert('브랜드 목록을 불러오는데 실패했습니다');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBrandChange = (brandId) => {
        setFormData(prev => ({
            ...prev,
            selected_brands: prev.selected_brands.includes(brandId)
                ? prev.selected_brands.filter(id => id !== brandId)
                : [...prev.selected_brands, brandId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 필수 필드 검증
        if (!formData.company_name || !formData.contact_name || !formData.contact_phone ||
            !formData.contact_email || !formData.preferred_subway || !formData.actual_users ||
            !formData.move_in_date) {
            alert('필수 필드를 모두 입력해주세요');
            return;
        }

        // 임대 기간 검증
        const finalLeasePeriod = formData.lease_period === 'custom'
            ? formData.lease_period_custom
            : formData.lease_period;

        if (!finalLeasePeriod || finalLeasePeriod <= 0) {
            alert('임대 기간을 입력해주세요');
            return;
        }

        if (formData.selected_brands.length === 0) {
            alert('최소 1개 이상의 브랜드를 선택해주세요');
            return;
        }

        // 발송 전 확인
        const selectedBrandNames = brands
            .filter(b => formData.selected_brands.includes(b._id?.toString() || b.id))
            .map(b => b.name)
            .join(', ');

        if (!window.confirm(`선택한 브랜드(${selectedBrandNames})에 제안 요청을 발송하시겠습니까?`)) {
            return;
        }

        try {
            setLoading(true);
            const submitData = {
                ...formData,
                lease_period: finalLeasePeriod
            };
            const response = await proposalRequestAPI.create(submitData);

            if (response.data.success) {
                // 부분 성공 케이스 처리
                if (response.data.partial) {
                    alert(response.data.message);
                } else {
                    alert('제안 요청이 성공적으로 발송되었습니다!');
                }
                navigate('/requests');
            }
        } catch (error) {
            console.error('제안 요청 생성 실패:', error);
            const errorMessage = error.response?.data?.message || error.message;
            alert('제안 요청 발송에 실패했습니다:\n' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">제안 요청 생성</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        브랜드 매니저에게 제안 요청 이메일을 발송합니다
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
                    {/* 고객사 정보 */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">고객사 정보</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    고객사명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    담당자명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    직책
                                </label>
                                <input
                                    type="text"
                                    name="contact_position"
                                    value={formData.contact_position}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    연락처 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="010-0000-0000"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    이메일 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 요구사항 */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">요구사항</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    희망 지하철역 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="preferred_subway"
                                    value={formData.preferred_subway}
                                    onChange={handleChange}
                                    required
                                    placeholder="예: 강남역, 선릉역"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    실사용 인원 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="actual_users"
                                    value={formData.actual_users}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    희망 인실
                                </label>
                                <input
                                    type="number"
                                    name="preferred_capacity"
                                    value={formData.preferred_capacity}
                                    onChange={handleChange}
                                    min="1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    입주 예정일 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="move_in_date"
                                    value={formData.move_in_date}
                                    onChange={handleChange}
                                    required
                                    placeholder="예: 2025년 3월"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    입주 기간 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="move_in_period"
                                    value={formData.move_in_period}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="early">초순</option>
                                    <option value="mid">중순</option>
                                    <option value="late">하순</option>
                                    <option value="whole">전체</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    임대 기간 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="lease_period"
                                    value={formData.lease_period}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="6">6개월</option>
                                    <option value="12">12개월</option>
                                    <option value="custom">직접 입력</option>
                                </select>
                                {formData.lease_period === 'custom' && (
                                    <input
                                        type="number"
                                        name="lease_period_custom"
                                        value={formData.lease_period_custom}
                                        onChange={handleChange}
                                        placeholder="개월 수 입력"
                                        min="1"
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700">
                                추가 정보
                            </label>
                            <textarea
                                name="additional_info"
                                value={formData.additional_info}
                                onChange={handleChange}
                                rows={4}
                                placeholder="기타 요구사항이나 추가 정보를 입력해주세요"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* 브랜드 선택 */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            제안 요청 브랜드 선택 <span className="text-red-500">*</span>
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            제안 요청을 받을 브랜드를 선택하세요 (중복 선택 가능)
                        </p>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {brands.map(brand => (
                                <label
                                    key={brand._id || brand.id}
                                    className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.selected_brands.includes(brand._id?.toString() || brand.id)}
                                        onChange={() => handleBrandChange(brand._id?.toString() || brand.id)}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-900">
                                        {brand.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/requests')}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400"
                        >
                            {loading ? '발송 중...' : '제안 요청 발송'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default ProposalRequestCreate;
