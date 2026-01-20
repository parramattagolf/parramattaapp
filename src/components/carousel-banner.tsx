'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Banner {
    id: string
    title: string
    subtitle: string
    image_url: string | null
    link_url: string | null
    link_type: string
    link_id: string | null
}

interface CarouselBannerProps {
    banners: Banner[]
}

export default function CarouselBanner({ banners }: CarouselBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (banners.length <= 1) return
        
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % banners.length)
        }, 5000)
        
        return () => clearInterval(interval)
    }, [banners.length])

    // Default banner if none exist
    const defaultBanners: Banner[] = [
        {
            id: 'default-1',
            title: '파라마타 골프 시즌 오픈',
            subtitle: '프리미엄 골프 커뮤니티에서 새로운 동반자를 만나보세요',
            image_url: null,
            link_url: '/rounds',
            link_type: 'internal',
            link_id: null
        }
    ]

    const displayBanners = banners.length > 0 ? banners : defaultBanners
    const current = displayBanners[currentIndex % displayBanners.length]
    
    const getLink = (banner: Banner) => {
        if (banner.link_url) return banner.link_url
        if (banner.link_type === 'event' && banner.link_id) return `/rounds/${banner.link_id}`
        if (banner.link_type === 'sponsor' && banner.link_id) return `/sponsors/${banner.link_id}`
        return '/rounds'
    }

    return (
        <div className="relative overflow-hidden">
            <Link href={getLink(current)} className="block">
                <div className="relative h-48 bg-[#002D56] overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
                    </div>
                    
                    {/* Background Image */}
                    {current.image_url && (
                        <img 
                            src={current.image_url} 
                            alt="" 
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-center px-6">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <span className="w-1 h-4 bg-[#D50032] rounded-full" />
                            <span className="text-xs text-white/70 font-semibold uppercase tracking-wider">
                                {current.link_type === 'sponsor' ? 'Sponsor Event' : 'Featured'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {current.title}
                        </h2>
                        {current.subtitle && (
                            <p className="text-sm text-white/70 mt-2 line-clamp-2">
                                {current.subtitle}
                            </p>
                        )}
                    </div>

                    {/* Red accent bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D50032]" />
                </div>
            </Link>

            {/* Dots Indicator */}
            {displayBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayBanners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentIndex 
                                    ? 'bg-white w-5' 
                                    : 'bg-white/40 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
