-- Kakao OAuth Metadata Sync Trigger (Corrected Version)
-- This trigger syncs Kakao profile data to public.users table

-- 1. Add full_name column if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. 카카오 로그인 시 데이터를 복사하는 함수 생성/수정
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, profile_img)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nickname', -- 카카오 닉네임만 사용 (대체하지 않음)
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture') -- 프로필 이미지 우선순위
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nickname = EXCLUDED.nickname,
    profile_img = EXCLUDED.profile_img,
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
    profile_img = COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', u.profile_img),
    nickname = COALESCE(au.raw_user_meta_data->>'nickname', u.nickname),
    email = COALESCE(au.email, u.email)
FROM auth.users au
WHERE u.id = au.id;
