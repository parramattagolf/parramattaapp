'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Flag, Users, Trophy, User } from 'lucide-react'
import { useState, useEffect, Suspense, useTransition } from 'react'

function BottomNavContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [activePath, setActivePath] = useState(pathname)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setActivePath(pathname)
  }, [pathname])

  const navItems = [
    { href: '/rounds', icon: Flag, label: '라운딩', activeColor: 'text-green-500' },
    { href: '/members', icon: Users, label: '멤버', activeColor: 'text-blue-500' },
    { href: '/sponsors', icon: Trophy, label: '스폰서', activeColor: 'text-yellow-500' },
    { href: '/my', icon: User, label: 'MY', activeColor: 'text-red-500' }
  ]

  const searchParams = useSearchParams()
  const isTournamentsTab = pathname === '/sponsors' && searchParams.get('tab') === 'tournaments'

  if (pathname === '/' || isTournamentsTab) return null

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    // Immediate visual feedback
    setActivePath(href)
    // Non-blocking navigation
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <nav className="bottom-nav border-none border-t-0 shadow-none">
      <div className="flex w-full h-full justify-around items-center">
        {navItems.map(item => {
          const isActive = activePath === item.href || activePath.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={(e) => handleNavClick(e, item.href)}
              className={`bottom-nav-item transition-all duration-75 ${
                isActive 
                  ? `${item.activeColor} opacity-100 scale-110` 
                  : 'text-gray-500 opacity-40'
              } ${isPending && activePath === item.href ? 'animate-pulse' : ''}`}
              aria-label={item.label}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                  className="transition-transform duration-100"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  )
}
