# Finance & Material Reference Files

File-file ini dipakai sebagai referensi untuk membangun Finance & Material module di hadi-kaya-virtual-office.

## Files

| File | Source | Purpose |
|------|--------|---------|
| `backup-18072026.json` | Owner backup 17 Juli 2026 | Snapshot data Finance & Material lama (122 PO, 58 wage, 94 expense, 163 material, 20 supplier, 9 worker, 44 memo, 110 usage) — dipakai untuk import ke schema baru |
| `01-format-po.pdf` | Owner format fisik | Template PO yang dipakai di lapangan — dipakai sebagai overlay untuk generate PO PDF |
| `02-pengajuan-dana-front-payment.pdf` | Owner format fisik | Format pengajuan dana untuk front payment (DP/tahap awal) |
| `03-bukti-kas-keluar.pdf` | Owner format fisik | Format bukti kas keluar (voucher per-recipient + rekening + terbilang) |
| `04-rab-material.pdf` | Owner format fisik | Format RAB Material per kategori pekerjaan |
| `05-pengajuan-dana-mingguan.pdf` | Owner format fisik | Format pengajuan dana mingguan (= Memo display) |
| `06-rab-upah-tukang.pdf` | Owner format fisik | Format RAB Upah Tukang per pekerjaan (match WageType.price) |
| `07-contoh-pengajuan-mingguan.pdf` | Owner real example | Contoh pengajuan mingguan yang sudah diisi — dipakai sebagai test data |
| `rab-anjayo-16.xlsx` | Owner Excel | RAB Anjayo 16 lengkap (material + upah) — akan dipakai saat RAB integration (Phase future) |

## Usage

- PDF files: dipakai sebagai overlay template via pdf-lib (lihat `src/lib/finance/pdf/` saat Phase E)
- Backup JSON: dipakai oleh `scripts/import-finance-backup.ts` di Phase B
- XLSX: deferred, akan dipakai saat RAB integration

## Security

- Tidak ada credentials/secret di file-file ini (verified)
- Backup JSON hanya berisi business data (PO, supplier, material, dll)
