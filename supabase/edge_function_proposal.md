# Auto-Kick Edge Function Proposal

## Objective
To simulate a "3-hour payment deadline", we need a backend process that runs periodically to check for users who joined but haven't paid within 3 hours.

## Architecture
Supabase Edge Functions + pg_cron (Database Cron)

## Implementation Steps

### 1. Enable pg_cron
Enable the `pg_cron` extension in Supabase Dashboard.

### 2. Create the Clean-up Function (SQL)
We can do this entirely in SQL without an external Edge Function if the logic is simple. But an Edge Function allows for sending notifications (e.g., "You have been removed due to timeout").

**Option A: Pure SQL (Simpler)**
```sql
CREATE OR REPLACE FUNCTION auto_kick_unpaid_users()
RETURNS void AS $$
BEGIN
  -- Delete users who joined > 3 hours ago AND are still 'pending'
  -- Also deduct manner score (e.g. -50)
  
  -- 1. Identify targets (for logging/score deduction)
  WITH kicked_users AS (
    DELETE FROM public.participants
    WHERE 
        status = 'joined' 
        AND payment_status = 'pending' 
        AND joined_at < NOW() - INTERVAL '3 hours'
    RETURNING user_id, event_id
  )
  -- 2. Deduct Score
  UPDATE public.users
  SET manner_score = manner_score - 50
  WHERE id IN (SELECT user_id FROM kicked_users);
END;
$$ LANGUAGE plpgsql;
```

### 3. Schedule the Job
```sql
SELECT cron.schedule(
  'auto-kick-every-10-mins', -- name
  '*/10 * * * *',            -- schedule
  'SELECT auto_kick_unpaid_users()'
);
```

## Why this approach?
- **Efficiency**: Runs directly on the database.
- **Reliability**: No external HTTP calls to fail.
- **Maintenance**: Schema and logic live together.

## Visual Feedback
The UI already has a client-side timer that counts down from `joined_at + 3 hrs`. When this backend job runs and deletes the row, the **Supabase Realtime** subscription in `RoundDetailContent` will trigger a refresh, and the user will disappear from the slot instantly.
