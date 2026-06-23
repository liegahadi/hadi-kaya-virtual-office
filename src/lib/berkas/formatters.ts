// ============================================================
// FORMATTERS - Currency, Date, Terbilang, Roman
// ============================================================

export function formatCurrency(amount: number): string {
  if (!amount) return 'Rp. 0'
  return 'Rp. ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount || 0)
}

export function formatLongDate(dateString: string): string {
  if (!dateString) return '..............................'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '..............................'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '............'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '............'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export function numberToWords(n: number): string {
  if (n === 0) return 'Nol'
  const words = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
  function convert(num: number): string {
    if (num < 12) return words[num]
    if (num < 20) return convert(num - 10) + ' Belas'
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10)
    if (num < 200) return 'Seratus ' + convert(num - 100)
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100)
    if (num < 2000) return 'Seribu ' + convert(num - 1000)
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000)
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000)
    return convert(Math.floor(num / 1000000000)) + ' Miliar ' + convert(num % 1000000000)
  }
  return convert(n).trim().replace(/\s+/g, ' ')
}

export function getMonthRoman(dateString: string): string {
  const date = dateString ? new Date(dateString) : new Date()
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return roman[date.getMonth()]
}

export function getYear(dateString: string): string {
  const date = dateString ? new Date(dateString) : new Date()
  return date.getFullYear().toString()
}
