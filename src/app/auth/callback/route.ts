import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/events'
  
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorParam) {
    console.error('OAuth Callback Error:', errorParam, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Extract Kakao profile info from auth metadata
      const kakaoProfile = data.user.user_metadata?.kakao_account?.profile
      const kakaoId = data.user.user_metadata?.provider_id
      const profileImageUrl = kakaoProfile?.profile_image_url || kakaoProfile?.thumbnail_image_url
      const nickname = kakaoProfile?.nickname
      
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()
      
      if (existingUser) {
        // User exists - update profile_img, nickname, and email
        await supabase
          .from('users')
          .update({
            email: data.user.email || null,
            profile_img: profileImageUrl || null,
            nickname: nickname || null,
            kakao_id: kakaoId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
      } else {
        // New user - insert with minimal data (email, profile_img, nickname, kakao_id)
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || null,
            kakao_id: kakaoId || null,
            nickname: nickname || null,
            profile_img: profileImageUrl || null,
            real_name: '', // Empty initially
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Unknown error')}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/login?error=NoCode`)
}
