-- users 테이블의 phone 컬럼 NOT NULL 제약조건 해제
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
