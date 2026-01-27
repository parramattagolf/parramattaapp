# Parramatta Golf - Integrated Documentation (Henry.md)

This file is a consolidation of all project documentation, guides, and specifications.

---

## 📂 Source: README.md

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### parramattaapp

- **Theme**: 프리미엄 블랙 모드 (`bg-[#121212]`, `border-white/10`).
- **Identity**: Toss 느낌의 깔끔한 카드 레이아웃과 LPGA의 정제된 타이포그래피.
- **Micro-interactions**: 버튼 클릭 시 햅틱 효과 느낌의 `active:scale-95` 모션.
- **Empty State**: 신청자가 없는 조나 웨이팅이 없는 경우 고급스러운 일러스트나 아이콘으로 처리.

#### 다크 모드 컬러 팔레트

| 구분 | 색상 코드 | 설명 |
| :--- | :--- | :--- |
| **메인 배경** | `#121212` | 칠흑같이 어두운 회색 |
| **헤더 배경** | `#121212` | 투명도 90% + 블러 효과 |
| **카드/서피스** | `#1c1c1e` | 배경보다 살짝 밝은 회색 |
| **구분선** | `rgba(255, 255, 255, 0.1)` | 은은한 경계선 |
| **텍스트** | `#FFFFFF` | 완전한 흰색 |

---

## 📂 Source: APP_STORE_GUIDE.md

# 📱 파라마타 골프 앱 스토어 출시 가이드

현재 만드신 **Next.js 웹 서비스**를 **애플 앱스토어(iOS)**와 **구글 플레이스토어(Android)**에 출시하기 위한 전체 로드맵입니다.

### 1단계: 필수 준비물 (계정 및 비용)

| 구분 | 애플 앱스토어 (Apple) | 구글 플레이스토어 (Google) |
| :--- | :--- | :--- |
| **사이트** | [Apple Developer Program](https://developer.apple.com/) | [Google Play Console](https://play.google.com/console/) |
| **비용** | **연 $99 (약 14만원 / 매년 갱신)** | **$25 (약 3만 5천원 / 평생 1회)** |
| **준비물** | D-U-N-S 번호 (사업자의 경우), 법인 카드 | 구글 계정, 해외 결제 카드 |
| **심사 기간** | 약 1~3일 (깐깐함) | 약 1~7일 (상대적으로 빠름) |

### 2단계: 기술적 변환 작업 (웹 → 앱)

Next.js에서는 **[Capacitor](https://capacitorjs.com/)**라는 도구를 가장 많이 사용합니다.

1. **Capacitor 설치**: 프로젝트에 모바일 변환 엔진을 설치합니다.
2. **네이티브 프로젝트 생성**: 명령어 한 번으로 `android` 폴더와 `ios` 폴더가 생성됩니다.
3. **기능 연결**: 카메라, 푸시 알림, 위치 정보 등 앱 고유 기능을 연결합니다. 카카오 로그인도 네이티브 SDK 방식으로 수정이 필요할 수 있습니다.
4. **빌드 (Build)**: 웹 코드를 앱용 설치 파일(`.ipa`, `.aab`)로 변환합니다.

### 3단계: 디자인 자산 준비

1. **앱 아이콘**: 1024x1024px
2. **스플래시 화면**: 앱 로딩 화면
3. **스토어 스크린샷**: 아이폰/안드로이드용 홍보 이미지

### 4단계: 심사 및 출시 주의사항

- **iOS**: 소셜 로그인 사용 시 "Apple로 로그인" 필수. 단순 웹뷰 포장 금지 (앱 전용 기능 어필 필요).
- **Android**: 개인 개발자는 20명 테스터 2주 테스트 필수 (사업자는 바로 출시 가능).

---

## 📂 Source: KAKAO_SYNC.md

# Kakao Login Profile Sync

### 📌 변경 사항 요약

카카오 로그인 시 프로필 사진과 닉네임이 자동으로 동기화되도록 시스템을 개선했습니다. **Strict Overwrite** 정책을 적용하여 카카오 데이터가 항상 최신 상태로 덮어씌워집니다.

### 🔄 동작 방식

#### 최초 로그인
`Users` 테이블에 카카오 프로필 정보(닉네임, 이미지, 이메일, 카카오ID)를 저장합니다.

#### 재방문 로그인
DB에 이미 존재하는 사용자는 **강제 업데이트(Overwrite)**를 수행합니다. 카카오톡에서 프로필을 변경하면 앱에도 즉시 반영됩니다.

### 🔒 데이터 정책

| 필드 | 정책 | 비고 |
| :--- | :--- | :--- |
| `email` | **덮어쓰기** | 카카오 데이터 우선 |
| `profile_img` | **덮어쓰기** | 카카오 데이터 우선 |
| `nickname` | **덮어쓰기** | 수정 불가 (카카오 동기화) |
| `kakao_id` | **갱신** | 고유 식별값 |

---

## 📂 Source: henryshare.md

# 🏌️ Parramatta Golf App - Henry Share Documentation (System Overview)

### 🎯 앱 개요

파라마타 골프는 골퍼들이 라운드를 검색하고 멤버를 찾고 스폰서와 연결되는 종합 골프 커뮤니티 플랫폼입니다.

- **라운드 검색**: 프라이빗/토너먼트
- **멤버 네트워킹**: 거리 기반 검색, 연결
- **스폰서 시스템**: 브랜드 혜택 및 배지
- **매너 점수**: Henry Rule 기반 관리 (-50점 차단)

### 📖 용어집 (Terminology)

- **멤버(Member)**: 가입 사용자
- **호스트(Host)**: 라운드 개설자
- **매너 점수(Manner Score)**: 초기 0점, -50점 이하 차단
- **Henry Rule**: 자동 차단 규칙

### 🗄️ 데이터베이스 구조

주요 테이블: `users`, `events`, `event_participants`, `sponsors`, `sponsor_products`, `points_history`, `manner_score_history`, `notifications`.

관리 포인트:
- `users.manner_score`: -50 이하 차단 로직
- `events.status`: 라운드 상태 관리
- `points_history`: 포인트 지급/회수 투명성

---

## 📂 Source: henrydata.md

# Henry's App Data Structure Document

앱의 주요 페이지별 사용되는 데이터와 테이블 정리.

### 1. 메인/로그인
- 테이블: `users`
- 데이터: 카카오 프로필 (`nickname`, `profile_img`)

### 2. 마이 페이지 (`/my`)
- 테이블: `users`, `participants`, `notifications`, `sponsors`
- 데이터: 구력, 핸디캡, 매너점수, 라운드/초대 횟수

### 3. 라운딩 목록 (`/rounds`)
- 테이블: `events` + Joins (`host`, `sponsor`)
- 데이터: 라운드 일정, 참가자 수, 프리미엄 여부

### 4. 멤버 목록 (`/members`)
- 테이블: `users`
- RPC: `get_member_list_with_distance` (거리 계산)

---

## 📂 Source: henrypagerule.md

# Henry Page Rule - UI/UX Rules

### 1. 라운딩 목록
- **월별 그룹화**: 라운드를 월 단위로 표시
- **유튜브 임베드**: 월 마지막에 표시
- **테두리 색상**: 참가자 있음(초록), 사전예약만 있음(파랑), 없음(흰색)

### 2. 회원 페이지 (`/my`)
- 닉네임, 매너점수, 포인트 표시
- 설정 버튼 접근성 확인

### 3. 공통 규칙
- **네비게이션**: 스크롤 시 자동 숨김 (메인 제외)
- **인디케이터**: 페이지별 고유 색상 점 표시 (라운드-초록, 인맥-파랑 등)

### 4. 페널티 규정 (Henry Rule)
- **노쇼/취소**: 매너점수 차감
- **사전예약**: 신청 시 +1점 (취소 시 회수)

### 5. 초대 및 홀드 규칙 (Invitation & Hold Rules)
- **홀드 슬롯 (Held Slots)**:
    - 지정된 초대자(`invited_user_id`)만 입장 가능.
    - 일반 사용자는 빈 자리가 없어 홀드된 좌석만 남을 경우 입장 불가.
- **초대 로직 (Invitation Types)**:
    - **1촌 (친구)**: 초대 시 즉시 참가자로 등록 (Force Join).
    - **2촌 이상**: 초대 시 빈 슬롯을 '홀드' 처리하고 초대장 발송.
- **액션 버튼**:
    - `[초대하기, 방옮기기, 방나가기]` 버튼은 항상 노출.
    - 참가자가 아닌 경우 클릭 시 "참가자만 이용 가능" 알림 표시.

---

## 📂 Source: henryimprove.md

# Project Improvement & Roadmap

### 1. 현재 구축 현황
- 카카오 싱크 완료
- 조인/사전예약, 멤버십, 알림 시스템 구축

### 2. 개선 필요 사항 (Database)
- **닉네임 중복**: 처리 로직 강화 필요
- **결제 검증**: PG사 연동 필요 (현재 수동)
- **Soft Delete**: 데이터 보존을 위해 삭제 대신 플래그 처리 권장

### 3. 디자인 고도화
- 다크 모드 Glassmorphism 강화
- 리액션 애니메이션 (Confetti 등) 추가

### 4. 미래 로드맵
- AI 스코어 분석 (OCR)
- 골프장 API 연동 (실시간 티타임)
- 카풀 매칭 서비스

---

## 📂 Source: docs/phase6_admin_automation.md

# Phase 6: Payment Automation & Admin System

### API Endpoints
- `POST /api/payment/confirm`: 결제 확정 처리 (n8n 연동)
- `POST /api/cron/auto-kick`: 미결제자 자동 퇴출 (Cron)

### Admin Dashboard
- **기능**: 행사 관리, 로그 확인, 수동 Auto-Kick
- **보안**: `is_admin=true` 체크 필수, API Secret 사용

### pg_cron Setup
DB 자체 스케줄러를 사용하여 10분마다 미결제자 정리 로직 실행 권장.

---

## 📂 Source: supabase/edge_function_proposal.md

# Auto-Kick Edge Function Proposal

### Objective
3시간 내 미결제자 자동 퇴출 시스템.

### Architecture
Supabase Edge Functions + pg_cron

### Implementation
1. **SQL Function**: `auto_kick_unpaid_users()` - 3시간 지난 `pending` 상태 참가자 삭제 및 매너점수 차감.
2. **Schedule**: `pg_cron`으로 10분마다 실행.

```sql
SELECT cron.schedule('auto-kick', '*/10 * * * *', 'SELECT auto_kick_unpaid_users()');
```
