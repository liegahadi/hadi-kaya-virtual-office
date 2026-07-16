'use client'

// ============================================================
// DINA v2: BANK ANNOTATION EDITOR
// Visual PDF annotation — click on PDF to place field markers
// Map each marker to a DB field (customer.name, customer.nik, etc)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Plus, Trash2, Loader2, MousePointerClick, ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, Grid3x3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Annotation } from './bank-builder'

// Annotation type with fontSize + testValue
interface AnnotationExt extends Annotation {
  fontSize?: number
}

// Grouped field mappings — MIRROR parent (FORMBOX_CATEGORIES di bank-builder.tsx)
// Urutan kategori & fields HARUS sama dengan parent, hanya beda value key:
//   - Parent uses form box field IDs ('applicant.fullName')
//   - Dropdown uses field mapping values ('customer.name')
//   - Mapping between them via FORMBOX_TO_MAPPING
// Field extra dihapus (gender, religion, maritalStatus, shmNumber, dll) — parent jadi source of truth murni.
// System + Custom tetap ada di bawah sebagai extra categories.
const FIELD_MAPPINGS_GROUPED = [
  {
    group: 'Data Perusahaan (Global)',
    fields: [
      { value: 'company.companyName', label: 'Nama PT (Developer)' },
      { value: 'company.directorName', label: 'Nama Direktur' },
      { value: 'company.directorNik', label: 'NIK Direktur' },
      { value: 'company.directorPhone', label: 'No. HP Owner (Global)' },
      { value: 'company.directorAddress', label: 'Alamat KTP Direktur' },
      { value: 'company.officeAddress', label: 'Alamat Kantor' },
      { value: 'company.city', label: 'Kota Kantor' },
      { value: 'company.btnAccount', label: 'Rekening BTN (Perusahaan)' },
      { value: 'company.mandiriAccount', label: 'Rekening Mandiri (Perusahaan)' },
      { value: 'company.bsbAccount', label: 'Rekening BSB Syariah (Perusahaan)' },
      { value: 'company.btnBranch', label: 'Cabang BTN' },
      { value: 'company.mandiriBranch', label: 'Cabang Mandiri' },
      { value: 'company.bsbBranch', label: 'Cabang BSB Syariah' },
    ],
  },
  {
    group: 'Data Nasabah',
    fields: [
      { value: 'customer.name', label: 'Nama Lengkap Debitur' },
      { value: 'customer.nik', label: 'NIK (No KTP)' },
      { value: 'customer.birthPlace', label: 'Tempat Lahir' },
      { value: 'customer.birthDate', label: 'Tanggal Lahir' },
      { value: 'customer.ktpAddress', label: 'Alamat KTP' },
      { value: 'customer.rtRw', label: 'RT/RW' },
      { value: 'customer.kelurahan', label: 'Kelurahan/Desa' },
      { value: 'customer.kecamatan', label: 'Kecamatan' },
      { value: 'customer.city', label: 'Kota' },
      { value: 'customer.postalCode', label: 'Kode Pos' },
      { value: 'customer.phone', label: 'No HP/Telp' },
      { value: 'customer.npwpNumber', label: 'NPWP' },
      { value: 'customer.btnAccountNumber', label: 'No Rekening BTN (Nasabah)' },
      { value: 'customer.domicileAddress', label: 'Alamat Domisili' },
      { value: 'customer.email', label: 'Email' },
      { value: 'customer.nip', label: 'NIP / No. Pokok Pegawai' },
    ],
  },
  {
    group: 'Data Pekerjaan / Wirausaha (Debitur)',
    fields: [
      { value: 'customer.workPosition', label: 'Jabatan / Jenis Usaha' },
      { value: 'customer.companyName', label: 'Nama Perusahaan / Usaha' },
      { value: 'customer.companyAddress', label: 'Alamat Perusahaan / Usaha' },
      { value: 'customer.companyPhone', label: 'Telp Perusahaan' },
      { value: 'customer.monthlyIncome', label: 'Gaji / Penghasilan Bersih per Bulan' },
    ],
  },
  {
    group: 'Data Pasangan Nasabah',
    fields: [
      { value: 'customer.spouseName', label: 'Nama Pasangan' },
      { value: 'customer.spouseNik', label: 'NIK Pasangan' },
      { value: 'customer.spouseBirthPlace', label: 'Tempat Lahir Pasangan' },
      { value: 'customer.spouseBirthDate', label: 'Tanggal Lahir Pasangan' },
      { value: 'customer.spouseAddress', label: 'Alamat Pasangan' },
    ],
  },
  {
    group: 'Data Pekerjaan Pasangan',
    fields: [
      { value: 'customer.spouseJob', label: 'Pekerjaan / Jabatan Pasangan' },
      { value: 'customer.spouseJobType', label: 'Status Pekerjaan Pasangan' },
    ],
  },
  {
    group: 'Unit Properti',
    fields: [
      { value: 'customer.projectName', label: 'Nama Perumahan' },
      { value: 'customer.houseAddress', label: 'Alamat Rumah/Properti' },
      { value: 'customer.blockLetter', label: 'Blok Rumah' },
      { value: 'customer.houseNumber', label: 'No Rumah' },
      { value: 'customer.landSize', label: 'Luas Tanah' },
      { value: 'customer.houseSize', label: 'Luas Bangunan' },
      { value: 'customer.shmNumber', label: 'No. Sertifikat (SHM)' },
      { value: 'customer.nibNumber', label: 'Kelurahan Sertipikat / NIB' },
      { value: 'customer.price', label: 'Harga Rumah' },
      { value: 'customer.dpAmount', label: 'DP' },
      { value: 'customer.plafonKpr', label: 'Plafon KPR' },
      { value: 'customer.tenor', label: 'Tenor (tahun)' },
      { value: 'customer.dateOfDocument', label: 'Tanggal Dokumen' },
      { value: 'customer.akadDate', label: 'Tanggal Akad' },
      { value: 'customer.akadNumber', label: 'No. Akad' },
      { value: 'customer.lpaDate', label: 'Tanggal LPA' },
      { value: 'customer.lpaNumber', label: 'No. LPA' },
      { value: 'customer.sp3kDate', label: 'Tanggal SP3K' },
    ],
  },
  {
    group: 'Sistem (Realtime)',
    fields: [
      { value: 'system.todayDate', label: 'Tanggal Hari Ini (DD/MM/YYYY)' },
      { value: 'system.todayDateLong', label: 'Tanggal Hari Ini (panjang)' },
      { value: 'system.todayDay', label: 'Hari (e.g. Senin)' },
      { value: 'system.currentYear', label: 'Tahun Berjalan' },
      { value: 'system.currentMonth', label: 'Bulan Berjalan' },
    ],
  },
  {
    group: 'Custom',
    fields: [
      { value: 'custom.text', label: 'Custom Text (diisi manual)' },
      { value: 'custom.date', label: 'Custom Date (diisi manual)' },
      { value: 'custom.signature', label: 'Tanda Tangan (kosong)' },
    ],
  },
]

// Flatten for backward compat
const FIELD_MAPPINGS = FIELD_MAPPINGS_GROUPED.flatMap(g => g.fields)

// Map Form Box Field IDs (from BankConfig) → Field Mapping values (in dropdown)
// This is needed because Form Box Fields use 'applicant.fullName' but
// Field Mapping dropdown uses 'customer.name'
const FORMBOX_TO_MAPPING: Record<string, string> = {
  // Perusahaan
  'company.companyName': 'company.companyName',
  'company.directorName': 'company.directorName',
  'company.directorNik': 'company.directorNik',
  'company.directorPhone': 'company.directorPhone',
  'company.directorAddress': 'company.directorAddress',
  'company.officeAddress': 'company.officeAddress',
  'company.city': 'company.city',
  'company.btnAccount': 'company.btnAccount',
  'company.mandiriAccount': 'company.mandiriAccount',
  'company.bsbAccount': 'company.bsbAccount',
  'company.btnBranch': 'company.btnBranch',
  'company.mandiriBranch': 'company.mandiriBranch',
  'company.bsbBranch': 'company.bsbBranch',
  // Nasabah
  'applicant.fullName': 'customer.name',
  'applicant.ktpNumber': 'customer.nik',
  'applicant.pob': 'customer.birthPlace',
  'applicant.dob': 'customer.birthDate',
  'applicant.address': 'customer.ktpAddress',
  'applicant.rtRw': 'customer.rtRw',
  'applicant.kelurahan': 'customer.kelurahan',
  'applicant.kecamatan': 'customer.kecamatan',
  'applicant.city': 'customer.city',
  'applicant.postalCode': 'customer.postalCode',
  'applicant.phone': 'customer.phone',
  'applicant.npwpNumber': 'customer.npwpNumber',
  'applicant.btnAccountNumber': 'customer.btnAccountNumber',
  'applicant.domicileAddress': 'customer.domicileAddress',
  'applicant.email': 'customer.email',
  'applicant.nip': 'customer.nip',
  // Pekerjaan
  'applicant.jobTitle': 'customer.workPosition',
  'applicant.companyName': 'customer.companyName',
  'applicant.companyAddress': 'customer.companyAddress',
  'applicant.companyPhone': 'customer.companyPhone',
  'applicant.monthlyIncome': 'customer.monthlyIncome',
  // Pasangan
  'spouse.fullName': 'customer.spouseName',
  'spouse.ktpNumber': 'customer.spouseNik',
  'spouse.pob': 'customer.spouseBirthPlace',
  'spouse.dob': 'customer.spouseBirthDate',
  'spouse.job': 'customer.spouseJob',
  'spouse.address': 'customer.spouseAddress',
  'spouse.jobType': 'customer.spouseJobType',
  // Properti
  'property.projectName': 'customer.projectName',
  'property.houseAddress': 'customer.houseAddress',
  'property.blockLetter': 'customer.blockLetter',
  'property.houseNumber': 'customer.houseNumber',
  'property.landSize': 'customer.landSize',
  'property.houseSize': 'customer.houseSize',
  'property.shmNumber': 'customer.shmNumber',
  'property.nibNumber': 'customer.nibNumber',
  'property.price': 'customer.price',
  'property.dpAmount': 'customer.dpAmount',
  'property.plafonKpr': 'customer.plafonKpr',
  'property.tenor': 'customer.tenor',
  'dateOfDocument': 'customer.dateOfDocument',
  'akadDate': 'customer.akadDate',
  'akadNumber': 'customer.akadNumber',
  'lpaDate': 'customer.lpaDate',
  'lpaNumber': 'customer.lpaNumber',
  'sp3kDate': 'customer.sp3kDate',
}

// Reverse mapping: Field Mapping value → Form Box Field ID
const MAPPING_TO_FORMBOX: Record<string, string> = Object.entries(FORMBOX_TO_MAPPING).reduce((acc, [k, v]) => {
  acc[v] = k
  return acc
}, {} as Record<string, string>)

// Build grouped dropdown options — filter static + custom fields by formboxFields
// Map parent category ID → dropdown group label (URUTAN HARUS MIRROR parent)
const CATEGORY_TO_GROUP: Record<string, string> = {
  'perusahaan': 'Data Perusahaan (Global)',
  'nasabah': 'Data Nasabah',
  'pekerjaan-debitur': 'Data Pekerjaan / Wirausaha (Debitur)',
  'pasangan': 'Data Pasangan Nasabah',
  'pekerjaan-pasangan': 'Data Pekerjaan Pasangan',
  'properti': 'Unit Properti',
}

// Reverse lookup: group label → category ID
const GROUP_TO_CATEGORY: Record<string, string> = Object.entries(CATEGORY_TO_GROUP).reduce((acc, [k, v]) => {
  acc[v] = k
  return acc
}, {} as Record<string, string>)

// Auto-derived fields (composite + transform) — injected to dropdown
// when their source field IDs are all checked in formboxFields.
// Defined in bank-builder.tsx as AUTO_DERIVED_FIELDS.
// Each auto-derived field appears in its parent category group.
const AUTO_DERIVED_FIELDS_LIST = [
  { id: 'applicant.pobDobComposite', label: 'Tempat, Tgl Lahir (gabungan)', type: 'composite_pob_dob', sourceFieldIds: ['applicant.pob', 'applicant.dob'], category: 'nasabah' },
  { id: 'company.cityLongDateComposite', label: 'Kota + Tanggal Panjang (gabungan)', type: 'composite_city_long_date', sourceFieldIds: ['company.city', 'dateOfDocument'], category: 'perusahaan' },
  { id: 'property.blokRumahComposite', label: 'Blok - No Rumah (gabungan, E-6)', type: 'composite_blok_rumah', sourceFieldIds: ['property.blockLetter', 'property.houseNumber'], category: 'properti' },
  { id: 'property.ltlbComposite', label: 'Luas Tanah / Luas Bangunan (gabungan, 36/84)', type: 'composite_ltlb', sourceFieldIds: ['property.landSize', 'property.houseSize'], category: 'properti' },
  { id: 'property.sprRomanMonth', label: 'Bulan SPR (Romawi, I-XII)', type: 'roman_month', sourceFieldIds: ['dateOfDocument'], category: 'properti' },
  { id: 'property.sprMonthName', label: 'Nama Bulan (e.g. Agustus)', type: 'month_name', sourceFieldIds: ['dateOfDocument'], category: 'properti' },
  { id: 'property.sprLongDate', label: 'Tanggal Panjang (17 Agustus 2026)', type: 'date_long', sourceFieldIds: ['dateOfDocument'], category: 'properti' },
  { id: 'property.sprShortDate', label: 'Tanggal Pendek (17/08/2026)', type: 'date_short', sourceFieldIds: ['dateOfDocument'], category: 'properti' },
]

function buildGroupedWithCustoms(customFields: Array<{ id: string; label: string; category: string }>, formboxFields: string[]) {
  if (!formboxFields || formboxFields.length === 0) {
    // No formbox config → show all (backward compat for banks without config)
    // Also include auto-derived fields (since we don't know what's checked, include all)
    return FIELD_MAPPINGS_GROUPED.map(group => {
      const catId = GROUP_TO_CATEGORY[group.group]
      const autoForGroup = AUTO_DERIVED_FIELDS_LIST
        .filter(af => af.category === catId)
        .map(af => ({ value: af.id, label: `${af.label} (Auto)` }))
      return {
        ...group,
        fields: [...group.fields, ...autoForGroup],
      }
    })
  }

  // Only include custom fields that are checked
  const activeCustoms = customFields.filter(f => formboxFields.includes(f.id))
  
  // Determine which auto-derived fields are active (all source IDs must be checked)
  const activeAutoDerived = AUTO_DERIVED_FIELDS_LIST.filter(af =>
    af.sourceFieldIds.every(srcId => formboxFields.includes(srcId))
  )
  
  return FIELD_MAPPINGS_GROUPED.map(group => {
    const groupLabel = GROUP_TO_CATEGORY[group.group]
    const customsForGroup = activeCustoms.filter(f => f.category === groupLabel)
    const autoForGroup = activeAutoDerived.filter(af => af.category === groupLabel)

    // Filter static fields: only show if corresponding formbox field is checked
    // System + Custom categories (no groupLabel) always show all
    const filteredStatic = group.fields.filter(f => {
      const formboxId = MAPPING_TO_FORMBOX[f.value]
      if (!formboxId) return true // System/custom fields always show
      return formboxFields.includes(formboxId)
    })
    
    return {
      ...group,
      fields: [
        ...filteredStatic,
        ...autoForGroup.map(af => ({ value: af.id, label: `${af.label} (Auto)` })),
        ...customsForGroup.map(f => ({ value: f.id, label: `${f.label} (Custom)` })),
      ],
    }
  })
}

interface BankTemplate {
  fileId?: string
  fileName?: string
  webViewLink?: string | null
  fileHash?: string
  version?: number
  annotations?: Annotation[]
}

export function BankAnnotationEditor({
  bank,
  template,
  onUpdated,
}: {
  bank: any
  template: BankTemplate
  onUpdated: () => void
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(template.annotations || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<null | 'move' | 'resize' | 'resize-bl' | 'resize-tr' | 'resize-tl'>(null)

  // Multi-template state
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Test field state (sample data untuk preview)
  const [testFieldValues, setTestFieldValues] = useState<Record<string, string>>({})
  const [testCustomerId, setTestCustomerId] = useState<string>('')
  const [customers, setCustomers] = useState<any[]>([])
  const [bankCustomFields, setBankCustomFields] = useState<Array<{ id: string; label: string; category: string }>>([])
  const [bankFormboxFields, setBankFormboxFields] = useState<string[]>([])

  const dragRef = useRef<{
    annId: string
    mode: typeof dragMode
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
    containerWidth: number
    containerHeight: number
  } | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageWidth, setPageWidth] = useState(600)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1.0)
  const [showGrid, setShowGrid] = useState(false)
  const [pdfDocRef, setPdfDocRef] = useState<any>(null) // store pdfjs document for re-render
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load templates + customers on mount
  useEffect(() => {
    async function loadAll() {
      // Load templates
      try {
        const res = await fetch(`/api/bank-config/${bank.id}/template`)
        const data = await res.json()
        if (data.success) {
          const tpls = data.data.templates || []
          if (tpls.length > 0) {
            setTemplates(tpls)
            setSelectedTemplateId(tpls[0].id)
            setAnnotations(tpls[0].annotations || [])
          } else if (data.data.template) {
            // Legacy single template
            const legacyTpl = {
              id: 'legacy',
              name: data.data.template.fileName || 'Template',
              fileId: data.data.template.fileId,
              annotations: data.data.template.annotations || [],
            }
            setTemplates([legacyTpl])
            setSelectedTemplateId('legacy')
            setAnnotations(legacyTpl.annotations)
          }
        }
      } catch (err) {
        console.error('Load templates error:', err)
      }

      // Load customers for test field dropdown
      try {
        const res = await fetch('/api/database-explorer/berkas')
        const data = await res.json()
        if (data.success) {
          setCustomers(data.data.slice(0, 50))
        }
      } catch (err) {
        console.error('Load customers error:', err)
      }

      // Load custom fields + formbox fields from BankConfig
      try {
        const res = await fetch(`/api/bank-config/${bank.id}/template`)
        const data = await res.json()
        if (data.success && data.data.bank?.documents) {
          const docs = JSON.parse(data.data.bank.documents)
          setBankCustomFields(docs.customFields || [])
          setBankFormboxFields(docs.formboxFields || [])
        }
      } catch (err) {
        console.error('Load custom fields error:', err)
      }
    }
    loadAll()
  }, [bank.id])

  // Load PDF — only when template or bank changes (NOT on zoom/page change)
  useEffect(() => {
    const selectedTpl = templates.find(t => t.id === selectedTemplateId)
    if (!selectedTpl?.fileId && !selectedTpl?.templatePath && !template?.fileId) {
      setLoadError('Belum ada template PDF. Upload template di tab "Template PDF" dulu.')
      return
    }

    let cancelled = false
    async function loadPdf() {
      try {
        setLoadError(null)
        setPdfLoaded(false)

        const proxyUrl = `/api/bank-config/${bank.id}/template/pdf-proxy?templateId=${selectedTpl?.id || selectedTemplateId}`

        const testRes = await fetch(proxyUrl)
        if (!testRes.ok) {
          const errData = await testRes.json().catch(() => ({}))
          throw new Error(errData.error || `Proxy returned ${testRes.status}`)
        }

        const pdfjs: any = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs`

        const loadingTask = pdfjs.getDocument({ url: proxyUrl })
        const pdf = await loadingTask.promise

        if (cancelled) return

        setNumPages(pdf.numPages)
        setPdfUrl(proxyUrl)
        setPdfDocRef(pdf) // store for re-render
      } catch (err: any) {
        console.error('PDF load error:', err)
        setLoadError(`Gagal memuat PDF: ${err?.message || 'unknown error'}`)
      }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [selectedTemplateId, templates, template?.fileId, bank.id])

  // Re-render page — when zoom, page, showGrid, or pdfDocRef changes
  useEffect(() => {
    if (!pdfDocRef) return
    async function doRender() {
      try {
        const page = await pdfDocRef.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return

        const container = containerRef.current
        const maxWidth = container?.clientWidth ? container.clientWidth - 32 : 600
        const viewport = page.getViewport({ scale: 1 })
        const baseScale = maxWidth / viewport.width
        const scale = baseScale * zoom
        const scaledViewport = page.getViewport({ scale })

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        canvas.style.width = `${scaledViewport.width}px`
        canvas.style.height = `${scaledViewport.height}px`
        setPageWidth(scaledViewport.width)

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise

        // Draw grid overlay if enabled (30% opacity)
        if (showGrid) {
          ctx.save()
          ctx.globalAlpha = 0.3
          ctx.strokeStyle = '#999'
          ctx.lineWidth = 0.5
          const gridSize = 20 * zoom
          for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
          }
          for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
          }
          ctx.restore()
        }

        setPdfLoaded(true)
      } catch (err) {
        console.error('Render page error:', err)
      }
    }
    doRender()
  }, [pdfDocRef, currentPage, zoom, showGrid])

  // Handle click on PDF to add annotation
  function handlePdfClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!pdfLoaded) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    // Default size (relative)
    const width = 0.15
    const height = 0.025

    const newAnnotation: Annotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      page: currentPage,
      x: Math.max(0, Math.min(1 - width, x - width / 2)),
      y: Math.max(0, Math.min(1 - height, y - height / 2)),
      width,
      height,
      label: `Field ${annotations.length + 1}`,
      fieldMapping: 'customer.name',
      fieldType: 'text',
    }

    setAnnotations([...annotations, newAnnotation])
    setSelectedId(newAnnotation.id)
    toast.success(`Field ditambahkan di page ${currentPage}`)
  }

  // Update annotation
  function updateAnnotation(id: string, updates: Partial<Annotation>) {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  // Delete annotation
  function deleteAnnotation(id: string) {
    setAnnotations(annotations.filter(a => a.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // === DRAG-MOVE + RESIZE handlers ===
  function startDrag(e: React.MouseEvent, annId: string, mode: typeof dragMode) {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(annId)
    setDragMode(mode)

    const ann = annotations.find(a => a.id === annId)
    if (!ann) return

    const container = e.currentTarget.closest('.relative.inline-block')
    const rect = container?.getBoundingClientRect()
    if (!rect) return

    dragRef.current = {
      annId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: ann.x,
      origY: ann.y,
      origW: ann.width,
      origH: ann.height,
      containerWidth: rect.width,
      containerHeight: rect.height,
    }

    // Attach global listeners
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', endDrag)
  }

  function onDragMove(e: MouseEvent) {
    if (!dragRef.current) return
    const d = dragRef.current
    const ann = annotations.find(a => a.id === d.annId)
    if (!ann) return

    const deltaX = (e.clientX - d.startX) / d.containerWidth
    const deltaY = (e.clientY - d.startY) / d.containerHeight

    let newX = d.origX
    let newY = d.origY
    let newW = d.origW
    let newH = d.origH

    if (d.mode === 'move') {
      newX = Math.max(0, Math.min(1 - d.origW, d.origX + deltaX))
      newY = Math.max(0, Math.min(1 - d.origH, d.origY + deltaY))
    } else if (d.mode === 'resize') {
      // Bottom-right resize
      newW = Math.max(0.02, Math.min(1 - d.origX, d.origW + deltaX))
      newH = Math.max(0.01, Math.min(1 - d.origY, d.origH + deltaY))
    } else if (d.mode === 'resize-bl') {
      // Bottom-left resize
      const newRight = d.origX + d.origW
      newX = Math.max(0, Math.min(newRight - 0.02, d.origX + deltaX))
      newW = newRight - newX
      newH = Math.max(0.01, Math.min(1 - d.origY, d.origH + deltaY))
    } else if (d.mode === 'resize-tr') {
      // Top-right resize
      const newBottom = d.origY + d.origH
      newY = Math.max(0, Math.min(newBottom - 0.01, d.origY + deltaY))
      newH = newBottom - newY
      newW = Math.max(0.02, Math.min(1 - d.origX, d.origW + deltaX))
    } else if (d.mode === 'resize-tl') {
      // Top-left resize
      const newRight = d.origX + d.origW
      const newBottom = d.origY + d.origH
      newX = Math.max(0, Math.min(newRight - 0.02, d.origX + deltaX))
      newY = Math.max(0, Math.min(newBottom - 0.01, d.origY + deltaY))
      newW = newRight - newX
      newH = newBottom - newY
    }

    setAnnotations(prev => prev.map(a =>
      a.id === d.annId
        ? { ...a, x: newX, y: newY, width: newW, height: newH }
        : a
    ))
  }

  function endDrag() {
    setDragMode(null)
    dragRef.current = null
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', endDrag)
  }

  // Save annotations to backend
  async function saveAnnotations() {
    setSaving(true)
    try {
      // Save annotations per template (multi-template support)
      const res = await fetch('/api/bank-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bank.id,
          annotations,
          templateId: selectedTemplateId, // save to specific template
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${annotations.length} annotation disimpan untuk template ini`)
        // Update local templates state so annotation count refreshes without Ctrl+R
        setTemplates(prev => prev.map(t =>
          t.id === selectedTemplateId ? { ...t, annotations } : t
        ))
        onUpdated()
      } else {
        toast.error(data.error || 'Gagal simpan')
      }
    } catch (err) {
      toast.error('Gagal simpan annotation')
    } finally {
      setSaving(false)
    }
  }

  const pageAnnotations = annotations.filter(a => a.page === currentPage)

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-3 overflow-hidden">
      {/* PDF Viewer */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Template selector */}
            {templates.length > 1 && (
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => {
                  const tplId = e.target.value
                  setSelectedTemplateId(tplId)
                  const tpl = templates.find(t => t.id === tplId)
                  if (tpl) {
                    setAnnotations(tpl.annotations || [])
                    setSelectedId(null)
                  }
                }}
                className="text-xs border rounded bg-background px-2 py-1 h-7"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs">
              Page {currentPage} / {numPages || '?'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} disabled={zoom <= 0.5} className="h-7 w-7 p-0">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} disabled={zoom >= 3.0} className="h-7 w-7 p-0">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant={showGrid ? 'default' : 'outline'} size="sm" onClick={() => setShowGrid(!showGrid)} className="h-7 w-7 p-0" title="Toggle grid">
              <Grid3x3 className="w-3.5 h-3.5" />
            </Button>
            <Badge variant="outline" className="text-xs ml-1">
              {annotations.length} total
            </Badge>
            <Button size="sm" onClick={saveAnnotations} disabled={saving} className="ml-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Simpan
            </Button>
          </div>
        </div>

        {/* PDF Canvas + Annotations overlay — overflow hidden, scroll hanya via page nav buttons */}
        <div ref={containerRef} className="flex-1 overflow-hidden p-4 bg-slate-300 dark:bg-slate-900 relative flex items-start justify-center">
          <div className="overflow-auto max-h-full">
          {loadError ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400 text-sm">
              <p>{loadError}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Pastikan file PDF di Drive memiliki permission "anyone with link can view".
              </p>
            </div>
          ) : (
            <div className="relative inline-block mx-auto bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                onClick={handlePdfClick}
                className="block cursor-crosshair"
              />
              {/* Annotations overlay — DRAGGABLE + RESIZABLE */}
              {pageAnnotations.map((ann) => {
                const isSelected = ann.id === selectedId
                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(ann.id)
                    }}
                    onMouseDown={(e) => startDrag(e, ann.id, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${ann.x * 100}%`,
                      top: `${ann.y * 100}%`,
                      width: `${ann.width * 100}%`,
                      height: `${ann.height * 100}%`,
                      cursor: dragMode === 'move' && isSelected ? 'grabbing' : 'grab',
                    }}
                    className={cn(
                      'border-2 transition-colors select-none',
                      isSelected
                        ? 'border-blue-500 bg-blue-500/30'
                        : 'border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30'
                    )}
                  >
                    {isSelected && (
                    <span className="absolute -top-5 left-0 text-[9px] font-medium bg-blue-600 text-white px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                      {ann.label}
                    </span>
                    )}
                    {/* Real-time test data overlay — show sample value inside annotation box */}
                    {testFieldValues[ann.fieldMapping] && (
                      <div
                        className="absolute inset-0 flex items-center px-1 overflow-hidden pointer-events-none"
                        style={{
                          fontSize: `${(ann as any).fontSize || 10}px`,
                          color: '#1e40af',
                          fontWeight: 500,
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          whiteSpace: 'normal',
                        }}
                      >
                        <span>{testFieldValues[ann.fieldMapping]}</span>
                      </div>
                    )}
                    {/* Resize handles (only when selected) */}
                    {isSelected && (
                      <>
                        {/* Bottom-right resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize"
                          style={{ cursor: 'se-resize' }}
                        />
                        {/* Bottom-left resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-bl')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'sw-resize' }}
                        />
                        {/* Top-right resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-tr')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'ne-resize' }}
                        />
                        {/* Top-left resize handle */}
                        <div
                          onMouseDown={(e) => startDrag(e, ann.id, 'resize-tl')}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm"
                          style={{ cursor: 'nw-resize' }}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {!pdfLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          </div>
        </div>

        {/* Hint */}
        <div className="p-2 bg-blue-500/5 border-t border-border text-[10px] text-muted-foreground flex items-center gap-1">
          <MousePointerClick className="w-3 h-3" />
          Klik di PDF untuk menambah field annotation. Pilih annotation untuk edit mapping.
        </div>
      </Card>

      {/* Annotation List + Editor — proper scroll within modal */}
      <Card className="overflow-hidden flex flex-col min-h-0">
        <div className="p-2 border-b border-border bg-muted/30 shrink-0">
          <h3 className="text-xs font-semibold">Annotations</h3>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-2 space-y-2">
            {annotations.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                Belum ada annotation. Klik di PDF untuk mulai.
              </div>
            ) : (
              annotations.map((ann, idx) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    setSelectedId(ann.id)
                    if (ann.page !== currentPage) setCurrentPage(ann.page)
                  }}
                  className={cn(
                    'p-2 rounded border cursor-pointer transition-colors',
                    selectedId === ann.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{ann.label}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">p{ann.page}</Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id) }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {FIELD_MAPPINGS.find(f => f.value === ann.fieldMapping)?.label || ann.fieldMapping}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected annotation editor + Test Field */}
        {selectedId && (
          <div className="p-2 border-t border-border bg-muted/30 space-y-2">
            <h4 className="text-xs font-semibold">Edit Field</h4>
            {(() => {
              const ann = annotations.find(a => a.id === selectedId)
              if (!ann) return null
              return (
                <>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Label</label>
                    <Input
                      value={ann.label}
                      onChange={(e) => updateAnnotation(ann.id, { label: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field Mapping</label>
                    <Select
                      value={ann.fieldMapping}
                      onValueChange={(v) => updateAnnotation(ann.id, { fieldMapping: v })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {buildGroupedWithCustoms(bankCustomFields, bankFormboxFields).map((group) => (
                          <div key={group.group}>
                            <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase bg-muted/50 sticky top-0">
                              {group.group}
                            </div>
                            {group.fields.map((f: any) => (
                              <SelectItem key={f.value} value={f.value} className="text-xs">
                                {f.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field Type</label>
                    <Select
                      value={ann.fieldType || 'text'}
                      onValueChange={(v) => updateAnnotation(ann.id, { fieldType: v as any })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text" className="text-xs">Text</SelectItem>
                        <SelectItem value="date" className="text-xs">Date</SelectItem>
                        <SelectItem value="number" className="text-xs">Number</SelectItem>
                        <SelectItem value="image" className="text-xs">Image (foto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <div>
                      <label className="text-[9px] text-muted-foreground">X</label>
                      <Input type="number" step="0.01" min="0" max="1" value={ann.x.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { x: parseFloat(e.target.value) || 0 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">Y</label>
                      <Input type="number" step="0.01" min="0" max="1" value={ann.y.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { y: parseFloat(e.target.value) || 0 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">W</label>
                      <Input type="number" step="0.01" min="0.01" max="1" value={ann.width.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { width: parseFloat(e.target.value) || 0.01 })} className="h-6 text-[10px]" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground">H</label>
                      <Input type="number" step="0.01" min="0.01" max="1" value={ann.height.toFixed(3)} onChange={(e) => updateAnnotation(ann.id, { height: parseFloat(e.target.value) || 0.01 })} className="h-6 text-[10px]" />
                    </div>
                  </div>
                  {/* Font Size */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Font Size (px)</label>
                    <Input
                      type="number"
                      min="6"
                      max="72"
                      value={(ann as any).fontSize || 10}
                      onChange={(e) => updateAnnotation(ann.id, { fontSize: parseInt(e.target.value) || 10 } as any)}
                      className="h-7 text-xs w-20"
                    />
                  </div>
                  {/* TEST FIELD — sample data untuk real-time preview di PDF */}
                  <div className="pt-2 border-t border-border">
                    <label className="text-[10px] text-violet-500 font-medium">🧪 Test Data (real-time preview di PDF)</label>
                    <Input
                      placeholder="Ketik sample value..."
                      value={testFieldValues[ann.fieldMapping] || ''}
                      onChange={(e) => setTestFieldValues(prev => ({ ...prev, [ann.fieldMapping]: e.target.value }))}
                      className="h-7 text-xs mt-1"
                    />
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Value muncul real-time di annotation box di PDF →
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Test Customer Selector */}
        <div className="p-2 border-t border-border bg-violet-500/5">
          <label className="text-[10px] text-violet-500 font-medium">🧪 Test dari Konsumen Existing</label>
          <select
            value={testCustomerId}
            onChange={async (e) => {
              const cid = e.target.value
              setTestCustomerId(cid)
              if (cid) {
                // Fetch customer data + company settings + fill test field values
                try {
                  const [custRes, companyRes] = await Promise.all([
                    fetch(`/api/customers/${cid}`),
                    fetch(`/api/company-settings`).catch(() => null),
                  ])
                  const data = await custRes.json()
                  if (data.success) {
                    const c = data.data
                    const values: Record<string, string> = {}

                    // === NASABAH ===
                    if (c.name) values['customer.name'] = c.name
                    if (c.nik) values['customer.nik'] = c.nik
                    if (c.birthPlace) values['customer.birthPlace'] = c.birthPlace
                    if (c.birthDate) values['customer.birthDate'] = c.birthDate
                    if (c.ktpAddress) values['customer.ktpAddress'] = c.ktpAddress
                    if (c.rtRw) values['customer.rtRw'] = c.rtRw
                    if (c.kelurahan) values['customer.kelurahan'] = c.kelurahan
                    if (c.kecamatan) values['customer.kecamatan'] = c.kecamatan
                    if (c.city) values['customer.city'] = c.city
                    if (c.postalCode) values['customer.postalCode'] = c.postalCode
                    if (c.whatsappNumber || c.phone) values['customer.phone'] = c.whatsappNumber || c.phone
                    if (c.npwpNumber) values['customer.npwpNumber'] = c.npwpNumber
                    if (c.btnAccountNumber) values['customer.btnAccountNumber'] = c.btnAccountNumber

                    // === PEKERJAAN DEBITUR ===
                    if (c.workPosition) values['customer.workPosition'] = c.workPosition
                    if (c.companyName) values['customer.companyName'] = c.companyName
                    if (c.companyAddress) values['customer.companyAddress'] = c.companyAddress
                    if (c.companyPhone) values['customer.companyPhone'] = c.companyPhone || ''
                    if (c.monthlyIncome) values['customer.monthlyIncome'] = String(c.monthlyIncome)

                    // === PASANGAN ===
                    if (c.spouseName) values['customer.spouseName'] = c.spouseName
                    if (c.spouseNik) values['customer.spouseNik'] = c.spouseNik
                    if (c.spouseBirthPlace) values['customer.spouseBirthPlace'] = c.spouseBirthPlace
                    if (c.spouseBirthDate) values['customer.spouseBirthDate'] = c.spouseBirthDate
                    if (c.spouseAddress) values['customer.spouseAddress'] = c.spouseAddress
                    if (c.spouseOccupation) values['customer.spouseJob'] = c.spouseOccupation
                    // jobType: 'NGANGGUR' → 'Tidak Bekerja', 'KARYAWAN' → 'Karyawan', 'WIRAUSAHA' → 'Wirausaha'
                    if (c.spouseJobType) {
                      const jobTypeMap: Record<string, string> = {
                        'NGANGGUR': 'Tidak Bekerja',
                        'KARYAWAN': 'Karyawan',
                        'WIRAUSAHA': 'Wirausaha',
                      }
                      values['customer.spouseJobType'] = jobTypeMap[c.spouseJobType] || c.spouseJobType
                    } else if (c.maritalStatus === 'MENIKAH' || c.maritalStatus === 'MARRIED') {
                      // Default to 'Tidak Bekerja' if married but no jobType set
                      values['customer.spouseJobType'] = 'Tidak Bekerja'
                    }

                    // === PROPERTI ===
                    if (c.projectName) values['customer.projectName'] = c.projectName
                    if (c.blockLetter) values['customer.blockLetter'] = c.blockLetter
                    if (c.houseNumber) values['customer.houseNumber'] = c.houseNumber
                    if (c.landSize) values['customer.landSize'] = String(c.landSize)
                    if (c.houseSize) values['customer.houseSize'] = String(c.houseSize)
                    if (c.price) values['customer.price'] = String(c.price)
                    if (c.downPayment) values['customer.dpAmount'] = String(c.downPayment)
                    if (c.kprPlafon) values['customer.plafonKpr'] = String(c.kprPlafon)
                    if (c.kprTerm) values['customer.tenor'] = String(c.kprTerm)
                    if (c.dateOfDocument) values['customer.dateOfDocument'] = c.dateOfDocument
                    if (c.akadDate) values['customer.akadDate'] = c.akadDate
                    if (c.lpaDate) values['customer.lpaDate'] = c.lpaDate
                    if (c.shmNumber) values['customer.shmNumber'] = c.shmNumber
                    if (c.nibNumber) values['customer.nibNumber'] = c.nibNumber

                    // === PERUSAHAAN (GLOBAL — dari CompanySetting) ===
                    if (companyRes && companyRes.ok) {
                      try {
                        const compData = await companyRes.json()
                        if (compData.success && compData.data) {
                          const cs = compData.data
                          if (cs.companyName) values['company.companyName'] = cs.companyName
                          if (cs.directorName) values['company.directorName'] = cs.directorName
                          if (cs.directorNik) values['company.directorNik'] = cs.directorNik
                          if (cs.officeAddress) values['company.officeAddress'] = cs.officeAddress
                          if (cs.city) values['company.city'] = cs.city
                        }
                      } catch {}
                    }

                    // === AUTO-DERIVED COMPOSITE + TRANSFORM FIELDS ===
                    // Composite: pobDob — "Jakarta, 17 Agustus 1990"
                    if (values['customer.birthPlace'] && values['customer.birthDate']) {
                      try {
                        const d = new Date(values['customer.birthDate'])
                        const long = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                        values['applicant.pobDobComposite'] = `${values['customer.birthPlace']}, ${long}`
                      } catch {}
                    }
                    // Composite: cityLongDate — "Pangkalpinang, 17 Agustus 2026"
                    if (values['company.city'] && values['customer.dateOfDocument']) {
                      try {
                        const d = new Date(values['customer.dateOfDocument'])
                        const long = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                        values['company.cityLongDateComposite'] = `${values['company.city']}, ${long}`
                      } catch {}
                    }
                    // Composite: blokRumahComposite — "E-6"
                    if (values['customer.blockLetter'] && values['customer.houseNumber']) {
                      values['property.blokRumahComposite'] = `${values['customer.blockLetter']}-${values['customer.houseNumber']}`
                    } else if (values['customer.blockLetter']) {
                      values['property.blokRumahComposite'] = values['customer.blockLetter']
                    } else if (values['customer.houseNumber']) {
                      values['property.blokRumahComposite'] = values['customer.houseNumber']
                    }
                    // Composite: ltlbComposite — "36/84"
                    if (values['customer.landSize'] && values['customer.houseSize']) {
                      values['property.ltlbComposite'] = `${values['customer.landSize']}/${values['customer.houseSize']}`
                    }
                    // Transform: roman_month, month_name, date_long, date_short — all derived from dateOfDocument
                    if (values['customer.dateOfDocument']) {
                      try {
                        const d = new Date(values['customer.dateOfDocument'])
                        const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
                        const NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
                        values['property.sprRomanMonth'] = ROMAN[d.getMonth()] || ''
                        values['property.sprMonthName'] = NAMES[d.getMonth()] || ''
                        values['property.sprLongDate'] = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                        const dd = String(d.getDate()).padStart(2, '0')
                        const mm = String(d.getMonth() + 1).padStart(2, '0')
                        values['property.sprShortDate'] = `${dd}/${mm}/${d.getFullYear()}`
                      } catch {}
                    }

                    // === SYSTEM ===
                    const today = new Date()
                    values['system.todayDate'] = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    values['system.todayDateLong'] = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    values['system.todayDay'] = today.toLocaleDateString('id-ID', { weekday: 'long' })
                    values['system.currentYear'] = String(today.getFullYear())
                    values['system.currentMonth'] = today.toLocaleDateString('id-ID', { month: 'long' })
                    setTestFieldValues(values)
                    toast.success(`Test data dari ${c.name} dimuat`)
                  }
                } catch (err) {
                  toast.error('Gagal load data konsumen')
                }
              } else {
                setTestFieldValues({})
              }
            }}
            className="w-full h-7 text-xs border rounded bg-background px-2 mt-1"
          >
            <option value="">— Pilih konsumen —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (Blok {c.blockLetter || ''}{c.houseNumber || ''})
              </option>
            ))}
          </select>
        </div>
        </div>
      </Card>
    </div>
  )
}
