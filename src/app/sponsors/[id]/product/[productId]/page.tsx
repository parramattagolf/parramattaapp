import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProductDetailPage({ 
    params 
}: { 
    params: { id: string; productId: string } 
}) {
    const supabase = await createClient()

    const { data: product } = await supabase
        .from('products')
        .select(`
            *,
            sponsor:sponsor_id(id, name, logo_url, description)
        `)
        .eq('id', params.productId)
        .single()

    if (!product) notFound()

    const { data: { user } } = await supabase.auth.getUser()

    // Check if user already purchased
    let hasPurchased = false
    if (user) {
        const { data: purchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', params.productId)
            .single()
        hasPurchased = !!purchase
    }

    const categoryLabels: Record<string, string> = {
        equipment: '🏌️ 장비',
        apparel: '👕 의류',
        lesson: '📚 레슨',
        accessory: '🧤 액세서리',
        other: '📦 기타'
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-32">
            {/* Back */}
            <div className="p-4">
                <Link href={`/sponsors/${params.id}`} className="text-gray-400 hover:text-white">
                    ← 뒤로
                </Link>
            </div>

            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-8"/>
                ) : (
                    <div className="text-8xl opacity-30">🏌️</div>
                )}
            </div>

            {/* Product Info */}
            <div className="px-4 -mt-8 relative z-10">
                <div className="bg-gray-800/95 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    {/* Sponsor */}
                    <Link 
                        href={`/sponsors/${product.sponsor?.id}`}
                        className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold mb-3 hover:underline"
                    >
                        {product.sponsor?.logo_url && (
                            <img src={product.sponsor.logo_url} alt="" className="w-5 h-5 rounded"/>
                        )}
                        {product.sponsor?.name}
                    </Link>

                    {/* Title & Category */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                                {categoryLabels[product.category] || product.category}
                            </span>
                            <h1 className="text-2xl font-bold text-white mt-2">{product.name}</h1>
                        </div>
                        {product.badge_code && (
                            <div className="text-center bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/30">
                                <span className="text-2xl">🏅</span>
                                <div className="text-[10px] text-amber-400 font-bold mt-1">배지 획득</div>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-emerald-400">
                            ₩{product.price?.toLocaleString()}
                        </span>
                    </div>

                    {/* Description */}
                    <div className="mt-6 pt-6 border-t border-gray-700/50">
                        <h3 className="text-sm font-bold text-gray-300 mb-2">상품 설명</h3>
                        <p className="text-gray-400 leading-relaxed">
                            {product.description || '상품 설명이 없습니다.'}
                        </p>
                    </div>

                    {/* Badge Info */}
                    {product.badge_code && (
                        <div className="mt-6 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🏅</span>
                                <div>
                                    <h4 className="font-bold text-amber-400">스폰서 배지 획득 상품</h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        이 상품을 구매하시면 프로필에 {product.sponsor?.name} 스폰서 배지가 표시됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase Status */}
            {hasPurchased && (
                <div className="px-4 mt-4">
                    <div className="bg-emerald-500/20 p-4 rounded-xl border border-emerald-500/30 text-center">
                        <span className="text-emerald-400 font-bold">✓ 이미 구매한 상품입니다</span>
                    </div>
                </div>
            )}

            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                <div className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl border border-gray-700/50 shadow-2xl">
                    {product.external_url ? (
                        <a 
                            href={product.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-4 rounded-xl text-center hover:from-emerald-500 hover:to-emerald-400 transition-all"
                        >
                            외부 스토어에서 구매하기 →
                        </a>
                    ) : (
                        <button 
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-emerald-500 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={hasPurchased}
                        >
                            {hasPurchased ? '구매 완료' : '구매하기'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
