// SK KERJA TEMPLATES - 20 diverse Indonesian company styles
// Each template is HTML with placeholders that get auto-filled from form data
// Placeholders: {{nama}}, {{nik}}, {{tempat_lahir}}, {{tanggal_lahir}}, {{jabatan}},
//   {{perusahaan}}, {{alamat_perusahaan}}, {{gaji}}, {{gaji_pokok}}, {{lama_bekerja}},
//   {{tanggal}}, {{kota}}, {{atasan}}, {{nip_atasan}}

export interface SkKerjaTemplate {
  id: string
  name: string
  category: string  // jenis perusahaan
  description: string
  html: string
}

const PLACEHOLDER_HINT = `<p style="font-size:9pt;color:#999;text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">[Edit kop surat di sini - ganti dengan logo & nama perusahaan]</p>`

export const SK_KERJA_TEMPLATES: SkKerjaTemplate[] = [
  // ===== 1. Standard Formal (Perusahaan Umum) =====
  {
    id: 'sk-standard',
    name: 'Standard Formal',
    category: 'Umum',
    description: 'Format standar surat keterangan kerja untuk perusahaan swasta umum',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
${PLACEHOLDER_HINT}
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 15px;">No: .../SK/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>Pimpinan {{perusahaan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Direktur / Pimpinan</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin-bottom:15px;">Benar bahwa yang bersangkutan adalah karyawan tetap di perusahaan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:30px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pimpinan Perusahaan</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( ............................. )</p>
</div>
</div>`
  },

  // ===== 2. Modern Minimalis (Tech Company) =====
  {
    id: 'sk-modern',
    name: 'Modern Minimalis',
    category: 'Tech/Startup',
    description: 'Layout modern dengan typography clean, cocok untuk perusahaan teknologi',
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#222;max-width:800px;margin:0 auto;">
<div style="border-left:4px solid #2563eb;padding-left:15px;margin-bottom:25px;">
<p style="font-size:18pt;font-weight:bold;color:#2563eb;margin:0;">{{perusahaan}}</p>
<p style="font-size:10pt;color:#666;margin:2px 0 0;">{{alamat_perusahaan}}</p>
</div>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
<p style="font-size:16pt;font-weight:bold;color:#222;text-align:center;margin:20px 0;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;color:#666;font-size:10pt;margin-bottom:25px;">No: .../SK/{{bulan}}/{{tahun}}</p>
<p style="margin-bottom:20px;">Yang bertanda tangan di bawah ini, pimpinan {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:20px;border-collapse:collapse;">
<tbody>
<tr><td style="padding:4px 0;width:30%;color:#666;">Nama</td><td style="width:3%;">:</td><td>Pimpinan {{perusahaan}}</td></tr>
<tr><td style="padding:4px 0;color:#666;">Jabatan</td><td>:</td><td>CEO / Direktur</td></tr>
<tr><td style="padding:4px 0;color:#666;">Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p style="margin-bottom:20px;">Menerangkan dengan sebenarnya bahwa:</p>
<table style="width:100%;font-size:11pt;margin-bottom:20px;">
<tbody>
<tr><td style="padding:6px 0;width:30%;color:#666;">Nama</td><td style="width:3%;">:</td><td><strong style="font-size:12pt;">{{nama}}</strong></td></tr>
<tr><td style="padding:6px 0;color:#666;">NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td style="padding:6px 0;color:#666;">Tempat, Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td style="padding:6px 0;color:#666;">Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td style="padding:6px 0;color:#666;">Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td style="padding:6px 0;color:#666;">Gaji per Bulan</td><td>:</td><td><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;background:#f8fafc;padding:12px;border-radius:4px;margin:20px 0;">Yang bersangkutan adalah karyawan tetap perusahaan kami dan masih aktif bekerja hingga saat ini. Surat ini dibuat untuk keperluan pengajuan KPR.</p>
<div style="display:flex;justify-content:space-between;margin-top:40px;">
<div></div>
<div style="text-align:center;">
<p>{{kota}}, {{tanggal}}</p>
<p>CEO,</p>
<p style="margin-top:50px;font-weight:bold;border-top:1px solid #222;padding-top:5px;display:inline-block;">( ............................. )</p>
</div>
</div>
</div>`
  },

  // ===== 3. Pemerintahan / Instansi Negara =====
  {
    id: 'sk-pemerintah',
    name: 'Instansi Pemerintah',
    category: 'Pemerintahan',
    description: 'Format khas surat dinas pemerintahan dengan kop instansi',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:5px;">
<tbody><tr>
<td style="width:80px;vertical-align:middle;text-align:center;border-right:2px solid #000;">[LOGO]</td>
<td style="padding-left:15px;text-align:center;vertical-align:middle;">
<p style="font-size:13pt;font-weight:bold;margin:0;">PEMERINTAH KOTA PANGKALPINANG</p>
<p style="font-size:14pt;font-weight:bold;margin:3px 0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;">Telepon: (0717) xxxxxx | Email: info@pemkot.go.id</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin:15px 0;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 15px;">Nomor: .../{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, Kepala {{perusahaan}}, dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:10px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIP / NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pangkat/Golongan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
<tr><td>Unit Kerja</td><td>:</td><td>{{perusahaan}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan adalah Pegawai Negeri Sipil/CPNS yang masih aktif bekerja di unit kerja kami hingga surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
<table style="width:100%;margin-top:30px;"><tbody><tr>
<td style="width:50%;"></td>
<td style="text-align:left;">
<p>{{kota}}, {{tanggal}}</p>
<p>Kepala {{perusahaan}}</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( ............................. )</p>
<p style="font-size:9pt;">NIP. {{nip_atasan}}</p>
</td>
</tr></tbody></table>
</div>`
  },

  // ===== 4. Bank / Lembaga Keuangan =====
  {
    id: 'sk-bank',
    name: 'Bank / Keuangan',
    category: 'Perbankan',
    description: 'Format untuk karyawan bank dengan kop surat formal',
    html: `<div style="font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #1e3a8a;padding-bottom:12px;margin-bottom:20px;">
<tbody><tr>
<td style="width:75px;vertical-align:middle;"><div style="background:#1e3a8a;color:#fff;width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:bold;">[LOGO]</div></td>
<td style="padding-left:15px;">
<p style="font-size:16pt;font-weight:bold;color:#1e3a8a;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (021) xxxxx | www.bank.co.id</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;color:#1e3a8a;text-decoration:underline;margin:20px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>HRD Manager {{perusahaan}}</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;border-collapse:collapse;">
<tbody>
<tr><td style="width:30%;padding:5px;border-bottom:1px solid #eee;">Nama</td><td style="width:3%;border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;"><strong>{{nama}}</strong></td></tr>
<tr><td style="padding:5px;border-bottom:1px solid #eee;">NIK Karyawan</td><td style="border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;">{{nik}}</td></tr>
<tr><td style="padding:5px;border-bottom:1px solid #eee;">Tempat/Tgl Lahir</td><td style="border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;">{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td style="padding:5px;border-bottom:1px solid #eee;">Jabatan</td><td style="border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;">{{jabatan}}</td></tr>
<tr><td style="padding:5px;border-bottom:1px solid #eee;">Lama Bekerja</td><td style="border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;">{{lama_bekerja}} tahun</td></tr>
<tr><td style="padding:5px;border-bottom:1px solid #eee;">Gaji per Bulan</td><td style="border-bottom:1px solid #eee;">:</td><td style="padding:5px;border-bottom:1px solid #eee;">{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap {{perusahaan}} dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>HRD Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 5. Pertambangan / Mining =====
  {
    id: 'sk-mining',
    name: 'Pertambangan',
    category: 'Mining',
    description: 'Format untuk karyawan perusahaan tambang dengan struktur formal',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="background:#78350f;color:#fff;padding:12px;margin-bottom:20px;">
<p style="font-size:14pt;font-weight:bold;margin:0;text-align:center;">{{perusahaan}}</p>
<p style="font-size:9pt;text-align:center;margin:3px 0 0;">PT Tambang Indonesia | {{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-MIN/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, Manajer Sumber Daya Manusia {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>HRD Manager</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan dengan sebenarnya bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;border:1px solid #78350f;"><tbody>
<tr><td style="width:30%;padding:6px;background:#fef3c7;">Nama Karyawan</td><td style="width:3%;background:#fef3c7;">:</td><td style="padding:6px;"><strong>{{nama}}</strong></td></tr>
<tr><td style="padding:6px;background:#fef3c7;">NIK</td><td style="background:#fef3c7;">:</td><td style="padding:6px;">{{nik}}</td></tr>
<tr><td style="padding:6px;background:#fef3c7;">Tempat/Tgl Lahir</td><td style="background:#fef3c7;">:</td><td style="padding:6px;">{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td style="padding:6px;background:#fef3c7;">Jabatan</td><td style="background:#fef3c7;">:</td><td style="padding:6px;">{{jabatan}}</td></tr>
<tr><td style="padding:6px;background:#fef3c7;">Lama Bekerja</td><td style="background:#fef3c7;">:</td><td style="padding:6px;">{{lama_bekerja}} tahun</td></tr>
<tr><td style="padding:6px;background:#fef3c7;">Gaji per Bulan</td><td style="background:#fef3c7;">:</td><td style="padding:6px;"><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan kami dan masih aktif bekerja di area pertambangan sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>HRD Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 6. Sekolah / Pendidikan =====
  {
    id: 'sk-sekolah',
    name: 'Sekolah / Pendidikan',
    category: 'Pendidikan',
    description: 'Format untuk guru/karyawan sekolah dengan kop surat sekolah',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px double #15803d;padding-bottom:10px;margin-bottom:5px;">
<tbody><tr>
<td style="width:75px;text-align:center;vertical-align:middle;border-right:2px solid #15803d;">[LOGO SEKOLAH]</td>
<td style="padding-left:15px;text-align:center;">
<p style="font-size:12pt;font-weight:bold;margin:0;">YAYASAN PENDIDIKAN HARAPAN BANGSA</p>
<p style="font-size:14pt;font-weight:bold;color:#15803d;margin:3px 0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;">Telp: (0717) xxxxx | Email: info@sekolah.sch.id</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin:15px 0;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 15px;">No: .../{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, Kepala Sekolah {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Kepala Sekolah</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIP / NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Mengajar</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan adalah tenaga pendidik yang masih aktif mengajar di sekolah kami hingga surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
<table style="width:100%;margin-top:30px;"><tbody><tr>
<td style="width:50%;"></td>
<td style="text-align:left;">
<p>{{kota}}, {{tanggal}}</p>
<p>Kepala Sekolah</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
<p style="font-size:9pt;">NIP. {{nip_atasan}}</p>
</td>
</tr></tbody></table>
</div>`
  },

  // ===== 7. Rumah Sakit / Kesehatan =====
  {
    id: 'sk-rs',
    name: 'Rumah Sakit',
    category: 'Kesehatan',
    description: 'Format untuk karyawan rumah sakit dengan kop surat medis',
    html: `<div style="font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #dc2626;padding-bottom:12px;margin-bottom:20px;">
<tbody><tr>
<td style="width:70px;vertical-align:middle;text-align:center;"><div style="background:#dc2626;color:#fff;width:55px;height:55px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18pt;font-weight:bold;">+</div></td>
<td style="padding-left:15px;">
<p style="font-size:15pt;font-weight:bold;color:#dc2626;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telepon: (0717) xxxxx | IGD 24 Jam</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-RS/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Direktur {{perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan adalah tenaga kesehatan/karyawan tetap rumah sakit kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Direktur RS</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 8. Retail / Supermarket =====
  {
    id: 'sk-retail',
    name: 'Retail / Supermarket',
    category: 'Retail',
    description: 'Format untuk karyawan retail dengan kop surat modern',
    html: `<div style="font-family:'Verdana',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="background:linear-gradient(90deg,#ea580c 0%,#facc15 100%);color:#fff;padding:12px 15px;border-radius:4px 4px 0 0;">
<p style="font-size:15pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">{{alamat_perusahaan}} | Telp: (0717) xxxxx</p>
</div>
<div style="border:1px solid #ea580c;border-top:none;padding:15px;border-radius:0 0 4px 4px;">
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:10px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, HRD Manager {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>HRD Manager</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap yang masih aktif bekerja di {{perusahaan}} sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>HRD Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>
</div>`
  },

  // ===== 9. Konstruksi / Construction =====
  {
    id: 'sk-konstruksi',
    name: 'Konstruksi',
    category: 'Konstruksi',
    description: 'Format untuk karyawan perusahaan konstruksi dengan tampilan solid',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;background:#1f2937;color:#fff;padding:10px 15px;">
<tbody><tr>
<td style="width:60px;"><div style="background:#fbbf24;color:#1f2937;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20pt;">[L]</div></td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#fbbf24;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">{{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-CT/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Project Director</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;border:1px solid #1f2937;"><tbody>
<tr><td style="width:30%;padding:6px;background:#f3f4f6;">Nama</td><td style="width:3%;background:#f3f4f6;">:</td><td style="padding:6px;"><strong>{{nama}}</strong></td></tr>
<tr><td style="padding:6px;background:#f3f4f6;">NIK</td><td style="background:#f3f4f6;">:</td><td style="padding:6px;">{{nik}}</td></tr>
<tr><td style="padding:6px;background:#f3f4f6;">Tempat/Tgl Lahir</td><td style="background:#f3f4f6;">:</td><td style="padding:6px;">{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td style="padding:6px;background:#f3f4f6;">Jabatan</td><td style="background:#f3f4f6;">:</td><td style="padding:6px;">{{jabatan}}</td></tr>
<tr><td style="padding:6px;background:#f3f4f6;">Lama Bekerja</td><td style="background:#f3f4f6;">:</td><td style="padding:6px;">{{lama_bekerja}} tahun</td></tr>
<tr><td style="padding:6px;background:#f3f4f6;">Gaji per Bulan</td><td style="background:#f3f4f6;">:</td><td style="padding:6px;"><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan konstruksi kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Project Director</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 10. Manufaktur / Pabrik =====
  {
    id: 'sk-pabrik',
    name: 'Manufaktur / Pabrik',
    category: 'Manufaktur',
    description: 'Format untuk karyawan pabrik dengan kop surat industri',
    html: `<div style="font-family:'Tahoma',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #4b5563;padding-bottom:10px;margin-bottom:20px;">
<tbody><tr>
<td style="width:70px;text-align:center;vertical-align:middle;">[LOGO]</td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#4b5563;">PT {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (0717) xxxxx | Fax: (0717) xxxxx</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-MFG/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Plant Manager</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama Karyawan</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap pabrik kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Plant Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 11. Perhotelan / Hotel =====
  {
    id: 'sk-hotel',
    name: 'Perhotelan',
    category: 'Hospitality',
    description: 'Format untuk karyawan hotel dengan desain elegan',
    html: `<div style="font-family:'Georgia',serif;font-size:11pt;line-height:1.6;color:#1e293b;">
<table style="width:100%;border-bottom:2px solid #92400e;padding-bottom:15px;margin-bottom:20px;">
<tbody><tr>
<td style="width:70px;vertical-align:middle;text-align:center;">[LOGO]</td>
<td style="padding-left:15px;text-align:center;">
<p style="font-size:18pt;font-weight:bold;color:#92400e;margin:0;font-style:italic;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:5px 0;letter-spacing:1px;">HOTEL & RESORT</p>
<p style="font-size:9pt;color:#666;margin:0;">{{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;color:#92400e;text-decoration:underline;margin:15px 0 5px;font-style:italic;">Surat Keterangan Kerja</p>
<p style="text-align:center;font-size:10pt;color:#666;margin:5px 0 20px;">No: .../HRD/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, General Manager {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>General Manager</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;font-style:italic;">Benar bahwa yang bersangkutan adalah karyawan tetap hotel kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;font-style:italic;">
<p>{{kota}}, {{tanggal}}</p>
<p>General Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 12. Restoran / F&B =====
  {
    id: 'sk-restoran',
    name: 'Restoran / F&B',
    category: 'F&B',
    description: 'Format untuk karyawan restoran dengan tampilan hangat',
    html: `<div style="font-family:'Segoe UI',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="background:#fef3c7;border-left:5px solid #d97706;padding:12px 15px;margin-bottom:20px;">
<p style="font-size:16pt;font-weight:bold;color:#d97706;margin:0;">🍽️ {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0 0;">{{alamat_perusahaan}} | Telp: (0717) xxxxx</p>
</div>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-RST/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Operations Manager</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap restoran kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Operations Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 13. BUMN / BUMD =====
  {
    id: 'sk-bumn',
    name: 'BUMN / BUMD',
    category: 'BUMN',
    description: 'Format khas BUMN dengan kop surat resmi negara',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px double #1e40af;padding-bottom:10px;margin-bottom:5px;">
<tbody><tr>
<td style="width:80px;text-align:center;vertical-align:middle;border-right:2px solid #1e40af;">[GARUDA]</td>
<td style="padding-left:15px;text-align:center;">
<p style="font-size:11pt;font-weight:bold;margin:0;">PEMERINTAH PROVINSI KEPULAUAN BANGKA BELITUNG</p>
<p style="font-size:14pt;font-weight:bold;color:#1e40af;margin:3px 0;">PERUMDA {{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;margin:0;">Telp: (0717) xxxxx | Email: info@perumda.go.id</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:11pt;font-weight:bold;text-decoration:underline;margin:15px 0;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 15px;">Nomor: .../HRD/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, Direktur Utama PERUMDA {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Direktur Utama</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIP / NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan adalah pegawai tetap PERUMDA {{perusahaan}} dan masih aktif bekerja hingga surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
<table style="width:100%;margin-top:30px;"><tbody><tr>
<td style="width:50%;"></td>
<td style="text-align:left;">
<p>{{kota}}, {{tanggal}}</p>
<p>Direktur Utama</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</td>
</tr></tbody></table>
</div>`
  },

  // ===== 14. Pertanian / Perkebunan =====
  {
    id: 'sk-kebun',
    name: 'Perkebunan',
    category: 'Agritech',
    description: 'Format untuk karyawan perusahaan perkebunan',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #166534;padding-bottom:10px;margin-bottom:20px;">
<tbody><tr>
<td style="width:75px;text-align:center;vertical-align:middle;">[LOGO]</td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;color:#166534;margin:0;">PT {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">PERKEBUNAN KELAPA SAWIT | {{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (0717) xxxxx</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-EBN/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Estate Manager</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan perkebunan kami dan masih aktif bekerja di estate sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Estate Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 15. Transportasi / Logistik =====
  {
    id: 'sk-transport',
    name: 'Transportasi / Logistik',
    category: 'Logistik',
    description: 'Format untuk karyawan perusahaan transportasi/logistik',
    html: `<div style="font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="background:#0c4a6e;color:#fff;padding:15px;border-radius:4px;margin-bottom:20px;">
<p style="font-size:16pt;font-weight:bold;margin:0;">🚚 {{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">LOGISTIK & EKSPEDISI | {{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-LOG/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Operations Director</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan logistik kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Operations Director</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 16. Apotek / Klinik =====
  {
    id: 'sk-apotek',
    name: 'Apotek / Klinik',
    category: 'Kesehatan',
    description: 'Format untuk karyawan apotek/klinik dengan kop surat medis kecil',
    html: `<div style="font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:2px solid #059669;padding-bottom:10px;margin-bottom:20px;">
<tbody><tr>
<td style="width:60px;text-align:center;vertical-align:middle;"><div style="background:#059669;color:#fff;width:50px;height:50px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18pt;">✚</div></td>
<td style="padding-left:12px;">
<p style="font-size:14pt;font-weight:bold;color:#059669;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">APOTEK & KLINIK | {{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Apoteker Penanggung Jawab</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap apotek/klinik kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Apoteker Penanggung Jawab</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 17. Telekomunikasi =====
  {
    id: 'sk-telco',
    name: 'Telekomunikasi',
    category: 'Telco',
    description: 'Format untuk karyawan perusahaan telekomunikasi',
    html: `<div style="font-family:'Segoe UI',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #7c3aed;padding-bottom:12px;margin-bottom:20px;">
<tbody><tr>
<td style="width:70px;vertical-align:middle;"><div style="background:#7c3aed;color:#fff;width:55px;height:55px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:bold;">[L]</div></td>
<td style="padding-left:15px;">
<p style="font-size:15pt;font-weight:bold;color:#7c3aed;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">TELEKOMUNIKASI | {{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (021) xxxxx | www.telco.co.id</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-TLC/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>HRD Director</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan telekomunikasi kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>HRD Director</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 18. Minyak & Gas =====
  {
    id: 'sk-migas',
    name: 'Minyak & Gas',
    category: 'Oil & Gas',
    description: 'Format untuk karyawan perusahaan oil & gas',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;background:#1e293b;color:#fff;padding:12px 15px;">
<tbody><tr>
<td style="width:65px;"><div style="background:#f59e0b;color:#1e293b;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14pt;">[L]</div></td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#f59e0b;">{{perusahaan}}</p>
<p style="font-size:9pt;margin:3px 0 0;">OIL & GAS | {{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:20px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-OGS/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>VP Human Resources</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;border:1px solid #1e293b;"><tbody>
<tr><td style="width:30%;padding:6px;background:#f1f5f9;">Nama</td><td style="width:3%;background:#f1f5f9;">:</td><td style="padding:6px;"><strong>{{nama}}</strong></td></tr>
<tr><td style="padding:6px;background:#f1f5f9;">NIK</td><td style="background:#f1f5f9;">:</td><td style="padding:6px;">{{nik}}</td></tr>
<tr><td style="padding:6px;background:#f1f5f9;">Tempat/Tgl Lahir</td><td style="background:#f1f5f9;">:</td><td style="padding:6px;">{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td style="padding:6px;background:#f1f5f9;">Jabatan</td><td style="background:#f1f5f9;">:</td><td style="padding:6px;">{{jabatan}}</td></tr>
<tr><td style="padding:6px;background:#f1f5f9;">Lama Bekerja</td><td style="background:#f1f5f9;">:</td><td style="padding:6px;">{{lama_bekerja}} tahun</td></tr>
<tr><td style="padding:6px;background:#f1f5f9;">Gaji per Bulan</td><td style="background:#f1f5f9;">:</td><td style="padding:6px;"><strong>{{gaji}}</strong></td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan migas kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>VP Human Resources</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 19. Kelautan / Perikanan =====
  {
    id: 'sk-perikanan',
    name: 'Perikanan',
    category: 'Maritime',
    description: 'Format untuk karyawan perusahaan perikanan',
    html: `<div style="font-family:'Calibri',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<table style="width:100%;border-bottom:3px solid #0891b2;padding-bottom:10px;margin-bottom:20px;">
<tbody><tr>
<td style="width:75px;text-align:center;vertical-align:middle;">[LOGO]</td>
<td style="padding-left:15px;">
<p style="font-size:14pt;font-weight:bold;color:#0891b2;margin:0;">PT {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">⚓ PERIKANAN & KELAUTAN | {{alamat_perusahaan}}</p>
</td>
</tr></tbody></table>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../HRD-FSH/{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Operations Manager</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah karyawan tetap perusahaan perikanan kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Operations Manager</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 20. Wirausaha / UKM =====
  {
    id: 'sk-ukm',
    name: 'Wirausaha / UKM',
    category: 'UMKM',
    description: 'Format untuk usaha kecil menengah dengan tampilan sederhana',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">
<p style="font-size:14pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (0717) xxxxx</p>
</div>
<p style="text-align:center;font-size:14pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN USAHA</p>
<p style="text-align:center;font-size:11pt;margin:5px 0 20px;">No: .../{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, pemilik {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Pemilik Usaha</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>{{perusahaan}}</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:20px 0;">Benar bahwa yang bersangkutan adalah pekerja tetap di usaha kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:40px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pemilik Usaha</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 21. Warung / Warkop (Informal) =====
  {
    id: 'sk-warung',
    name: 'Warung / Warkop',
    category: 'Informal',
    description: 'Untuk pekerja di warung/warkop - sangat sederhana, tanpa kop formal',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:13pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">Per {{tanggal}}</p>
<p>Yang bertanda tangan di bawah ini, pemilik {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Pemilik Warung</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan bekerja di warung kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pemilik Warung</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 22. Toko Sembako (Informal) =====
  {
    id: 'sk-sembako',
    name: 'Toko Sembako',
    category: 'Informal',
    description: 'Untuk pekerja di toko sembako kelontong - sederhana, langkap',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:12pt;font-weight:bold;margin:0;">TOKO {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Sembako & Kelontong | {{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">Per {{tanggal}}</p>
<p>Yang bertanda tangan di bawah ini, pemilik Toko {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Pemilik Toko</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan bekerja di toko sembako kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pemilik Toko</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 23. Kafe / Restoran Kecil (Informal) =====
  {
    id: 'sk-kafe-kecil',
    name: 'Kafe / Restoran Kecil',
    category: 'Informal',
    description: 'Untuk pekerja di kafe/restoran kecil - hangat & sederhana',
    html: `<div style="font-family:'Segoe UI',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;padding:10px;background:#fef3c7;border-radius:4px;margin-bottom:15px;">
<p style="font-size:14pt;font-weight:bold;margin:0;color:#92400e;">☕ {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">Kafe & Dapur | {{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">Per {{tanggal}}</p>
<p>Yang bertanda tangan di bawah ini, pemilik {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Pemilik Kafe</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan bekerja di kafe/restoran kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pemilik Kafe</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 24. CV Abal-abal (PT/CV tanpa struktur) =====
  {
    id: 'sk-cv-abal',
    name: 'CV Kecil (Tanpa Struktur)',
    category: 'Informal',
    description: 'Untuk CV/PT kecil tanpa HRD formal - tetap formal tapi sederhana',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:13pt;font-weight:bold;margin:0;">CV {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:0;">Telp: (0717) xxxxx</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">No: .../{{bulan}}/{{tahun}}</p>
<p>Yang bertanda tangan di bawah ini, pimpinan CV {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Direktur / Pimpinan</td></tr>
<tr><td>Perusahaan</td><td>:</td><td>CV {{perusahaan}}</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Gaji per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan bekerja di CV kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pimpinan CV</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 25. UD (Usaha Dagang) =====
  {
    id: 'sk-ud',
    name: 'Usaha Dagang (UD)',
    category: 'Informal',
    description: 'Untuk karyawan UD (Usaha Dagang) perorangan - sederhana',
    html: `<div style="font-family:'Arial',sans-serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:13pt;font-weight:bold;margin:0;">UD {{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">Per {{tanggal}}</p>
<p>Yang bertanda tangan di bawah ini, pemilik UD {{perusahaan}}:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Jabatan</td><td>:</td><td>Pemilik Usaha Dagang</td></tr>
<tr><td>Alamat</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan bekerja di usaha dagang kami dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pemilik UD</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },

  // ===== 26. Pekerja Perorangan / Toko Swasta =====
  {
    id: 'sk-perorangan',
    name: 'Pekerja Perorangan',
    category: 'Informal',
    description: 'Untuk pekerja di usaha perorangan (toko pribadi, jasa) - paling sederhana',
    html: `<div style="font-family:'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#000;">
<div style="text-align:center;border-bottom:1px solid #000;padding-bottom:8px;margin-bottom:15px;">
<p style="font-size:12pt;font-weight:bold;margin:0;">{{perusahaan}}</p>
<p style="font-size:9pt;color:#666;margin:3px 0;">{{alamat_perusahaan}}</p>
</div>
<p style="text-align:center;font-size:13pt;font-weight:bold;text-decoration:underline;margin:15px 0 5px;">SURAT KETERANGAN KERJA</p>
<p style="text-align:center;font-size:10pt;margin:5px 0 20px;">Per {{tanggal}}</p>
<p>Yang bertanda tangan di bawah ini:</p>
<table style="width:100%;font-size:11pt;margin-bottom:15px;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td>{{atasan}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>Pengusaha Perorangan</td></tr>
<tr><td>Alamat Usaha</td><td>:</td><td>{{alamat_perusahaan}}</td></tr>
</tbody></table>
<p>Dengan ini menerangkan bahwa:</p>
<table style="width:100%;font-size:11pt;margin:15px 0;"><tbody>
<tr><td style="width:30%;">Nama</td><td style="width:3%;">:</td><td><strong>{{nama}}</strong></td></tr>
<tr><td>NIK</td><td>:</td><td>{{nik}}</td></tr>
<tr><td>Tempat/Tgl Lahir</td><td>:</td><td>{{tempat_lahir}}, {{tanggal_lahir}}</td></tr>
<tr><td>Pekerjaan</td><td>:</td><td>{{jabatan}}</td></tr>
<tr><td>Lama Bekerja</td><td>:</td><td>{{lama_bekerja}} tahun</td></tr>
<tr><td>Penghasilan per Bulan</td><td>:</td><td>{{gaji}}</td></tr>
</tbody></table>
<p style="text-align:justify;margin:15px 0;">Benar bahwa yang bersangkutan adalah pekerja di usaha saya dan masih aktif bekerja sampai dengan surat ini diterbitkan. Surat keterangan ini dibuat untuk keperluan pengajuan KPR.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya.</p>
<div style="text-align:right;margin-top:35px;">
<p>{{kota}}, {{tanggal}}</p>
<p>Pengusaha</p>
<p style="margin-top:60px;font-weight:bold;text-decoration:underline;">( {{atasan}} )</p>
</div>
</div>`
  },
]

export const SK_KERJA_CATEGORIES = [...new Set(SK_KERJA_TEMPLATES.map(t => t.category))]
