// ============================================================
// SPR MANDIRI - Surat Keterangan Penjualan (Surat Pemesanan Rumah)
// Template dari DOCX Mandiri, dengan kop surat preserved
// ============================================================

import React from 'react'
import { BerkasState, JobType } from '@/lib/berkas/types'
import { COMPANY_INFO, DEFAULT_PROPERTY } from '@/lib/berkas/constants'
import { DocumentLayout } from '../../DocumentLayout'

export function SPR_MANDIRI({ data }: { data: BerkasState }) {
  const { applicant, property, dateOfDocument } = data

  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const sprSeq = '001'
  const sprMonth = romans[new Date(dateOfDocument).getMonth()]
  const sprYear = new Date(dateOfDocument).getFullYear().toString()

  const formatDate = (d: string) => {
    if (!d) return '...........................'
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  const formatCurrency = (n: number) => n ? `Rp. ${n.toLocaleString('id-ID')},-` : ''

  return (
    <DocumentLayout>
      {/* Kop Surat PT. Marlindo Bangun Persada */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
        {/* Logo placeholder - MB (Marlindo Bangun) biru + kuning */}
        <div style={{
          width: '60px', height: '60px', marginRight: '15px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid #1a5276', borderRadius: '8px',
          background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
          position: 'relative',
        }}>
          <span style={{
            fontSize: '28pt', fontWeight: 'bold', color: '#f1c40f',
            fontFamily: 'Arial, sans-serif', lineHeight: 1,
            textShadow: '2px 2px 0 #1a5276',
          }}>MB</span>
        </div>
        {/* Text kop surat */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, color: '#000', fontFamily: 'Arial, sans-serif' }}>
            PT. MARLINDO BANGUN PERSADA
          </h1>
          <p style={{ fontSize: '9pt', margin: '3px 0 0 0', color: '#000' }}>
            Alamat : Jalan Fatmawati Kel. Air Salemba Kec. Gabek Pangkalpinang
          </p>
          <p style={{ fontSize: '9pt', margin: '1px 0 0 0', color: '#000' }}>
            e-mail : pt_marlindobangunpersada@yahoo.com
          </p>
        </div>
      </div>
      {/* Garis pemisah kop surat */}
      <div style={{ borderBottom: '3px solid #000', marginBottom: '15px' }}></div>

      {/* Judul SPR */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '13pt', fontWeight: 'bold', margin: 0 }}>
          SURAT KETERANGAN PENJUALAN
        </h2>
        <p style={{ fontSize: '11pt', fontWeight: 'bold', margin: '5px 0' }}>
          No. {sprSeq}/SPR/{sprMonth}/SPR-AJR/{sprYear}
        </p>
      </div>

      <p style={{ marginBottom: '10px', fontSize: '11pt' }}>Yang bertanda tangan di bawah ini.</p>

      {/* 1. DATA PEMESAN */}
      <p style={{ marginBottom: '5px', fontSize: '11pt', fontWeight: 'bold' }}>1. DATA PEMESAN:</p>
      <table style={{ width: '100%', marginBottom: '10px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{applicant.fullName || '\u00A0'}</strong></td></tr>
          <tr><td>Nomor KTP</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.ktpNumber || '\u00A0'}</td></tr>
          <tr><td>Pekerjaan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.jobTitle || applicant.jobType || '\u00A0'}</td></tr>
          <tr><td>Alamat Sesuai KTP</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.address || '\u00A0'}</td></tr>
          <tr><td>No Telpone / HP</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{applicant.phone || '\u00A0'}</td></tr>
        </tbody>
      </table>

      {/* 2. DATA PENJUAL */}
      <p style={{ marginBottom: '5px', fontSize: '11pt', fontWeight: 'bold' }}>2. DATA PENJUAL:</p>
      <table style={{ width: '100%', marginBottom: '10px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '30%' }}>Nama</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}><strong>{COMPANY_INFO.director}</strong></td></tr>
          <tr><td>Nomor KTP / NIK</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{(COMPANY_INFO as any).directorKtp || '\u00A0'}</td></tr>
          <tr><td>No Telpone / HP</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>0823-7668-5228</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '10px', textAlign: 'justify', fontSize: '11pt' }}>
        Setelah saya melihat dan mendapatkan penjelasan dari <strong>PIHAK PERUMAHAN ANJAYO 16</strong>, perihal rumah yang akan saya beli, dengan ini saya memutuskan untuk melakukan pembelian/pemesanan rumah dengan rincian sebagai berikut:
      </p>

      {/* 3. DATA RUMAH */}
      <p style={{ marginBottom: '5px', fontSize: '11pt', fontWeight: 'bold' }}>3. DATA RUMAH:</p>
      <table style={{ width: '100%', marginBottom: '10px', fontSize: '11pt' }}>
        <tbody>
          <tr><td style={{ width: '35%' }}>Jenis Rumah</td><td style={{ width: '3%' }}>:</td><td style={{ borderBottom: '1px dotted #000' }}>SUBSIDI</td></tr>
          <tr><td>Blok / Nomor Rumah</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>Blok {property.blockLetter || ''}{property.houseNumber || ''}</td></tr>
          <tr><td>No. Sertifikat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.shmNumber || ''} /Kel JERAMBAH GANTUNG</td></tr>
          <tr><td>No. IMB</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.pbgNumber || 'SK-PBG-197106-24112023-001'}</td></tr>
          <tr><td>LT/LB</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.landSize || 84} m² / {property.houseSize || 36} m²</td></tr>
          <tr><td>Tahun Pembangunan</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{new Date().getFullYear()}</td></tr>
          <tr><td>Alamat</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.houseAddress || 'JL. KELOMPOK, JERAMBAH GANTUNG, KERABUT, PANGKALPINANG'}</td></tr>
          <tr><td>Sumber Air</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{property.water || 'SUMUR BOR BESAR'}</td></tr>
          <tr><td>Harga Jual</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{formatCurrency(property.price)}</td></tr>
          <tr><td>Total DP (Down payment)</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{formatCurrency(property.downPayment)}</td></tr>
          <tr><td>Dana SBUM</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{formatCurrency(property.sbumAmount)}</td></tr>
          <tr><td>Nilai Pengajuan KPR</td><td>:</td><td style={{ borderBottom: '1px dotted #000' }}>{formatCurrency(property.kprPlafon)}</td></tr>
        </tbody>
      </table>

      <p style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11pt' }}>
        Demikian surat keterangan ini dibuat dengan sebenarnya, bilamana terdapat ketidak sesuaian dengan kondisi yang sebenarnya, maka pemohon berhak meminta perbaikan sebagai mana mestinya.
      </p>

      {/* Tanda tangan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11pt' }}>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>Pangkalpinang, {formatDate(dateOfDocument)}</p>
          <p style={{ margin: '0 0 60px 0' }}>Pemesan</p>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}><strong>{applicant.fullName || '...........................'}</strong></p>
        </div>
        <div style={{ textAlign: 'center', width: '45%' }}>
          <p style={{ margin: '0 0 5px 0' }}>&nbsp;</p>
          <p style={{ margin: '0 0 5px 0' }}>Penjual</p>
          <p style={{ margin: '0 0 40px 0' }}><strong>Direktur PT. Marlindo Bangun Persada</strong></p>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', textDecoration: 'underline' }}><strong>{COMPANY_INFO.director}</strong></p>
        </div>
      </div>
    </DocumentLayout>
  )
}
