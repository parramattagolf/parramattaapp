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
          setAll(cookiesToSet) {
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
      const kakaoId = meta?.provider_id || meta?.sub

      // Try to get profile image from multiple possible metadata paths
      const profileImageUrl = 
          meta?.kakao_account?.profile?.profile_image_url || 
          meta?.kakao_account?.profile?.thumbnail_image_url || 
          meta?.avatar_url || 
          meta?.picture ||
          meta?.properties?.profile_image ||
          meta?.properties?.thumbnail_image ||
          null

      // 1. Try to get nickname from reliable paths
      const nicknameFromMeta = 
          meta?.full_name || 
          meta?.name || 
          meta?.kakao_account?.profile?.nickname || 
          meta?.nickname || 
          meta?.properties?.nickname ||
          meta?.preferred_username || 
          null

      // Check if user exists in our users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      // Upgrade: Store Provider Tokens (e.g. Kakao)
      const providerToken = data.session?.provider_token
      const providerRefreshToken = data.session?.provider_refresh_token
      // Session expires_in is for Supabase session usually. 
      // Provider token expiry isn't always exposed directly in the session root, 
      // but let's assume standard OAuth 1 hour or check if it's in user_metadata or elsewhere. 
      // Supabase `exchangeCodeForSession` returns a Session object.
      // Usually provider_token is valid for some time. We'll refresh it if needed.
      // Let's store what we have.
      
      if (providerToken && providerRefreshToken) {
          // Calculate expiry (Kakao usually 6-12 hours for access, 2 months for refresh)
          // We'll set access token expiry to now + 6 hours as a safe default if not provided, 
          // or just rely on refresh logic handled by our client later.
          // Let's store it.
          const { error: tokenError } = await supabase
              .from('user_tokens')
              .upsert({
                  user_id: data.user.id,
                  provider: 'kakao', // Assuming Kakao for now, or detect from provider
                  access_token: providerToken,
                  refresh_token: providerRefreshToken,
                  expires_at: new Date(Date.now() + 21600 * 1000).toISOString(), // 6 hours default
                  updated_at: new Date().toISOString()
              }, { onConflict: 'user_id, provider' })
          
           if (tokenError) {
               console.error('Failed to save provider tokens:', tokenError)
           }
      }

      if (profile) {
        // User exists - update profile_img, nickname, and email
        // Only update nickname if we found a non-null one from metadata
        const updates: {
            email: string | null;
            kakao_id: string | null;
            updated_at: string;
            profile_img?: string;
            nickname?: string;
            membership_level?: string;
        } = {
            email: data.user.email || null,
            kakao_id: kakaoId || null,
            updated_at: new Date().toISOString()
        }

        if (profileImageUrl) {
            updates.profile_img = profileImageUrl
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

      // Check for profile completeness: real_name, gender, age_range, district, job, mbti
      // Points and manner_score are not required for completeness but are rewards.
      const isComplete = (profile?.real_name || nicknameFromMeta) && 
                         (profile?.gender || meta?.kakao_account?.gender) && 
                         (profile?.age_range || meta?.kakao_account?.age_range) && 
                         (profile?.district) && 
                         (profile?.job) && 
                         (profile?.mbti);
      
      // However, since we might have just updated or inserted, let's check the current state 
      // or the data we just prepared. 
      // Actually, it's safer to check the database again or just logic based on what we know.
      // For now, let's redirection logic:
      const { data: latestProfile } = await supabase
        .from('users')
        .select('real_name, gender, age_range, district, job, mbti')
        .eq('id', data.user.id)
        .single();

      const actuallyComplete = latestProfile && 
                               latestProfile.real_name && 
                               latestProfile.gender && 
                               latestProfile.age_range && 
                               latestProfile.district && 
                               latestProfile.job && 
                               latestProfile.mbti;

      if (!actuallyComplete) {
        return NextResponse.redirect(`${origin}/settings?missing_info=true&next=${encodeURIComponent(next)}`);
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error:', error)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error?.message || 'Unknown error')}`)
    }
  }
  
  return NextResponse.redirect(`${origin}/?error=NoCode`)
}
