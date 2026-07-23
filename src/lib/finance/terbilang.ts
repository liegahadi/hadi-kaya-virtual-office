// Terbilang — convert number to Indonesian words
// Port dari sistem lama (Google AI Studio app)
// Contoh: 1500000 → "Satu Juta Lima Ratus Ribu Rupiah"

/**
 * Convert number to Indonesian words
 */
export function terbilang(num: number): string {
  if (num === 0) return 'Nol'

  const minus = num < 0
  num = Math.abs(num)

  let result = ''
  const billion = Math.floor(num / 1000000000)
  num -= billion * 1000000000
  const million = Math.floor(num / 1000000)
  num -= million * 1000000
  const thousand = Math.floor(num / 1000)
  num -= thousand * 1000
  const remainder = num

  if (billion > 0) result += `${convertHundreds(billion)} Miliar `
  if (million > 0) result += `${convertHundreds(million)} Juta `
  if (thousand > 0) result += `${convertHundreds(thousand)} Ribu `
  if (remainder > 0) result += convertHundreds(remainder)

  result = result.trim()

  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }

  return (minus ? 'Minus ' : '') + result + ' Rupiah'
}

function convertHundreds(num: number): string {
  if (num === 0) return ''
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]

  const hundred = Math.floor(num / 100)
  num -= hundred * 100
  const ten = Math.floor(num / 10)
  const one = num - ten * 10

  let result = ''
  if (hundred > 0) result += `${ones[hundred]} Ratus `
  if (ten > 0) result += `${tens[ten]} `
  if (one > 0) result += ones[one]

  return result.trim()
}

const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas']
const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh']
