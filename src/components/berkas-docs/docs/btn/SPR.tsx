// ============================================================
// SPR - Surat Pemesanan Rumah (BTN)
// REPLICA dari SPR BTN asli (scan Afisa)
// Layout: 1 halaman A4, font kecil, catatan 1 kolom
// ============================================================

import React from 'react'
import { BerkasState } from '@/lib/berkas/types'
import { COMPANY_INFO } from '@/lib/berkas/constants'
import { formatCurrency, formatLongDate, getMonthRoman, getYear } from '@/lib/berkas/formatters'
import { DocumentLayout } from '../../DocumentLayout'

export function SPR_BTN({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '0.5in', // 0.5" narrow margins (top, right, bottom, left)
      backgroundColor: 'white',
      color: 'black',
      fontFamily: 'Times New Roman, serif',
      boxSizing: 'border-box',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '9pt', lineHeight: '1.35', color: '#000' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: 0 }}>{property.projectName}</h1>
          <p style={{ fontSize: '9pt', margin: '2px 0' }}>KANTOR PEMASARAN JL. FATMAWATI (KAMPAK)</p>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', margin: '3px 0' }}>FORM PEMESANAN</h2>
          <p style={{ fontSize: '9pt' }}>
            NO. {property.sprNumber || '………'}/SPR/{getMonthRoman(dateOfDocument)}/SPR-AJR/{getYear(dateOfDocument)}
          </p>
        </div>

        <p style={{ marginBottom: '5px' }}>Saya yang bertanda tangan dibawah ini :</p>

        {/* Data Pemohon - single column */}
        <table style={{ width: '100%', marginBottom: '8px', fontSize: '9pt' }}>
          <tbody>
            <tr><td style={{ width: '25%' }}>Nama</td><td>: <strong>{applicant.fullName || '………………'}</strong></td></tr>
            <tr><td>Nomor KTP</td><td>: {applicant.ktpNumber || '………………'}</td></tr>
            <tr><td>Pekerjaan</td><td>: {applicant.jobType || '………………'}</td></tr>
            <tr><td>Alamat</td><td>: {applicant.address || '………………'}</td></tr>
            <tr><td>No.Telp/HP Pemohon</td><td>: {applicant.phone || '………………'}</td></tr>
          </tbody>
        </table>

        <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>DATA – DATA RUMAH YANG SAYA PESAN :</p>

        {/* Data Rumah - single column */}
        <table style={{ width: '100%', marginBottom: '8px', fontSize: '9pt' }}>
          <tbody>
            <tr><td style={{ width: '25%' }}>Cara Pembayaran</td><td>: KPR</td></tr>
            <tr><td>Harga Pembelian</td><td>: {formatCurrency(property.price)}</td></tr>
            <tr><td>Uang Muka</td><td>: {formatCurrency(property.downPayment)}</td></tr>
            <tr><td>SBUM</td><td>: {formatCurrency(property.sbumAmount)}</td></tr>
            <tr><td>Plafon KPR</td><td>: {formatCurrency(property.kprPlafon)}</td></tr>
            <tr><td>Jangka Waktu</td><td>: {property.kprTerm || '……'} (Tahun/Bulan)</td></tr>
            <tr><td>No. Kavling Rumah</td><td>: {property.kavlingNumber || '……'} (Site Plan terlampir)</td></tr>
            <tr><td>Type</td><td>: {property.houseSize} / {property.landSize} M²</td></tr>
            <tr><td>No. Sertifikat</td><td>: {property.nibNumber || '………………………'}</td></tr>
            <tr><td>No. PBG</td><td>: {property.pbgNumber} Tgl Terbit {property.pbgDate ? new Date(property.pbgDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '……'}</td></tr>
            <tr><td>Listrik</td><td>: {property.electricity}</td></tr>
            <tr><td>Air</td><td>: {property.water}</td></tr>
            <tr><td>Tanah Bangunan</td><td>: {property.buildingYear || new Date().getFullYear().toString()}</td></tr>
          </tbody>
        </table>

        {/* Catatan - single column, 13 items */}
        <p style={{ marginBottom: '4px', fontWeight: 'bold' }}>Catatan :</p>
        <ol style={{ paddingLeft: '18px', margin: '0 0 8px 0', fontSize: '7.5pt', lineHeight: '1.3' }}>
          <li>Apabila hasil BI Cheking saya tidak sesuai dengan pernyataan yang telah saya buat sebelumnya maka saya bersedia menerima semua konsekuensinya.</li>
          <li>Harga tersebut diatas termasuk :<br/>
            - Biaya IMB dari Pemerintah Kota Pangkalpinang.<br/>
            - Biaya Pemecahan Sertifikat Induk (SHGB)<br/>
            - PLN 1300 Watt dan air bor/PDAM<br/>
            - PPN 1% dari harga jual<br/>
            - BPHTB, AJB/balik nama dan biaya KPR</li>
          <li>DP harus lunas dalam waktu 1 minggu terhitung sejak booking fee</li>
          <li>Berkas lengkap dalam 7 hari kerja dan wajib membuat buku tabungan KPR BTN</li>
          <li>Booking Fee/DP tidak bisa di kembalikan dengan alasan apapun termasuk jika calon nasabah memberikan keterangan yang tidak sesuai dalam form wawancara sehingga ditolak oleh pihak bank.</li>
          <li>SBUM (bantuan uang muka) adalah sebagai pengganti DP atau biaya proses lainnya kepada DEVELOPER dan pencairannya saya setuju dicairkan atau di pindah bukukan ke rekening PT. Marlindo Bangun Persada dengan Rek Bank BTN NO. 00209.01.30.0003316</li>
          <li>Harga diatas belum termasuk saldo mengendap yang ditentukan oleh pihak BANK.</li>
          <li>Apabila terjadi penurunan plafond dari pihak BANK, maka calon nasabah di wajibkan membayar kekurangan plafond tersebut.</li>
          <li>Jika dalam tempo 7 hari DP belum lunas atau berkas tidak dilengkapi terhitung sejak tgl booking fee maka, harga promo tidak berlaku lagi dan akan dikembalikan ke harga normal.</li>
          <li>Form wawancara wajib di isi sesuai dengan data yang sebenar benar nya.</li>
          <li>Jika berkas tidak lengkap dalam jangka waktu 14 hari kerja, maka saya dianggap mengundurkan diri dan menerima semua konsekuensinya.</li>
          <li>Informasi & berkas yang diserahkan kepada pihak PT.MARLINDO BANGUN PERSADA kebenarannya, sepenuhnya merupakan tanggung jawab Pemesan/Debitor</li>
          <li>Harga sewaktu-waktu bisa berubah sesuai dengan pemberitahuan dari Bank.</li>
        </ol>

        {/* Signature - 2 columns */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ margin: 0 }}>Pangkalpinang, {formatLongDate(dateOfDocument)}</p>
            <p style={{ margin: '3px 0' }}>Pemesan,</p>
            <div style={{ height: '60px' }}></div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{applicant.fullName || '(...........................)'}</p>
          </div>
          <div style={{ textAlign: 'center', width: '45%' }}>
            <p style={{ margin: 0 }}>Mengetahui,</p>
            <p style={{ margin: '3px 0' }}>BAG.PENJUALAN PERUMAHAN ANJAYO 16</p>
            <div style={{ height: '60px' }}></div>
            <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( ............................. )</p>
          </div>
        </div>
      </div>
    </div>
  )
}
