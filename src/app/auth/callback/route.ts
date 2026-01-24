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
      const meta = data.user.user_metadata
      const kakaoProfile = meta?.kakao_account?.profile
      const kakaoId = meta?.provider_id || meta?.sub

      // Try various paths for profile image
      const profileImageUrl = 
          kakaoProfile?.profile_image_url || 
          kakaoProfile?.thumbnail_image_url || 
          meta?.avatar_url || 
          meta?.picture ||
          null

      // Try various paths for nickname
      let nickname = 
          kakaoProfile?.nickname || 
          meta?.full_name || 
          meta?.name || 
          meta?.preferred_username ||
          null

      // Fallback to email username if nickname is missing
      if (!nickname && (data.user.email || meta?.email)) {
         const email = data.user.email || meta?.email
         const emailPrefix = email.split('@')[0]
         // Add random suffix to ensure uniqueness for email-based nicknames
         nickname = `${emailPrefix}_${Math.floor(Math.random() * 10000)}`
      }

      // If still no nickname, generate a random one
      if (!nickname) {
          nickname = `Member_${Math.floor(Math.random() * 100000)}`
      }
      
      // Check if user exists in our users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
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
        // New user - insert with minimal data
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || null,
            kakao_id: kakaoId || null,
            nickname: nickname || null,
            profile_img: profileImageUrl || null,
            real_name: '', // Empty initially
            membership_level: 'red',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      // Re-fetch or use logic to check if incomplete
      const checkProfile = profile || { real_name: '', gender: '', age_range: '', district: '', job: '', mbti: '', golf_experience: '', handicap: null, onboarding_reward_received: false };
      
      const isProfileIncomplete = !checkProfile.real_name || 
        !checkProfile.gender || 
        !checkProfile.age_range || 
        !checkProfile.district || 
        !checkProfile.job || 
        !checkProfile.mbti || 
        !checkProfile.golf_experience || 
        checkProfile.handicap === null;

      if (isProfileIncomplete && !checkProfile.onboarding_reward_received) {
        return NextResponse.redirect(`${origin}/settings?gift_notice=true`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Unknown error')}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/login?error=NoCode`)
}
