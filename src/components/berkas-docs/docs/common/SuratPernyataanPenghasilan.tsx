// ============================================================
// SURAT PERNYATAAN PENGHASILAN
// Berkas dasar - harus ada di semua bank (BTN, Mandiri, BSB)
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { DocumentLayout } from '../../DocumentLayout'

function numberToWords(num: number): string {
  if (!num || num === 0) return ''
  const u = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  if (num < 12) return u[num]
  if (num < 20) return u[num - 10] + ' belas'
  if (num < 100) return u[Math.floor(num / 10)] + ' puluh' + (num % 10 ? ' ' + u[num % 10] : '')
  if (num < 200) return 'seratus' + (num - 100 > 0 ? ' ' + numberToWords(num - 100) : '')
  if (num < 1000) return u[Math.floor(num / 100)] + ' ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
  if (num < 2000) return 'seribu' + (num - 1000 > 0 ? ' ' + numberToWords(num - 1000) : '')
  if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' ribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
  if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '')
  return numberToWords(Math.floor(num / 1000000000)) + ' miliar' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '')
}

export function SuratPernyataanPenghasilan({ data }: { data: BerkasState }) {
  const { applicant, dateOfDocument } = data

  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  const incomeNum = applicant.monthlyIncome || 0
  const incomeFmt = incomeNum ? `Rp. ${incomeNum.toLocaleString('id-ID')}` : 'Rp. ..............................'
  const incomeWords = incomeNum ? numberToWords(incomeNum) + ' Rupiah' : '........................................................................'

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT PERNYATAAN PENGHASILAN
        </h2>
      </div>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini :</p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td></tr>
          <tr><td>Tempat/Tgl Lahir</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob} / ${formatDate(applicant.dob)}` : '\u00A0'}</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td></tr>
          <tr><td>No. KTP/Passport</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Menyatakan dengan sesungguhnya bahwa sampai saat surat pernyataan ini ditandatangani, saya menyatakan bahwa jumlah gaji/upah pokok saya adalah sebesar {incomeFmt} ({incomeWords}) perbulan.
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan Fasilitas Likuiditas Perumahan yang saya terima.
      </p>

      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <p style={{ margin: '0 60px 5px 0', fontSize: '11pt' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>Mengetahui</p>
          <p style={{ margin: '0 0 100px 0' }}>Pimpinan di instansi tempat bekerja</p>
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
