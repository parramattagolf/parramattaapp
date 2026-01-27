# Admin Web Development Guide

This document serves as the **single source of truth** for building the Parramatta Golf Admin Web. It details the mapping between the database schema and application terminology, and provides structural guidelines for efficient management.

## 1. Database & Terminology Mapping

### A. Rounds (Events)
**Table:** `public.events`

| DB Column | App Term (Admin UI) | Description / Notes |
| :--- | :--- | :--- |
| `id` | ID | UUID (Hidden mostly) |
| `title` | 라운딩명 (제목) | Event title displayed on cards. |
| `start_date` | 시작 일시 | Date & Time. Used to calculate "D-Day" and sort future/past. |
| `end_date` | 종료 일시 | Used to calculate duration (e.g., 당일, 1박 2일). |
| `location` | 장소 (골프장) | Name of the golf course or location. |
| `max_participants` | 정원 (최대 인원) | Default 4. Determines "Deadline" status if full. |
| `payment_deadline_hours` | 결제 마감 시간 | Hours before start to pay? (Check logic). |
| `host_id` | 호스트 (방장) | User who created the round. |
| `created_at` | 생성일 | |

**Table:** `public.participants`
| DB Column | App Term | Description |
| :--- | :--- | :--- |
| `user_id` | 참가자 | User joining the round. |
| `status` | 상태 | `joined` (참가), `paid` (결제완료), `waiting` (대기). |

---

### B. Connections (Inmaek / Relationships)
**Table:** `public.relationships`

| DB Column | App Term (Admin UI) | Description / Notes |
| :--- | :--- | :--- |
| `user_id` | 요청자 (User A) | |
| `friend_id` | 대상자 (User B) | |
| `status` | 관계 상태 | `pending` (요청중), `accepted` (1촌/친구). |
| - | 촌수 (Distance) | Calculated via RPC `get_member_list_with_distance`. 1=Direct, 2=Friend of Friend. |

**Table:** `public.blocks`
| DB Column | App Term | Description |
| :--- | :--- | :--- |
| `blocker_id` | 차단한 사람 | |
| `blocked_id` | 차단된 사람 | |
| `reason` | 차단 사유 | Optional text. |

---

### C. Sponsors

**Table:** `public.sponsors`

| DB Column | App Term (Admin UI) | Description / Notes |
| :--- | :--- | :--- |
| `name` | 스폰서명 | Name displayed on badges and event cards. |
| `description` | 설명 | Short description. |
| `contact_info` | 연락처 | Phone or Email. |
| `logo_url` | 로고 이미지 | URL to storage. Should be rendered with `unoptimized` in Next.js Image if external. |

**Related:** Badges system links Users to Sponsors (via `user_badges` or similar linking table if implemented, otherwise derived).

---

### D. My Page (Members/Users)

**Table:** `public.users`

| DB Column | App Term (Admin UI) | Description / Notes |
| :--- | :--- | :--- |
| `nickname` | 닉네임 | **Immutable** (Trigger protected). displayed prominently. |
| `real_name` | 실명 | Used for verification/admin view. |
| `phone` | 전화번호 | Contact info. |
| `kakao_id` | 카카오 ID | External Auth ID. |
| `manner_score` | 매너점수 | Float. Default 100. **Auto-ban** if hits 0 (Trigger). |
| `golf_experience` | 구력 | e.g., "1년", "3년", "5년", "10년". |
| `profile_img` | 프로필 이미지 | Avatar URL. |
| `points` | 포인트 | User's activity points. |
| `handicap` | 핸디 | Golf handicap (lower is better, usually). |
| `is_banned` | 차단 여부 | Boolean. True if manually banned or manner_score == 0. |
| `membership_level` | 멤버십 등급 | VIP / Regular etc. |

---

### E. Invitation & Hold Logic

- **Held Slots**: Strictly reserved for the `invited_user_id`. Cannot be joined by random users.
- **1st Degree Invite (Friends)**: Force-joins the target user directly into `participants`.
- **2nd Degree+ Invite**: Creates a `held_slots` record and sends a notification.
- **UI Visibility**: Action buttons (`Invite`, `Move`, `Leave`) are always visible. Guarded by client-side alerts for non-participants.

---

## 2. Admin Web Structure & Features

### Key Philosophy

-   **Automation First**: Rely on DB triggers for strict rules (e.g., Nickname immutability, Auto-ban).
-   **Efficiency**: Use dense, LPGA-style dark tables for data management.

### Architecture

-   **Route**: `/src/app/(admin)`
-   **Auth**: Dedicated Admin Login via Kakao (ID whitelist or `is_admin` flag).
-   **Styling**: Dark Theme (Deep Navy #002D56 base).
-   **Components**: Use `shadcn/ui` based standard tables with search/filter.

### Core Features

1.  **Dashboard**:
    -   Overview of active Rounds, New Members, Pending Reports.
    -   Manner Score outliers (Potential bans).
2.  **Rounds Management**:
    -   List View: Sort by Start Date.
    -   Detail View: Manage Participants (Force Remove/Add).
3.  **Member Management**:
    -   List View: Search by Nickname/Real Name.
    -   Actions: Adjust Manner Score, Manual Ban/Unban.
4.  **Sponsor Management**:
    -   CRUD for Sponsors.
    -   Assign Sponsors to Events.

### Automation Rules (Implemented in DB)

-   **Nickname Lock**: Updates to `nickname` column are rejected by DB trigger.
-   **Auto-Ban**: If `manner_score` becomes 0, `is_banned` is set to `true` automatically.

### UI Guidelines

-   **Images**: Use `next/image` with `unoptimized` for external storage URLs to avoid cost/limits.
-   **Tables**:
    -   Columns: `DB Name (Display Name)` format.
    -   Actions: Edit/Delete buttons on right.
