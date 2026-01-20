-- Kakao OAuth Metadata Sync Trigger (Corrected Version)
-- This trigger syncs Kakao profile data to public.users table

-- 1. Add full_name column if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. 카카오 로그인 시 데이터를 복사하는 함수 생성/수정
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, avatar_url, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', '골퍼'), -- 닉네임 우선순위
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),       -- 프로필 이미지 우선순위
    new.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = COALESCE(EXCLUDED.nickname, public.users.nickname),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거가 이미 있다면 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_metadata();

-- 4. 기존 사용자 데이터 동기화 (한 번만 실행)
UPDATE public.users u
SET 
    avatar_url = COALESCE(u.avatar_url, au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
    nickname = COALESCE(u.nickname, au.raw_user_meta_data->>'nickname', au.raw_user_meta_data->>'full_name'),
    full_name = COALESCE(u.full_name, au.raw_user_meta_data->>'full_name'),
    email = COALESCE(u.email, au.email)
FROM auth.users au
WHERE u.id = au.id;
