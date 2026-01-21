'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flag, Users, Trophy, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/rounds', icon: Flag, label: '라운딩' },
    { href: '/members', icon: Users, label: '멤버' },
    { href: '/sponsors', icon: Trophy, label: '스폰서' },
    { href: '/my', icon: User, label: 'MY' }
  ]

  if (pathname === '/') return null

  return (
    <nav className="bottom-nav">
      <div className="flex w-full h-full justify-around items-center">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? (item.href === '/rounds' ? 'text-green-500 opacity-100' : item.href === '/members' ? 'text-blue-500 opacity-100' : item.href === '/sponsors' ? 'text-yellow-500 opacity-100' : item.href === '/my' ? 'text-red-500 opacity-100' : 'text-white opacity-100') : 'text-gray-400 opacity-50'}`}
              aria-label={item.label}
            >
              <Icon
                size={28}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
