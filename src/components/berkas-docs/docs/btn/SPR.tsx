// ============================================================
// SPR - Surat Pemesanan Rumah (BTN)
// Full replica BTN SPR.pdf - optimized for 1 page (tighter spacing, smaller fonts)
// All content preserved, only alignment/spacing adjusted
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
      <div style={{ fontSize: '8pt', lineHeight: '1.25' }}>
        {/* Header - compact */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0 }}>{property.projectName}</h1>
          <p style={{ fontSize: '7pt', margin: '1px 0' }}>KANTOR PEMASARAN JL. FATMAWATI (KAMPAK)</p>
          <h2 style={{ fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline', margin: '2px 0' }}>FORM PEMESANAN</h2>
          <p style={{ fontSize: '8pt' }}>
            NO. {property.sprNumber || '………'}/SPR/{getMonthRoman(dateOfDocument)}/SPR-AJR/{getYear(dateOfDocument)}
          </p>
        </div>

        <p style={{ marginBottom: '4px' }}>Saya yang bertanda tangan dibawah ini :</p>

        {/* Data pemohon - 2 kolom untuk hemat space */}
        <table style={{ width: '100%', marginBottom: '6px', fontSize: '8pt' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%' }}>Nama</td><td style={{ width: '35%' }}>: <strong>{applicant.fullName || '………………'}</strong></td>
              <td style={{ width: '15%' }}>No. Telp/HP</td><td style={{ width: '35%' }}>: {applicant.phone || '………………'}</td>
            </tr>
            <tr>
              <td>Nomor KTP</td><td>: {applicant.ktpNumber || '………………'}</td>
              <td>Pekerjaan</td><td>: {applicant.jobType || '………………'}</td>
            </tr>
            <tr>
              <td>Alamat</td><td colSpan={3}>: {applicant.address || '………………'}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ marginBottom: '4px', textAlign: 'justify' }}>
          Setelah saya mendapatakan penjelasan dan melihat ke lokasi Pembangunan Perumahan "{property.projectName}"
          di Lokasi {property.houseAddress} dengan ini saya memutuskan untuk melakukan pembelian/pemesanan Rumah sbb :
        </p>

        {/* Data rumah - 2 kolom untuk hemat space */}
        <table style={{ width: '100%', marginBottom: '6px', fontSize: '8pt' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%' }}>1. Cara Bayar</td><td style={{ width: '35%' }}>: KPR</td>
              <td style={{ width: '15%' }}>7. No. Kavling</td><td style={{ width: '35%' }}>: {property.kavlingNumber || '……'} (Site Plan terlampir)</td>
            </tr>
            <tr>
              <td>2. Harga Beli</td><td>: {formatCurrency(property.price)}</td>
              <td>8. Type</td><td>: {property.houseSize} / {property.landSize} M²</td>
            </tr>
            <tr>
              <td>3. Uang Muka</td><td>: {formatCurrency(property.downPayment)}</td>
              <td>9. No. Sertifikat</td><td>: {property.nibNumber || '………………………'}</td>
            </tr>
            <tr>
              <td>4. SBUM</td><td>: {formatCurrency(property.sbumAmount)}</td>
              <td>10. No. PBG</td><td>: {property.pbgNumber}</td>
            </tr>
            <tr>
              <td>5. Plafon KPR</td><td>: {formatCurrency(property.kprPlafon)}</td>
              <td>11. Listrik</td><td>: {property.electricity}</td>
            </tr>
            <tr>
              <td>6. Jangka Waktu</td><td>: {property.kprTerm || '……'} Tahun</td>
              <td>12. Air</td><td>: {property.water}</td>
            </tr>
            <tr>
              <td></td><td></td>
              <td style={{ paddingLeft: '15px' }}>Tgl Terbit</td><td>: {formatLongDate(property.pbgDate)}</td>
            </tr>
          </tbody>
        </table>

        {/* Catatan - compact 2-column layout */}
        <p style={{ marginBottom: '3px', fontWeight: 'bold', fontSize: '8pt' }}>Catatan :</p>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '6px' }}>
          <ol style={{ paddingLeft: '15px', margin: 0, fontSize: '6.5pt', lineHeight: '1.2', flex: 1 }}>
            <li>Apabila pemohon membatalkan pemesanan, maka uang muka dan SBUM yang telah dibayarkan tidak dapat ditarik kembali.</li>
            <li>Apabila KPR tidak disetujui oleh pihak Bank, maka uang muka dikembalikan potong administrasi Rp. 500.000</li>
            <li>Pengajuan KPR maksimal 1 (satu) bulan dari tanggal SPR, jika lebih maka SPR dianggap batal.</li>
            <li>Apabila terjadi selisih harga, maka akan diselesaikan secara kekeluargaan.</li>
            <li>Pemohon sudah berkomitmen untuk membeli rumah dan menyerahkan seluruh berkas persyaratan KPR kepada pihak developer untuk diajukan ke Bank.</li>
            <li>Pihak developer akan membantu pengurusan persyaratan KPR sampai dengan akad.</li>
            <li>Apabila pemohon menghendaki perubahan atas pesanan rumah, maka harus dengan seizin pihak developer.</li>
          </ol>
          <ol start={8} style={{ paddingLeft: '15px', margin: 0, fontSize: '6.5pt', lineHeight: '1.2', flex: 1 }}>
            <li>Apabila serah terima kunci sudah dilakukan, maka segala kerusakan/sengketa yang terjadi bukan merupakan tanggung jawab pihak developer.</li>
            <li>Pembayaran cicilan DP dilakukan sebelum pelaksanaan akad.</li>
            <li>Pemberian dana SBUM dari pemerintah dilakukan setelah akad.</li>
            <li>Apabila sertifikat belum pecah, maka proses akad menunggu pecah sertifikat.</li>
            <li>Proses pemindahan hak atas nama pemohon dilakukan setelah seluruh kewajiban pemohon kepada developer diselesaikan.</li>
            <li>Kontraktor pelaksana pembangunan dianggap sah dan sah secara hukum.</li>
          </ol>
        </div>

        {/* Signature - compact */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ margin: 0 }}>Pangkalpinang, {formatLongDate(dateOfDocument)}</p>
            <p style={{ margin: '2px 0' }}>Pemesan,</p>
            <div style={{ height: '50px' }}></div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{applicant.fullName || '(...........................)'}</p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ margin: 0 }}>Mengetahui,</p>
            <p style={{ margin: '2px 0' }}>{COMPANY_INFO.name}</p>
            <div style={{ height: '50px' }}></div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{COMPANY_INFO.director}</p>
            <p style={{ fontSize: '7pt', margin: 0 }}>Direktur</p>
          </div>
        </div>
      </div>
    </DocumentLayout>
  )
}
