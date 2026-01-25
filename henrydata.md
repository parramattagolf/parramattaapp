# Henry's App Data Structure Document

이 문서는 앱의 각 페이지에서 사용되는 Supabase 테이블과 주요 데이터 컬럼을 정리한 파일입니다.

## 1. 🏠 메인/로그인 (Landing/Auth)
- **페이지 경로**: `/`, `/login`, `/auth/callback`
- **사용 테이블**: `users`
- **주요 데이터**:
  - `profile` (metadata from Kakao): `nickname`, `profile_image_url`
  - `users`: `id`, `email`, `kakao_id`, `nickname`, `profile_img`
- **설명**: 
  - 카카오 로그인을 통해 사용자 인증을 처리합니다.
  - 로그인 성공 시 `users` 테이블에 정보를 저장하거나 업데이트(`upsert`)합니다.

## 2. 👤 마이 페이지 (My Page)
- **페이지 경로**: `/my`
- **사용 테이블**: `users`, `participants`, `notifications`, `sponsors` (via badges)
- **주요 데이터**:
  - `users`: 
    - 기본 정보: `nickname`, `real_name` (실명), `profile_img`, `email`, `kakao_id`
    - 골프 정보: `golf_experience` (구력), `handicap`, `job`, `membership_level` (등급)
    - 점수/랭킹: `manner_score` (매너점수), `points` (포인트)
  - `participants`: 라운딩 참여 내역 카운트 (`user_id` 기준 조회)
  - `notifications`: 읽지 않은 알림 개수 (`is_read: false`)
- **설명**: 
  - 사용자의 종합적인 프로필 통계와 정보를 보여줍니다.
  - 리얼 네임(`real_name`)과 닉네임(`nickname`)을 함께 표시합니다.

## 3. ⛳ 라운딩 목록 (Rounds List)
- **페이지 경로**: `/rounds`
- **사용 테이블**: `events`, `users` (Host), `sponsors`, `participants`, `pre_reservations`
- **주요 데이터**:
  - `events`: 
    - `id`, `start_date`, `theme`, `is_public`
    - `host_id` -> `users(nickname, profile_img)`
    - `sponsor_id` -> `sponsors(name, logo_url)`
  - `participants`: 각 이벤트별 참여자 수 카운트 (`count`)
  - `pre_reservations`: 각 이벤트별 사전 예약자 수 카운트 (`count`)
- **설명**: 
  - 등록된 라운딩(이벤트) 목록을 월별(`start_date`)로 그룹화하여 보여줍니다.
  - 호스트와 스폰서 정보를 조인(Join)하여 함께 표시합니다.

## 4. 👥 멤버 목록 (Members List)
- **페이지 경로**: `/members`
- **사용 테이블**: `users`, `participants`, `pre_reservations`
- **RPC 함수**: `get_member_list_with_distance`
- **주요 데이터**:
  - `users`: `id`, `nickname`, `profile_img`, `gender`, `manner_score`
  - `participants`: 해당 멤버가 라운딩 참여자인지 여부 (`isParticipant`)
  - `pre_reservations`: 해당 멤버가 사전 예약자인지 여부 (`isPreBooked`)
  - `rpc`: 나와의 거리 관계 (`distance`, 예: 1촌, 2촌)
- **설명**: 
  - 전체 회원 목록을 보여주며, 나와의 인맥 거리(촌수)를 계산하여 표시합니다.
  - 매너 점수(`manner_score`)를 기반으로 상위 퍼센트(%)를 계산합니다.

## 5. 🔔 알림 센터 (Notifications)
- **페이지 경로**: `/notifications`
- **사용 테이블**: `notifications`
- **주요 데이터**:
  - `notifications`: 
    - `id`, `type` ('global', 'invite', etc), `title`, `content`
    - `is_read`, `created_at`, `link_url`
- **설명**: 
  - 나에게 온 개인 알림(`receiver_id`)과 전체 공지(`type: global`)를 통합하여 보여줍니다.
  - '읽음 처리' 및 관련 링크 이동 기능을 제공합니다.

## 6. ⚙️ 설정 (Settings)
- **페이지 경로**: `/settings`
- **사용 테이블**: `users`
- **주요 데이터**:
  - `users`: 본인의 프로필 정보 전체 수정 가능
- **설명**: 
  - 닉네임, 프로필 사진 등은 카카오 동기화 정책에 따라 수정 불가능할 수 있음(정책 의존).
  - 구력, 핸디캡, 직업 등 부가 정보 수정.

---
**작성일**: 2026-01-26
**작성자**: Antigravity Agent
