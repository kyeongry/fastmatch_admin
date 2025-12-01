# 🚀 FASTMATCH 단계별 개발 가이드 (AI 바이브코딩용)

> **목적**: Claude Code가 순차적으로 개발할 수 있도록 각 단계별 구체적인 지시사항 제공  
> **사용법**: 각 Phase를 순서대로 AI에게 요청하고, 완료 후 다음 Phase로 진행

---

## 📋 전체 개발 로드맵

```
Phase 1: 프로젝트 초기 설정 (1-2시간)
  ├── 1.1 백엔드 프로젝트 초기화
  ├── 1.2 프론트엔드 프로젝트 초기화
  └── 1.3 데이터베이스 설정

Phase 2: 백엔드 인증 시스템 (2-3시간)
  ├── 2.1 MongoDB 설정
  ├── 2.2 인증 미들웨어
  ├── 2.3 회원가입/이메일 인증
  └── 2.4 로그인/로그아웃

Phase 3: 백엔드 브랜드 관리 (2-3시간)
  ├── 3.1 Brand CRUD
  ├── 3.2 Manager CRUD
  └── 3.3 Branch CRUD

Phase 4: 백엔드 옵션 관리 (3-4시간)
  ├── 4.1 Option CRUD
  ├── 4.2 옵션 검색/필터링
  └── 4.3 삭제 요청 시스템

Phase 5: 백엔드 제안 시스템 (4-5시간)
  ├── 5.1 제안 요청 생성
  ├── 5.2 이메일 발송 로직
  ├── 5.3 추가/변경 제안 요청
  └── 5.4 제안서 PDF 생성

Phase 6: 백엔드 부가 기능 (2-3시간)
  ├── 6.1 파일 업로드 (Cloudinary)
  ├── 6.2 외부 API 연동
  └── 6.3 관리자 대시보드

Phase 7: 프론트엔드 인증 (2-3시간)
  ├── 7.1 AuthContext 구현
  ├── 7.2 Login 페이지
  ├── 7.3 Register/VerifyEmail 페이지
  └── 7.4 ProtectedRoute

Phase 8: 프론트엔드 메인 페이지 (4-5시간)
  ├── 8.1 레이아웃 구조
  ├── 8.2 옵션 목록 표시
  ├── 8.3 검색/필터 기능
  └── 8.4 옵션 상세 슬라이드

Phase 9: 프론트엔드 옵션 관리 (3-4시간)
  ├── 9.1 옵션 등록 페이지
  ├── 9.2 옵션 수정 페이지
  └── 9.3 옵션 삭제 요청

Phase 10: 프론트엔드 제안 시스템 (4-5시간)
  ├── 10.1 제안 요청 페이지
  ├── 10.2 제안 요청 관리
  ├── 10.3 추가/변경 제안
  └── 10.4 제안서 생성

Phase 11: 프론트엔드 관리자 (3-4시간)
  ├── 11.1 관리자 대시보드
  ├── 11.2 브랜드/매니저/지점 관리
  └── 11.3 삭제 요청 관리

Phase 12: 최종 테스트 및 배포 (2-3시간)
  ├── 12.1 통합 테스트
  ├── 12.2 버그 수정
  └── 12.3 배포 준비
```

---

## Phase 1: 프로젝트 초기 설정

### 1.1 백엔드 프로젝트 초기화

**AI에게 요청:**
```markdown
## 요청 사항
FASTMATCH 백엔드 프로젝트를 초기화해주세요.

## 디렉토리 구조
fastmatch/backend/ 디렉토리를 생성하고 다음 구조로 설정:
- src/
  - routes/
  - controllers/
  - services/
  - middlewares/
  - utils/
  - config/
  - prisma/
  - server.js
- package.json
- .env.example
- .gitignore

## 필요한 패키지
npm install express cors helmet morgan dotenv
npm install bcryptjs jsonwebtoken
npm install mongodb
npm install nodemailer
npm install cloudinary
npm install axios

npm install -D nodemon

## package.json scripts
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}

## .env.example 파일
마스터 가이드 Section 2.3의 환경 변수 템플릿 사용

## server.js
마스터 가이드 Section 5.2의 서버 진입점 코드 사용
```

**완료 확인:**
- [ ] `fastmatch/backend/` 디렉토리 생성됨
- [ ] `package.json` 파일 생성 및 패키지 설치됨
- [ ] `.env.example` 파일 생성됨
- [ ] 디렉토리 구조 생성됨
- [ ] `src/server.js` 파일 생성됨

---

### 1.2 프론트엔드 프로젝트 초기화

**AI에게 요청:**
```markdown
## 요청 사항
FASTMATCH 프론트엔드 프로젝트를 Vite + React로 초기화해주세요.

## 프로젝트 생성
cd fastmatch
npm create vite@latest frontend -- --template react
cd frontend
npm install

## 추가 패키지 설치
npm install react-router-dom axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

## 디렉토리 구조
src/ 디렉토리를 마스터 가이드 Section 6.1의 구조대로 생성:
- components/
  - common/
  - main/
  - admin/
- pages/
  - auth/
  - main/
  - options/
  - proposals/
  - admin/
- hooks/
- context/
- services/
- utils/

## tailwind.config.js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]

## .env.example
VITE_API_BASE_URL=http://localhost:5000/api
```

**완료 확인:**
- [ ] `fastmatch/frontend/` 디렉토리 생성됨
- [ ] Vite + React 프로젝트 생성됨
- [ ] 필요한 패키지 설치됨
- [ ] Tailwind CSS 설정됨
- [ ] 디렉토리 구조 생성됨

---

### 1.3 데이터베이스 설정

**AI에게 요청:**
```markdown
## 요청 사항
MongoDB 데이터베이스를 설정해주세요.

## MongoDB 선택지
1. MongoDB Atlas (클라우드) - 권장
   - https://www.mongodb.com/cloud/atlas
   - 클러스터 생성
   - 연결 문자열 복사

2. MongoDB 로컬 설치 (개발용)
   - https://www.mongodb.com/try/download/community

## 패키지 설치
cd backend
npm install mongodb

## .env 설정
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/fastmatch?retryWrites=true&w=majority"

또는 로컬의 경우:
MONGODB_URI="mongodb://localhost:27017/fastmatch"

## MongoDB 초기 설정
- 데이터베이스명: fastmatch
- Collections는 코드에서 자동 생성됨

## 테스트 데이터 생성 (선택)
Admin 계정 생성을 위한 seed 스크립트 작성
```

**완료 확인:**
- [ ] MongoDB 연결 설정 완료
- [ ] `.env` 파일에 MONGODB_URI 설정됨
- [ ] 데이터베이스 연결 테스트 완료
- [ ] Admin 테스트 계정 생성됨

---

## Phase 2: 백엔드 인증 시스템

### 2.1 MongoDB 설정 & 유틸리티 구현

**AI에게 요청:**
```markdown
## 요청 사항
MongoDB 연결을 설정하고 인증 관련 미들웨어를 구현해주세요.

## 파일 생성
1. src/config/mongodb.js
   - MongoDB 연결 설정
   - 데이터베이스 풀 관리
   - 재연결 로직

2. src/models/user.mongodb.js
   - User 컬렉션 CRUD 함수
   - findByEmail, findById, create, update, delete 등

3. src/middlewares/auth.middleware.js
   - JWT 토큰 검증
   - req.user에 사용자 정보 저장

4. src/middlewares/admin.middleware.js
   - Admin 권한 체크

5. src/middlewares/error.middleware.js
   - 전역 에러 핸들러
   - 에러 로깅
   - 클라이언트 친화적 에러 응답

6. src/middlewares/validation.middleware.js
   - 입력 검증 미들웨어 (이메일, 비밀번호 등)

## MongoDB 연결 구조
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('fastmatch');

## 에러 핸들러 구조
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 (개발 환경에서만)"
}
```

**완료 확인:**
- [ ] `src/config/mongodb.js` 생성됨
- [ ] `src/models/user.mongodb.js` 생성됨
- [ ] `auth.middleware.js` 생성됨
- [ ] `admin.middleware.js` 생성됨
- [ ] `error.middleware.js` 생성됨
- [ ] `validation.middleware.js` 생성됨
- [ ] MongoDB 연결 테스트 완료

---

### 2.2 인증 Service 구현 (3-Step Registration Flow)

**AI에게 요청:**
```markdown
## 요청 사항
인증 관련 비즈니스 로직을 구현해주세요.

## 파일 생성
1. src/services/auth.service.js
2. src/services/email.service.js

## auth.service.js 구현 함수

### Step 1: 이메일 입력 & 인증 코드 발송
1. register({ email })
   - 이메일 중복 체크 (MongoDB)
   - 6자리 인증 코드 생성
   - 인증 코드를 메모리 Map에 저장 (10분 TTL)
   - 이메일로 인증 코드 발송
   - Response: { message, email }

### Step 2: 인증 코드 검증
2. verifyEmail(email, code)
   - 메모리에서 인증 코드 확인
   - 코드 비교 및 만료 시간 체크
   - 인증 완료 표시 (verified: true)
   - Response: { message, email }

### Step 3: 회원정보 입력 & 사용자 생성
3. completeRegistration({ email, name, phone, password })
   - 이메일 인증 여부 확인
   - MongoDB에 새로운 User 생성
   - 비밀번호는 bcrypt로 해싱
   - is_smatch_domain 자동 설정 (@smatch.kr 여부)
   - JWT 토큰 생성 (7일)
   - Refresh 토큰 생성 (30일)
   - Response: { token, refreshToken, user }

### 인증 & 로그인
4. login(email, password)
   - 사용자 조회 (MongoDB)
   - email_verified 확인
   - 비밀번호 검증 (bcrypt)
   - JWT 토큰 생성
   - last_login 업데이트
   - Response: { token, refreshToken, user }

5. getCurrentUser(userId)
   - MongoDB에서 사용자 조회
   - 사용자 정보 반환

### 유틸리티
6. generateVerificationCode()
   - 6자리 숫자 코드 생성
   - Math.random() 사용

7. generateToken(userId)
   - JWT Access Token 생성 (7일)
   - payload: { userId }

8. generateRefreshToken(userId)
   - JWT Refresh Token 생성 (30일)
   - payload: { userId }

## 메모리 기반 인증 코드 저장
const verificationCodes = new Map();

verificationCodes.set(email, {
  code: '123456',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  verified: false
});

// 10분 후 자동 삭제
setTimeout(() => verificationCodes.delete(email), 10 * 60 * 1000);

## email.service.js
1. sendVerificationEmail(email, code)
   - Nodemailer로 이메일 발송
   - 템플릿에 코드 포함
```

**완료 확인:**
- [ ] `auth.service.js` 생성됨
- [ ] `email.service.js` 생성됨
- [ ] 3-step 인증 흐름 구현됨
- [ ] bcrypt로 비밀번호 해싱됨
- [ ] JWT 토큰 생성 로직 구현됨
- [ ] 이메일 발송 로직 구현됨
- [ ] 메모리 기반 인증 코드 관리 구현됨

---

### 2.3 인증 Controller & Routes 구현 (3-Step Flow)

**AI에게 요청:**
```markdown
## 요청 사항
인증 API의 Controller와 Routes를 구현해주세요.

## 파일 생성
1. src/controllers/auth.controller.js
2. src/routes/auth.routes.js

## Controller 함수 (3-Step Flow 지원)

### Step 1: 이메일 입력 & 인증 코드 발송
1. register(req, res)
   - Request: { email }
   - authService.register() 호출
   - Response: { success, message, email }

### Step 2: 인증 코드 검증
2. verifyEmail(req, res)
   - Request: { email, code } (회원가입 완료시 name, phone, password 포함)
   - 코드만 검증하면 authService.verifyEmail() 호출
   - 회원정보까지 있으면 authService.completeRegistration() 호출
   - Response:
     - 코드만 검증: { success, message, email }
     - 회원가입 완료: { success, message, token, refreshToken, user }

### Step 3: 회원가입 또는 로그인
3. login(req, res)
   - Request: { email, password }
   - authService.login() 호출
   - Response: { success, token, refreshToken, user }

### 추가 기능
4. logout(req, res)
   - 클라이언트에서 토큰 삭제 유도 (JWT는 stateless)
   - Response: { success, message }

5. me(req, res)
   - 인증된 사용자 정보 반환
   - Response: { success, user }

6. refresh(req, res)
   - Refresh Token으로 Access Token 갱신
   - Response: { success, token }

## Routes 구조
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/login
POST   /api/auth/logout (authMiddleware 적용)
POST   /api/auth/refresh
GET    /api/auth/me (authMiddleware 적용)

## 클라이언트 플로우
1. POST /api/auth/register { email } → 인증 코드 발송
2. POST /api/auth/verify-email { email, code } → 코드 검증 (Step 2)
3. POST /api/auth/verify-email { email, code, name, phone, password } → 회원가입 완료 & 자동 로그인
```

**완료 확인:**
- [ ] `auth.controller.js` 생성됨
- [ ] `auth.routes.js` 생성됨
- [ ] 3-step 인증 플로우 구현됨
- [ ] 에러 처리 적용됨
- [ ] `server.js`에 라우트 연결됨

---

## Phase 3: 백엔드 브랜드 관리

### 3.1 Brand CRUD 구현

**AI에게 요청:**
```markdown
## 요청 사항
Brand CRUD API를 구현해주세요.

## 파일 생성
1. src/services/brand.service.js
2. src/controllers/brand.controller.js
3. src/routes/brand.routes.js

## Service 함수
1. getAllBrands(filters)
   - status, search 필터 지원
   - manager, branch 카운트 포함

2. getBrandById(id)
   - 브랜드 상세 정보
   - managers, branches 포함

3. createBrand(data, creatorId)
   - 중복 체크
   - 브랜드 생성

4. updateBrand(id, data, updaterId)
   - 브랜드 수정

5. deleteBrand(id)
   - 브랜드 삭제 (관련 manager, branch, option도 cascade 삭제)

6. checkDuplicate(name)
   - 브랜드명 중복 체크

7. getAvailableBrandsForAddition(proposalId)
   - 제안 요청에 추가 가능한 브랜드 목록
   - 이미 발송한 브랜드 제외

## Routes 구조
GET    /api/brands (authMiddleware)
POST   /api/brands (authMiddleware + adminMiddleware)
GET    /api/brands/:id (authMiddleware)
PUT    /api/brands/:id (authMiddleware + adminMiddleware)
DELETE /api/brands/:id (authMiddleware + adminMiddleware)
POST   /api/brands/check-duplicate (authMiddleware + adminMiddleware)
GET    /api/brands/available-for-addition (authMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.2
- Prisma Schema: 마스터 가이드 Section 3.2
```

**완료 확인:**
- [ ] `brand.service.js` 생성됨
- [ ] `brand.controller.js` 생성됨
- [ ] `brand.routes.js` 생성됨
- [ ] 모든 엔드포인트 구현됨
- [ ] Admin 권한 체크 적용됨

---

### 3.2 Manager CRUD 구현

**AI에게 요청:**
```markdown
## 요청 사항
Manager CRUD API를 구현해주세요.

## 파일 생성
1. src/services/manager.service.js
2. src/controllers/manager.controller.js
3. src/routes/manager.routes.js

## Service 함수
1. getAllManagers(filters)
   - brand_id, search 필터 지원
   - brand 정보 포함

2. getManagerById(id)
   - 매니저 상세 정보
   - brand 정보 포함

3. createManager(data, creatorId)
   - 매니저 생성
   - brand_id 유효성 체크

4. updateManager(id, data, updaterId)
   - 매니저 수정

5. deleteManager(id)
   - 매니저 삭제

## Routes 구조
GET    /api/managers (authMiddleware)
POST   /api/managers (authMiddleware + adminMiddleware)
GET    /api/managers/:id (authMiddleware)
PUT    /api/managers/:id (authMiddleware + adminMiddleware)
DELETE /api/managers/:id (authMiddleware + adminMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.3
```

**완료 확인:**
- [ ] `manager.service.js` 생성됨
- [ ] `manager.controller.js` 생성됨
- [ ] `manager.routes.js` 생성됨
- [ ] 모든 엔드포인트 구현됨

---

### 3.3 Branch CRUD 구현

**AI에게 요청:**
```markdown
## 요청 사항
Branch CRUD API를 구현해주세요.

## 파일 생성
1. src/services/branch.service.js
2. src/controllers/branch.controller.js
3. src/routes/branch.routes.js

## Service 함수
1. getAllBranches(filters)
   - brand_id, status 필터 지원
   - brand 정보 포함
   - option 카운트 포함

2. getBranchById(id)
   - 지점 상세 정보
   - brand, options 포함

3. createBranch(data, creatorId)
   - 지점 생성
   - brand_id 유효성 체크

4. updateBranch(id, data, updaterId)
   - 지점 수정

5. deleteBranch(id)
   - 지점 삭제 (관련 option도 cascade 삭제)

## Routes 구조
GET    /api/branches (authMiddleware)
POST   /api/branches (authMiddleware + adminMiddleware)
GET    /api/branches/:id (authMiddleware)
PUT    /api/branches/:id (authMiddleware + adminMiddleware)
DELETE /api/branches/:id (authMiddleware + adminMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.4
```

**완료 확인:**
- [ ] `branch.service.js` 생성됨
- [ ] `branch.controller.js` 생성됨
- [ ] `branch.routes.js` 생성됨
- [ ] 모든 엔드포인트 구현됨

---

## Phase 4: 백엔드 옵션 관리

### 4.1 Option CRUD 구현

**AI에게 요청:**
```markdown
## 요청 사항
Option CRUD API를 구현해주세요.

## 파일 생성
1. src/services/option.service.js
2. src/controllers/option.controller.js
3. src/routes/option.routes.js

## Service 함수
1. getAllOptions(filters, pagination)
   - brand_id, branch_id, status, search 필터 지원
   - 정렬: latest, oldest, price_low, price_high
   - 페이지네이션
   - branch, brand, creator 정보 포함

2. getOptionById(id)
   - 옵션 상세 정보
   - branch, brand, manager, creator 정보 포함

3. createOption(data, creatorId)
   - 옵션 생성
   - branch_id 유효성 체크
   - one_time_fees는 JSON 배열로 저장

4. updateOption(id, data, updaterId, userRole)
   - 권한 체크: 본인 또는 Admin만 수정 가능
   - 옵션 수정

5. requestDelete(id, reason, requesterId)
   - 권한 체크: 본인만 삭제 요청 가능
   - 옵션 상태를 'delete_requested'로 변경
   - DeleteRequest 레코드 생성

6. getMyOptions(userId)
   - 내가 등록한 옵션 목록

## Routes 구조
GET    /api/options (authMiddleware)
POST   /api/options (authMiddleware)
GET    /api/options/:id (authMiddleware)
PUT    /api/options/:id (authMiddleware + 권한 체크)
DELETE /api/options/:id (authMiddleware + 권한 체크)
GET    /api/options/my (authMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.5
```

**완료 확인:**
- [ ] `option.service.js` 생성됨
- [ ] `option.controller.js` 생성됨
- [ ] `option.routes.js` 생성됨
- [ ] 검색/필터/정렬 구현됨
- [ ] 권한 체크 구현됨

---

### 4.2 DeleteRequest 구현

**AI에게 요청:**
```markdown
## 요청 사항
옵션 삭제 요청 처리 API를 구현해주세요.

## 파일 생성
1. src/services/deleteRequest.service.js
2. src/controllers/deleteRequest.controller.js
3. src/routes/deleteRequest.routes.js

## Service 함수
1. getAllDeleteRequests(filters)
   - status 필터 지원
   - option, requester 정보 포함

2. getDeleteRequestById(id)
   - 삭제 요청 상세
   - option (branch, brand 포함), requester 정보 포함

3. approveDeleteRequest(id, processorId)
   - DeleteRequest.status = 'approved'
   - Option.status = 'deleted'
   - 트랜잭션으로 처리

4. rejectDeleteRequest(id, reason, processorId)
   - DeleteRequest.status = 'rejected'
   - Option.status = 'active' (복구)
   - 트랜잭션으로 처리

## Routes 구조
GET    /api/delete-requests (authMiddleware + adminMiddleware)
GET    /api/delete-requests/:id (authMiddleware + adminMiddleware)
POST   /api/delete-requests/:id/approve (authMiddleware + adminMiddleware)
POST   /api/delete-requests/:id/reject (authMiddleware + adminMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.6
- 비즈니스 로직: 마스터 가이드 Section 1.3
```

**완료 확인:**
- [ ] `deleteRequest.service.js` 생성됨
- [ ] `deleteRequest.controller.js` 생성됨
- [ ] `deleteRequest.routes.js` 생성됨
- [ ] 승인/거부 트랜잭션 구현됨
- [ ] Admin 권한 체크 적용됨

---

## Phase 5: 백엔드 제안 시스템

### 5.1 이메일 Service 구현

**AI에게 요청:**
```markdown
## 요청 사항
이메일 발송 Service를 구현해주세요.

## 파일 생성
1. src/services/email.service.js
2. src/config/email.js

## email.js (Nodemailer 설정)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = transporter;

## email.service.js 함수
1. sendEmail({ to, cc, replyTo, subject, html })
   - Nodemailer로 이메일 발송
   - from: process.env.EMAIL_FROM

2. generateProposalEmailTemplate({ manager, proposal, requester })
   - 제안 요청 이메일 HTML 생성
   - 마스터 가이드 Section 8.4의 이메일 템플릿 사용

3. generateProposalEmailSubject(proposal)
   - 제목 생성
   - 형식: [패스트매치] 공실 문의의 건 [고객사명 : 지하철역 / 인실]

4. generateSignature(user)
   - 이메일 서명 생성

## 참조 문서
- 이메일 로직: 마스터 가이드 Section 8.4
- 이메일 템플릿: emailsendlogic.txt
```

**완료 확인:**
- [ ] `email.service.js` 생성됨
- [ ] `config/email.js` 생성됨
- [ ] 이메일 템플릿 구현됨
- [ ] Nodemailer 설정 완료

---

### 5.2 ProposalRequest 구현

**AI에게 요청:**
```markdown
## 요청 사항
제안 요청 API를 구현해주세요.

## 파일 생성
1. src/services/proposalRequest.service.js
2. src/controllers/proposalRequest.controller.js
3. src/routes/proposalRequest.routes.js

## Service 함수
1. createProposalRequest(data, requesterId)
   - ProposalRequest 생성
   - 선택 브랜드의 매니저 정보 조회
   - 각 매니저에게 이메일 발송
   - ProposalSendHistory 생성
   - 트랜잭션으로 처리

2. getAllProposalRequests(filters, userId, userRole)
   - 본인 제안 요청만 조회 (Admin은 전체 조회)
   - status, search 필터 지원
   - 발송 내역 포함

3. getProposalRequestById(id, userId, userRole)
   - 권한 체크: 본인 또는 Admin만 조회
   - 발송 내역 포함

4. updateProposalRequest(id, data, userId, userRole)
   - 권한 체크
   - 제안 요청 수정

5. addBrandsToProposal(id, additionalBrands, userId, userRole)
   - 권한 체크
   - 중복 체크: 이미 발송한 브랜드 제외
   - 새 브랜드의 매니저에게 이메일 발송
   - selected_brands 배열에 추가
   - ProposalSendHistory 생성 (send_type: 'additional')

6. modifyProposal(id, updatedData, userId, userRole)
   - 권한 체크
   - 제안 요청 수정
   - 기존 발송 브랜드의 매니저에게 재발송
   - 이메일 제목에 [변경] 추가
   - 이메일 본문에 변경 안내 추가
   - ProposalSendHistory 생성 (send_type: 'modified')

## 이메일 발송 구조 (핵심!)
await emailService.sendEmail({
  from: process.env.EMAIL_FROM,
  to: manager.email,
  cc: [
    manager.cc_email, 
    requester.email,  // User가 이메일 받음
    process.env.EMAIL_FIXED_CC
  ].filter(Boolean),
  replyTo: requester.email,  // 회신이 User에게 직접 전달
  subject: emailService.generateProposalEmailSubject(proposal),
  html: emailService.generateProposalEmailTemplate({
    manager, proposal, requester
  }),
});

## Routes 구조
GET    /api/proposals/requests (authMiddleware)
POST   /api/proposals/requests (authMiddleware)
GET    /api/proposals/requests/:id (authMiddleware)
PUT    /api/proposals/requests/:id (authMiddleware)
POST   /api/proposals/requests/:id/add (authMiddleware)
POST   /api/proposals/requests/:id/modify (authMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.7
- 이메일 로직: emailsendlogic.txt
```

**완료 확인:**
- [ ] `proposalRequest.service.js` 생성됨
- [ ] `proposalRequest.controller.js` 생성됨
- [ ] `proposalRequest.routes.js` 생성됨
- [ ] 이메일 발송 로직 구현됨
- [ ] Reply-To 설정 구현됨
- [ ] 추가/변경 제안 로직 구현됨

---

### 5.3 ProposalDocument 구현

**AI에게 요청:**
```markdown
## 요청 사항
제안서 생성 API를 구현해주세요.

## 파일 생성
1. src/services/proposalDocument.service.js
2. src/controllers/proposalDocument.controller.js
3. src/routes/proposalDocument.routes.js

## Service 함수
1. createProposalDocument(data, creatorId)
   - ProposalDocument 생성
   - selected_options: 옵션 ID 배열
   - option_order: 옵션 순서
   - option_custom_info: 커스텀 정보

2. getAllProposalDocuments(userId, userRole)
   - 본인 제안서만 조회 (Admin은 전체 조회)

3. getProposalDocumentById(id, userId, userRole)
   - 권한 체크
   - 제안서 상세 정보
   - 선택된 옵션 정보 포함

4. updateProposalDocument(id, data, userId, userRole)
   - 권한 체크
   - 제안서 수정

5. generatePDF(id, userId, userRole)
   - 권한 체크
   - Google Docs 템플릿 기반 PDF 생성
   - Cloudinary에 업로드
   - pdf_url 저장
   - PDF 파일 반환

## PDF 생성 로직 (TODO)
// Google Docs API 또는 다른 PDF 생성 라이브러리 사용
// 현재는 placeholder로 구현

## Routes 구조
GET    /api/proposals/documents (authMiddleware)
POST   /api/proposals/documents (authMiddleware)
GET    /api/proposals/documents/:id (authMiddleware)
PUT    /api/proposals/documents/:id (authMiddleware)
GET    /api/proposals/documents/:id/pdf (authMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.8
```

**완료 확인:**
- [ ] `proposalDocument.service.js` 생성됨
- [ ] `proposalDocument.controller.js` 생성됨
- [ ] `proposalDocument.routes.js` 생성됨
- [ ] PDF 생성 로직 placeholder 구현됨

---

## Phase 6: 백엔드 부가 기능

### 6.1 파일 업로드 (Cloudinary)

**AI에게 요청:**
```markdown
## 요청 사항
Cloudinary를 사용한 파일 업로드 API를 구현해주세요.

## 파일 생성
1. src/config/cloudinary.js
2. src/services/upload.service.js
3. src/controllers/upload.controller.js
4. src/routes/upload.routes.js

## cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;

## upload.service.js 함수
1. uploadImage(file)
   - Cloudinary에 이미지 업로드
   - folder: process.env.CLOUDINARY_FOLDER
   - 이미지 URL 반환

2. uploadPDF(file)
   - Cloudinary에 PDF 업로드
   - 파일 URL 반환

3. uploadFromUrl(url, type)
   - URL에서 파일 다운로드 후 Cloudinary에 업로드

## Multer 설정
npm install multer

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

## Routes 구조
POST   /api/upload/image (authMiddleware + multer)
POST   /api/upload/pdf (authMiddleware + multer)

## 참조 문서
- API: 마스터 가이드 Section 4.9
- Cloudinary 설정: 마스터 가이드 Section 8.3
```

**완료 확인:**
- [ ] Cloudinary 설정 완료
- [ ] `upload.service.js` 생성됨
- [ ] `upload.controller.js` 생성됨
- [ ] `upload.routes.js` 생성됨
- [ ] Multer 설정 완료

---

### 6.2 외부 API 연동

**AI에게 요청:**
```markdown
## 요청 사항
KakaoMap API와 건축물대장 API 연동을 구현해주세요.

## 파일 생성
1. src/services/kakaoMap.service.js
2. src/services/buildingRegistry.service.js
3. src/controllers/external.controller.js
4. src/routes/external.routes.js

## kakaoMap.service.js 함수
1. searchAddress(address)
   - KakaoMap API로 주소 검색
   - 좌표 변환
   - 가장 가까운 지하철역 검색 (키워드 검색 사용)
   - 도보 거리 계산
   - Response: { address, lat, lng, subway, walking_distance }

## buildingRegistry.service.js 함수
1. getBuildingInfo(address)
   - 주소를 시군구코드, 법정동코드, 번지로 파싱
   - 건축물대장 API 호출
   - Response: { approval_year, floors_above, floors_below, total_area }

## Routes 구조
POST   /api/external/kakao/address (authMiddleware)
POST   /api/external/building-registry (authMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.10
- KakaoMap API: 마스터 가이드 Section 8.1
- 건축물대장 API: 마스터 가이드 Section 8.2
```

**완료 확인:**
- [ ] `kakaoMap.service.js` 생성됨
- [ ] `buildingRegistry.service.js` 생성됨
- [ ] `external.controller.js` 생성됨
- [ ] `external.routes.js` 생성됨

---

### 6.3 관리자 대시보드

**AI에게 요청:**
```markdown
## 요청 사항
관리자 대시보드 API를 구현해주세요.

## 파일 생성
1. src/services/admin.service.js
2. src/controllers/admin.controller.js
3. src/routes/admin.routes.js

## admin.service.js 함수
1. getDashboardStats()
   - 총 브랜드 수
   - 총 지점 수
   - 총 옵션 수
   - 활성 사용자 수
   - 대기중 삭제 요청 수

2. getStatistics()
   - 월별 옵션 등록 추이
   - 브랜드별 옵션 수
   - 제안 요청 추이

3. getRecentActivities()
   - 최근 등록된 옵션 (10개)
   - 최근 삭제 요청 (10개)
   - 최근 제안 요청 (10개)

## Routes 구조
GET    /api/admin/dashboard (authMiddleware + adminMiddleware)
GET    /api/admin/statistics (authMiddleware + adminMiddleware)
GET    /api/admin/activities (authMiddleware + adminMiddleware)

## 참조 문서
- API: 마스터 가이드 Section 4.11
```

**완료 확인:**
- [ ] `admin.service.js` 생성됨
- [ ] `admin.controller.js` 생성됨
- [ ] `admin.routes.js` 생성됨
- [ ] Admin 권한 체크 적용됨

---

## Phase 7: 프론트엔드 인증

### 7.1 AuthContext 구현

**AI에게 요청:**
```markdown
## 요청 사항
인증 Context를 구현해주세요.

## 파일 생성
src/context/AuthContext.jsx

## 구현 내용
1. AuthContext 생성
2. AuthProvider 컴포넌트
   - 상태: user, token, loading
   - 함수: login, logout, register, verifyEmail

3. useAuth Hook
   - AuthContext 사용

## 로컬 스토리지
- token 저장
- 페이지 새로고침시 자동 로그인

## 코드 구조
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // register, verifyEmail 구현

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, logout, register, verifyEmail 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**완료 확인:**
- [ ] `AuthContext.jsx` 생성됨
- [ ] AuthProvider 구현됨
- [ ] useAuth Hook 구현됨
- [ ] 로컬 스토리지 관리됨

---

### 7.2 API Service 구현

**AI에게 요청:**
```markdown
## 요청 사항
API 호출 Service를 구현해주세요.

## 파일 생성
src/services/api.js

## 구현 내용
마스터 가이드 Section 6.3의 api.js 코드를 그대로 사용

## 포함 내용
- Axios 인스턴스 생성
- Request Interceptor (JWT 토큰 자동 추가)
- Response Interceptor (에러 처리)
- authAPI, brandAPI, managerAPI, branchAPI, optionAPI, 
  deleteRequestAPI, proposalRequestAPI, proposalDocumentAPI,
  uploadAPI, externalAPI, adminAPI

## 참조 문서
- API Service: 마스터 가이드 Section 6.3
```

**완료 확인:**
- [ ] `api.js` 생성됨
- [ ] 모든 API 함수 구현됨
- [ ] Interceptor 설정됨

---

### 7.3 Login & VerifyEmail 페이지 (3-Step Registration)

**AI에게 요청:**
```markdown
## 요청 사항
Login과 VerifyEmail 페이지를 구현해주세요.

## 파일 생성
1. src/pages/auth/Login.jsx
2. src/pages/auth/VerifyEmail.jsx

## 🔄 새로운 인증 플로우
Login → [회원가입 클릭] → VerifyEmail (3단계)

## Login.jsx
- 이메일, 비밀번호 입력
- useAuth의 login 함수 사용
- 성공시 "/" 리다이렉트
- [회원가입] 버튼 → /verify-email로 이동 (Register.jsx 제거!)

## VerifyEmail.jsx (3-Step 프로세스)

### Step 1: 이메일 입력
- 이메일 입력 필드
- [인증 코드 발송] 버튼
- authContext.register(email) 호출

### Step 2: 인증 코드 검증
- 6자리 코드 입력 필드 (숫자만)
- [이전] [다음] 버튼
- authContext.verifyEmail(email, code) 호출
- 코드 재발송 기능

### Step 3: 회원정보 입력
- 이름 입력
- 전화번호 입력 (010-1234-5678 형식)
- 비밀번호 입력
- 비밀번호 확인
- [이전] [회원가입] 버튼
- authContext.completeRegistration({email, name, phone, password}) 호출
- 성공시 /login으로 리다이렉트

## 진행 표시 (Progress Bar)
┌─────────────────────────────┐
│ Step 1 ███ Step 2 ░░░ Step 3 ░░░ │
└─────────────────────────────┘

## 검증 규칙
- Step 1: 유효한 이메일 포함 '@'
- Step 2: 6자리 코드
- Step 3:
  - 이름: 2자 이상
  - 전화: 010-1234-5678 형식
  - 비밀번호: 6자 이상
  - 비밀번호 일치 확인

## 에러/성공 메시지
- 각 단계별 인라인 에러 표시
- 성공 메시지 2초 후 다음 단계로 진행

## 참조 문서
- Backend: Phase 2.2, 2.3의 3-step 플로우
- AuthContext: 회원가입 함수 재설계
```

**완료 확인:**
- [ ] `Login.jsx` 생성됨
- [ ] `VerifyEmail.jsx` 생성됨 (3-step 구현)
- [ ] 진행 표시 구현됨
- [ ] 검증 규칙 적용됨
- [ ] 에러 처리 구현됨
- [ ] Register.jsx 제거됨

---

### 7.4 ProtectedRoute 구현

**AI에게 요청:**
```markdown
## 요청 사항
ProtectedRoute와 AdminRoute 컴포넌트를 구현해주세요.

## 파일 생성
1. src/components/common/ProtectedRoute.jsx
2. src/components/common/AdminRoute.jsx

## ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;

## AdminRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminRoute;

## Loading.jsx
간단한 로딩 스피너 컴포넌트
```

**완료 확인:**
- [ ] `ProtectedRoute.jsx` 생성됨
- [ ] `AdminRoute.jsx` 생성됨
- [ ] `Loading.jsx` 생성됨

---

## Phase 8: 프론트엔드 메인 페이지

### 8.1 레이아웃 구조 구현

**AI에게 요청:**
```markdown
## 요청 사항
메인 페이지의 레이아웃 구조를 구현해주세요.

## 파일 생성
1. src/components/common/Layout.jsx
2. src/components/common/Header.jsx
3. src/components/common/Navigation.jsx

## Layout.jsx
<div className="flex flex-col h-screen">
  <Header />
  <div className="flex flex-1 overflow-hidden">
    <Navigation />
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </div>
</div>

## Header.jsx
- 로고 (좌측)
- 사용자 정보 (우측)
- 로그아웃 버튼

## Navigation.jsx
- User 네비게이션: 메인, 제안요청, 제안서
- Admin 네비게이션: 메인, 관리자, 제안요청
- user.role에 따라 다르게 표시
```

**완료 확인:**
- [ ] `Layout.jsx` 생성됨
- [ ] `Header.jsx` 생성됨
- [ ] `Navigation.jsx` 생성됨
- [ ] 반응형 레이아웃 구현됨

---

### 8.2 메인 페이지 구현

**AI에게 요청:**
```markdown
## 요청 사항
메인 페이지를 구현해주세요.

## 파일 생성
1. src/pages/main/MainPage.jsx
2. src/components/main/Sidebar.jsx
3. src/components/main/SearchBar.jsx
4. src/components/main/FilterBar.jsx
5. src/components/main/OptionCard.jsx
6. src/components/main/Footer.jsx

## MainPage.jsx 구조
<Layout>
  <div className="flex">
    <Sidebar />
    <div className="flex-1">
      <SearchBar />
      <FilterBar />
      <div className="grid grid-cols-3 gap-4">
        {options.map(option => (
          <OptionCard 
            key={option.id} 
            option={option}
            selected={selectedOptions.includes(option.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  </div>
  {selectedOptions.length > 0 && (
    <Footer 
      selectedCount={selectedOptions.length}
      onClearAll={() => setSelectedOptions([])}
      onCreateProposal={handleCreateProposal}
    />
  )}
</Layout>

## 상태 관리
const [options, setOptions] = useState([]);
const [filters, setFilters] = useState({
  brands: [],
  branches: [],
  search: '',
  sort: 'latest',
});
const [selectedOptions, setSelectedOptions] = useState([]);
const [loading, setLoading] = useState(false);

## API 호출
useEffect(() => {
  const fetchOptions = async () => {
    setLoading(true);
    try {
      const response = await optionAPI.getAll(filters);
      setOptions(response.data.options);
    } catch (error) {
      console.error('옵션 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchOptions();
}, [filters]);

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.1
- 페이지 디자인: page_detail.txt
```

**완료 확인:**
- [ ] `MainPage.jsx` 생성됨
- [ ] 모든 하위 컴포넌트 생성됨
- [ ] 옵션 목록 표시됨
- [ ] 검색/필터 작동됨

---

### 8.3 Sidebar 구현

**AI에게 요청:**
```markdown
## 요청 사항
Sidebar 컴포넌트를 구현해주세요.

## 파일 생성
1. src/components/main/Sidebar.jsx
2. src/components/main/BrandListModal.jsx
3. src/components/main/ManagerListModal.jsx
4. src/components/main/BranchListModal.jsx

## Sidebar.jsx
- 📋 브랜드 버튼 → BrandListModal 열기
- 👥 매니저 버튼 → ManagerListModal 열기
- 🏢 지점 버튼 → BranchListModal 열기

## BrandListModal.jsx
- 브랜드 목록 표시
- brandAPI.getAll() 호출
- 각 브랜드 클릭시 필터에 추가

## ManagerListModal.jsx
- 매니저 목록 표시
- managerAPI.getAll() 호출

## BranchListModal.jsx
- 지점 목록 표시
- branchAPI.getAll() 호출
- 각 지점 클릭시 필터에 추가

## Modal 컴포넌트
src/components/common/Modal.jsx
- 기본 모달 컴포넌트
- 닫기 버튼
- 외부 클릭시 닫기
```

**완료 확인:**
- [ ] `Sidebar.jsx` 생성됨
- [ ] 모든 모달 컴포넌트 생성됨
- [ ] `Modal.jsx` 생성됨
- [ ] 모달 열기/닫기 작동됨

---

### 8.4 검색/필터 구현

**AI에게 요청:**
```markdown
## 요청 사항
검색바와 필터바를 구현해주세요.

## SearchBar.jsx
- 통합 검색 입력창
- 실시간 검색 (debounce 500ms)
- 브랜드명, 지점명, 옵션명으로 검색

## FilterBar.jsx
- 필터 + 버튼 → 드롭다운 열기
  - 브랜드 (체크박스 복수 선택)
  - 지점 (텍스트 입력 + 자동완성)
  - 작성자 (체크박스 복수 선택)
- 선택된 필터 태그 표시
- 각 태그의 ✕ 버튼으로 제거
- ⟳ 버튼으로 전체 필터 초기화
- 정렬 드롭다운
  - 최신순, 오래된순, 가격 낮은순, 가격 높은순

## 상태 업데이트
filters 상태를 업데이트하여 MainPage에서 API 재호출
```

**완료 확인:**
- [ ] `SearchBar.jsx` 생성됨
- [ ] `FilterBar.jsx` 생성됨
- [ ] 실시간 검색 구현됨
- [ ] 필터 태그 표시됨
- [ ] 정렬 작동됨

---

### 8.5 옵션 카드 & 상세 슬라이드

**AI에게 요청:**
```markdown
## 요청 사항
옵션 카드와 상세 슬라이드를 구현해주세요.

## OptionCard.jsx
- 체크박스 (좌측 상단)
- 브랜드명 - 지점명
- 인실 (옵션분류1/옵션분류2)
- 💰 월사용료 / 보증금
- 📅 입주가능일 / 계약기간
- 🕐 생성일시
- [수정] [삭제요청] 버튼 (본인 등록 옵션만 표시)
- [보기] 버튼 (다른 사용자 등록 옵션)
- 카드 클릭시 상세 슬라이드 열기

## OptionDetailSlide.jsx
- 우측에서 슬라이드 인 애니메이션
- 옵션 전체 정보 표시
  - 지점 정보 (주소, 지하철, 건물 정보)
  - 가격 정보 (월사용료, 보증금, 정가, 일회성비용)
  - 계약 정보 (입주가능일, 계약기간)
  - 추가 정보 (오피스정보, 크레딧, 냉난방, 주차)
  - 평면도 이미지
- 닫기 버튼 (✕)
- 외부 클릭시 닫기

## 참조 문서
- 페이지 디자인: page_detail.txt
```

**완료 확인:**
- [ ] `OptionCard.jsx` 생성됨
- [ ] `OptionDetailSlide.jsx` 생성됨
- [ ] 체크박스 선택 작동됨
- [ ] 상세 슬라이드 작동됨

---

## Phase 9: 프론트엔드 옵션 관리

### 9.1 옵션 등록 페이지

**AI에게 요청:**
```markdown
## 요청 사항
옵션 등록 페이지를 구현해주세요.

## 파일 생성
src/pages/options/OptionRegister.jsx

## 단계별 폼
1. 브랜드/지점 선택
   - 브랜드 드롭다운
   - 지점 드롭다운 (브랜드 선택후 활성화)

2. 기본 정보
   - 옵션명 *
   - 옵션분류1 * (라디오 버튼)
   - 옵션분류2 (라디오 버튼)
   - 인실 * (숫자 입력)

3. 가격 정보
   - 월사용료 * (숫자 입력, 천원 단위 콤마)
   - 보증금 * (숫자 입력, 천원 단위 콤마)
   - 정가 (숫자 입력)
   - 일회성비용 (동적 추가/삭제)
     - 종류, 금액 입력

4. 계약 정보
   - 입주가능일 타입 * (라디오: 즉시입주, 협의필요, 직접입력)
   - 입주가능일 값 (타입이 '직접입력'일 때만)
   - 계약기간 타입 * (라디오: 6개월, 12개월, 직접입력)
   - 계약기간 값 (타입이 '직접입력'일 때만)

5. 추가 정보
   - 오피스정보 (textarea)
   - 크레딧 (숫자)
   - 냉난방식 (라디오)
   - 주차방식 (라디오)
   - 기타메모 (textarea)
   - 평면도 업로드

## 유효성 검증
- 필수 항목 입력 체크
- 양수 입력 체크
- 파일 크기/타입 체크

## API 호출
optionAPI.create(data)
성공시 "/" 리다이렉트

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.2
```

**완료 확인:**
- [ ] `OptionRegister.jsx` 생성됨
- [ ] 모든 폼 필드 구현됨
- [ ] 유효성 검증 구현됨
- [ ] 파일 업로드 구현됨

---

### 9.2 옵션 수정 페이지

**AI에게 요청:**
```markdown
## 요청 사항
옵션 수정 페이지를 구현해주세요.

## 파일 생성
src/pages/options/OptionEdit.jsx

## 구현 내용
- OptionRegister와 유사한 폼
- useParams로 옵션 ID 받기
- 초기 데이터 로딩
  - optionAPI.getById(id) 호출
  - 폼 필드에 기존 데이터 채우기
- 수정 권한 체크
  - 본인 또는 Admin만 접근 가능
  - 권한 없으면 "/" 리다이렉트
- optionAPI.update(id, data) 호출
- 성공시 "/" 리다이렉트
```

**완료 확인:**
- [ ] `OptionEdit.jsx` 생성됨
- [ ] 기존 데이터 로딩됨
- [ ] 권한 체크 구현됨
- [ ] 수정 작동됨

---

### 9.3 옵션 삭제 요청

**AI에게 요청:**
```markdown
## 요청 사항
옵션 카드의 [삭제요청] 기능을 구현해주세요.

## 구현 위치
OptionCard.jsx의 [삭제요청] 버튼

## 구현 내용
1. [삭제요청] 버튼 클릭
2. 삭제 사유 입력 모달 열기
3. 사유 입력 후 [요청] 버튼 클릭
4. optionAPI.requestDelete(id, { reason }) 호출
5. 성공 토스트 표시
6. 옵션 목록 새로고침

## DeleteRequestModal.jsx
- 삭제 사유 textarea
- [취소] [요청] 버튼
```

**완료 확인:**
- [ ] DeleteRequestModal 생성됨
- [ ] 삭제 요청 작동됨
- [ ] 토스트 표시됨

---

## Phase 10: 프론트엔드 제안 시스템

### 10.1 제안 요청 페이지

**AI에게 요청:**
```markdown
## 요청 사항
제안 요청 페이지를 구현해주세요.

## 파일 생성
src/pages/proposals/ProposalRequest.jsx

## 폼 구성
1. 고객사 정보
   - 고객사명 *
   - 담당자 이름 *
   - 담당자 직책
   - 담당자 연락처 * (010-0000-0000 형식)
   - 담당자 이메일 *

2. 입주 조건
   - 희망 지하철역 * (텍스트 입력)
   - 실사용 인원 * (숫자)
   - 희망 인실 (숫자)
   - 입주 예정일 * (날짜 선택)
   - 입주 희망 기간 * (라디오: 초순, 중순, 하순, 전체)
   - 임대 기간 * (숫자, 개월)
   - 추가 정보 (textarea)

3. 브랜드 선택
   - 브랜드 목록 (체크박스 복수 선택)
   - brandAPI.getAll() 호출하여 목록 표시

## 제출 플로우
1. 유효성 검증
2. proposalRequestAPI.create(data) 호출
3. 성공 모달 표시
   - "✓ 제안 요청이 발송되었습니다"
   - "발송 완료: N개 브랜드"
   - "📧 브랜드 답변은 내 이메일로 직접 전달됩니다"
   - [제안 요청 관리] [메인으로] 버튼
4. [제안 요청 관리] 클릭시 "/proposals/requests"로 이동

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.3
- 페이지 디자인: page_detail.txt
```

**완료 확인:**
- [ ] `ProposalRequest.jsx` 생성됨
- [ ] 모든 폼 필드 구현됨
- [ ] 브랜드 선택 구현됨
- [ ] 성공 모달 구현됨

---

### 10.2 제안 요청 관리

**AI에게 요청:**
```markdown
## 요청 사항
제안 요청 목록 및 상세 페이지를 구현해주세요.

## 파일 생성
1. src/pages/proposals/ProposalRequestList.jsx
2. src/pages/proposals/ProposalRequestDetail.jsx

## ProposalRequestList.jsx
- 제안 요청 목록 표시
- proposalRequestAPI.getAll() 호출
- 각 항목 표시
  - 고객사명
  - 희망 지하철역
  - 실사용 인원
  - 발송 브랜드 수
  - 발송일시
  - 상태 (발송완료, 발송실패)
- 카드 클릭시 상세 페이지로 이동

## ProposalRequestDetail.jsx
- 제안 요청 상세 정보 표시
- proposalRequestAPI.getById(id) 호출
- 표시 내용
  - 고객사 정보 (읽기 전용)
  - 입주 조건 (읽기 전용)
  - 발송 내역
    - 브랜드별 발송 시간
    - 발송 유형 (최초발송, 추가발송, 변경발송)
- 액션 버튼
  - [추가 제안 요청] → "/proposals/requests/:id/add"
  - [변경 제안 요청] → "/proposals/requests/:id/modify"

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.4
- 페이지 디자인: page_detail.txt
```

**완료 확인:**
- [ ] `ProposalRequestList.jsx` 생성됨
- [ ] `ProposalRequestDetail.jsx` 생성됨
- [ ] 목록 표시 작동됨
- [ ] 상세 페이지 작동됨

---

### 10.3 추가/변경 제안 요청

**AI에게 요청:**
```markdown
## 요청 사항
추가 제안 요청과 변경 제안 요청 페이지를 구현해주세요.

## 파일 생성
1. src/pages/proposals/ProposalRequestAdd.jsx
2. src/pages/proposals/ProposalRequestModify.jsx

## ProposalRequestAdd.jsx
- 기존 제안 요청 정보 표시 (읽기 전용, 회색 배경)
  - 고객사 정보
  - 입주 조건
  - 기존 발송 브랜드 (태그 형태)
- 추가 브랜드 선택
  - brandAPI.getAvailableForAddition(proposalId) 호출
  - 드롭다운에서 선택
  - 선택된 브랜드는 태그 형태로 표시
  - 각 태그에 ✕ 버튼으로 제거
- [추가 발송] 버튼
  - proposalRequestAPI.addBrands(id, { additional_brands }) 호출
  - 성공 모달 표시

## ProposalRequestModify.jsx
- 기존 제안 요청 정보 표시
  - 고객사 정보 (읽기 전용, 회색 배경)
  - 입주 조건 (수정 가능, 흰색 배경)
  - 기존 발송 브랜드 (태그 형태, 읽기 전용)
- 수정 가능 항목
  - 희망 지하철역, 실사용 인원, 희망 인실,
    입주 예정일, 입주 희망 기간, 임대 기간, 추가 정보
- [변경 발송] 버튼
  - proposalRequestAPI.modify(id, data) 호출
  - 성공 모달 표시

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.5, 7.6
- 페이지 디자인: page_detail.txt
```

**완료 확인:**
- [ ] `ProposalRequestAdd.jsx` 생성됨
- [ ] `ProposalRequestModify.jsx` 생성됨
- [ ] 브랜드 추가 작동됨
- [ ] 조건 변경 작동됨

---

### 10.4 제안서 생성

**AI에게 요청:**
```markdown
## 요청 사항
제안서 생성 페이지를 구현해주세요.

## 파일 생성
src/pages/proposals/ProposalCreate.jsx

## 구현 내용
1. 메인 페이지에서 선택된 옵션 받기
   - localStorage 또는 URL params 사용

2. Step 1: 옵션 순서 및 정보 변경
   - 선택된 옵션 목록 표시
   - 드래그 앤 드롭으로 순서 변경
   - 각 옵션별 커스텀 정보 입력 가능

3. Step 2: 제안서명 작성
   - 기본값: "{고객사명}_공유오피스_제안서"
   - 수정 가능

4. Step 3: PDF 미리보기 및 출력
   - proposalDocumentAPI.create(data) 호출
   - PDF 생성 (백엔드에서 처리)
   - PDF 미리보기 표시
   - [다운로드] 버튼

## 드래그 앤 드롭
react-beautiful-dnd 또는 dnd-kit 사용

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.7
```

**완료 확인:**
- [ ] `ProposalCreate.jsx` 생성됨
- [ ] 3단계 프로세스 구현됨
- [ ] 드래그 앤 드롭 구현됨
- [ ] PDF 생성 작동됨

---

## Phase 11: 프론트엔드 관리자

### 11.1 관리자 대시보드

**AI에게 요청:**
```markdown
## 요청 사항
관리자 대시보드를 구현해주세요.

## 파일 생성
1. src/pages/admin/Dashboard.jsx
2. src/components/admin/StatisticsCard.jsx
3. src/components/admin/RecentActivities.jsx

## Dashboard.jsx
- adminAPI.getDashboard() 호출
- 통계 카드 표시
  - 총 브랜드 수
  - 총 지점 수
  - 총 옵션 수
  - 활성 사용자 수
  - 대기중 삭제 요청 수
- 최근 활동 표시
  - 최근 등록된 옵션
  - 최근 삭제 요청
  - 최근 제안 요청

## StatisticsCard.jsx
- 아이콘
- 제목
- 숫자 (큰 폰트)
- 변화량 (optional)

## RecentActivities.jsx
- 활동 목록 표시
- 각 항목 클릭시 상세 페이지로 이동

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.8
```

**완료 확인:**
- [ ] `Dashboard.jsx` 생성됨
- [ ] StatisticsCard 구현됨
- [ ] RecentActivities 구현됨

---

### 11.2 브랜드/매니저/지점 관리

**AI에게 요청:**
```markdown
## 요청 사항
관리자용 브랜드, 매니저, 지점 관리 페이지를 구현해주세요.

## 파일 생성
1. src/pages/admin/brands/BrandManagement.jsx
2. src/pages/admin/managers/ManagerManagement.jsx
3. src/pages/admin/branches/BranchManagement.jsx

## 공통 구조
- 목록 표시 (테이블 또는 카드)
- [+ 등록] 버튼
- 각 항목에 [수정] [삭제] 버튼
- 모달 형태로 등록/수정 폼 표시

## BrandManagement.jsx
- brandAPI.getAll() 호출
- 브랜드 목록 표시
- 등록/수정 모달
  - 브랜드명, 상태
- brandAPI.create(), update(), delete() 호출

## ManagerManagement.jsx
- managerAPI.getAll() 호출
- 매니저 목록 표시
- 등록/수정 모달
  - 브랜드 선택, 이름, 직책, 이메일, 참조메일, 연락처
- managerAPI.create(), update(), delete() 호출

## BranchManagement.jsx
- branchAPI.getAll() 호출
- 지점 목록 표시
- 등록/수정 모달
  - 브랜드 선택
  - 지점명, 주소 (KakaoMap API 연동)
  - 외관사진, 내부이미지 업로드
  - 건축물 정보 (건축물대장 API 연동)
- branchAPI.create(), update(), delete() 호출

## KakaoMap 연동
주소 입력시 externalAPI.searchAddress() 호출
- 좌표, 지하철역, 도보거리 자동 입력

## 건축물대장 연동
주소 입력시 externalAPI.getBuildingInfo() 호출
- 사용승인일, 지상층수, 지하층수, 연면적 자동 입력
```

**완료 확인:**
- [ ] BrandManagement 구현됨
- [ ] ManagerManagement 구현됨
- [ ] BranchManagement 구현됨
- [ ] 외부 API 연동 작동됨

---

### 11.3 삭제 요청 관리

**AI에게 요청:**
```markdown
## 요청 사항
관리자용 삭제 요청 관리 페이지를 구현해주세요.

## 파일 생성
1. src/pages/admin/deleteRequests/DeleteRequestManagement.jsx
2. src/pages/admin/deleteRequests/DeleteRequestDetail.jsx

## DeleteRequestManagement.jsx
- deleteRequestAPI.getAll() 호출
- 삭제 요청 목록 표시
  - 요청일시
  - 옵션명
  - 요청자
  - 요청 사유
  - 상태 (대기중, 승인, 거부)
- 카드 클릭시 상세 페이지로 이동

## DeleteRequestDetail.jsx
- deleteRequestAPI.getById(id) 호출
- 옵션 정보 전체 표시
- 요청 사유 표시
- [승인] [거부] 버튼

### 승인 플로우
1. [승인] 버튼 클릭
2. 확인 모달 "이 옵션을 삭제하시겠습니까?"
3. deleteRequestAPI.approve(id) 호출
4. 성공 토스트 표시
5. 목록으로 이동

### 거부 플로우
1. [거부] 버튼 클릭
2. 거부 사유 입력 모달
3. deleteRequestAPI.reject(id, { reason }) 호출
4. 성공 토스트 표시
5. 목록으로 이동

## 참조 문서
- 페이지 명세: 마스터 가이드 Section 7.9
```

**완료 확인:**
- [ ] DeleteRequestManagement 구현됨
- [ ] DeleteRequestDetail 구현됨
- [ ] 승인/거부 작동됨

---

## Phase 12: 최종 테스트 및 배포

### 12.1 통합 테스트

**AI에게 요청:**
```markdown
## 요청 사항
전체 시스템을 테스트해주세요.

## 테스트 체크리스트

### 인증
- [ ] 회원가입 → 이메일 인증 → 로그인
- [ ] 로그아웃
- [ ] 토큰 만료시 자동 리다이렉트

### 옵션 관리
- [ ] 옵션 등록
- [ ] 옵션 목록 조회
- [ ] 옵션 검색/필터
- [ ] 옵션 수정 (본인만 가능)
- [ ] 옵션 삭제 요청

### 제안 시스템
- [ ] 제안 요청 생성
- [ ] 이메일 발송 확인
- [ ] Reply-To 확인
- [ ] 추가 제안 요청
- [ ] 변경 제안 요청
- [ ] 제안서 생성
- [ ] PDF 다운로드

### 관리자
- [ ] 대시보드 표시
- [ ] 브랜드/매니저/지점 CRUD
- [ ] 삭제 요청 승인/거부
- [ ] 권한 체크 (User는 접근 불가)

### 외부 API
- [ ] KakaoMap 주소 검색
- [ ] 건축물대장 조회
- [ ] Cloudinary 이미지 업로드
```

**완료 확인:**
- [ ] 모든 기능 테스트 완료
- [ ] 버그 수정 완료

---

### 12.2 배포 준비

**AI에게 요청:**
```markdown
## 요청 사항
배포를 위한 설정을 해주세요.

## 백엔드
1. .env.production 파일 생성
2. Prisma 마이그레이션 실행
   - npx prisma migrate deploy
3. 프로덕션 환경변수 확인
4. PM2 설정 (선택)

## 프론트엔드
1. .env.production 파일 생성
   - VITE_API_BASE_URL=https://api.your-domain.com
2. 빌드 실행
   - npm run build
3. dist/ 폴더 확인

## 배포 체크리스트
- [ ] 모든 환경 변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] Cloudinary 계정 설정
- [ ] KakaoMap API 키 발급
- [ ] 건축물대장 API 키 발급
- [ ] 이메일 SMTP 설정
- [ ] CORS 설정 확인
- [ ] 백엔드 배포 (Heroku, AWS, etc.)
- [ ] 프론트엔드 배포 (Vercel, Netlify, etc.)
- [ ] Admin 계정 생성
- [ ] 최종 테스트

## 참조 문서
- 배포 가이드: 마스터 가이드 Section 10
```

**완료 확인:**
- [ ] 배포 설정 완료
- [ ] 프로덕션 환경에서 테스트 완료

---

## 🎯 최종 점검

### 전체 개발 완료 체크리스트

#### 백엔드 (MongoDB 기반)
- [ ] MongoDB 연결 설정 완료
- [ ] User 모델 (MongoDB) 구현 완료
- [ ] 3-Step 인증 시스템 (이메일 → 코드 → 회원정보) 완료
- [ ] Brand/Manager/Branch CRUD 완료 (MongoDB 사용)
- [ ] Option CRUD 완료 (MongoDB 사용)
- [ ] DeleteRequest 시스템 완료
- [ ] ProposalRequest 시스템 완료
- [ ] ProposalDocument 시스템 완료
- [ ] 이메일 발송 로직 완료
- [ ] 파일 업로드 (Cloudinary) 완료
- [ ] 외부 API 연동 완료
- [ ] 관리자 대시보드 완료
- [ ] Prisma/PostgreSQL 의존성 완전 제거

#### 프론트엔드
- [ ] Login 페이지 완료 (회원가입 버튼 → /verify-email)
- [ ] VerifyEmail 페이지 완료 (3-Step: 이메일 → 코드 → 회원정보)
- [ ] AuthContext 업데이트 완료 (3-Step 플로우 지원)
- [ ] 메인 페이지 완료
- [ ] 옵션 등록/수정 완료
- [ ] 제안 요청 페이지 완료
- [ ] 제안 요청 관리 완료
- [ ] 추가/변경 제안 완료
- [ ] 제안서 생성 완료
- [ ] 관리자 대시보드 완료
- [ ] 브랜드/매니저/지점 관리 완료
- [ ] 삭제 요청 관리 완료
- [ ] Register.jsx 제거됨

#### 테스트 & 배포
- [ ] 3-Step 회원가입 통합 테스트 완료
- [ ] MongoDB 데이터 생성/조회/수정/삭제 테스트 완료
- [ ] 전체 기능 통합 테스트 완료
- [ ] 버그 수정 완료
- [ ] 배포 설정 완료 (MongoDB Atlas 연결)
- [ ] 프로덕션 테스트 완료

---

## 🚀 다음 단계

1. **Phase 1**부터 시작하여 순차적으로 진행
2. 각 Phase 완료후 체크리스트 확인
3. 문제 발생시 마스터 가이드 참조
4. AI에게 요청시 명확한 지시사항 제공
5. 완료된 기능은 즉시 테스트

**이 가이드를 따라 개발하면 FASTMATCH 서비스를 완성할 수 있습니다!**

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2024-11-20  
**예상 개발 기간**: 40-60시간
