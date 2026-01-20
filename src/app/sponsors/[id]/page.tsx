import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PremiumSubHeader from '@/components/premium-sub-header'

export default async function SponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: sponsor } = await supabase
        .from('sponsors')
        .select('*')
        .eq('id', id)
        .single()

    if (!sponsor) notFound()

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('sponsor_id', id)
        .eq('is_active', true)
        .order('price', { ascending: false })

    // Group by category
    const categories = ['equipment', 'apparel', 'lesson', 'accessory', 'other']
    const groupedProducts = categories.reduce((acc: any, cat) => {
        acc[cat] = products?.filter((p: any) => p.category === cat) || []
        return acc
    }, {})

    const categoryLabels: Record<string, string> = {
        equipment: '🏌️ 장비',
        apparel: '👕 의류',
        lesson: '📚 레슨',
        accessory: '🧤 액세서리',
        other: '📦 기타'
    }

    return (
        <div className="min-h-screen bg-[#121212] pb-24 font-sans overflow-x-hidden">
            <PremiumSubHeader title="" backHref="/sponsors" />
            {/* Banner Area */}
            <div className="relative h-60 bg-gradient-to-b from-[#1c1c1e] to-[#121212] overflow-hidden">
                {sponsor.banner_url ? (
                    <img
                        src={sponsor.banner_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
                    />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
                )}
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Logo & Info */}
            <div className="px-6 -mt-20 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-[#1c1c1e] rounded-[36px] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center p-6 relative group active:scale-95 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                        {sponsor.logo_url ? (
                            <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain relative z-10" />
                        ) : (
                            <span className="text-5xl font-black text-white/10 relative z-10">{sponsor.name[0]}</span>
                        )}
                    </div>
                    <div className="mt-8 text-center px-4">
                        <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-2xl">{sponsor.name}</h1>
                        {sponsor.website_url && (
                            <a href={sponsor.website_url} target="_blank" className="inline-block mt-4 text-[10px] text-blue-400 font-black bg-blue-400/10 px-4 py-2 rounded-full uppercase tracking-widest border border-blue-400/10 active:scale-95 transition-transform">
                                Official Website ↗
                            </a>
                        )}
                    </div>
                </div>
                {sponsor.description && (
                    <div className="mt-12 bg-[#1c1c1e] p-8 rounded-[32px] border border-white/10 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-6xl font-black group-hover:opacity-[0.04] transition-opacity">BRAND</div>
                        <h2 className="text-[12px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Official Brand Story</h2>
                        <p className="text-white/70 text-[15px] leading-relaxed font-medium tracking-tight whitespace-pre-wrap relative z-10">
                            {sponsor.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Products by Category */}
            <div className="mt-16 space-y-16">
                {categories.map(cat => {
                    const prods = groupedProducts[cat]
                    if (!prods || prods.length === 0) return null

                    return (
                        <div key={cat} className="px-6">
                            <div className="flex items-center justify-between mb-8 px-1">
                                <h2 className="text-[16px] font-black text-white tracking-[0.2em] uppercase opacity-80">
                                    {categoryLabels[cat]}
                                </h2>
                                <span className="text-[11px] font-black text-white/20 uppercase tracking-widest">{prods.length} Items</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {prods.map((product: any) => (
                                    <ProductCard key={product.id} product={product} sponsorId={id} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ProductCard({ product, sponsorId }: { product: any; sponsorId: string }) {
    return (
        <Link
            href={`/sponsors/${sponsorId}/product/${product.id}`}
            className="block bg-[#1c1c1e] border border-white/10 rounded-[28px] p-5 active:scale-[0.98] transition-all group relative overflow-hidden shadow-xl"
        >
            <div className="flex gap-5">
                <div className="w-24 h-24 bg-[#2c2c2e] rounded-2xl flex-shrink-0 overflow-hidden border border-white/5 shadow-inner p-2 group-hover:scale-105 transition-transform duration-500">
                    {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-10 grayscale">⛳</div>
                    )}
                </div>
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h3 className="font-black text-[16px] text-white tracking-tight leading-tight group-hover:text-blue-500 transition-colors">{product.name}</h3>
                                {product.badge_code && (
                                    <span className="shrink-0 text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                        Badge
                                    </span>
                                )}
                            </div>
                            <p className="text-[12px] text-white/40 font-medium line-clamp-2 tracking-tight">{product.description}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[18px] font-black text-white tracking-tighter">
                                <span className="text-[12px] text-white/30 mr-1 opacity-50 font-medium">KRW</span>
                                {product.price?.toLocaleString()}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-all">
                                <span className="text-white text-sm">→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
