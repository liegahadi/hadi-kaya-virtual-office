'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, User, Briefcase, Heart, Home } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface CustomerData {
  id: string
  name: string
  nik: string | null
  birthPlace: string | null
  birthDate: string | null
  gender: string | null
  ktpAddress: string | null
  rtRw: string | null
  kelurahan: string | null
  kecamatan: string | null
  city: string | null
  postalCode: string | null
  religion: string | null
  occupation: string | null
  companyName: string | null
  companyAddress: string | null
  companyPhone: string | null
  workDuration: string | null
  workPosition: string | null
  monthlyIncome: number | null
  maritalStatus: string | null
  spouseName: string | null
  spouseNik: string | null
  spouseBirthPlace: string | null
  spouseBirthDate: string | null
  spouseOccupation: string | null
  spouseIncome: number | null
  motherMaidenName: string | null
  emergencyContact: string | null
  dependents: number | null
  phone: string | null
  whatsappNumber: string | null
}

export function CustomerDataForm({ customerId }: { customerId: string }) {
  const [data, setData] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  async function fetchCustomer() {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`)
      const d = await res.json()
      if (d.success) setData(d.data)
    } catch {
      toast.error('Gagal memuat data konsumen')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const d = await res.json()
      if (d.success) {
        toast.success('Data konsumen tersimpan! Auto-fill siap digunakan.')
      } else {
        toast.error('Gagal menyimpan')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  function update(field: keyof CustomerData, value: string | number | null) {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  if (loading || !data) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin" />
      </Card>
    )
  }

  return (
    <Card className="p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Data Konsumen (untuk Auto-Fill)</h3>
          <p className="text-[10px] text-muted-foreground">
            Isi sekali → sistem auto-fill semua form bank. Data tersimpan di cloud.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
          Simpan
        </Button>
      </div>

      <div className="space-y-4">
        {/* Personal Data */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <User className="w-3 h-3" /> Data Pribadi
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Field label="Nama Lengkap" value={data.name} onChange={v => update('name', v)} required />
            <Field label="NIK / No. KTP" value={data.nik || ''} onChange={v => update('nik', v)} />
            <Field label="Tempat Lahir" value={data.birthPlace || ''} onChange={v => update('birthPlace', v)} />
            <Field label="Tanggal Lahir" value={data.birthDate || ''} onChange={v => update('birthDate', v)} placeholder="dd-mm-yyyy" />
            <SelectField label="Jenis Kelamin" value={data.gender || ''} onChange={v => update('gender', v)} options={['LAKI_LAKI', 'PEREMPUAN']} />
            <SelectField label="Agama" value={data.religion || ''} onChange={v => update('religion', v)} options={['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']} />
            <SelectField label="Status Pernikahan" value={data.maritalStatus || ''} onChange={v => update('maritalStatus', v)} options={['SINGLE', 'MENIKAH', 'JANDA', 'DUDA']} />
            <Field label="No. Telepon/HP" value={data.phone || ''} onChange={v => update('phone', v)} />
            <Field label="Jumlah Tanggungan" value={String(data.dependents || '')} onChange={v => update('dependents', parseInt(v) || 0)} />
          </div>
        </div>

        {/* KTP Address */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Home className="w-3 h-3" /> Alamat KTP
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="col-span-2 md:col-span-3">
              <Field label="Alamat (sesuai KTP)" value={data.ktpAddress || ''} onChange={v => update('ktpAddress', v)} full />
            </div>
            <Field label="RT/RW" value={data.rtRw || ''} onChange={v => update('rtRw', v)} />
            <Field label="Kelurahan/Desa" value={data.kelurahan || ''} onChange={v => update('kelurahan', v)} />
            <Field label="Kecamatan" value={data.kecamatan || ''} onChange={v => update('kecamatan', v)} />
            <Field label="Kota/Kabupaten" value={data.city || ''} onChange={v => update('city', v)} />
            <Field label="Kode Pos" value={data.postalCode || ''} onChange={v => update('postalCode', v)} />
          </div>
        </div>

        {/* Work Data */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Pekerjaan
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Field label="Pekerjaan" value={data.occupation || ''} onChange={v => update('occupation', v)} placeholder="KARYAWAN / WIRAUSAHA" />
            <Field label="Jabatan" value={data.workPosition || ''} onChange={v => update('workPosition', v)} />
            <Field label="Nama Perusahaan" value={data.companyName || ''} onChange={v => update('companyName', v)} />
            <div className="col-span-2">
              <Field label="Alamat Perusahaan" value={data.companyAddress || ''} onChange={v => update('companyAddress', v)} full />
            </div>
            <Field label="Telp Perusahaan" value={data.companyPhone || ''} onChange={v => update('companyPhone', v)} />
            <Field label="Lama Bekerja (tahun)" value={data.workDuration || ''} onChange={v => update('workDuration', v)} />
            <Field label="Penghasilan/Bulan (Rp)" value={String(data.monthlyIncome || '')} onChange={v => update('monthlyIncome', parseFloat(v) || 0)} />
          </div>
        </div>

        {/* Spouse Data */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Heart className="w-3 h-3" /> Data Pasangan (jika menikah)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Field label="Nama Pasangan" value={data.spouseName || ''} onChange={v => update('spouseName', v)} />
            <Field label="NIK Pasangan" value={data.spouseNik || ''} onChange={v => update('spouseNik', v)} />
            <Field label="Tempat Lahir" value={data.spouseBirthPlace || ''} onChange={v => update('spouseBirthPlace', v)} />
            <Field label="Tanggal Lahir" value={data.spouseBirthDate || ''} onChange={v => update('spouseBirthDate', v)} placeholder="dd-mm-yyyy" />
            <Field label="Pekerjaan" value={data.spouseOccupation || ''} onChange={v => update('spouseOccupation', v)} />
            <Field label="Penghasilan/Bulan (Rp)" value={String(data.spouseIncome || '')} onChange={v => update('spouseIncome', parseFloat(v) || 0)} />
          </div>
        </div>

        {/* Other */}
        <div>
          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-2">
            Lainnya
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Field label="Nama Ibu Kandung" value={data.motherMaidenName || ''} onChange={v => update('motherMaidenName', v)} />
            <Field label="Kontak Darurat" value={data.emergencyContact || ''} onChange={v => update('emergencyContact', v)} />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Field({ label, value, onChange, placeholder, full, required }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  full?: boolean
  required?: boolean
}) {
  return (
    <div className={full ? 'col-span-2 md:col-span-3' : ''}>
      <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="text-[9px] font-medium text-muted-foreground mb-0.5 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">-</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  )
}
