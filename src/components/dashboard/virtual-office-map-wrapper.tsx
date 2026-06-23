'use client'

import dynamic from 'next/dynamic'

const VirtualOfficeMap = dynamic(
  () => import('@/components/dashboard/virtual-office-map').then(m => ({ default: m.VirtualOfficeMap })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[600px] flex items-center justify-center bg-slate-100 rounded-xl border-2 border-slate-300">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-600 font-mono">Loading virtual office...</p>
        </div>
      </div>
    ),
  }
)

export function VirtualOfficeMapWrapper({ stats }: { stats: unknown }) {
  return <VirtualOfficeMap stats={stats as never} />
}
