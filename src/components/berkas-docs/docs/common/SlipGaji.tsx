// SLIP GAJI - Inline editable, with kop surat
// 7 lembar (6 bulan ke belakang + 1 bulan ke depan)
import React from 'react'
import { BerkasState, JobType } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

interface SlipItem { label: string; amount: number }

export function SlipGaji({ data, kopSurat, bulanKe }: { data: BerkasState; kopSurat?: string; bulanKe: number }) {
  const { applicant } = data
  const gajiPokok = (data.applicant as any).gajiPokok || applicant.monthlyIncome || 0
  const tunjanganTetap: SlipItem[] = (data.applicant as any).tunjanganTetap || []
  const tunjanganVariabel: SlipItem[] = (data.applicant as any).tunjanganVariabel || []
  const potongan: SlipItem[] = (data.applicant as any).potongan || []
  const tanggalTerima = (data.applicant as any).tanggalTerimaGaji || ''
  const periode = (data.applicant as any).periodeSlip || ''

  const totalTunjangan = [...tunjanganTetap, ...tunjanganVariabel].reduce((s, t) => s + (t.amount || 0), 0)
  const totalPotongan = potongan.reduce((s, p) => s + (p.amount || 0), 0)
  const gajiKotor = gajiPokok + totalTunjangan
  const gajiBersih = gajiKotor - totalPotongan

  const fmt = (n: number) => 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'
  const now = new Date()
  const slipDate = new Date(now.getFullYear(), now.getMonth() - 6 + bulanKe, tanggalTerima ? parseInt(tanggalTerima) : 25)
  const monthName = slipDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <DocumentLayout>
      {/* Kop Surat - inline editable (paste from browser) */}
      {kopSurat ? (
        <div dangerouslySetInnerHTML={{ __html: kopSurat }} style={{ marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }} />
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <p style={{ fontSize: '10pt', color: '#999' }}>[Kop Surat Perusahaan - Edit di form]</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0, textDecoration: 'underline' }}>SLIP GAJI</h2>
        <p style={{ fontSize: '11pt', margin: '5px 0' }}>Periode: {monthName}</p>
      </div>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '25%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td></tr>
          <tr><td>NIK</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td></tr>
          <tr><td>Perusahaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.companyName || '\u00A0'}</td></tr>
        </tbody>
      </table>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '5px' }}>Keterangan</th>
            <th style={{ textAlign: 'right', padding: '5px' }}>Pendapatan</th>
            <th style={{ textAlign: 'right', padding: '5px' }}>Potongan</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px dotted #ccc' }}><td style={{ padding: '5px' }}>Gaji Pokok</td><td style={{ textAlign: 'right', padding: '5px' }}>{fmt(gajiPokok)}</td><td style={{ padding: '5px' }}></td></tr>
          {tunjanganTetap.map((t, i) => (
            <tr key={`tt${i}`} style={{ borderBottom: '1px dotted #ccc' }}><td style={{ padding: '5px' }}>{t.label}</td><td style={{ textAlign: 'right', padding: '5px' }}>{fmt(t.amount)}</td><td style={{ padding: '5px' }}></td></tr>
          ))}
          {tunjanganVariabel.map((t, i) => (
            <tr key={`tv${i}`} style={{ borderBottom: '1px dotted #ccc' }}><td style={{ padding: '5px' }}>{t.label}</td><td style={{ textAlign: 'right', padding: '5px' }}>{fmt(t.amount)}</td><td style={{ padding: '5px' }}></td></tr>
          ))}
          {potongan.map((p, i) => (
            <tr key={`p${i}`} style={{ borderBottom: '1px dotted #ccc' }}><td style={{ padding: '5px' }}>{p.label}</td><td style={{ padding: '5px' }}></td><td style={{ textAlign: 'right', padding: '5px' }}>{fmt(p.amount)}</td></tr>
          ))}
          <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
            <td style={{ padding: '5px' }}>Total</td>
            <td style={{ textAlign: 'right', padding: '5px' }}>{fmt(gajiKotor)}</td>
            <td style={{ textAlign: 'right', padding: '5px' }}>{fmt(totalPotongan)}</td>
          </tr>
          <tr style={{ fontWeight: 'bold', fontSize: '12pt' }}>
            <td style={{ padding: '5px' }} colSpan={2}>Gaji Diterima (Bersih)</td>
            <td style={{ textAlign: 'right', padding: '5px' }}>{fmt(gajiBersih)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div>
          <p>Tanggal Terima: {slipDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 60px 0' }}>Pangkalpinang, {slipDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p style={{ margin: '0 0 5px 0' }}>Bagian Keuangan</p>
          <p style={{ margin: '20px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}>( ............................. )</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
