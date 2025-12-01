# 🎯 FASTMATCH 빠른 참조 가이드

> **목적**: AI 코딩시 빠르게 참조할 수 있는 핵심 정보 요약  
> **사용법**: 개발 중 궁금한 사항을 즉시 찾아볼 수 있는 치트시트

---

## 📌 핵심 원칙

### 절대 변경 금지
1. ❌ MongoDB 컬렉션 스키마 (User, Option, Brand, etc.)
2. ❌ API 엔드포인트 URL 구조
3. ❌ 파일/디렉토리 구조
4. ❌ 비즈니스 로직 (삭제 요청, 이메일 발송, 3-Step 회원가입)
5. ❌ 인증/권한 체크 방식 (JWT + MongoDB)

### 필수 준수
1. ✅ 모든 API에 에러 처리
2. ✅ 모든 비동기 작업에 로딩 상태
3. ✅ 모든 입력에 유효성 검증
4. ✅ 보호된 라우트에 authMiddleware
5. ✅ Admin 기능에 adminMiddleware

---

## 🗄️ 데이터베이스 핵심 (MongoDB)

### 주요 컬렉션 관계
```
User → Option (creator_id)
User → ProposalRequest (requester_id)
Brand → Manager (brand_id)
Brand → Branch (brand_id)
Branch → Option (branch_id)
Option → DeleteRequest (option_id)
ProposalRequest → ProposalSendHistory (proposal_id)
```

### MongoDB 컬렉션 구조

**users**
- `_id`: ObjectId
- `email`: String (unique)
- `password_hash`: String (bcrypt)
- `name`: String
- `phone`: String
- `role`: 'user' | 'admin'
- `email_verified`: Boolean
- `is_smatch_domain`: Boolean (@smatch.kr 여부)
- `status`: 'active' | 'inactive' | 'suspended'
- `created_at`: Date
- `last_login`: Date

**options**
- `_id`: ObjectId
- `branch_id`: ObjectId
- `name`: String
- `status`: 'active' | 'delete_requested' | 'deleted'
- `one_time_fees`: Array<{name, amount}>
- `creator_id`: ObjectId (수정 권한 체크용)
- `created_at`: Date
- `updated_at`: Date

**proposals**
- `_id`: ObjectId
- `requester_id`: ObjectId
- `selected_brands`: Array<ObjectId>
- `send_status`: 'sending' | 'sent' | 'failed'
- `created_at`: Date

**proposal_send_history**
- `_id`: ObjectId
- `proposal_id`: ObjectId
- `send_type`: 'initial' | 'additional' | 'modified'
- `created_at`: Date

### 메모리 기반 인증 코드 저장
- 메모리 Map: `verificationCodes`
- 구조: `{ email: { code, expiresAt, verified } }`
- TTL: 10분 (자동 삭제)

---

## 🔌 API 엔드포인트 요약

### 인증 (3-Step Registration Flow)
```
POST   /api/auth/register
       { email }
       → 인증 코드 발송 (Step 1)

POST   /api/auth/verify-email
       { email, code }
       → 코드 검증 (Step 2)

POST   /api/auth/verify-email
       { email, code, name, phone, password }
       → 회원가입 완료 & 자동 로그인 (Step 3)

POST   /api/auth/login             로그인
       { email, password }

POST   /api/auth/logout            로그아웃 (🔒)

POST   /api/auth/refresh           토큰 갱신
       { refreshToken }

GET    /api/auth/me                현재 사용자 정보 (🔒)
```

### 브랜드 (🔒 = 인증 필요, 👑 = Admin 전용)
```
GET    /api/brands                 목록 (🔒)
POST   /api/brands                 생성 (🔒👑)
GET    /api/brands/:id             상세 (🔒)
PUT    /api/brands/:id             수정 (🔒👑)
DELETE /api/brands/:id             삭제 (🔒👑)
```

### 옵션
```
GET    /api/options                목록 (🔒)
POST   /api/options                생성 (🔒)
GET    /api/options/:id            상세 (🔒)
PUT    /api/options/:id            수정 (🔒 본인/Admin)
DELETE /api/options/:id            삭제요청 (🔒 본인)
GET    /api/options/my             내 옵션 (🔒)
```

### 제안 요청
```
POST   /api/proposals/requests               생성 (🔒)
GET    /api/proposals/requests/:id           상세 (🔒)
POST   /api/proposals/requests/:id/add       추가 발송 (🔒)
POST   /api/proposals/requests/:id/modify    변경 발송 (🔒)
```

### 삭제 요청
```
GET    /api/delete-requests                  목록 (🔒👑)
POST   /api/delete-requests/:id/approve      승인 (🔒👑)
POST   /api/delete-requests/:id/reject       거부 (🔒👑)
```

---

## 🔐 권한 체크 패턴

### 옵션 수정 권한
```javascript
// 본인 또는 Admin만 수정 가능
if (option.creator_id !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({ 
    success: false, 
    message: '권한이 없습니다' 
  });
}
```

### 제안 요청 조회 권한
```javascript
// 본인 또는 Admin만 조회 가능
if (proposal.requester_id !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({ 
    success: false, 
    message: '권한이 없습니다' 
  });
}
```

---

## 📧 이메일 발송 핵심

### 이메일 구조
```javascript
await emailService.sendEmail({
  from: 'noreply@fastmatch.kr',
  to: manager.email,                    // 브랜드 매니저
  cc: [
    manager.cc_email,                    // 매니저 참조메일
    requester.email,                     // User 이메일 (본인도 받음)
    'official@fastmatch.kr'              // 고정 참조
  ].filter(Boolean),
  replyTo: requester.email,              // ⭐ 회신이 User에게 직접 전달
  subject: emailService.generateSubject(proposal),
  html: emailService.generateTemplate({ manager, proposal, requester }),
});
```

### 발송 유형
1. **최초 발송**: 제안 요청 생성시
2. **추가 발송**: 기존 요청에 브랜드 추가시
3. **변경 발송**: 조건 변경시 기존 브랜드에게 재발송
   - 제목에 `[변경]` 추가
   - 본문에 변경 안내 추가

---

## 🗑️ 삭제 요청 워크플로우

### User가 삭제 요청
```javascript
// 1. DeleteRequest 생성
await prisma.deleteRequest.create({
  option_id, requester_id, request_reason, status: 'pending'
});

// 2. Option 상태 변경
await prisma.option.update({
  where: { id: option_id },
  data: { status: 'delete_requested' }
});
```

### Admin이 승인
```javascript
// 트랜잭션으로 처리
await prisma.$transaction([
  prisma.deleteRequest.update({
    where: { id },
    data: { status: 'approved', processed_at: new Date(), processor_id }
  }),
  prisma.option.update({
    where: { id: option_id },
    data: { status: 'deleted' }
  })
]);
```

### Admin이 거부
```javascript
// 트랜잭션으로 처리
await prisma.$transaction([
  prisma.deleteRequest.update({
    where: { id },
    data: { status: 'rejected', process_reason, processed_at: new Date(), processor_id }
  }),
  prisma.option.update({
    where: { id: option_id },
    data: { status: 'active' }  // 복구
  })
]);
```

---

## 🎨 프론트엔드 패턴

### API 호출 패턴
```jsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await someAPI.getAll();
      setData(response.data);
    } catch (error) {
      setError(error.message);
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, [dependencies]);
```

### 폼 제출 패턴
```jsx
const [formData, setFormData] = useState({});
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 유효성 검증
  if (!validateForm(formData)) {
    showToast('필수 항목을 입력해주세요', 'error');
    return;
  }
  
  setSubmitting(true);
  try {
    await someAPI.create(formData);
    showToast('성공적으로 생성되었습니다', 'success');
    navigate('/list');
  } catch (error) {
    showToast('생성에 실패했습니다', 'error');
    console.error('생성 실패:', error);
  } finally {
    setSubmitting(false);
  }
};
```

### 모달 패턴
```jsx
const [isOpen, setIsOpen] = useState(false);
const [modalData, setModalData] = useState(null);

const openModal = (data) => {
  setModalData(data);
  setIsOpen(true);
};

const closeModal = () => {
  setIsOpen(false);
  setModalData(null);
};

return (
  <>
    <button onClick={() => openModal(someData)}>열기</button>
    {isOpen && (
      <Modal onClose={closeModal}>
        {/* 모달 내용 */}
      </Modal>
    )}
  </>
);
```

---

## 🛠️ 자주 사용하는 유틸리티

### 날짜 포맷팅
```javascript
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};
```

### 숫자 포맷팅 (천원 단위 콤마)
```javascript
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
```

### 전화번호 포맷팅
```javascript
const formatPhone = (phone) => {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
};
```

### 이메일 검증
```javascript
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
```

---

## 🔍 검색/필터 구현

### 백엔드 (Prisma)
```javascript
const getOptions = async (filters) => {
  const { brand_id, branch_id, status, search, sort } = filters;
  
  const where = {
    ...(brand_id && { branch: { brand_id } }),
    ...(branch_id && { branch_id }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { branch: { name: { contains: search, mode: 'insensitive' } } },
        { branch: { brand: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    })
  };
  
  const orderBy = sort === 'latest' ? { created_at: 'desc' }
                 : sort === 'oldest' ? { created_at: 'asc' }
                 : sort === 'price_low' ? { monthly_fee: 'asc' }
                 : { monthly_fee: 'desc' };
  
  return prisma.option.findMany({
    where,
    orderBy,
    include: {
      branch: { include: { brand: true } },
      creator: true
    }
  });
};
```

### 프론트엔드
```jsx
const [filters, setFilters] = useState({
  brands: [],
  branches: [],
  search: '',
  sort: 'latest'
});

useEffect(() => {
  fetchOptions();
}, [filters]);

const handleFilterChange = (key, value) => {
  setFilters(prev => ({ ...prev, [key]: value }));
};
```

---

## 🖼️ 파일 업로드 (Cloudinary)

### 백엔드
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: process.env.CLOUDINARY_FOLDER,
  });
  return result.secure_url;
};
```

### 프론트엔드
```jsx
const [selectedFile, setSelectedFile] = useState(null);
const [uploading, setUploading] = useState(false);

const handleFileChange = (e) => {
  setSelectedFile(e.target.files[0]);
};

const handleUpload = async () => {
  if (!selectedFile) return;
  
  setUploading(true);
  try {
    const response = await uploadAPI.image(selectedFile);
    const imageUrl = response.data.image_url;
    // imageUrl 사용
  } catch (error) {
    console.error('업로드 실패:', error);
  } finally {
    setUploading(false);
  }
};
```

---

## 🗺️ 외부 API 연동

### KakaoMap 주소 검색
```javascript
const searchAddress = async (address) => {
  const response = await axios.get(
    'https://dapi.kakao.com/v2/local/search/address.json',
    {
      params: { query: address },
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` }
    }
  );
  
  const { x, y, address_name } = response.data.documents[0];
  
  // 가장 가까운 지하철역 검색
  const subwayResponse = await axios.get(
    'https://dapi.kakao.com/v2/local/search/keyword.json',
    {
      params: { query: '지하철역', x, y, radius: 1000 },
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` }
    }
  );
  
  const subway = subwayResponse.data.documents[0];
  
  return {
    address: address_name,
    latitude: parseFloat(y),
    longitude: parseFloat(x),
    nearest_subway: subway.place_name,
    walking_distance: Math.round(subway.distance / 80) // 도보시간 (분)
  };
};
```

---

## 🐛 에러 처리 패턴

### 백엔드
```javascript
// error.middleware.js
const errorMiddleware = (err, req, res, next) => {
  console.error(err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 오류가 발생했습니다';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
};
```

### 프론트엔드
```jsx
try {
  // API 호출
} catch (error) {
  if (error.response) {
    // 서버가 응답을 반환한 경우
    const message = error.response.data.message || '오류가 발생했습니다';
    showToast(message, 'error');
  } else if (error.request) {
    // 요청이 전송되었으나 응답을 받지 못한 경우
    showToast('서버와 연결할 수 없습니다', 'error');
  } else {
    // 요청 설정 중 오류가 발생한 경우
    showToast('요청 처리 중 오류가 발생했습니다', 'error');
  }
  console.error('에러:', error);
}
```

---

## 📱 반응형 Tailwind 클래스

### 컨테이너
```jsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
```

### 그리드
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 폰트 크기
```jsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
```

### 간격
```jsx
<div className="p-4 sm:p-6 lg:p-8">
```

### 숨김/표시
```jsx
<div className="hidden sm:block">  {/* 모바일에서 숨김 */}
<div className="block sm:hidden">  {/* 모바일에서만 표시 */}
```

---

## 🎯 자주 발생하는 실수

### ❌ 잘못된 예시
```javascript
// 1. 에러 처리 없음
const data = await someAPI.getAll();

// 2. 로딩 상태 없음
setData(response.data);

// 3. 권한 체크 없음
await prisma.option.update({ ... });

// 4. 유효성 검증 없음
await createOption(req.body);

// 5. 트랜잭션 없음 (여러 테이블 수정시)
await prisma.deleteRequest.update({ ... });
await prisma.option.update({ ... });
```

### ✅ 올바른 예시
```javascript
// 1. 에러 처리
try {
  const data = await someAPI.getAll();
} catch (error) {
  console.error('조회 실패:', error);
}

// 2. 로딩 상태
setLoading(true);
try {
  const response = await someAPI.getAll();
  setData(response.data);
} finally {
  setLoading(false);
}

// 3. 권한 체크
if (option.creator_id !== userId && role !== 'admin') {
  throw new Error('권한이 없습니다');
}
await prisma.option.update({ ... });

// 4. 유효성 검증
if (!validateOption(data)) {
  throw new Error('유효하지 않은 데이터입니다');
}
await createOption(data);

// 5. 트랜잭션
await prisma.$transaction([
  prisma.deleteRequest.update({ ... }),
  prisma.option.update({ ... })
]);
```

---

## 🚀 배포 체크리스트

### 환경 변수
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] EMAIL 설정
- [ ] CLOUDINARY 설정
- [ ] KAKAO_REST_API_KEY
- [ ] BUILDING_REGISTRY_API_KEY
- [ ] CORS_ORIGIN

### 데이터베이스
- [ ] Prisma 마이그레이션 실행
- [ ] Admin 계정 생성
- [ ] 테스트 데이터 생성 (선택)

### 빌드
- [ ] 백엔드: npm start
- [ ] 프론트엔드: npm run build

### 최종 확인
- [ ] 모든 API 엔드포인트 테스트
- [ ] 권한 체크 테스트
- [ ] 이메일 발송 테스트
- [ ] 파일 업로드 테스트
- [ ] 외부 API 연동 테스트

---

## 📚 문서 참조

### 상세 정보가 필요할 때
1. **FASTMATCH_개발_마스터_가이드.md**: 전체 구조 및 명세
2. **FASTMATCH_단계별_개발_가이드.md**: Phase별 개발 순서
3. **이 문서**: 빠른 참조

### AI에게 요청시 템플릿
```markdown
## 요청 사항
[구체적인 작업 설명]

## 참조 문서
- 빠른 참조 가이드: [해당 섹션]
- 마스터 가이드: Section X.X

## 준수 사항
- 데이터베이스 스키마 변경 금지
- API 엔드포인트 명세 준수
- 에러 처리 필수
- 로딩 상태 관리 필수
```

---

**이 문서를 개발 중 자주 참조하세요!**  
**궁금한 사항이 있으면 Ctrl+F로 검색하세요.**

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2024-11-20
