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
            <PremiumSubHeader title="포인트 내역" backHref="/my" />

            <div className="pt-20 px-5">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform translate-x-10 -translate-y-10 rotate-12">
                        P
                    </div>
                    <div className="relative z-10">
                        <span className="text-pink-100 text-sm font-medium tracking-wider uppercase">Current Balance</span>
                        <div className="text-4xl font-black text-white mt-1">
                            {(userData?.points || 0).toLocaleString()} <span className="text-2xl font-bold opacity-80">P</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-black/20 text-white/80 px-2 py-1 rounded backdrop-blur-sm">
                                1P = 1원
                            </span>
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-pink-500 rounded-full"></span>
                    입출금 내역
                </h2>

                <div className="bg-[var(--color-gray-100)] rounded-2xl border border-[var(--color-divider)] overflow-hidden">
                    {!transactions || transactions.length === 0 ? (
                        <div className="p-12 text-center text-[var(--color-text-desc)] text-sm">
                            아직 거래 내역이 없습니다.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-divider)]">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="p-5 flex justify-between items-center group hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
                                            {tx.description}
                                        </span>
                                        <span className="text-[11px] text-[var(--color-text-desc)]">
                                            {format(new Date(tx.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[15px] font-black ${tx.amount > 0 ? 'text-pink-500' : 'text-[var(--color-text-primary)]'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} P
                                        </div>
                                        {tx.balance_snapshot !== undefined && tx.balance_snapshot !== null && (
                                            <div className="text-[10px] text-[var(--color-text-desc)] mt-0.5">
                                                잔액 {tx.balance_snapshot.toLocaleString()} P
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
