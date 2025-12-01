# 🚀 FASTMATCH 개발 마스터 가이드 (AI 바이브코딩용)

> **목적**: Claude Code 또는 다른 AI 코딩 도구가 일관되게 개발할 수 있도록 명확하게 구조화된 가이드
> **대상**: 비개발자가 AI를 활용하여 풀스택 웹 서비스를 구축
> **작성일**: 2024-11-20
> **버전**: 1.3.0
> **마지막 업데이트**: 2025-11-21 (Phase 2 완료)

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [API 엔드포인트 명세](#4-api-엔드포인트-명세)
5. [백엔드 구조](#5-백엔드-구조)
6. [프론트엔드 구조](#6-프론트엔드-구조)
7. [페이지별 상세 명세](#7-페이지별-상세-명세)
8. [외부 API 연동](#8-외부-api-연동)
9. [개발 지침](#9-개발-지침)
10. [배포 가이드](#10-배포-가이드)

---

## 1. 프로젝트 개요

### 1.1 서비스 설명
**FASTMATCH**는 공유오피스 공간 관리 및 제안서 생성 시스템입니다.

**핵심 기능:**
- 브랜드/매니저/지점/옵션 데이터 관리
- 옵션 등록 및 검색/필터링
- 제안 요청 자동 이메일 발송
- 제안서 PDF 자동 생성
- 삭제 요청 워크플로우
- 다중 역할 사용자 관리 (Admin, User)

### 1.2 사용자 역할

| 역할 | 권한 |
|------|------|
| **Admin** | 모든 기능 접근, 브랜드/매니저/지점 생성, 삭제 요청 승인/거부 |
| **User** | 옵션 등록/수정/삭제요청, 제안요청, 제안서 생성 |

### 1.3 주요 비즈니스 로직

#### 옵션 삭제 프로세스
1. User가 본인 옵션에 대해 삭제 요청 (사유 입력)
2. 옵션 상태가 `삭제요청중`으로 변경
3. Admin이 승인 → 옵션 상태 `삭제됨`
4. Admin이 거부 → 옵션 상태 `활성` 복구

#### 제안 요청 이메일 발송 로직
1. **최초 발송**: User가 브랜드 선택 → 각 브랜드 매니저에게 이메일 발송
2. **추가 발송**: 기존 제안 요청에 새 브랜드 추가 발송
3. **변경 발송**: 조건 변경시 기존 발송 브랜드에게 재발송 (제목에 [변경] 표시)

**이메일 구조:**
- **From**: `noreply@fastmatch.kr`
- **To**: 브랜드 매니저 이메일
- **Cc**: 매니저 참조메일, User 이메일, `official@fastmatch.kr`
- **Reply-To**: User 이메일 (회신이 User에게 직접 전달됨)

---

## 2. 기술 스택

### 2.1 백엔드
```
- Runtime: Node.js (v18+)
- Framework: Express.js
- Database: MongoDB (Native MongoDB Driver)
- Authentication: JWT (jsonwebtoken)
- Email: Nodemailer
- File Upload: Cloudinary
- API: KakaoMap API, 건축물대장 API
```

### 2.2 프론트엔드
```
- Framework: React (v18+)
- Build Tool: Vite
- Styling: Tailwind CSS
- Routing: React Router Dom (v6)
- HTTP Client: Axios
- State: React Context API + Hooks
```

### 2.3 필수 환경 변수 (.env)
```bash
# 서버
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# DB (MongoDB)
MONGODB_URI=mongodb://localhost:27017/fastmatch
# 또는 MongoDB Atlas 연결 문자열
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fastmatch

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@fastmatch.kr
EMAIL_FIXED_CC=official@fastmatch.kr

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=fastmatch

# KakaoMap
KAKAO_REST_API_KEY=your-kakao-rest-api-key
KAKAO_ADDRESS_SEARCH_URL=https://dapi.kakao.com/v2/local/search/address.json

# 건축물대장
BUILDING_REGISTRY_API_KEY=your-building-registry-api-key
BUILDING_REGISTRY_API_URL=http://apis.data.go.kr/1613000/BldRgstService_v2/getBrBasisOulnInfo

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 기타
BCRYPT_ROUNDS=10
LOG_LEVEL=debug
```

---

## 3. 데이터베이스 설계

### 3.1 ERD 다이어그램
```
User (사용자)
├── 1:N → Option (옵션 생성자)
├── 1:N → DeleteRequest (삭제 요청자)
├── 1:N → ProposalRequest (제안 요청자)
└── 1:N → ProposalDocument (제안서 생성자)

Brand (브랜드)
├── 1:N → Manager (매니저)
├── 1:N → Branch (지점)
└── N:M → ProposalRequest (선택브랜드)

Branch (지점)
└── 1:N → Option (옵션)

Option (옵션)
├── N:1 → Branch
└── 1:1 → DeleteRequest (optional)

ProposalRequest (제안 요청)
└── 1:N → ProposalSendHistory (발송 내역)
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ===== 사용자 관리 =====

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  email_verified    Boolean   @default(false)
  is_smatch_domain  Boolean   @default(false)
  name              String
  phone             String
  password_hash     String
  role              Role      @default(user)
  status            UserStatus @default(active)
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  last_login        DateTime?

  // Relations
  created_brands           Brand[]              @relation("BrandCreator")
  updated_brands           Brand[]              @relation("BrandUpdater")
  created_managers         Manager[]            @relation("ManagerCreator")
  updated_managers         Manager[]            @relation("ManagerUpdater")
  created_branches         Branch[]             @relation("BranchCreator")
  updated_branches         Branch[]             @relation("BranchUpdater")
  created_options          Option[]             @relation("OptionCreator")
  updated_options          Option[]             @relation("OptionUpdater")
  delete_requests          DeleteRequest[]      @relation("DeleteRequester")
  processed_delete_requests DeleteRequest[]     @relation("DeleteProcessor")
  proposal_requests        ProposalRequest[]
  proposal_documents       ProposalDocument[]

  @@map("users")
}

enum Role {
  user
  admin
}

enum UserStatus {
  active
  suspended
  deleted
}

model EmailVerification {
  id            String    @id @default(uuid())
  email         String
  code          String
  expires_at    DateTime
  verified      Boolean   @default(false)
  created_at    DateTime  @default(now())

  @@map("email_verifications")
}

// ===== 브랜드 관리 =====

model Brand {
  id            String    @id @default(uuid())
  name          String    @unique
  status        BrandStatus @default(active)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  creator_id    String
  updater_id    String?

  // Relations
  creator       User      @relation("BrandCreator", fields: [creator_id], references: [id])
  updater       User?     @relation("BrandUpdater", fields: [updater_id], references: [id])
  managers      Manager[]
  branches      Branch[]
  send_histories ProposalSendHistory[]

  @@map("brands")
}

enum BrandStatus {
  active
  inactive
}

model Manager {
  id            String    @id @default(uuid())
  brand_id      String
  name          String
  position      String
  email         String
  cc_email      String?
  phone         String
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  creator_id    String
  updater_id    String?

  // Relations
  brand         Brand     @relation(fields: [brand_id], references: [id], onDelete: Cascade)
  creator       User      @relation("ManagerCreator", fields: [creator_id], references: [id])
  updater       User?     @relation("ManagerUpdater", fields: [updater_id], references: [id])

  @@map("managers")
}

model Branch {
  id                    String    @id @default(uuid())
  brand_id              String
  name                  String
  address               String
  latitude              Decimal   @db.Decimal(10, 8)
  longitude             Decimal   @db.Decimal(11, 8)
  nearest_subway        String
  walking_distance      Int
  exterior_image_url    String?
  interior_image_urls   Json      @default("[]")
  branch_info           String?
  approval_year         Int?
  floors_above          Int?
  floors_below          Int?
  total_area            Decimal?  @db.Decimal(10, 2)
  status                BranchStatus @default(active)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt
  creator_id            String
  updater_id            String?

  // Relations
  brand         Brand     @relation(fields: [brand_id], references: [id], onDelete: Cascade)
  creator       User      @relation("BranchCreator", fields: [creator_id], references: [id])
  updater       User?     @relation("BranchUpdater", fields: [updater_id], references: [id])
  options       Option[]

  @@map("branches")
}

enum BranchStatus {
  active
  inactive
}

// ===== 옵션 관리 =====

model Option {
  id                        String    @id @default(uuid())
  branch_id                 String
  name                      String
  category1                 OptionCategory1
  category2                 OptionCategory2?
  capacity                  Int
  monthly_fee               Decimal   @db.Decimal(12, 2)
  deposit                   Decimal   @db.Decimal(12, 2)
  list_price                Decimal?  @db.Decimal(12, 2)
  one_time_fees             Json      @default("[]")
  move_in_date_type         MoveInDateType
  move_in_date_value        String?
  contract_period_type      ContractPeriodType
  contract_period_value     String?
  office_info               String?
  credits                   Int?
  hvac_type                 HVACType?
  parking_type              ParkingType?
  memo                      String?
  floor_plan_url            String?
  status                    OptionStatus @default(active)
  delete_request_at         DateTime?
  delete_request_reason     String?
  delete_processed_at       DateTime?
  delete_result             DeleteResult?
  delete_process_reason     String?
  processor_admin_id        String?
  created_at                DateTime  @default(now())
  updated_at                DateTime  @updatedAt
  creator_id                String
  updater_id                String?

  // Relations
  branch                    Branch    @relation(fields: [branch_id], references: [id], onDelete: Cascade)
  creator                   User      @relation("OptionCreator", fields: [creator_id], references: [id])
  updater                   User?     @relation("OptionUpdater", fields: [updater_id], references: [id])
  processor_admin           User?     @relation("DeleteProcessor", fields: [processor_admin_id], references: [id])
  delete_request            DeleteRequest?

  @@map("options")
}

enum OptionCategory1 {
  exclusive_floor
  separate_floor
  connected_floor
  exclusive_room
  separate_room
  connected_room
}

enum OptionCategory2 {
  window_side
  inner_side
}

enum MoveInDateType {
  immediate
  negotiable
  custom
}

enum ContractPeriodType {
  six_months
  twelve_months
  custom
}

enum HVACType {
  central
  individual
}

enum ParkingType {
  self_parking
  mechanical
}

enum OptionStatus {
  active
  delete_requested
  deleted
}

enum DeleteResult {
  approved
  rejected
}

model DeleteRequest {
  id              String    @id @default(uuid())
  option_id       String    @unique
  requester_id    String
  request_at      DateTime  @default(now())
  request_reason  String
  status          DeleteRequestStatus @default(pending)
  processed_at    DateTime?
  processor_id    String?
  process_reason  String?

  // Relations
  option          Option    @relation(fields: [option_id], references: [id], onDelete: Cascade)
  requester       User      @relation("DeleteRequester", fields: [requester_id], references: [id])
  processor       User?     @relation("DeleteProcessor", fields: [processor_id], references: [id])

  @@map("delete_requests")
}

enum DeleteRequestStatus {
  pending
  approved
  rejected
}

// ===== 제안 요청 =====

model ProposalRequest {
  id                      String    @id @default(uuid())
  requester_id            String
  company_name            String
  contact_name            String
  contact_position        String
  contact_phone           String
  contact_email           String
  preferred_subway        String
  actual_users            Int
  preferred_capacity      Int?
  move_in_date            DateTime
  move_in_period          MoveInPeriod
  lease_period            Int
  additional_info         String?
  selected_brands         Json      @default("[]")
  send_status             SendStatus @default(sending)
  sent_at                 DateTime?
  created_at              DateTime  @default(now())
  updated_at              DateTime  @updatedAt

  // Relations
  requester               User      @relation(fields: [requester_id], references: [id])
  send_histories          ProposalSendHistory[]

  @@map("proposal_requests")
}

enum MoveInPeriod {
  early
  mid
  late
  whole
}

enum SendStatus {
  sending
  sent
  failed
}

model ProposalSendHistory {
  id                    String    @id @default(uuid())
  proposal_request_id   String
  brand_id              String
  send_type             SendType
  sent_at               DateTime  @default(now())
  send_success          Boolean   @default(true)

  // Relations
  proposal_request      ProposalRequest @relation(fields: [proposal_request_id], references: [id], onDelete: Cascade)
  brand                 Brand     @relation(fields: [brand_id], references: [id])

  @@map("proposal_send_histories")
}

enum SendType {
  initial
  additional
  modified
}

// ===== 제안서 =====

model ProposalDocument {
  id                  String    @id @default(uuid())
  creator_id          String
  document_name       String
  selected_options    Json      @default("[]")
  option_order        Json      @default("[]")
  option_custom_info  Json      @default("{}")
  pdf_url             String?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  // Relations
  creator             User      @relation(fields: [creator_id], references: [id])

  @@map("proposal_documents")
}
```

---

## 4. API 엔드포인트 명세

### 4.1 인증 (Authentication)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/verify-email` | 이메일 인증 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |
| POST | `/api/auth/refresh` | 토큰 갱신 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |

#### POST /api/auth/register
```json
// Request
{
  "email": "hong@smatch.kr",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "인증 코드가 이메일로 발송되었습니다"
}
```

#### POST /api/auth/verify-email
```json
// Request
{
  "email": "hong@smatch.kr",
  "code": "123456"
}

// Response
{
  "success": true,
  "message": "이메일 인증이 완료되었습니다"
}
```

#### POST /api/auth/login
```json
// Request
{
  "email": "hong@smatch.kr",
  "password": "password123"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "홍길동",
    "email": "hong@smatch.kr",
    "role": "user"
  }
}
```

### 4.2 브랜드 (Brands)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/brands` | 브랜드 목록 | ✅ | All |
| POST | `/api/brands` | 브랜드 생성 | ✅ | Admin |
| GET | `/api/brands/:id` | 브랜드 상세 | ✅ | All |
| PUT | `/api/brands/:id` | 브랜드 수정 | ✅ | Admin |
| DELETE | `/api/brands/:id` | 브랜드 삭제 | ✅ | Admin |
| POST | `/api/brands/check-duplicate` | 중복 확인 | ✅ | Admin |
| GET | `/api/brands/available-for-addition` | 추가 가능 브랜드 | ✅ | All |

#### GET /api/brands
```
Query Parameters:
- status: 'active' | 'inactive'
- search: string

Response:
{
  "success": true,
  "brands": [
    {
      "id": "uuid",
      "name": "패스트파이브",
      "status": "active",
      "created_at": "2024-11-20T...",
      "managers_count": 3,
      "branches_count": 5
    }
  ]
}
```

#### POST /api/brands
```json
// Request
{
  "name": "패스트파이브",
  "status": "active"
}

// Response
{
  "success": true,
  "brand": {
    "id": "uuid",
    "name": "패스트파이브",
    "status": "active",
    "created_at": "2024-11-20T..."
  }
}
```

### 4.3 매니저 (Managers)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/managers` | 매니저 목록 | ✅ | All |
| POST | `/api/managers` | 매니저 생성 | ✅ | Admin |
| GET | `/api/managers/:id` | 매니저 상세 | ✅ | All |
| PUT | `/api/managers/:id` | 매니저 수정 | ✅ | Admin |
| DELETE | `/api/managers/:id` | 매니저 삭제 | ✅ | Admin |

#### GET /api/managers
```
Query Parameters:
- brand_id: uuid
- search: string

Response:
{
  "success": true,
  "managers": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "name": "홍길동",
      "position": "매니저",
      "email": "hong@fastfive.com",
      "cc_email": "cc@fastfive.com",
      "phone": "010-1234-5678",
      "brand": {
        "name": "패스트파이브"
      }
    }
  ]
}
```

### 4.4 지점 (Branches)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/branches` | 지점 목록 | ✅ | All |
| POST | `/api/branches` | 지점 생성 | ✅ | Admin |
| GET | `/api/branches/:id` | 지점 상세 | ✅ | All |
| PUT | `/api/branches/:id` | 지점 수정 | ✅ | Admin |
| DELETE | `/api/branches/:id` | 지점 삭제 | ✅ | Admin |

### 4.5 옵션 (Options)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/options` | 옵션 목록 | ✅ | All |
| POST | `/api/options` | 옵션 생성 | ✅ | All |
| GET | `/api/options/:id` | 옵션 상세 | ✅ | All |
| PUT | `/api/options/:id` | 옵션 수정 | ✅ | Owner/Admin |
| DELETE | `/api/options/:id` | 옵션 삭제요청 | ✅ | Owner |
| GET | `/api/options/my` | 내 옵션 목록 | ✅ | All |

#### GET /api/options
```
Query Parameters:
- brand_id: uuid
- branch_id: uuid
- status: 'active' | 'delete_requested' | 'deleted'
- sort: 'latest' | 'oldest' | 'price_low' | 'price_high'
- search: string
- page: number
- pageSize: number

Response:
{
  "success": true,
  "options": [
    {
      "id": "uuid",
      "branch_id": "uuid",
      "name": "강남점 4인실",
      "category1": "exclusive_floor",
      "category2": "window_side",
      "capacity": 4,
      "monthly_fee": 1500000,
      "deposit": 10000000,
      "move_in_date_type": "immediate",
      "contract_period_type": "twelve_months",
      "status": "active",
      "created_at": "2024-11-20T...",
      "branch": {
        "name": "강남점",
        "brand": {
          "name": "패스트파이브"
        }
      },
      "creator": {
        "name": "홍길동"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

#### DELETE /api/options/:id
```json
// Request
{
  "reason": "계약 종료로 인한 삭제 요청"
}

// Response
{
  "success": true,
  "message": "삭제 요청이 접수되었습니다"
}
```

### 4.6 삭제 요청 (Delete Requests)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/delete-requests` | 삭제 요청 목록 | ✅ | Admin |
| GET | `/api/delete-requests/:id` | 삭제 요청 상세 | ✅ | Admin |
| POST | `/api/delete-requests/:id/approve` | 승인 | ✅ | Admin |
| POST | `/api/delete-requests/:id/reject` | 거부 | ✅ | Admin |

### 4.7 제안 요청 (Proposal Requests)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/proposals/requests` | 제안 요청 목록 | ✅ |
| POST | `/api/proposals/requests` | 제안 요청 생성 | ✅ |
| GET | `/api/proposals/requests/:id` | 제안 요청 상세 | ✅ |
| PUT | `/api/proposals/requests/:id` | 제안 요청 수정 | ✅ |
| POST | `/api/proposals/requests/:id/add` | 추가 제안 요청 | ✅ |
| POST | `/api/proposals/requests/:id/modify` | 변경 제안 요청 | ✅ |

#### POST /api/proposals/requests
```json
// Request
{
  "company_name": "(주)테크스타트업",
  "contact_name": "김철수",
  "contact_position": "대리",
  "contact_phone": "010-1234-5678",
  "contact_email": "kim@techstartup.com",
  "preferred_subway": "강남역",
  "actual_users": 10,
  "preferred_capacity": 12,
  "move_in_date": "2025-01-15",
  "move_in_period": "early",
  "lease_period": 12,
  "additional_info": "회의실 필요",
  "selected_brands": ["brand_id_1", "brand_id_2"]
}

// Response
{
  "success": true,
  "proposal_request_id": "uuid",
  "emails_sent": 2
}
```

#### POST /api/proposals/requests/:id/add
```json
// Request
{
  "additional_brands": ["brand_id_3", "brand_id_4"]
}

// Response
{
  "success": true,
  "emails_sent": 2,
  "total_brands": 4
}
```

#### POST /api/proposals/requests/:id/modify
```json
// Request
{
  "company_name": "(주)테크스타트업",
  "move_in_date": "2025-02-01",
  "actual_users": 15
}

// Response
{
  "success": true,
  "emails_sent": 2,
  "brands_updated": 2
}
```

### 4.8 제안서 (Proposal Documents)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/proposals/documents` | 제안서 목록 | ✅ |
| POST | `/api/proposals/documents` | 제안서 생성 | ✅ |
| GET | `/api/proposals/documents/:id` | 제안서 상세 | ✅ |
| PUT | `/api/proposals/documents/:id` | 제안서 수정 | ✅ |
| GET | `/api/proposals/documents/:id/pdf` | PDF 다운로드 | ✅ |

### 4.9 파일 업로드 (Upload)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/image` | 이미지 업로드 | ✅ |
| POST | `/api/upload/pdf` | PDF 업로드 | ✅ |

### 4.10 외부 API (External)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/external/kakao/address` | 주소 검색 | ✅ |
| POST | `/api/external/building-registry` | 건축물대장 조회 | ✅ |
| POST | `/api/external/email/send` | 이메일 발송 | ✅ |

### 4.11 관리자 (Admin)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/api/admin/dashboard` | 대시보드 통계 | ✅ | Admin |
| GET | `/api/admin/statistics` | 각종 지표 | ✅ | Admin |
| GET | `/api/admin/activities` | 최근 활동 | ✅ | Admin |

---

## 5. 백엔드 구조

### 5.1 디렉토리 구조
```
backend/
├── src/
│   ├── routes/              # 라우트 정의
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── brand.routes.js
│   │   ├── manager.routes.js
│   │   ├── branch.routes.js
│   │   ├── option.routes.js
│   │   ├── deleteRequest.routes.js
│   │   ├── proposalRequest.routes.js
│   │   ├── proposalDocument.routes.js
│   │   ├── upload.routes.js
│   │   ├── external.routes.js
│   │   └── admin.routes.js
│   │
│   ├── controllers/         # 컨트롤러 (요청 처리)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── brand.controller.js
│   │   ├── manager.controller.js
│   │   ├── branch.controller.js
│   │   ├── option.controller.js
│   │   ├── deleteRequest.controller.js
│   │   ├── proposalRequest.controller.js
│   │   ├── proposalDocument.controller.js
│   │   ├── upload.controller.js
│   │   ├── external.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── brand.service.js
│   │   ├── manager.service.js
│   │   ├── branch.service.js
│   │   ├── option.service.js
│   │   ├── deleteRequest.service.js
│   │   ├── proposalRequest.service.js
│   │   ├── proposalDocument.service.js
│   │   ├── upload.service.js
│   │   ├── email.service.js
│   │   ├── kakaoMap.service.js
│   │   └── buildingRegistry.service.js
│   │
│   ├── middlewares/         # 미들웨어
│   │   ├── auth.middleware.js      # JWT 인증
│   │   ├── admin.middleware.js     # Admin 권한
│   │   ├── validation.middleware.js # 입력 검증
│   │   ├── error.middleware.js     # 에러 핸들링
│   │   └── rateLimit.middleware.js # Rate Limiting
│   │
│   ├── utils/               # 유틸리티
│   │   ├── logger.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── dateUtils.js
│   │   └── errorHandler.js
│   │
│   ├── config/              # 설정
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   ├── email.js
│   │   └── constants.js
│   │
│   ├── prisma/              # Prisma
│   │   └── schema.prisma
│   │
│   └── server.js            # 서버 진입점
│
├── package.json
└── .env
```

### 5.2 서버 진입점 (server.js)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/brands', require('./routes/brand.routes'));
app.use('/api/managers', require('./routes/manager.routes'));
app.use('/api/branches', require('./routes/branch.routes'));
app.use('/api/options', require('./routes/option.routes'));
app.use('/api/delete-requests', require('./routes/deleteRequest.routes'));
app.use('/api/proposals/requests', require('./routes/proposalRequest.routes'));
app.use('/api/proposals/documents', require('./routes/proposalDocument.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/external', require('./routes/external.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Error Middleware
app.use(require('./middlewares/error.middleware'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 5.3 핵심 미들웨어

#### auth.middleware.js
```javascript
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '인증 토큰이 없습니다' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId } 
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: '유효하지 않은 사용자입니다' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '인증에 실패했습니다' 
    });
  }
};

module.exports = authMiddleware;
```

#### admin.middleware.js
```javascript
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: '관리자 권한이 필요합니다' 
    });
  }
  next();
};

module.exports = adminMiddleware;
```

---

## 6. 프론트엔드 구조

### 6.1 디렉토리 구조
```
frontend/
├── public/
├── src/
│   ├── assets/              # 이미지, 폰트 등
│   │
│   ├── components/          # 공통 컴포넌트
│   │   ├── common/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Loading.jsx
│   │   │
│   │   ├── main/            # 메인 페이지 컴포넌트
│   │   │   ├── Sidebar.jsx
│   │   │   ├── BrandListModal.jsx
│   │   │   ├── ManagerListModal.jsx
│   │   │   ├── BranchListModal.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── OptionCard.jsx
│   │   │   ├── OptionDetailSlide.jsx
│   │   │   └── Footer.jsx
│   │   │
│   │   └── admin/           # 관리자 컴포넌트
│   │       ├── StatisticsCard.jsx
│   │       └── RecentActivities.jsx
│   │
│   ├── pages/               # 페이지
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── VerifyEmail.jsx
│   │   │
│   │   ├── main/
│   │   │   └── MainPage.jsx
│   │   │
│   │   ├── options/
│   │   │   ├── OptionRegister.jsx
│   │   │   ├── OptionEdit.jsx
│   │   │   └── OptionDetail.jsx
│   │   │
│   │   ├── proposals/
│   │   │   ├── ProposalRequest.jsx
│   │   │   ├── ProposalRequestList.jsx
│   │   │   ├── ProposalRequestDetail.jsx
│   │   │   ├── ProposalRequestAdd.jsx
│   │   │   ├── ProposalRequestModify.jsx
│   │   │   └── ProposalCreate.jsx
│   │   │
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── brands/
│   │       ├── managers/
│   │       ├── branches/
│   │       ├── options/
│   │       ├── deleteRequests/
│   │       └── users/
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useAuth.js
│   │   ├── useModal.js
│   │   ├── useToast.js
│   │   └── useApi.js
│   │
│   ├── context/             # Context API
│   │   └── AuthContext.jsx
│   │
│   ├── services/            # API 호출
│   │   └── api.js
│   │
│   ├── utils/               # 유틸리티
│   │   ├── validators.js
│   │   └── formatters.js
│   │
│   ├── App.jsx              # 메인 App
│   └── main.jsx             # 진입점
│
├── package.json
├── tailwind.config.js
└── vite.config.js
```

### 6.2 라우팅 구조 (App.jsx)
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

// Main Pages
import MainPage from './pages/main/MainPage';
import OptionRegister from './pages/options/OptionRegister';
import OptionEdit from './pages/options/OptionEdit';

// Proposal Pages
import ProposalRequest from './pages/proposals/ProposalRequest';
import ProposalRequestList from './pages/proposals/ProposalRequestList';
import ProposalRequestDetail from './pages/proposals/ProposalRequestDetail';
import ProposalRequestAdd from './pages/proposals/ProposalRequestAdd';
import ProposalRequestModify from './pages/proposals/ProposalRequestModify';
import ProposalCreate from './pages/proposals/ProposalCreate';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import BrandManagement from './pages/admin/brands/BrandManagement';
import ManagerManagement from './pages/admin/managers/ManagerManagement';
import BranchManagement from './pages/admin/branches/BranchManagement';
import OptionManagement from './pages/admin/options/OptionManagement';
import DeleteRequestManagement from './pages/admin/deleteRequests/DeleteRequestManagement';

// Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainPage />} />
            
            {/* Options */}
            <Route path="/options/register" element={<OptionRegister />} />
            <Route path="/options/edit/:id" element={<OptionEdit />} />
            
            {/* Proposals */}
            <Route path="/proposals/request" element={<ProposalRequest />} />
            <Route path="/proposals/requests" element={<ProposalRequestList />} />
            <Route path="/proposals/requests/:id" element={<ProposalRequestDetail />} />
            <Route path="/proposals/requests/:id/add" element={<ProposalRequestAdd />} />
            <Route path="/proposals/requests/:id/modify" element={<ProposalRequestModify />} />
            <Route path="/proposals/create" element={<ProposalCreate />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/brands" element={<BrandManagement />} />
            <Route path="/admin/managers" element={<ManagerManagement />} />
            <Route path="/admin/branches" element={<BranchManagement />} />
            <Route path="/admin/options" element={<OptionManagement />} />
            <Route path="/admin/delete-requests" element={<DeleteRequestManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 6.3 API 서비스 (services/api.js)
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Brand API
export const brandAPI = {
  getAll: (params) => api.get('/brands', { params }),
  getById: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
  checkDuplicate: (data) => api.post('/brands/check-duplicate', data),
  getAvailableForAddition: (proposalId) => 
    api.get(`/brands/available-for-addition?proposal_id=${proposalId}`),
};

// Manager API
export const managerAPI = {
  getAll: (params) => api.get('/managers', { params }),
  getById: (id) => api.get(`/managers/${id}`),
  create: (data) => api.post('/managers', data),
  update: (id, data) => api.put(`/managers/${id}`, data),
  delete: (id) => api.delete(`/managers/${id}`),
};

// Branch API
export const branchAPI = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Option API
export const optionAPI = {
  getAll: (params) => api.get('/options', { params }),
  getById: (id) => api.get(`/options/${id}`),
  getMy: () => api.get('/options/my'),
  create: (data) => api.post('/options', data),
  update: (id, data) => api.put(`/options/${id}`, data),
  requestDelete: (id, data) => api.delete(`/options/${id}`, { data }),
};

// Delete Request API
export const deleteRequestAPI = {
  getAll: (params) => api.get('/delete-requests', { params }),
  getById: (id) => api.get(`/delete-requests/${id}`),
  approve: (id) => api.post(`/delete-requests/${id}/approve`),
  reject: (id, data) => api.post(`/delete-requests/${id}/reject`, data),
};

// Proposal Request API
export const proposalRequestAPI = {
  getAll: (params) => api.get('/proposals/requests', { params }),
  getById: (id) => api.get(`/proposals/requests/${id}`),
  create: (data) => api.post('/proposals/requests', data),
  update: (id, data) => api.put(`/proposals/requests/${id}`, data),
  addBrands: (id, data) => api.post(`/proposals/requests/${id}/add`, data),
  modify: (id, data) => api.post(`/proposals/requests/${id}/modify`, data),
};

// Proposal Document API
export const proposalDocumentAPI = {
  getAll: () => api.get('/proposals/documents'),
  getById: (id) => api.get(`/proposals/documents/${id}`),
  create: (data) => api.post('/proposals/documents', data),
  update: (id, data) => api.put(`/proposals/documents/${id}`, data),
  downloadPDF: (id) => api.get(`/proposals/documents/${id}/pdf`, { 
    responseType: 'blob' 
  }),
};

// Upload API
export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  pdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// External API
export const externalAPI = {
  searchAddress: (data) => api.post('/external/kakao/address', data),
  getBuildingInfo: (data) => api.post('/external/building-registry', data),
  sendEmail: (data) => api.post('/external/email/send', data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStatistics: () => api.get('/admin/statistics'),
  getActivities: () => api.get('/admin/activities'),
};

export default api;
```

---

## 7. 페이지별 상세 명세

### 7.1 메인 페이지 (/)

**컴포넌트 구조:**
```
MainPage
├── Sidebar (브랜드/매니저/지점 목록)
├── SearchBar (통합 검색)
├── FilterBar (필터링 + 정렬)
├── OptionCard[] (옵션 카드 리스트)
├── Footer (체크박스 선택시)
└── OptionDetailSlide (옵션 상세)
```

**핵심 기능:**
1. **검색**: 브랜드명, 지점명, 옵션명으로 통합 검색
2. **필터**: 브랜드, 지점, 작성자로 필터링
3. **정렬**: 최신순, 오래된순, 가격 낮은순, 가격 높은순
4. **체크박스 선택**: 여러 옵션 선택 후 제안서 생성
5. **옵션 상세 슬라이드**: 옵션 클릭시 우측에서 슬라이드 형태로 상세 정보 표시

**상태 관리:**
```jsx
const [options, setOptions] = useState([]);
const [filters, setFilters] = useState({
  brands: [],
  branches: [],
  creators: [],
  search: '',
  sort: 'latest',
});
const [selectedOptions, setSelectedOptions] = useState([]);
const [detailSlideOption, setDetailSlideOption] = useState(null);
const [loading, setLoading] = useState(false);
```

**API 호출:**
```jsx
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
```

### 7.2 옵션 등록 (/options/register)

**단계별 폼:**
1. **브랜드/지점 선택**
2. **기본 정보**: 옵션명, 분류, 인실
3. **가격 정보**: 월사용료, 보증금, 정가, 일회성비용
4. **계약 정보**: 입주가능일, 계약기간
5. **추가 정보**: 오피스정보, 크레딧, 냉난방, 주차, 메모, 평면도

**유효성 검증:**
- 브랜드/지점 필수 선택
- 옵션명 입력 필수
- 인실 양수 입력
- 가격 양수 입력
- 입주가능일 타입별 값 입력

### 7.3 제안 요청 (/proposals/request)

**폼 구성:**
```jsx
// 고객사 정보
- 고객사명 *
- 담당자 이름 *
- 담당자 직책
- 담당자 연락처 *
- 담당자 이메일 *

// 입주 조건
- 희망 지하철역 *
- 실사용 인원 *
- 희망 인실
- 입주 예정일 *
- 입주 희망 기간 *
- 임대 기간 *
- 추가 정보

// 브랜드 선택
- 브랜드 복수 선택 *
```

**제출 플로우:**
1. 폼 유효성 검증
2. API 호출: `POST /api/proposals/requests`
3. 성공 모달 표시 (발송 완료 브랜드 수 표시)
4. "제안 요청 관리"로 이동

### 7.4 제안 요청 상세 (/proposals/requests/:id)

**표시 정보:**
- 고객사 정보 (읽기 전용)
- 입주 조건 (읽기 전용)
- 발송 내역 (브랜드별 발송 시간)

**액션 버튼:**
- **[추가 제안 요청]**: `/proposals/requests/:id/add`로 이동
- **[변경 제안 요청]**: `/proposals/requests/:id/modify`로 이동

### 7.5 추가 제안 요청 (/proposals/requests/:id/add)

**표시 정보:**
- 고객사 정보 (읽기 전용, 회색 배경)
- 입주 조건 (읽기 전용, 회색 배경)
- 기존 발송 브랜드 (태그 형태)

**추가 브랜드 선택:**
- 드롭다운에서 기존 발송 브랜드 제외한 브랜드만 표시
- 선택된 브랜드는 태그 형태로 표시
- 각 태그에 `✕` 버튼으로 제거 가능

**제출 플로우:**
1. 추가 브랜드 선택
2. API 호출: `POST /api/proposals/requests/:id/add`
3. 성공 모달 표시
4. 제안 요청 상세로 이동

### 7.6 변경 제안 요청 (/proposals/requests/:id/modify)

**표시 정보:**
- 고객사 정보 (읽기 전용, 회색 배경)
- 입주 조건 (수정 가능, 흰색 배경)
- 기존 발송 브랜드 (태그 형태)

**수정 가능 항목:**
- 희망 지하철역
- 실사용 인원
- 희망 인실
- 입주 예정일
- 입주 희망 기간
- 임대 기간
- 추가 정보

**제출 플로우:**
1. 입주 조건 수정
2. API 호출: `POST /api/proposals/requests/:id/modify`
3. 이메일 제목에 `[변경]` 표시
4. 이메일 본문에 변경 안내 추가
5. 성공 모달 표시
6. 제안 요청 상세로 이동

### 7.7 제안서 생성 (/proposals/create)

**단계별 프로세스:**

**Step 1: 옵션 순서 및 정보 변경**
- 선택된 옵션 목록 표시 (드래그 앤 드롭으로 순서 변경)
- 각 옵션별 커스텀 정보 입력 가능

**Step 2: 제안서명 작성**
- 기본값: `{고객사명}_공유오피스_제안서`
- 수정 가능

**Step 3: PDF 미리보기 및 출력**
- Google Docs 템플릿 기반 PDF 생성
- PDF 미리보기
- 다운로드 버튼

### 7.8 관리자 대시보드 (/admin)

**표시 정보:**
- 총 브랜드 수
- 총 지점 수
- 총 옵션 수
- 활성 사용자 수
- 대기중 삭제 요청 수

**최근 활동:**
- 최근 등록된 옵션
- 최근 삭제 요청
- 최근 제안 요청

### 7.9 삭제 요청 관리 (/admin/delete-requests)

**목록 표시:**
- 요청일시
- 옵션명
- 요청자
- 요청 사유
- 상태 (대기중, 승인, 거부)

**상세 페이지:**
- 옵션 정보 전체 표시
- 요청 사유 표시
- 승인/거부 버튼

**승인 플로우:**
1. [승인] 버튼 클릭
2. 확인 모달
3. API 호출: `POST /api/delete-requests/:id/approve`
4. 옵션 상태 → `deleted`
5. 목록으로 이동

**거부 플로우:**
1. [거부] 버튼 클릭
2. 거부 사유 입력 모달
3. API 호출: `POST /api/delete-requests/:id/reject`
4. 옵션 상태 → `active` (복구)
5. 목록으로 이동

---

## 8. 외부 API 연동

### 8.1 KakaoMap API

**사용 목적:** 주소 검색 및 좌표 변환

**API 엔드포인트:**
```
GET https://dapi.kakao.com/v2/local/search/address.json
Headers: Authorization: KakaoAK {KAKAO_REST_API_KEY}
Query: ?query={주소}
```

**응답 예시:**
```json
{
  "documents": [
    {
      "address_name": "서울 강남구 역삼동 123-45",
      "x": "127.0276368",
      "y": "37.4979505"
    }
  ]
}
```

**구현 위치:**
- 백엔드: `src/services/kakaoMap.service.js`
- 프론트엔드: 지점 등록 페이지

### 8.2 건축물대장 API

**사용 목적:** 건물 정보 조회 (사용승인일, 층수, 연면적)

**API 엔드포인트:**
```
GET http://apis.data.go.kr/1613000/BldRgstService_v2/getBrBasisOulnInfo
Query:
- ServiceKey: {BUILDING_REGISTRY_API_KEY}
- sigunguCd: {시군구코드}
- bjdongCd: {법정동코드}
- bun: {번}
- ji: {지}
```

**구현 위치:**
- 백엔드: `src/services/buildingRegistry.service.js`
- 프론트엔드: 지점 등록 페이지

### 8.3 Cloudinary API

**사용 목적:** 이미지/파일 업로드

**구현:**
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

**구현 위치:**
- 백엔드: `src/services/upload.service.js`
- 프론트엔드: 지점 등록, 옵션 등록 페이지

### 8.4 Nodemailer (이메일 발송)

**설정:**
```javascript
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

const sendEmail = async ({ to, cc, replyTo, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    cc,
    replyTo,
    subject,
    html,
  });
};
```

**이메일 템플릿 예시:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <p>안녕하십니까, {{브랜드명}} {{매니저명}} 매니저님.</p>
  <p>패스트매치 {{요청자명}}입니다.</p>
  <br>
  <p>신규 고객사가 있어 문의드립니다.</p>
  <br>
  <table>
    <tr><th>고객사명</th><td>{{고객사명}}</td></tr>
    <tr><th>담당자</th><td>{{담당자명}} ({{담당자직책}})</td></tr>
    <tr><th>연락처</th><td>{{담당자연락처}}</td></tr>
    <tr><th>이메일</th><td>{{담당자이메일}}</td></tr>
    <tr><th>희망지하철역</th><td>{{희망지하철역}}</td></tr>
    <tr><th>인실</th><td>{{인실정보}}</td></tr>
    <tr><th>입주예정일</th><td>{{입주예정일}} ({{입주희망기간}})</td></tr>
    <tr><th>임대기간</th><td>{{임대기간}}개월</td></tr>
    <tr><th>추가정보</th><td>{{추가정보}}</td></tr>
  </table>
  <br>
  <p>제안 가능한 공실 있으면 피드백 부탁드립니다.</p>
  <p>감사합니다.</p>
  <br>
  <p>패스트매치 {{요청자명}} 드림.</p>
  <br>
  <hr>
  <p style="font-size: 12px; color: #888;">
    {{요청자명}}<br>
    {{요청자이메일}}<br>
    패스트매치
  </p>
</body>
</html>
```

**구현 위치:**
- 백엔드: `src/services/email.service.js`
- 사용: 제안 요청 생성/추가/변경시 자동 발송

---

## 9. 개발 지침

### 9.1 AI 코딩시 필수 준수사항

#### 🔴 절대 규칙

1. **데이터베이스 스키마 변경 금지**
   - Prisma Schema는 절대 수정하지 않음
   - 모든 필드명, 관계, 타입은 위 명세 그대로 유지

2. **API 엔드포인트 변경 금지**
   - URL 경로, HTTP 메서드, Request/Response 구조는 명세 그대로
   - 새로운 엔드포인트 추가시 명세 업데이트 필수

3. **인증/권한 로직 변경 금지**
   - JWT 기반 인증 유지
   - Admin/User 역할 구분 유지
   - 권한 체크 미들웨어는 모든 보호된 라우트에 적용

4. **파일 구조 변경 금지**
   - 디렉토리 구조는 명세 그대로 유지
   - 파일 위치 변경시 명세 업데이트 필수

5. **비즈니스 로직 변경 금지**
   - 옵션 삭제 프로세스
   - 제안 요청 이메일 발송 로직
   - 이메일 구조 (From, To, Cc, Reply-To)

#### 🟢 권장 사항

1. **컴포넌트 분리**
   - 50줄 이상 컴포넌트는 작은 단위로 분리
   - 재사용 가능한 컴포넌트는 `components/common/`에 배치

2. **에러 처리**
   - 모든 API 호출에 try-catch 적용
   - 사용자 친화적 에러 메시지 표시
   - 백엔드에서 일관된 에러 응답 형식 사용

3. **로딩 상태 관리**
   - 모든 비동기 작업에 로딩 상태 표시
   - 로딩 중 버튼 비활성화

4. **유효성 검증**
   - 프론트엔드: 실시간 검증 + 제출시 검증
   - 백엔드: 모든 입력 검증 필수

5. **코드 주석**
   - 복잡한 로직에는 주석 추가
   - 함수/컴포넌트 상단에 목적 설명

### 9.2 네이밍 컨벤션

#### 백엔드 (JavaScript)
```javascript
// 파일명: camelCase.js
// 예: authService.js, brandController.js

// 함수/변수: camelCase
const getUserById = async (userId) => { ... }
const totalCount = 100;

// 클래스: PascalCase
class EmailService { ... }

// 상수: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10485760;
const JWT_EXPIRES_IN = '7d';
```

#### 프론트엔드 (React)
```jsx
// 컴포넌트 파일명: PascalCase.jsx
// 예: MainPage.jsx, OptionCard.jsx

// 컴포넌트명: PascalCase
function MainPage() { ... }
const OptionCard = ({ option }) => { ... }

// 함수/변수: camelCase
const [options, setOptions] = useState([]);
const fetchOptions = async () => { ... }

// Custom Hook: use로 시작
const useAuth = () => { ... }
const useModal = () => { ... }
```

#### 데이터베이스 (Prisma)
```prisma
// 모델명: PascalCase
model User { ... }
model ProposalRequest { ... }

// 필드명: snake_case
email_verified  Boolean
is_smatch_domain Boolean
created_at DateTime

// Enum: PascalCase
enum Role {
  user
  admin
}
```

### 9.3 Git 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 패키지 매니저 수정

예시:
feat: 옵션 등록 페이지 구현
fix: 제안 요청 이메일 발송 버그 수정
docs: API 엔드포인트 명세 업데이트
```

### 9.4 개발 순서 (AI에게 지시할 순서)

#### Phase 1: 백엔드 기본 구조
1. Prisma Schema 설정
2. 인증 API (register, login, verify-email)
3. 미들웨어 (auth, admin, error)

#### Phase 2: 백엔드 핵심 기능
4. Brand, Manager, Branch CRUD
5. Option CRUD
6. Delete Request 처리
7. Proposal Request (이메일 발송 포함)
8. Proposal Document (PDF 생성 포함)

#### Phase 3: 백엔드 부가 기능
9. Upload (Cloudinary)
10. External API (KakaoMap, 건축물대장)
11. Admin 대시보드

#### Phase 4: 프론트엔드 인증
12. Login, Register, VerifyEmail 페이지
13. AuthContext 구현
14. ProtectedRoute, AdminRoute 구현

#### Phase 5: 프론트엔드 메인 기능
15. MainPage (옵션 목록, 검색, 필터)
16. Option Register/Edit 페이지
17. Proposal Request 페이지
18. Proposal Request List/Detail 페이지
19. Proposal Request Add/Modify 페이지
20. Proposal Create 페이지 (PDF 생성)

#### Phase 6: 프론트엔드 관리자
21. Admin Dashboard
22. Brand/Manager/Branch 관리 페이지
23. Delete Request 관리 페이지

#### Phase 7: 테스트 및 배포
24. 통합 테스트
25. 배포 준비

### 9.5 AI에게 요청시 템플릿

```markdown
### 요청 사항
[명확한 작업 설명]

### 참조 문서
- 데이터베이스: Section 3.2 Prisma Schema
- API: Section 4.X [해당 섹션]
- 백엔드 구조: Section 5.1
- 프론트엔드 구조: Section 6.1

### 준수 사항
- 데이터베이스 스키마 변경 금지
- API 엔드포인트 명세 준수
- 파일 구조 명세 준수
- 에러 처리 필수
- 로딩 상태 관리 필수

### 예상 결과물
[생성될 파일 목록 및 기능 설명]
```

**예시:**
```markdown
### 요청 사항
브랜드 목록 조회 API를 구현해주세요.

### 참조 문서
- API: Section 4.2 브랜드 (Brands)
- 백엔드 구조: Section 5.1
- Prisma Schema: Section 3.2

### 준수 사항
- GET /api/brands 엔드포인트 구현
- Query Parameters: status, search 지원
- JWT 인증 필수 (authMiddleware)
- Response 구조는 API 명세 준수

### 예상 결과물
1. src/routes/brand.routes.js - 라우트 정의
2. src/controllers/brand.controller.js - 컨트롤러
3. src/services/brand.service.js - 비즈니스 로직
```

---

## 10. 배포 가이드

### 10.1 환경 변수 설정

**개발 환경 (.env.development)**
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

**프로덕션 환경 (.env.production)**
```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
DATABASE_URL=postgresql://...
```

### 10.2 빌드 명령어

**백엔드:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

**프론트엔드:**
```bash
cd frontend
npm install
npm run build
```

### 10.3 배포 체크리스트

- [ ] 환경 변수 모두 설정
- [ ] Prisma 마이그레이션 실행
- [ ] Cloudinary 계정 설정
- [ ] KakaoMap API 키 발급
- [ ] 건축물대장 API 키 발급
- [ ] 이메일 SMTP 설정
- [ ] CORS 설정 확인
- [ ] 프론트엔드 빌드 완료
- [ ] 데이터베이스 백업 설정
- [ ] 로그 모니터링 설정

---

## 📌 주요 참고 사항

### 1. 이메일 발송 로직 핵심
```javascript
// Reply-To를 User 이메일로 설정하여 회신이 User에게 직접 전달
await sendEmail({
  from: 'noreply@fastmatch.kr',
  to: manager.email,
  cc: [manager.cc_email, user.email, 'official@fastmatch.kr'],
  replyTo: user.email,  // ← 핵심
  subject: '...',
  html: '...',
});
```

### 2. 삭제 요청 워크플로우
```
User: DELETE /api/options/:id { reason: "..." }
  → Option.status = 'delete_requested'
  → DeleteRequest 생성

Admin: POST /api/delete-requests/:id/approve
  → Option.status = 'deleted'
  → DeleteRequest.status = 'approved'

Admin: POST /api/delete-requests/:id/reject { reason: "..." }
  → Option.status = 'active'
  → DeleteRequest.status = 'rejected'
```

### 3. 제안 요청 추가/변경 로직
```
최초 발송: selected_brands = ['A', 'B', 'C']
추가 발송: selected_brands = ['A', 'B', 'C', 'D', 'E']
변경 발송: selected_brands 그대로, 조건만 수정 후 재발송
```

### 4. 권한 체크
```javascript
// 옵션 수정: 본인 또는 Admin만 가능
if (option.creator_id !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({ 
    success: false, 
    message: '권한이 없습니다' 
  });
}
```

---

## 📊 개발 진행 현황 (2024-11-21 기준)

### 백엔드 구현 현황
```
✅ Phase 1 (완료 - 100%)
  ├── Prisma Schema 설계
  ├── 인증 시스템 (회원가입, 로그인, 이메일 인증)
  └── 미들웨어 (JWT 인증, 관리자 권한, 에러 처리)

🔄 Phase 2 (진행 중 - 40%)
  ├── ✅ Brand CRUD
  ├── ✅ Manager CRUD
  ├── ✅ Branch CRUD
  ├── ❌ Option CRUD (다음 순)
  ├── ❌ Delete Request
  ├── ❌ Proposal Request
  └── ❌ Proposal Document

⏳ Phase 3 (대기)
  ├── File Upload (Cloudinary)
  ├── External API (KakaoMap, 건축물대장)
  └── Admin Dashboard
```

### 프론트엔드 구현 현황
```
✅ Phase 4 (완료 - 100%)
  ├── Login 페이지
  ├── Register 페이지
  ├── VerifyEmail 페이지
  ├── AuthContext (JWT 인증)
  ├── ProtectedRoute (인증 필요)
  ├── AdminRoute (관리자만)
  ├── useAuth Hook
  └── API 서비스 (46개 메서드)

⏳ Phase 5 (대기 - 0%)
  ├── MainPage
  ├── Option Pages (등록, 수정, 삭제)
  └── OptionCard 컴포넌트

⏳ Phase 6 (대기 - 0%)
  ├── Proposal Request Pages
  ├── Proposal Document Pages
  └── Admin Pages
```

### 구현된 파일 목록

**백엔드 (19개 파일)**
- Routes: auth, brand, manager, branch
- Controllers: auth, brand, manager, branch
- Services: auth, brand, manager, branch, email
- Middlewares: auth, admin, error, validation
- Config: email
- Server: express 진입점

**프론트엔드 (15개 파일)**
- Context: AuthContext.jsx (JWT 인증, 회원가입, 로그인, 로그아웃)
- Pages/Auth: Login.jsx, Register.jsx, VerifyEmail.jsx
- Components/Common: ProtectedRoute.jsx, AdminRoute.jsx
- Hooks: useAuth.js (AuthContext 접근 훅)
- Services: api.js (46개 API 메서드 정의)
- Router 설정: App.jsx (7개 라우트)
- 진입점: main.jsx

---

## 🎯 다음 개발 단계

### 즉시 진행할 작업 (Priority 1)
1. **Option CRUD** - 핵심 기능
2. **Delete Request** - 비즈니스 로직
3. **Proposal Request** - 이메일 발송
4. **Proposal Document** - PDF 생성

### 그 다음 진행할 작업 (Priority 2)
5. **프론트엔드 인증** - 백엔드 완료 후
6. **프론트엔드 메인** - UI 구현
7. **관리자 기능** - 마지막

---

## 최종 체크리스트

이 문서를 AI에게 제공하기 전에 확인:

- [x] 모든 API 엔드포인트가 명확하게 정의되어 있는가?
- [x] 데이터베이스 스키마가 완벽하게 정의되어 있는가?
- [x] 백엔드/프론트엔드 파일 구조가 명확한가?
- [x] 페이지별 상세 명세가 충분한가?
- [x] 외부 API 연동 방법이 명확한가?
- [x] 개발 지침이 구체적인가?
- [x] 네이밍 컨벤션이 일관성 있는가?
- [x] 개발 순서가 논리적인가?

---

**이 문서는 AI 바이브코딩을 위한 완벽한 가이드입니다.**
**모든 AI 코딩 도구에게 이 문서를 먼저 제공하고, 각 Phase별로 개발을 진행하세요.**
**중간에 AI가 명세를 벗어나면 즉시 이 문서를 다시 참조하도록 지시하세요.**

---

**문서 버전**: 1.2.0
**최종 수정일**: 2024-11-21
**현재 진행 단계**: Phase 2 (백엔드 40%) + Phase 4 (프론트엔드 인증 100% 완료)
**전체 진행률**: 50%
**작성자**: FASTMATCH 개발팀 + Claude Code
