# Phase 6: Payment Automation & Admin System

## API Endpoints

### 1. Payment Confirm API (`POST /api/payment/confirm`)
n8n에서 네이버 스토어 결제 정보를 전송하면 자동으로 매칭/확정 처리.

**Request:**
```json
{
  "phone": "010-1234-5678",
  "name": "홍길동",
  "event_id": "uuid (optional)"
}
```

**Authentication:**
```
Authorization: Bearer YOUR_PAYMENT_API_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "matched_user_id": "uuid",
  "matched_event_id": "uuid"
}
```

### 2. Auto-Kick Trigger (`POST /api/cron/auto-kick`)
n8n이나 외부 크론에서 호출하여 3시간 초과 미결제자 자동 퇴출.

**Authentication:**
```
Authorization: Bearer YOUR_PAYMENT_API_SECRET
```

**Response:**
```json
{
  "success": true,
  "kicked_count": 3,
  "timestamp": "2026-01-13T18:00:00Z"
}
```

---

## Environment Variables

Add to `.env.local`:
```
PAYMENT_API_SECRET=your-secure-random-key-here
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/parramatta-events
```

---

## n8n Workflow Examples

### Workflow 1: 네이버 스토어 결제 → 자동 확정
1. **Trigger**: 네이버 스토어 Webhook (결제 완료)
2. **HTTP Request**: POST to `/api/payment/confirm`
   - Body: `{ "phone": "{{order.buyer_phone}}", "name": "{{order.buyer_name}}" }`
3. **IF**: success === false → Send Slack/Kakao notification to admin

### Workflow 2: 10분마다 Auto-Kick 실행
1. **Trigger**: Schedule (Every 10 minutes)
2. **HTTP Request**: POST to `/api/cron/auto-kick`
3. **IF**: kicked_count > 0 → Send summary notification

### Workflow 3: 이벤트 알림 수신
- Listen on `N8N_WEBHOOK_URL`
- Events: `payment_processed`, `auto_kick_executed`
- Action: Send Kakao알림톡 or Slack message

---

## Admin Dashboard Features

**Location:** `/admin`

### 기능:
1. **행사 관리 탭**
   - 모든 행사를 테마별로 필터링/정렬
   - 참여자 테이블 (닉네임, 실명, 전화번호, 매너점수, 결제상태)
   - 3시간 초과 미결제자 빨간색 하이라이트
   - 액션 버튼: 확정, 퇴출, 매너점수 수정

2. **로그 탭**
   - 결제 매칭 실패 (`payment_unmatched`)
   - 중복 발생 (`payment_duplicate`)
   - 자동 퇴출 (`auto_kick`)
   - 수동 조치 (`manual_action`)
   - "해결 완료" 버튼으로 처리

3. **수동 Auto-Kick 버튼**
   - 긴급 시 수동으로 전체 검사/퇴출 실행

---

## pg_cron Setup (Alternative to n8n)

Supabase Dashboard → Database → Extensions → Enable `pg_cron`

```sql
-- Schedule auto-kick every 10 minutes
SELECT cron.schedule(
  'auto-kick-unpaid',
  '*/10 * * * *',
  'SELECT auto_kick_unpaid_users()'
);

-- Check scheduled jobs
SELECT * FROM cron.job;

-- Remove a job
SELECT cron.unschedule('auto-kick-unpaid');
```

---

## Security Considerations

1. **API Secret**: 반드시 강력한 랜덤 키 사용
2. **Admin Check**: `is_admin = TRUE`인 유저만 /admin 접근 가능
3. **RLS**: `admin_logs` 테이블은 관리자만 조회 가능
4. **Webhook**: HTTPS 필수, n8n 측에서도 인증 설정 권장
