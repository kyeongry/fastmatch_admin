export const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('ko-KR').format(price);
};

export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatCategory1 = (category) => {
    const map = {
        exclusive_floor: '전용층',
        separate_floor: '분리층',
        connected_floor: '연층',
        exclusive_room: '전용호실',
        separate_room: '분리호실',
        connected_room: '연접호실',
    };
    return map[category] || category;
};

export const formatCategory2 = (category) => {
    const map = {
        window_side: '창측',
        inner_side: '내측',
    };
    return map[category] || category;
};

export const formatMoveInDate = (type, value) => {
    if (type === 'immediate') return '즉시 입주';
    if (type === 'negotiable') return '협의 가능';
    if (type === 'custom') return value || '날짜 지정';
    return type;
};

export const formatContractPeriod = (type, value) => {
    if (type === 'six_months') return '6개월';
    if (type === 'twelve_months') return '12개월';
    if (type === 'custom') return value || '기간 협의';
    return type;
};

export const formatStatus = (status) => {
    const map = {
        active: '활성',
        completed: '거래완료',
        delete_requested: '삭제요청중',
        deleted: '삭제됨',
        inactive: '비활성',
    };
    return map[status] || status;
};

export const formatRole = (role) => {
    const map = {
        admin: '관리자',
        user: '사용자',
    };
    return map[role] || role;
};

// 숫자 입력값에 쉼표 포맷팅 (입력 필드용)
export const formatNumberInput = (value) => {
    if (!value && value !== 0) return '';
    // 숫자만 추출
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (!numericValue) return '';
    // 쉼표 추가
    return new Intl.NumberFormat('ko-KR').format(numericValue);
};

// 쉼표가 포함된 문자열에서 숫자만 추출
export const parseNumberInput = (value) => {
    if (!value) return '';
    return String(value).replace(/[^\d]/g, '');
};
