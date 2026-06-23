// ============================================================
// SPR - Surat Pemesanan Rumah (BTN)
// FULL REPLICA dari file asli BTN SPR.pdf
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate, getMonthRoman, getYear } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function SPR_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  return (
    <DocumentLayout>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>{property.projectName}</h1>
        <p style={{ fontSize: '9pt', margin: '2px 0' }}>KANTOR PEMASARAN JL. FATMAWATI (KAMPAK)</p>
        <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', margin: '5px 0' }}>FORM PEMESANAN</h2>
        <p style={{ fontSize: '10pt' }}>
          NO. {property.sprNumber || '………'}/SPR/{getMonthRoman(dateOfDocument)}/SPR-AJR/{getYear(dateOfDocument)}
        </p>
      </div>

      <p style={{ marginBottom: '10px' }}>Saya yang bertanda tangan dibawah ini :</p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '10pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td>: <strong>{applicant.fullName || '………………'}</strong></td></tr>
          <tr><td>Nomor KTP</td><td>: {applicant.ktpNumber || '………………'}</td></tr>
          <tr><td>Pekerjaan</td><td>: {applicant.jobType || '………………'}</td></tr>
          <tr><td>Alamat</td><td>: {applicant.address || '………………'}</td></tr>
          <tr><td>No. Telp/HP Pemohon</td><td>: {applicant.phone || '………………'}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '10px', textAlign: 'justify' }}>
        Setelah saya mendapatakan penjelasan dan melihat ke lokasi Pembangunan Perumahan "{property.projectName}"
        di Lokasi {property.houseAddress} dengan ini saya memutuskan untuk melakukan pembelian/pemesanan Rumah sbb :
      </p>

      <table style={{ width: '100%', marginBottom: '15px', fontSize: '10pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>1. Cara Pembayaran</td><td>: KPR</td></tr>
          <tr><td>2. Harga Pembelian</td><td>: {formatCurrency(property.price)}</td></tr>
          <tr><td>3. Uang Muka</td><td>: {formatCurrency(property.downPayment)}</td></tr>
          <tr><td>4. SBUM</td><td>: {formatCurrency(property.sbumAmount)}</td></tr>
          <tr><td>5. Plafon KPR</td><td>: {formatCurrency(property.kprPlafon)}</td></tr>
          <tr><td>6. Jangka Waktu</td><td>: {property.kprTerm || '……'} Tahun</td></tr>
          <tr><td>7. No. Kavling Rumah</td><td>: {property.kavlingNumber || '……'} (Site Plan terlampir)</td></tr>
          <tr><td>8. Type</td><td>: {property.houseSize} / {property.landSize} M²</td></tr>
          <tr><td>9. No. Sertifikat</td><td>: {property.nibNumber || '………………………'}</td></tr>
          <tr><td>10. No. PBG</td><td>: {property.pbgNumber}</td></tr>
          <tr><td style={{ paddingLeft: '20px' }}>Tgl Terbit</td><td>: {formatLongDate(property.pbgDate)}</td></tr>
          <tr><td>11. Listrik</td><td>: {property.electricity}</td></tr>
          <tr><td>12. Air</td><td>: {property.water}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Catatan :</p>
      <ol style={{ paddingLeft: '25px', marginBottom: '15px', fontSize: '9pt' }}>
        <li>Apabila pemohon membatalkan pemesanan, maka uang muka dan SBUM yang telah dibayarkan tidak dapat ditarik kembali.</li>
        <li>Apabila KPR tidak disetujui oleh pihak Bank, maka uang muka dikembalikan potong administrasi Rp. 500.000</li>
        <li>Pengajuan KPR maksimal 1 (satu) bulan dari tanggal SPR, jika lebih maka SPR dianggap batal.</li>
        <li>Apabila terjadi selisih harga, maka akan diselesaikan secara kekeluargaan.</li>
        <li>Pemohon sudah berkomitmen untuk membeli rumah dan menyerahkan seluruh berkas persyaratan KPR kepada pihak developer untuk diajukan ke Bank.</li>
        <li>Pihak developer akan membantu pengurusan persyaratan KPR sampai dengan akad.</li>
        <li>Apabila pemohon menghendaki perubahan atas pesanan rumah, maka harus dengan seizin pihak developer.</li>
        <li>Apabila serah terima kunci sudah dilakukan, maka segala kerusakan/sengketa yang terjadi bukan merupakan tanggung jawab pihak developer.</li>
        <li>Pembayaran cicilan DP dilakukan sebelum pelaksanaan akad.</li>
        <li>Pemberian dana SBUM dari pemerintah dilakukan setelah akad.</li>
        <li>Apabila sertifikat belum pecah, maka proses akad menunggu pecah sertifikat.</li>
        <li>Proses pemindahan hak atas nama pemohon dilakukan setelah seluruh kewajiban pemohon kepada developer diselesaikan.</li>
        <li>Kontraktor pelaksana pembangunan dianggap sah dan sah secara hukum.</li>
      </ol>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Pangkalpinang, {formatLongDate(dateOfDocument)}</p>
          <p style={{ marginTop: '5px' }}>Pemesan,</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{applicant.fullName || '(...........................)'}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>Mengetahui,</p>
          <p style={{ marginTop: '5px' }}>{COMPANY_INFO.name}</p>
          <div style={{ height: '70px' }}></div>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{COMPANY_INFO.director}</p>
          <p style={{ fontSize: '9pt' }}>Direktur</p>
        </div>
      </div>
    </DocumentLayout>
  )
}
