// ============================================================
// SURAT PERNYATAAN BPHTB
// Income limit logic:
// - Single/Janda/Duda: max 9,000,000 (Sembilan Juta Rupiah)
// - Menikah: max 11,000,000 (Sebelas Juta Rupiah)
// ============================================================

import React from 'react'
import { BerkasState, MaritalStatus } from '@/lib/berkas/types'
import { DocumentLayout } from '../../DocumentLayout'

export function SuratPernyataanBPHTB({ data }: { data: BerkasState }) {
  const { applicant, maritalStatus, dateOfDocument } = data

  // Income limit based on marital status
  const isMarried = maritalStatus === MaritalStatus.MARRIED
  const incomeLimit = isMarried ? 11000000 : 9000000
  const incomeWords = isMarried ? 'Sebelas Juta Rupiah' : 'Sembilan Juta Rupiah'
  const statusText = isMarried
    ? 'sudah menikah'
    : 'belum menikah / janda / duda'

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
          SURAT PERNYATAAN
        </h2>
      </div>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Saya yang bertanda tangan dibawah ini :</p>

      {/* Data Pemohon */}
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td>
          </tr>
          <tr>
            <td>NIK</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>

      {/* Body pernyataan */}
      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Dengan ini saya menyatakan bahwa memang benar saya {statusText} dan berpenghasilan tidak lebih dari Rp. {incomeLimit.toLocaleString('id-ID')} ({incomeWords}). Jika dikemudian hari ditemukan fakta yang berbeda dari pernyataan yang saya buat, maka saya siap dituntut berdasarkan Peraturan Perundang-undangan yang berlaku.
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian surat pernyataan ini saya buat dengan sebenar-benarnya agar bisa di proses sebagaimana mestinya, atas perhatiannya diucapkan terima kasih.
      </p>

      {/* Tanda tangan */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <p style={{ margin: '0 60px 5px 0', fontSize: '11pt' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
      </div>

      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: '0 60px 20px 0', fontSize: '11pt' }}>Yang Menyatakan,</p>
        <div style={{ display: 'inline-block', textAlign: 'center', marginRight: '60px' }}>
          <div style={{ border: '1px solid #999', padding: '20px 40px', marginBottom: '5px', minHeight: '60px' }}>
            <span style={{ fontSize: '9pt', color: '#999' }}>METERAI 10000</span>
          </div>
          <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline', fontSize: '11pt' }}><strong>{applicant.fullName || '...........................'}</strong></p>
        </div>
      </div>
    </DocumentLayout>
  )
}
