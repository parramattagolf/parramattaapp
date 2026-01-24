'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flag, Users, Trophy, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const [activePath, setActivePath] = useState(pathname)

  useEffect(() => {
    setActivePath(pathname)
  }, [pathname])

  const navItems = [
    { href: '/rounds', icon: Flag, label: '라운딩', activeColor: 'text-green-500' },
    { href: '/members', icon: Users, label: '멤버', activeColor: 'text-blue-500' },
    { href: '/sponsors', icon: Trophy, label: '스폰서', activeColor: 'text-yellow-500' },
    { href: '/my', icon: User, label: 'MY', activeColor: 'text-red-500' }
  ]

  if (pathname === '/') return null

  return (
    <nav className="bottom-nav">
      <div className="flex w-full h-full justify-around items-center">
        {navItems.map(item => {
          const isActive = activePath === item.href || activePath.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActivePath(item.href)}
              className={`bottom-nav-item transition-all duration-100 ${
                isActive 
                  ? `${item.activeColor} opacity-100 scale-110` 
                  : 'text-gray-500 opacity-40'
              }`}
              aria-label={item.label}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                  className="transition-transform duration-200"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
