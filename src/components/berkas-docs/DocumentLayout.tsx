// ============================================================
// DOCUMENT LAYOUT - A4 page wrapper with page-break
// ============================================================
// CRITICAL: Setiap dokumen HARUS di halaman sendiri.
// CSS: page-break-after: always
// Tidak boleh overlap antar dokumen.
// ============================================================

import React from 'react'
import { CompanyInfo } from '@/lib/berkas/types'

interface DocumentLayoutProps {
  children: React.ReactNode
  title?: string
  docNumber?: string
}

export function DocumentLayout({ children, title, docNumber }: DocumentLayoutProps) {
  return (
    <div className="berkas-page" style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '20mm 20mm 25mm 20mm',
      backgroundColor: 'white',
      color: 'black',
      fontSize: '11pt',
      lineHeight: '1.5',
      fontFamily: 'Times New Roman, serif',
      pageBreakAfter: 'always',
      breakAfter: 'page',
      position: 'relative',
      boxSizing: 'border-box',
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      {children}
    </div>
  )
}

export function DocHeader({ company, sub }: { company: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
      <h1 style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
        {company}
      </h1>
      {sub && <p style={{ fontSize: '10pt', fontWeight: '600', textTransform: 'uppercase', margin: '5px 0 0 0' }}>{sub}</p>}
    </div>
  )
}

export function SignatureBlock({
  location = 'Pangkalpinang',
  date,
  title,
  name,
  subTitle,
  materai = false,
  align = 'right',
}: {
  location?: string
  date: string
  title?: string
  name: string
  subTitle?: string
  materai?: boolean
  align?: 'left' | 'right' | 'center' | 'between'
}) {
  const content = (
    <div style={{ textAlign: 'center', display: 'inline-block', minWidth: '200px' }}>
      <p style={{ margin: 0 }}>{location}, {date}</p>
      {title && <p style={{ margin: '4px 0 0 0' }}>{title},</p>}
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {materai && (
          <div style={{ border: '1px solid #999', padding: '8px 16px', fontSize: '9pt', textTransform: 'uppercase', color: '#666' }}>
            Materai 10.000
          </div>
        )}
      </div>
      <p style={{ fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase', margin: 0 }}>{name}</p>
      {subTitle && <p style={{ fontSize: '9pt', textTransform: 'uppercase', margin: '2px 0 0 0' }}>{subTitle}</p>}
    </div>
  )

  if (align === 'between') return content

  const justifyContent = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'
  return <div style={{ display: 'flex', justifyContent, marginTop: '30px' }}>{content}</div>
}

export function DataTable({ rows }: { rows: Array<[string, string | React.ReactNode]> }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td style={{ width: '35%', padding: '3px 0', verticalAlign: 'top' }}>{label}</td>
            <td style={{ padding: '3px 0', verticalAlign: 'top' }}>: {value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function PageNumber({ num }: { num: number }) {
  return (
    <div style={{ position: 'absolute', bottom: '10mm', right: '20mm', fontSize: '8pt', color: '#999' }}>
      Halaman {num}
    </div>
  )
}
