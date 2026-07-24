// GET/POST /api/finance/qc-checklist
// QC checklist per work item sebelum dibayar
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

// Default QC checklist per pekerjaan (standard Anjayo 16)
const DEFAULT_CHECKLIST: Record<string, string[]> = {
  'Pondasi': ['Besi terpasang sesuai ukuran', 'Cor sloof selesai', 'Bata 3 keping terpasang', 'Ukuran pondasi sesuai gambar'],
  'Subsitank': ['Galian lobang selesai', 'Pipa subsitank terpasang', 'Cor subsitank selesai', 'Urukan tanah selesai'],
  'Pasang Bata': ['Bata terpasang rapi', 'Tebeng layar selesai', 'Cor ring balok selesai', 'Cor kolom selesai', 'Kusen terpasang', 'Roster terpasang'],
  'Atap': ['Rangka atap terpasang', 'Penutup atap terpasang', 'NOK terpasang', 'List plank terpasang'],
  'Plaster': ['Plaster keliling selesai', 'Instalasi pipa listrik selesai', 'Openingan selesai', 'Finishing dak selesai'],
  'Plafon': ['Rangka plafon terpasang', 'Gypsum terpasang rapi', 'Sudut rapi'],
  'Keramik': ['Keramik lantai terpasang', 'Plint terpasang', 'Keramik kamar mandi terpasang', 'Keramik dinding terpasang'],
  'Pintu': ['Pintu depan terpasang', 'Pintu kamar terpasang', 'Kunci terpasang'],
  'Listrik': ['11 titik listrik terpasang', 'Mangkok listrik terpasang', 'Saklar terpasang'],
  'Cat': ['Cat dasar selesai', 'Cat finish selesai', 'Warna sesuai'],
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workItem = searchParams.get('workItem')
    if (workItem && DEFAULT_CHECKLIST[workItem]) {
      return NextResponse.json({ success: true, data: DEFAULT_CHECKLIST[workItem] })
    }
    return NextResponse.json({ success: true, data: DEFAULT_CHECKLIST })
  } catch (err: any) { return NextResponse.json({ success: false, error: String(err?.message || err).substring(0, 500) }, { status: 500 }) }
}
