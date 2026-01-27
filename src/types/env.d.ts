namespace NodeJS {
  interface ProcessEnv {
    KAKAO_CLIENT_ID: string;
    KAKAO_CLIENT_SECRET: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_SITE_URL: string;
    [key: string]: string | undefined;
  }
}
