import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PremiumSubHeader from '@/components/premium-sub-header'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function PointsHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch user points
    const { data: userData } = await supabase
        .from('users')
        .select('points')
        .eq('id', user.id)
        .single()

    // Fetch transaction history
    const { data: transactions, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)] font-sans pb-12">
            <PremiumSubHeader title="" backHref="/my" />

            <div className="pt-20 px-5">
                <div className="mb-6 text-[15px] font-bold text-white text-center leading-relaxed whitespace-pre-line break-keep opacity-90">
                    상위 144명 포인트 회원에게는 <span className="text-yellow-400">스폰서 경품골프대회</span>에 참가자격을 부여합니다.
                </div>
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-2xl p-8 shadow-xl mb-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform translate-x-10 -translate-y-10 rotate-12 pointer-events-none">
                        P
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-7xl font-black text-white tracking-tight">
                            {(userData?.points || 0).toLocaleString()}
                        </div>
                        {transactions && transactions.length > 0 && (
                            <div className={`mt-2 flex items-center gap-1 text-lg font-bold ${transactions[0].amount > 0 ? 'text-red-300' : 'text-blue-300'}`}>
                                <span>{transactions[0].amount > 0 ? '▲' : '▼'}</span>
                                <span>{Math.abs(transactions[0].amount).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] overflow-hidden">
                    {!transactions || transactions.length === 0 ? (
                        <div className="p-12 text-center text-[var(--color-text-desc)] text-sm">
                            아직 거래 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-divider)]">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="p-5 flex justify-between items-center group hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex flex-col gap-1 flex-1 pr-4">
                                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                                            {tx.description}
                                        </span>
                                        <span className="text-[11px] text-[var(--color-text-desc)]">
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
