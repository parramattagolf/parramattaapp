'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Bell, LogOut } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

function TopNavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(true)
  const isTournamentsTab = pathname === '/sponsors' && searchParams.get('tab') === 'tournaments'
  const [lastScrollY, setLastScrollY] = useState(0)
  const [nickname, setNickname] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState({ message: '', visible: false })

  const showToast = (message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000)
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const fetchProfileAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (pathname === '/my') {
        const { data } = await supabase
          .from('users')
          .select('nickname')
          .eq('id', user.id)
          .single()
        if (data?.nickname) setNickname(data.nickname)
        else if (user.user_metadata?.kakao_account?.profile?.nickname) {
          setNickname(user.user_metadata.kakao_account.profile.nickname)
        }
      }

      const getUnreadCount = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .or(`receiver_id.eq.${user.id},type.eq.global`)
          .eq('is_read', false)
        setUnreadCount(count || 0)
      }

      await getUnreadCount()

      // Real-time subscription for badge updates
      channel = supabase
        .channel('top-nav-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, () => {
          getUnreadCount()
        })
        .subscribe()
    }

    fetchProfileAndNotifications()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Fixed header for main pages
      if (pathname === '/rounds' || pathname === '/members' || pathname === '/sponsors' || pathname === '/my') {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // Intelligent Hide/Show Logic for other pages
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, pathname])

  // Hide on certain pages
  const isDetailPage = pathname.startsWith('/members/') ||
    pathname.startsWith('/rounds/') ||
    pathname.startsWith('/sponsors/') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/my/rounds') ||
    pathname.startsWith('/notifications')

  // Root page or Detail pages (which have their own headers)
  if (pathname === '/' || isTournamentsTab || (isDetailPage && pathname !== '/rounds' && pathname !== '/members' && pathname !== '/sponsors')) {
    // If it's the tournaments tab, hide immediately
    if (isTournamentsTab) return null;
    
    // Note: pathname in Next.js 15+ usually matches the actual URL, not the pattern.
    // So if it's /rounds/123, it's a detail page.
    if (pathname !== '/rounds' && pathname !== '/members' && pathname !== '/sponsors') {
      return null
    }
  }

  const getTitle = () => {
    if (pathname === '/rounds') return '라운딩'
    if (pathname === '/members') return '멤버'
    if (pathname === '/sponsors') return '스폰서'
    if (pathname === '/notifications') return '알림'
    if (pathname === '/my') return nickname ? `${nickname}님` : '회원님'
    return 'PARRAMATTA'
  }

  return (
    <nav className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] transition-all duration-300 ease-in-out flex items-center justify-between px-6 bg-[#121212]/90 backdrop-blur-2xl py-3 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="flex flex-col">
        <div
          onClick={() => {
            if (pathname === '/rounds') showToast('특별한 행사에 참여하세요')
            if (pathname === '/members') showToast('셀럽, 인플루언서와 라운딩을...')
            if (pathname === '/sponsors') showToast('프로처럼 스폰을 받을 수 있어요')
            if (pathname === '/my') showToast('매너와 포인트를 쌓아보세요')
          }}
          className={`flex items-center ${pathname === '/rounds' || pathname === '/members' || pathname === '/sponsors' || pathname === '/my' ? 'cursor-pointer' : ''}`}
        >
          {pathname === '/rounds' && (
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
          )}
          {pathname === '/members' && (
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
          )}
          {pathname === '/sponsors' && (
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" />
          )}
          {pathname === '/my' && (
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
          )}
          <h1 className={`truncate max-w-[200px] ${(pathname === '/rounds' || pathname === '/members' || pathname === '/sponsors' || pathname === '/my') ? 'text-[15px] font-bold text-white tracking-tight' : 'text-xl font-black text-white tracking-tighter'}`}>
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">

        {pathname === '/sponsors' && (
          <Link 
            href="/sponsors?tab=tournaments"
            className="flex items-center gap-1.5 mr-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.1)] active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-[16px]">🏆</span>
            <span className="text-[12px] font-black text-amber-400 tracking-tighter">메이져대회</span>
          </Link>
        )}
        {pathname === '/my' && (
          <button
            onClick={async () => {
              if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                showToast('로그아웃 되었습니다')
                const supabase = createClient()
                await supabase.auth.signOut()

                // 카카오 계정까지 함께 로그아웃 처리
                const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
                const logoutRedirectUri = window.location.origin; // 로그아웃 후 돌아올 주소

                setTimeout(() => {
                  if (kakaoApiKey) {
                    // 카카오 계정 로그아웃 URL로 리다이렉트
                    window.location.href = `https://kauth.kakao.com/oauth/logout?client_id=${kakaoApiKey}&logout_redirect_uri=${logoutRedirectUri}`;
                  } else {
                    console.warn('카카오 REST API 키가 없습니다. 일반 로그아웃만 수행합니다.');
                    window.location.href = '/';
                  }
                }, 500)
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-red-400"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        )}

        {pathname !== '/rounds' && pathname !== '/members' && pathname !== '/sponsors' && pathname !== '/my' && (
          <Link
            href="/notifications"
            className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 relative bg-white/5 border border-white/10 text-white hover:text-blue-400"
          >
            <Bell size={20} className={unreadCount > 0 ? 'animate-bounce-subtle' : ''} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#121212] flex items-center justify-center">
                {unreadCount > 9 && <span className="text-[5px] text-white font-bold">9+</span>}
              </span>
            )}
          </Link>
        )}
      </div>
      {/* Custom Toast Notification */}
      <div
        className={`absolute top-full mt-4 left-6 bg-[#FEE500] border border-[#FEE500] text-black text-xl font-bold py-4 px-8 rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] whitespace-nowrap z-[110] transition-all duration-300 transform origin-top-left ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
      >
        {toast.message}
        {/* Little arrow on to p */}
        <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#FEE500] border-t border-l border-[#FEE500] rotate-45"></div>
      </div>
    </nav>
  )
}

export default function TopNav() {
  return (
    <Suspense fallback={null}>
      <TopNavContent />
    </Suspense>
  )
}
