// ============================================================
// SURAT KUASA BPHTB
// Dari template DOCX "SURAT KUASA BPHTB"
// Pemberi kuasa = Debitur, Penerima kuasa = yang ngurus (manual)
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

export function SuratKuasaBPHTB({ data }: { data: BerkasState }) {
  const { applicant, dateOfDocument } = data

  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return d }
  }

  return (
    <DocumentLayout>
      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT KUASA
        </h2>
      </div>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Saya yang bertandatangan di bawah ini :</p>

      {/* Pemberi Kuasa (Debitur) */}
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}>Nama</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>Tempat/Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob}, ${formatDate(applicant.dob)}` : '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Bersama ini saya menyatakan dengan sesungguhnya, bahwa saya telah memberikan kuasa khusus kepada :
      </p>

      {/* Penerima Kuasa (Yang ngurus - from company director/staff) */}
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}>Nama</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong></td>
          </tr>
          <tr>
            <td>No KTP</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{(COMPANY_INFO as any).directorKtp || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{COMPANY_INFO.city}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Untuk bertindak, menghadap, menyerahkan, menerima dokumen-dokumen dan lain sebagainya untuk pengurusan BPHTB dan Pajak.
      </p>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Surat Kuasa ini berlaku sejak ditandatanganinya oleh kedua belah pihak dan berakhir secara otomatis setelah selesai pengurusan surat menyurat yang dimaksud diatas.
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian surat kuasa ini dibuat dengan sebenarnya, tanpa ada paksaan dari pihak manapun.
      </p>

      {/* Tanda tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
          <p style={{ margin: '0 0 100px 0' }}>Yang Memberi Kuasa</p>
          <div style={{ border: '1px solid #999', padding: '8px 16px', fontSize: '9pt', color: '#999', display: 'inline-block', marginBottom: '5px' }}>
            Materai 10.000
          </div>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}><strong>{applicant.fullName || '...........................'}</strong></p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>&nbsp;</p>
          <p style={{ margin: '0 0 100px 0' }}>Yang Menerima Kuasa</p>
          <div style={{ minHeight: '30px' }}></div>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}><strong>{COMPANY_INFO.director}</strong></p>
        </div>
      </div>
    </DocumentLayout>
  )
}
