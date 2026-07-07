// ============================================================
// SURAT PERNYATAAN TIDAK MEMILIKI RUMAH
// Berkas dasar - harus ada di semua bank (BTN, Mandiri, BSB)
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { DocumentLayout } from '../../DocumentLayout'

export function SuratPernyataanTidakMemilikiRumah({ data }: { data: BerkasState }) {
  const { applicant, dateOfDocument } = data

  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT PERNYATAAN TIDAK MEMILIKI RUMAH
        </h2>
      </div>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini menerangkan bahwa :</p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td></tr>
          <tr><td>Tempat / Tgl Lahir</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob} / ${formatDate(applicant.dob)}` : '\u00A0'}</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td></tr>
          <tr><td>No. KTP</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Menyatakan bahwa sampai dengan Surat Pernyataan ini di buat tidak memiliki hak kepemilikan rumah.
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian Surat Pernyataan ini saya buat dengan sebenarnya tanpa ada paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan Fasilitas Likuiditas pembiayaan perumahan yang saya terima.
      </p>

      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <p style={{ margin: '0 60px 5px 0', fontSize: '11pt' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Mengetahui,</p>
          <p style={{ margin: '0 0 5px 0' }}>Kepala Desa / Lurah</p>
          <p style={{ margin: '20px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}>( ............................. )</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 100px 0' }}>Yang Membuat Pernyataan</p>
          <p style={{ margin: '20px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}><strong>( {applicant.fullName || '...........................'} )</strong></p>
        </div>
      </div>
    </DocumentLayout>
  )
}
