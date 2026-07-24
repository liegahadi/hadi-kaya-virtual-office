// GET /api/finance/bphtb-calculator?njop=XXX&transactionType=jual_beli|hibah|waris
// BPHTB Calculator untuk Kota Pangkalpinang
// BPHTB = 5% × (NJOPTKP - NJOPTKP)
// NJOPTKP Pangkalpinang: Rp 80.000.000 (uang tidak kena pajak)
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const njop = parseFloat(searchParams.get('njop') || '0')
    const transactionType = searchParams.get('transactionType') || 'jual_beli'
    // NJOPTKP (Nilai Jual Objek Pajak Tidak Kena Pajak) Pangkalpinang
    const NJOPTKP = 80000000
    // Tarif BPHTB Pangkalpinang: 5%
    const TARIF = 0.05
    // BPHTB = 5% × (NJOP - NJOPTKP), minimal 0
    const bphtb = Math.max(0, (njop - NJOPTKP) * TARIF)
    return NextResponse.json({
      success: true,
      data: {
        njop, njoptkp: NJOPTKP, tarif: TARIF * 100 + '%',
        bphtb, transactionType,
        dasarPerhitungan: `5% × (Rp ${njop.toLocaleString('id-ID')} - Rp ${NJOPTKP.toLocaleString('id-ID')})`,
      },
    })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
