import { createClient } from '@/utils/supabase/server'

const KAKAO_API_BASE = 'https://kapi.kakao.com'
const KAKAO_AUTH_BASE = 'https://kauth.kakao.com'

interface KakaoTokenResponse {
  access_token: string
  token_type: string
  refresh_token?: string
  refresh_token_expires_in?: number
  expires_in: number
  scope?: string
}

export async function refreshKakaoToken(refreshToken: string) {
  const clientId = process.env.KAKAO_CLIENT_ID // REST API Key
  // const clientSecret = process.env.KAKAO_CLIENT_SECRET // Optional if enabled

  if (!clientId) {
    console.error('KAKAO_CLIENT_ID is not set')
    return null
  }

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('client_id', clientId)
  params.append('refresh_token', refreshToken)
  // if (clientSecret) params.append('client_secret', clientSecret)

  try {
    const response = await fetch(`${KAKAO_AUTH_BASE}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: params,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to refresh Kakao token:', response.status, errorText)
      return null
    }

    const data = (await response.json()) as KakaoTokenResponse
    return data
  } catch (error) {
    console.error('Error refreshing Kakao token:', error)
    return null
  }
}

export async function sendKakaoMeMessage(
  userId: string,
  text: string,
  linkUrl: string,
  buttonText: string = '자세히 보기'
) {
  const supabase = await createClient()

  // 1. Get User Token
  const { data: tokenData } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'kakao')
    .single()

  if (!tokenData) {
    console.log(`No Kakao token found for user ${userId}`)
    return false
  }

  let accessToken = tokenData.access_token

  // 2. Send Message
  let response = await callSendMemo(accessToken, text, linkUrl, buttonText)

  // 3. Retry with Refresh if 401
  if (response.status === 401) {
    console.log(`Token expired for user ${userId}, refreshing...`)
    const newData = await refreshKakaoToken(tokenData.refresh_token)

    if (newData) {
      accessToken = newData.access_token
      
      // Update DB
      const updates: any = {
        access_token: newData.access_token,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + newData.expires_in * 1000).toISOString()
      }
      if (newData.refresh_token) {
        updates.refresh_token = newData.refresh_token
      }

      await supabase
        .from('user_tokens')
        .update(updates)
        .eq('id', tokenData.id)

      // Retry
      response = await callSendMemo(accessToken, text, linkUrl, buttonText)
    } else {
        console.error('Token refresh failed')
        return false
    }
  }

  if (!response.ok) {
      const err = await response.text()
      console.error('Failed to send Kakao message:', response.status, err)
      return false
  }

  return true
}

async function callSendMemo(accessToken: string, text: string, linkUrl: string, buttonText: string) {
  // Construct Template
  // Using 'text' template for simplicity, or 'feed' if we need image.
  // Requirement: "Room info and link". Text template is fine.
  
  // Note: linkUrl usually needs to be absolute AND domain must be registered in Kakao Dev Console.
  // If localhost, it might fail if not registered.
  // Ideally use the full URL from environment.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://parramattaapp.vercel.app' // Fallback
  const fullUrl = linkUrl.startsWith('http') ? linkUrl : `${origin}${linkUrl}`

  const templateObject = {
    object_type: 'text',
    text: text,
    link: {
      web_url: fullUrl,
      mobile_web_url: fullUrl,
    },
    button_title: buttonText,
  }

  return await fetch(`${KAKAO_API_BASE}/v2/api/talk/memo/default/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      template_object: JSON.stringify(templateObject),
    }),
  })
}
