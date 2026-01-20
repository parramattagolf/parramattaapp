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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=NoCode`)
}
