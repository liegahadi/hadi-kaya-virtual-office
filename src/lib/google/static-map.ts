// Google Maps Static Map Helper
// Fetches a static map image from Google Static Maps API (requires GOOGLE_MAPS_API_KEY)
// Falls back to manual screenshot upload if no API key

// Extract coordinates from Google Maps URL
// Supports:
// - https://www.google.com/maps/@-2.0667,106.4500,17z
// - https://www.google.com/maps/place/.../@-2.0667,106.4500,17z
// - https://maps.google.com/?q=-2.0667,106.4500
// - https://maps.app.goo.gl/xxx (short link - needs redirect resolution)
export async function extractCoordinates(mapsLink: string): Promise<{ lat: number; lng: number } | null> {
  if (!mapsLink) return null

  // Try to extract @lat,lng pattern from URL
  const coordsMatch = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1])
    const lng = parseFloat(coordsMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
  }

  // Try ?q=lat,lng pattern
  const qMatch = mapsLink.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) {
    const lat = parseFloat(qMatch[1])
    const lng = parseFloat(qMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }
  }

  // If short link, try to follow redirect and extract from final URL
  if (mapsLink.includes('maps.app.goo.gl') || mapsLink.includes('goo.gl/maps')) {
    try {
      const res = await fetch(mapsLink, { method: 'HEAD', redirect: 'follow' })
      const finalUrl = res.url
      const coords = await extractCoordinates(finalUrl)
      if (coords) return coords
    } catch {
      // Follow redirect with GET (some short links need GET)
      try {
        const res = await fetch(mapsLink, { redirect: 'follow' })
        const finalUrl = res.url
        const coords = await extractCoordinates(finalUrl)
        if (coords) return coords
      } catch {}
    }
  }

  return null
}

// Extract place name from Google Maps URL (for search query fallback)
export function extractPlaceName(mapsLink: string): string | null {
  if (!mapsLink) return null
  const placeMatch = mapsLink.match(/\/place\/([^\/\?@]+)/)
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
  }
  return null
}

// Fetch static map image from Google Static Maps API
// Returns Buffer (image data) or null if failed
export async function fetchStaticMap(
  mapsLink: string,
  options: { width?: number; height?: number; zoom?: number } = {}
): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const width = options.width || 600
  const height = options.height || 400
  const zoom = options.zoom || 16

  // Extract coordinates
  const coords = await extractCoordinates(mapsLink)
  const placeName = extractPlaceName(mapsLink)

  let url: string
  if (coords) {
    // Use coordinates for center
    url = `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&markers=color:red%7C${coords.lat},${coords.lng}&key=${apiKey}`
  } else if (placeName) {
    // Use place name as center
    url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(placeName)}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&markers=color:red%7C${encodeURIComponent(placeName)}&key=${apiKey}`
  } else {
    // Use the entire link as query
    url = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapsLink)}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap&key=${apiKey}`
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('Static map fetch failed:', res.status, await res.text().catch(() => ''))
      return null
    }
    const buf = Buffer.from(await res.arrayBuffer())
    return buf
  } catch (err) {
    console.error('Static map fetch error:', err)
    return null
  }
}

// Check if Google Maps API key is configured
export function hasMapsApiKey(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY
}
