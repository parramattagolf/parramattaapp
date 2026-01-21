'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Bell, Settings } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function TopNavContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [nickname, setNickname] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState({ message: '', visible: false })

  const showToast = (message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000)
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: any

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
  const isDetailPage = pathname.includes('/[id]') ||
    pathname.startsWith('/rounds/') ||
    pathname.startsWith('/sponsors/') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/my/network') ||
    pathname.startsWith('/my/rounds') ||
    pathname.startsWith('/notifications')

  // Root page or Detail pages (which have their own headers)
  if (pathname === '/' || (isDetailPage && pathname !== '/rounds' && pathname !== '/members' && pathname !== '/sponsors')) {
    // Note: pathname in Next.js 15+ usually matches the actual URL, not the pattern.
    // So if it's /rounds/123, it's a detail page.
    if (pathname !== '/rounds' && pathname !== '/members' && pathname !== '/sponsors') {
      return null
    }
  }

  const getTitle = () => {
    if (pathname === '/rounds') return '라운딩'
    if (pathname === '/members') return '인맥'
    if (pathname === '/sponsors') return '스폰서'
    if (pathname === '/notifications') return '알림'
    if (pathname === '/my') return nickname ? `${nickname}님` : '회원님'
    return 'PARRAMATTA'
  }

  return (
    <nav className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[100] transition-all duration-300 ease-in-out flex items-center justify-between px-6 bg-[#121212]/90 backdrop-blur-2xl border-b border-white/10 py-3 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="flex flex-col">
        <div
          onClick={() => {
            if (pathname === '/rounds') showToast('테마가 있는 라운딩 날짜를 선택하세요')
            if (pathname === '/members') showToast('내가 만나고 싶은 사람을 찾아보세요')
            if (pathname === '/sponsors') showToast('운과 실력으로 프로처럼 스폰을 받아보세요')
            if (pathname === '/my') showToast('매너와 신뢰를 쌓아보세요')
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
          <h1 className={`leading-none ${(pathname === '/rounds' || pathname === '/members' || pathname === '/sponsors' || pathname === '/my') ? 'text-[15px] font-bold text-white tracking-normal' : 'text-xl font-black text-white tracking-tighter'}`}>
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pathname === '/rounds' && (
          <Link
            href={view === 'past' ? '/rounds' : '/rounds?view=past'}
            className="text-[13px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-tight active:scale-95 mr-2"
          >
            {view === 'past' ? '진행중인 라운딩' : '지난일정'}
          </Link>
        )}

        {pathname === '/members' && (
          <Link
            href="/members/search"
            className="text-[13px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-tight active:scale-95 mr-2"
          >
            인맥찾기
          </Link>
        )}

        {pathname === '/sponsors' && (
          <Link
            href="/sponsors/new"
            className="text-[13px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-tight active:scale-95 mr-2"
          >
            스폰서등록
          </Link>
        )}

        {pathname === '/my' && (
          <Link
            href="/settings"
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-blue-400"
          >
            <Settings size={18} strokeWidth={2.5} />
          </Link>
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
        className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border border-white/10 text-white text-[13px] font-bold py-2.5 px-6 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] whitespace-nowrap z-[110] transition-all duration-300 transform ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
      >
        {toast.message}
        {/* Little arrow on to p */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1c1c1e] border-t border-l border-white/10 rotate-45"></div>
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
