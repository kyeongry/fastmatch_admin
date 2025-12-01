import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
    const { user } = useAuth();

    return (
        <Layout>
            <div className="max-w-2xl mx-auto p-8">
                <h1 className="text-2xl font-bold mb-6">내 정보</h1>

                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">이름</label>
                            <div className="text-lg font-medium">{user?.name}</div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
                            <div className="text-lg">{user?.email}</div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
                            <div className="text-lg">{user?.phone || '-'}</div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">계정 유형</label>
                            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                {user?.role === 'admin' ? '관리자' : '사용자'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                            비밀번호 변경
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;
