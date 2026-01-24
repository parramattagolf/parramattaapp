'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronDown } from 'lucide-react'

interface TransactionItem {
    id: string;
    description: string;
    created_at: string;
    amount: number;
    balance_snapshot: number | null;
}

export default function PointsHistoryList({ initialTransactions }: { initialTransactions: TransactionItem[] }) {
    const [displayCount, setDisplayCount] = useState(10)
    
    const visibleTransactions = initialTransactions.slice(0, displayCount)
    const hasMore = displayCount < initialTransactions.length

    if (!initialTransactions || initialTransactions.length === 0) {
        return (
            <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] p-12 text-center text-[var(--color-text-desc)] text-sm">
                아직 거래 내역이 없습니다.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] overflow-hidden">
                <ul className="divide-y divide-[var(--color-divider)]">
                    {visibleTransactions.map((tx) => (
                        <li key={tx.id} className="p-5 flex justify-between items-center group hover:bg-[var(--color-surface-hover)] transition-colors">
                            <div className="flex flex-col gap-1 flex-1 pr-4">
                                <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                                    {tx.description}
                                </span>
                                <span className="text-[11px] text-[var(--color-text-desc)]" suppressHydrationWarning>
                                    {format(new Date(tx.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <div className={`text-[15px] font-black ${tx.amount > 0 ? 'text-pink-500' : 'text-[var(--color-text-primary)]'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                </div>
                                {tx.balance_snapshot !== undefined && tx.balance_snapshot !== null && (
                                    <div className="text-[10px] text-[var(--color-text-desc)] mt-0.5">
                                        T {tx.balance_snapshot.toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {hasMore && (
                <button
                    onClick={() => setDisplayCount(prev => prev + 10)}
                    className="w-full py-4 bg-[var(--color-gray-100)] border border-[var(--color-divider)] rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold text-white/40 hover:text-white hover:bg-[var(--color-surface-hover)] transition-all active:scale-[0.98]"
                >
                    더 보기 (10개씩)
                    <ChevronDown size={16} />
                </button>
            )}
        </div>
    )
}
