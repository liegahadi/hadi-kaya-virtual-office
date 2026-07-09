// ============================================================
// FLPP BTN - Form Lampiran Memo SMD (13 halaman)
// FULL REPLICA dari file asli "Lampiran Memo SMD 8971 Ketentuan Realiasi KPR Sejahtera FLPP Tahun 2026"
// Setiap halaman = 1 lampiran terpisah, semua digabung jadi 1 dokumen
//
// Format: A4 (210mm x 297mm), font Times New Roman, margin 20mm
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate, getMonthRoman, getYear } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function FLPP_BTN({ data }: { data: BerkasState }) {
  const { applicant, spouse, property, dateOfDocument } = data

  return (
    <>
      <LampiranIII data={data} />
      <LampiranIV data={data} />
      <LampiranVI data={data} />
      <LampiranVIII data={data} />
      <SuratKuasa data={data} />
    </>
  )
}

// ============================================================
// LAMPIRAN III - SURAT PERNYATAAN PERSETUJUAN PENYALURAN KPR SEJAHTERA FLPP
// ============================================================
function LampiranIII({ data }: { data: BerkasState }) {
  const { applicant, spouse, property, dateOfDocument } = data
  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return d }
  }
  const dateCity = 'Pangkalpinang'
  const dateStr = dateOfDocument ? new Date(dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '...........................'
  const dateYear = dateOfDocument ? new Date(dateOfDocument).getFullYear().toString() : '20...'

  return (
    <DocumentLayout>
      {/* Header Lampiran */}
      <div style={{ fontSize: '10pt', marginBottom: '15px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Lampiran III</p>
        <p style={{ margin: '2px 0' }}>Memo SMD No. <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '60px' }}>&nbsp;</span>/M/SMD/PPD/XII/2025 tanggal <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '50px' }}>&nbsp;</span>Desember 2025</p>
        <p style={{ margin: '2px 0' }}>Format Internal</p>
      </div>

      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT PERNYATAAN PERSETUJUAN
        </h2>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '5px 0 0 0' }}>
          PENYALURAN KPR SEJAHTERA FLPP TA 2025
        </h2>
      </div>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini:</p>

      {/* Data Pemohon */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ width: '32%', borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
            <td style={{ width: '12%' }}>No. KTP</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Tempat, Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob}, ${formatDate(applicant.dob)}` : '\u00A0'}</td>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}></td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Selaku pemohon.</p>

      {/* Data Pasangan */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ width: '32%', borderBottom: '1px dotted #000' }}><strong>{spouse?.fullName || '\u00A0'}</strong></td>
            <td style={{ width: '12%' }}>No. KTP</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Tempat, Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.pob ? `${spouse.pob}, ${formatDate(spouse.dob)}` : '\u00A0'}</td>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.job || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}>{spouse?.address || applicant.address || '\u00A0'}</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}></td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Selaku istri/suami* pemohon.</p>

      {/* Body pernyataan */}
      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt' }}>
        Menyatakan dengan sesungguhnya bahwa sehubungan dengan kerja sama penyaluran Subsidi Bantuan Uang Muka Perumahan (SBUM) Tahun 2025 masih dalam proses kajian internal Kementerian PKP, maka atas fasilitas Kredit Pemilikan Rumah (KPR) Sejahtera FLPP yang Saya dan istri/suami* ajukan maka Saya dan istri/suami*:
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        1. Mengetahui dan menyetujui bahwa penyaluran KPR Sejahtera FLPP TA 2025 dimaksud atas pembelian rumah umum tapak pada proyek perumahan <strong>{property.projectName}</strong> Cluster <strong>{property.projectName}</strong> Blok/No <strong>{property.kavlingNumber}</strong> yang dikembangkan oleh PT. <strong>{COMPANY_INFO.name}</strong> dengan fasilitas SBUM yang akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2026.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        2. Bersedia dilakukan pemblokiran dana sebesar Rp. 4.000.000,-/Rp. 10.000.000,- *) dan bersedia untuk dilakukan pemindahbukuan atas dana tersebut ke Rekening Developer dengan Nomor Rekening: <strong>{COMPANY_INFO.btnAccount}</strong> atas nama <strong>{COMPANY_INFO.name}</strong> sebagai pengganti Dana SBUM apabila fasilitas SBUM tidak dapat ditagihkan kepada Satker PUPR.
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian surat pernyataan ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun dan apabila di kemudian hari pernyataan saya ini tidak benar, saya bersedia mengembalikan seluruh subsidi yang saya terima.
      </p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

      {/* Tanda tangan */}
      <p style={{ marginBottom: '5px', fontSize: '11pt' }}>Menyetujui,</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>{dateCity}, {dateStr} {dateYear}</p>
      <p style={{ fontSize: '9pt', color: '#666', margin: '0 0 5px 0' }}>Kota/Kabupaten, tanggal bulan tahun</p>

      {/* Meterai + tanda tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ border: '1px solid #999', padding: '15px', marginBottom: '5px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9pt', color: '#999' }}>Meterai<br />Rp. 10.000,-</span>
          </div>
          <p style={{ margin: 0 }}>( <strong>{spouse?.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Suami/Istri*</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ padding: '15px', marginBottom: '5px', minHeight: '60px' }}></div>
          <p style={{ margin: 0 }}>( <strong>{applicant.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Pemohon</p>
        </div>
      </div>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Mengetahui,</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt' }}>Pengembang PT. <strong>{COMPANY_INFO.name}</strong></p>
      <div style={{ textAlign: 'center', marginBottom: '5px' }}>
        <div style={{ display: 'inline-block', padding: '15px', minHeight: '60px' }}></div>
        <p style={{ margin: 0, fontSize: '11pt' }}>( <strong>{COMPANY_INFO.director}</strong> )</p>
        <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap, Jabatan dan Stempel</p>
      </div>

      <p style={{ fontSize: '9pt', marginTop: '30px', fontStyle: 'italic' }}>*) coret salah yang tidak perlu</p>
    </DocumentLayout>
  )
}

// ============================================================
// LAMPIRAN IV - SURAT PERNYATAAN DEVELOPER
// ============================================================
function LampiranIV({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data
  const dateCity = 'Pangkalpinang'
  const dateStr = dateOfDocument ? new Date(dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '...........................'
  const dateYear = dateOfDocument ? new Date(dateOfDocument).getFullYear().toString() : '20...'

  return (
    <DocumentLayout>
      {/* Header Lampiran */}
      <div style={{ fontSize: '10pt', marginBottom: '15px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Lampiran IV</p>
        <p style={{ margin: '2px 0' }}>Memo SMD No. <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '60px' }}>&nbsp;</span>/M/SMD/PPD/XII/2025 tanggal <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '50px' }}>&nbsp;</span>Desember 2025</p>
        <p style={{ margin: '2px 0' }}>Format Internal</p>
      </div>

      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT PERNYATAAN DEVELOPER
        </h2>
      </div>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini:</p>

      {/* Data Developer */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ width: '32%', borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong></td>
            <td style={{ width: '12%' }}>No. KTP</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>&nbsp;</td>
          </tr>
          <tr>
            <td>Jabatan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>Direktur</td>
            <td>Nama Developer</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>PT. <strong>{COMPANY_INFO.name}</strong></td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}>{COMPANY_INFO.city}</td>
          </tr>
          <tr>
            <td colSpan={2}></td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}></td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Dengan ini menyatakan bahwa debitur:</p>

      {/* Data Debitur */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ width: '32%', borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
            <td style={{ width: '12%' }}>No. KTP</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat Perumahan</td>
            <td>:</td>
            <td colSpan={4} style={{ borderBottom: '1px dotted #000' }}>{property.houseAddress || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Melaksanakan akad kredit di Bank BTN dengan kondisi saat ini fasilitas SBUM akan dibayarkan apabila telah dapat ditagihkan dan sesuai dengan ketentuan pada PKS SBUM TA 2026. Sehubungan dengan hal tersebut kami menyatakan tidak akan mengaitkan pembayaran SBUM debitur dimaksud kepada Bank BTN.
      </p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian surat pernyataan ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

      {/* Tanda tangan */}
      <p style={{ marginBottom: '5px', fontSize: '11pt' }}>Menyetujui,</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>{dateCity}, {dateStr} {dateYear}</p>
      <p style={{ fontSize: '9pt', color: '#666', margin: '0 0 5px 0' }}>Kota/Kabupaten, tanggal bulan tahun</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Yang Menyatakan,</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ border: '1px solid #999', padding: '15px', marginBottom: '5px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9pt', color: '#999' }}>Meterai<br />Rp. 10.000,-</span>
          </div>
          <p style={{ margin: 0 }}>( <strong>{COMPANY_INFO.name}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Developer</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ padding: '15px', marginBottom: '5px', minHeight: '60px' }}></div>
          <p style={{ margin: 0 }}>( <strong>{COMPANY_INFO.director}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Pembuat Pernyataan dan Stempel Developer</p>
        </div>
      </div>

      <p style={{ fontSize: '9pt', marginTop: '30px', fontStyle: 'italic' }}>*) coret salah yang tidak perlu</p>
    </DocumentLayout>
  )
}

// ============================================================
// LAMPIRAN VI - SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN
// ============================================================
function LampiranVI({ data }: { data: BerkasState }) {
  const { applicant, spouse, property, dateOfDocument } = data
  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return d }
  }

  const numberToWords = (num: number): string => {
    if (!num || num === 0) return '..........................'
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

  return (
    <DocumentLayout>
      {/* Header Lampiran */}
      <div style={{ fontSize: '10pt', marginBottom: '15px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Lampiran VI</p>
        <p style={{ margin: '2px 0' }}>Memo SMD No. <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '60px' }}>&nbsp;</span>/M/SMD/PPD/XII/2025 tanggal <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '50px' }}>&nbsp;</span>Desember 2025</p>
        <p style={{ margin: '2px 0' }}>Format Eksternal</p>
      </div>

      {/* Judul */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN
        </h2>
      </div>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini:</p>

      {/* Data Pemohon */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '28%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>Tempat/Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob ? `${applicant.pob}, ${formatDate(applicant.dob)}` : '\u00A0'}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td>
          </tr>
          <tr>
            <td>No. KTP/NIK</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Selaku Pemohon.</p>

      {/* Data Pasangan */}
      <table style={{ width: '100%', marginBottom: '5px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '28%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{spouse?.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>Tempat/Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.pob ? `${spouse.pob}, ${formatDate(spouse.dob)}` : '\u00A0'}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.job || '\u00A0'}</td>
          </tr>
          <tr>
            <td>No. KTP/NIK</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{spouse?.address || applicant.address || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Selaku suami/istri* pemohon.</p>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Menyatakan dengan sesungguhnya bahwa:</p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        1. Saya memiliki gaji/upah pokok/penghasilan bersih/upah rata – rata *) per bulan sebesar Rp. <strong>{applicant.monthlyIncome ? applicant.monthlyIncome.toLocaleString('id-ID') : '..........................'}</strong>,-
        <br />(<strong>{applicant.monthlyIncome ? numberToWords(applicant.monthlyIncome) : '..........................'}</strong>)*)
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        2. Saya dan (istri/suami*)) tidak memiliki hak kepemilikan atas rumah pada saat pengajuan pembiayaan KPR Bersubsidi.*)
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        3. Saya dan (istri/suami*)) belum pernah menerima subsidi atau bantuan pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan perumahan dari pemerintah terkait kredit/pembiayaan kepemilikan rumah dan pembangunan Rumah Swadaya.*)
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        4. Saya membeli Rumah Umum Tapak/Sarusun Umum dengan harga Rp. <strong>{property.price ? property.price.toLocaleString('id-ID') : '........................................'}</strong>,-
        <br />(<strong>{property.price ? numberToWords(property.price) : '........................................................'}</strong>) dari PT <strong>{COMPANY_INFO.name}</strong>*)
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        5. Saya dan (istri/suami*)) akan menggunakan Rumah Umum Tapak/Sarusun Umum sebagai tempat tinggal saya dan/atau keluarga dalam kurun waktu paling lambat 1 (satu) tahun setelah serah terima rumah.*)
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        6. Saya dan (istri/suami*)) tidak akan menyewakan/mengontrakkan, memperjualbelikan atau memindahtangankan dengan bentuk perbuatan hukum apapun, kecuali:
      </p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '40px' }}>a. penghunian telah melampaui 5 (lima) tahun untuk Rumah Umum Tapak;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '40px' }}>b. penghunian telah melampaui 20 (dua puluh) tahun untuk Sarusun Umum;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '40px' }}>c. pindah tempat tinggal sesuai ketentuan peraturan perundang-undangan; atau</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '40px' }}>d. meninggal dunia (pewarisan); atau</p>
      <p style={{ marginBottom: '10px', fontSize: '11pt', paddingLeft: '40px' }}>e. untuk kepentingan Bank BTN dalam rangka penyelesaian kredit bermasalah.</p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        7. Bahwa semua dokumen persyaratan yang disampaikan kepada Bank BTN untuk memperoleh subsidi adalah benar dan dapat dipertanggungjawabkan keabsahannya.
      </p>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        8. Apabila di kemudian hari pernyataan saya ini tidak benar dan/atau tidak saya penuhi, saya bersedia mengembalikan seluruh dana kemudahan dan/atau bantuan pembiayaan perumahan yang telah diperoleh melalui Bank BTN dan bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang- undangan.
      </p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian surat pernyataan ini saya buat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

      <p style={{ marginBottom: '5px', fontSize: '11pt' }}>Menyetujui,</p>
      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Pangkalpinang, {dateOfDocument ? new Date(dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' }) : '...........................'} {dateOfDocument ? new Date(dateOfDocument).getFullYear().toString() : '20...'}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ border: '1px solid #999', padding: '15px', marginBottom: '5px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9pt', color: '#999' }}>Meterai<br />secukupnya</span>
          </div>
          <p style={{ margin: 0 }}>( <strong>{spouse?.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Suami/Istri*</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <div style={{ padding: '15px', marginBottom: '5px', minHeight: '60px' }}></div>
          <p style={{ margin: 0 }}>( <strong>{applicant.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap Pemohon</p>
        </div>
      </div>

      <p style={{ fontSize: '9pt', marginTop: '30px', fontStyle: 'italic' }}>*) coret salah yang tidak perlu</p>
    </DocumentLayout>
  )
}

// ============================================================
// LAMPIRAN VIII - BERITA ACARA SERAH TERIMA RUMAH UMUM TAPAK
// ============================================================
function LampiranVIII({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  return (
    <DocumentLayout>
      {/* Header Lampiran */}
      <div style={{ fontSize: '10pt', marginBottom: '15px' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>Lampiran VIII</p>
        <p style={{ margin: '2px 0' }}>Memo SMD No. <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '60px' }}>&nbsp;</span>/M/SMD/PPD/XII/2025 tanggal <span style={{ display: 'inline-block', borderBottom: '1px dotted #000', minWidth: '50px' }}>&nbsp;</span>Desember 2025</p>
        <p style={{ margin: '2px 0' }}>Format Eksternal</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          BERITA ACARA SERAH TERIMA
        </h2>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '5px 0 0 0' }}>
          RUMAH UMUM TAPAK
        </h2>
      </div>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt' }}>
        Pada hari ini <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '60px' }}>&nbsp;</span> tanggal <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '60px' }}>&nbsp;</span> bulan <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '80px' }}>&nbsp;</span> tahun <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '60px' }}>&nbsp;</span>, yang bertanda tangan di bawah ini:
      </p>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>
        1. Nama : <strong>{COMPANY_INFO.director}</strong>
        <br />&nbsp;&nbsp;&nbsp;&nbsp;Jabatan : Direktur
        <br />&nbsp;&nbsp;&nbsp;&nbsp;Alamat : {COMPANY_INFO.city}
      </p>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>dalam hal ini bertindak untuk dan atas nama PT. <strong>{COMPANY_INFO.name}</strong>, selanjutnya disebut "Pihak Pertama";</p>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Kepada pembeli:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '5%' }}>1.</td>
            <td style={{ width: '20%' }}>Nama</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>2.</td>
            <td>NIK</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>3.</td>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
          <tr>
            <td>4.</td>
            <td>Nomor Telp./HP</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.phone || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>selanjutnya disebut "Pihak Kedua"</p>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Atas 1 (Satu) unit Rumah Umum Tapak pada lokasi sebagai berikut:</p>
      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '5%' }}>1.</td>
            <td style={{ width: '20%' }}>Nama Perumahan</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{property.projectName || '\u00A0'}</td>
          </tr>
          <tr>
            <td>2.</td>
            <td>No. Rumah</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{property.kavlingNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>3.</td>
            <td>Luas Tanah dan Lantai Rumah</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{property.landSize ? `${property.landSize} m²` : '\u00A0'}</td>
          </tr>
          <tr>
            <td>4.</td>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{property.houseAddress || '\u00A0'}</td>
          </tr>
          <tr>
            <td>5.</td>
            <td>Kota/Kabupaten/Provinsi</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>Pangkalpinang, Kepulauan Bangka Belitung</td>
          </tr>
        </tbody>
      </table>
      <p style={{ marginBottom: '15px', fontSize: '11pt' }}>Selanjutnya disebut "Obyek Serah Terima"</p>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Obyek Serah Terima dengan kondisi laik fungsi dan dilengkapi dengan:</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '20px' }}>1. Jaringan air bersih sudah berfungsi;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '20px' }}>2. Jaringan listrik sudah berfungsi;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '20px' }}>3. Jalan lingkungan sudah selesai dan berfungsi;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '20px' }}>4. Saluran/drainase lingkungan sudah selesai dan berfungsi;</p>
      <p style={{ marginBottom: '5px', fontSize: '11pt', paddingLeft: '20px' }}>5. Saluran air limbah/air kotor rumah tangga sudah selesai dan berfungsi; dan</p>
      <p style={{ marginBottom: '15px', fontSize: '11pt', paddingLeft: '20px' }}>6. Sarana pewadahan sampah individual dan tempat pembuangan sampah sementara.</p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian berita acara serah terima ini ditandatangani oleh kedua belah pihak dan dapat dipertanggungjawabkan.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 30px 0' }}>Pihak Pertama/Kuasa*,</p>
          <p style={{ margin: '0 0 5px 0' }}>( <strong>{COMPANY_INFO.name}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap, Jabatan dan Stempel</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 30px 0' }}>Pihak Kedua,</p>
          <p style={{ margin: '0 0 5px 0' }}>( <strong>{applicant.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap</p>
        </div>
      </div>

      <p style={{ fontSize: '9pt', marginTop: '30px', fontStyle: 'italic' }}>*) coret yang tidak perlu</p>
    </DocumentLayout>
  )
}

// ============================================================
// SURAT KUASA
// ============================================================
function SuratKuasa({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, textDecoration: 'underline' }}>
          SURAT KUASA
        </h2>
      </div>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt' }}>
        Yang bertanda tangan di bawah ini:
      </p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '11pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '30%' }}>Nama Lengkap</td>
            <td style={{ width: '3%' }}>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td>
          </tr>
          <tr>
            <td>No. KTP/NIK</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Tempat/Tanggal Lahir</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.pob || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Pekerjaan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Alamat</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Nomor Rekening Tabungan</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.btnAccountNumber || '\u00A0'}</td>
          </tr>
          <tr>
            <td>Nomor Rekening KPR Bersubsidi</td>
            <td>:</td>
            <td style={{ borderBottom: '1px dotted #000' }}>{applicant.btnAccountNumber || '\u00A0'}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Dengan ini memberi kuasa kepada PT. Bank Tabungan Negara (Persero) Tbk., berkedudukan di Jalan Gajah Mada No. 01 Jakarta Pusat yang dalam hal ini diwakili oleh <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '120px' }}>&nbsp;</span> selaku <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '120px' }}>&nbsp;</span> di PT. Bank Tabungan Negara (Persero) Tbk. Kantor Cabang Pangkalpinang. Selanjutnya disebut "Penerima Kuasa".
      </p>

      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt' }}>
        Untuk dan atas nama Pemberi Kuasa dengan ini menunjuk dan memberi kuasa kepada Penerima Kuasa dengan hak substitusi untuk melaksanakan hal-hal sebagai berikut:
      </p>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        1. Membuka rekening atas nama Pemberi Kuasa di PT. Bank Tabungan Negara (Persero) Tbk., Kantor Cabang Pangkalpinang;
      </p>
      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        2. Menerima, mencairkan dan menguasai dana FLPP/SBUM yang diterima oleh Pemberi Kuasa;
      </p>
      <p style={{ marginBottom: '15px', textAlign: 'justify', fontSize: '11pt', textIndent: '20px' }}>
        3. Melakukan penandatanganan dokumen-dokumen yang diperlukan dalam rangka pelaksanaan kuasa ini.
      </p>

      <p style={{ marginBottom: '20px', fontSize: '11pt' }}>Demikian surat kuasa ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>Pangkalpinang, {dateOfDocument ? new Date(dateOfDocument).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...........................'}</p>
          <p style={{ margin: '0 0 30px 0' }}>Pemberi Kuasa,</p>
          <p style={{ margin: '0 0 5px 0' }}>( <strong>{applicant.fullName || '...........................'}</strong> )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap &amp; Tanda Tangan</p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>&nbsp;</p>
          <p style={{ margin: '0 0 30px 0' }}>Penerima Kuasa,</p>
          <p style={{ margin: '0 0 5px 0' }}>( ........................... )</p>
          <p style={{ fontSize: '9pt', margin: '2px 0 0 0' }}>Nama Lengkap, Jabatan &amp; Stempel</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
