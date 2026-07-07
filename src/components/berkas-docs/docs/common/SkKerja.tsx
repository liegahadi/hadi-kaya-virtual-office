// SK KERJA - Surat Keterangan Kerja
// Inline editable kop surat, data dari form
import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { DocumentLayout } from '../../DocumentLayout'

export function SkKerja({ data, kopSurat }: { data: BerkasState; kopSurat?: string }) {
  const { applicant, dateOfDocument } = data
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'
  const fmt = (n: number) => 'Rp. ' + (n || 0).toLocaleString('id-ID') + ',-'

  return (
    <DocumentLayout>
      {kopSurat ? (
        <div dangerouslySetInnerHTML={{ __html: kopSurat }} style={{ marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }} />
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <p style={{ fontSize: '10pt', color: '#999' }}>[Kop Surat Perusahaan - Edit di form]</p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0, textDecoration: 'underline' }}>SURAT KETERANGAN KERJA</h2>
        <p style={{ fontSize: '11pt', margin: '5px 0' }}>No: .../SK/{new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
      </div>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini:</p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.companyName ? 'Pimpinan ' + applicant.companyName : '...'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Direktur / Pimpinan</td></tr>
          <tr><td>Perusahaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.companyName || '...'}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.companyAddress || '...'}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Dengan ini menerangkan bahwa:</p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '...'}</strong></td></tr>
          <tr><td>NIK</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '...'}</td></tr>
          <tr><td>Tempat/Tgl Lahir</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob}, ${formatDate(applicant.dob)}` : '...'}</td></tr>
          <tr><td>Jabatan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '...'}</td></tr>
          <tr><td>Lama Bekerja</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>... tahun</td></tr>
          <tr><td>Gaji per Bulan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{fmt(applicant.monthlyIncome)}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Benar bahwa yang bersangkutan adalah karyawan tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.
      </p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

      <div style={{ textAlign: 'right', fontSize: '11pt' }}>
        <p style={{ margin: '0 60px 5px 0' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
        <p style={{ margin: '0 60px 100px 0' }}>Pimpinan Perusahaan</p>
        <p style={{ margin: '0 60px 0 0', fontWeight: 'bold', textDecoration: 'underline' }}>( ............................. )</p>
      </div>
    </DocumentLayout>
  )
}
