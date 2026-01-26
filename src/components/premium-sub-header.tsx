'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PremiumSubHeaderProps {
    title: React.ReactNode;
    backHref?: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    titleClassName?: string;
}

export default function PremiumSubHeader({ title, backHref, onBack, rightElement, titleClassName }: PremiumSubHeaderProps) {
    return (
        <header
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[110] bg-[#121212]/90 backdrop-blur-2xl py-3"
        >
            <div className="px-gutter flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {onBack ? (
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-blue-400"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                        </button>
                    ) : backHref ? (
                        <Link
                            href={backHref}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-90 bg-white/5 border border-white/10 text-white hover:text-blue-400"
                        >
                            <ArrowLeft size={18} strokeWidth={3} />
                        </Link>
                    ) : null}

                    <h1 className={`text-[15px] font-black text-white tracking-tighter transition-all duration-500 opacity-100 translate-x-0 truncate ${titleClassName || ''}`}>
                        {title}
                    </h1>
                </div>

                {/* Right Action */}
                <div className="flex-shrink-0 ml-2">
                    {rightElement}
                </div>
            </div>
        </header>
    )
}
