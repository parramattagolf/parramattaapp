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
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorDescription || errorParam)}`)
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

      // Try to get profile image strictly from Kakao profile only
      const profileImageUrl = 
          kakaoProfile?.profile_image_url || 
          kakaoProfile?.thumbnail_image_url || 
          null

      // 1. Try to get nickname from reliable paths
      const nicknameFromMeta = 
          meta?.full_name || 
          meta?.name || 
          kakaoProfile?.nickname || 
          meta?.nickname || 
          meta?.preferred_username || 
          null

      // Check if user exists in our users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        // User exists - update profile_img, nickname, and email
        // Only update nickname if we found a non-null one from metadata
        const updates: any = {
            email: data.user.email || null,
            profile_img: profileImageUrl || null,
            kakao_id: kakaoId || null,
            updated_at: new Date().toISOString()
        }

        if (nicknameFromMeta) {
            updates.nickname = nicknameFromMeta
        }

        if (!profile.membership_level) {
            updates.membership_level = 'red'
        }

        await supabase
          .from('users')
          .update(updates)
          .eq('id', data.user.id)
      } else {
        // New user - insert with minimal data
        // For new users, we need a nickname. If meta doesn't have it, generate one.
        const finalNickname = nicknameFromMeta || `Member_${Math.floor(Math.random() * 100000)}`
        
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || null,
            kakao_id: kakaoId || null,
            nickname: finalNickname,
            profile_img: profileImageUrl || null,
            real_name: '', // Empty initially
            membership_level: 'red',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      // Profile completeness check removed per user request.
      // Users can fill in details (real_name, etc.) later in their settings page.
      
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error:', error)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error?.message || 'Unknown error')}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/?error=NoCode`)
}
