/**
 * parseLabelPdf.js
 * Extract tracking number, receiver name and address from a shipping label PDF.
 * Uses pdfjs-dist (already a project dependency) to read text content.
 *
 * ─── HOW TO ADD A NEW CARRIER ────────────────────────────────────────────────
 * Add a new object to the CARRIER_PARSERS array below. Each parser must have:
 *
 *   {
 *     name: 'CARRIER_NAME',          // string displayed in logs
 *     detect(lines, fullText),        // return true if this carrier matches
 *     parse(lines, fullText),         // return { trackingNo, receiverName, receiverAddress }
 *   }
 *
 * - `lines`    : string[]  — text lines extracted top-to-bottom from all PDF pages
 * - `fullText` : string    — lines joined with '\n' for easy regex matching
 *
 * Parsers are tried in order; the first match wins.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as pdfjsLib from 'pdfjs-dist'

// Vite-compatible worker URL for pdfjs-dist v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

// ─── PDF text extraction ──────────────────────────────────────────────────────

/**
 * Extract text lines from every page of a PDF File.
 * Items on the same Y position (within a 3-unit bucket) are merged left-to-right,
 * and pages are read top-to-bottom.
 */
async function extractLines(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const result = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    // Bucket items by rounded Y (PDF Y=0 is bottom of page)
    const buckets = new Map()
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue
      const s = item.str.replace(/\s+/g, ' ').trim()
      if (!s) continue
      const y = Math.round(item.transform[5] / 3) * 3
      if (!buckets.has(y)) buckets.set(y, [])
      buckets.get(y).push({ x: item.transform[4], str: s })
    }

    // Y descending = top of page first
    const ys = [...buckets.keys()].sort((a, b) => b - a)
    for (const y of ys) {
      const line = buckets.get(y)
        .sort((a, b) => a.x - b.x)
        .map(i => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) result.push(line)
    }
  }

  return result
}

// ─── Shared helper utilities ──────────────────────────────────────────────────

/** Collect address lines after a given start index, stopping at section boundaries */
function collectAddressLines(lines, startIdx, stopRe, maxLines = 2) {
  const out = []
  for (let i = startIdx; i < lines.length && out.length < maxLines; i++) {
    const l = lines[i].trim()
    if (!l) continue
    if (stopRe && stopRe.test(l)) break
    out.push(l)
  }
  return out
}

/** Walk backwards from idx, return first non-empty, non-digit-only, non-phone line */
function prevNameLine(lines, idx) {
  for (let i = idx - 1; i >= 0; i--) {
    const l = lines[i].trim()
    if (!l) continue
    if (/^[\d\s\-\+\(\)]+$/.test(l)) continue   // phone / digits only
    if (/^[A-Z0-9]{1,8}$/.test(l)) continue      // short routing code
    return l
  }
  return ''
}

// ─── Carrier parser registry ─────────────────────────────────────────────────

/**
 * CARRIER_PARSERS — add new carriers here.
 *
 * Each entry: { name, detect(lines, fullText), parse(lines, fullText) }
 */
const CARRIER_PARSERS = [

  // ── UPS ──────────────────────────────────────────────────────────────────
  {
    name: 'UPS',
    // Tracking numbers start with 1Z followed by 16 alphanumeric chars (may be spaced)
    detect: (_lines, fullText) => /\b1Z(?:\s*[A-Z0-9]){16}\b/i.test(fullText),
    parse: (lines, fullText) => {
      const tm = fullText.match(/\b(1Z(?:\s*[A-Z0-9]){16})\b/i)
      const trackingNo = tm[1].replace(/\s+/g, '').toUpperCase()

      // Locate "SHIP TO:" on one line, or "SHIP" + "TO:" on separate lines
      let shipIdx = -1, toIdx = -1
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim()
        if (/SHIP\s+TO\s*:?/i.test(l)) { shipIdx = i; toIdx = i; break }
        if (/^SHIP$/i.test(l)) {
          shipIdx = i
          for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            if (/^TO\s*:?$/i.test(lines[j].trim())) { toIdx = j; break }
          }
          if (toIdx >= 0) break
        }
      }

      const receiverName = shipIdx >= 0 ? prevNameLine(lines, shipIdx) : ''
      const addrStart = (toIdx >= 0 ? toIdx : shipIdx) + 1
      const addressLines = shipIdx >= 0
        ? collectAddressLines(lines, addrStart, /^(FROM\s*:|REFERENCE|WEIGHT|SERVICE|UPS\s|TRACKING|BILLING|ATTENTION|[A-Z]{2,4}\s+\d{3})/i)
        : []

      return { trackingNo, receiverName, receiverAddress: addressLines.join(', ') }
    }
  },

  // ── USPS ─────────────────────────────────────────────────────────────────
  {
    name: 'USPS',
    // Tracking numbers: 20-22 digits starting with 9 (may be spaced)
    detect: (_lines, fullText) => /\b9(?:\s*\d){19,21}\b/.test(fullText),
    parse: (lines, fullText) => {
      const tm = fullText.match(/\b(9(?:\s*\d){19,21})\b/)
      const trackingNo = tm[1].replace(/\s+/g, '')

      let receiverName = '', receiverAddress = ''

      // Strategy 1: lines immediately before "USPS TRACKING #" marker
      const markerIdx = lines.findIndex(l => /USPS\s+TRACKING\s*#?/i.test(l))
      if (markerIdx >= 3) {
        const before = []
        for (let i = markerIdx - 1; i >= 0 && before.length < 3; i--) {
          const l = lines[i].trim()
          if (!l || /^[A-Z0-9]{1,6}$/.test(l)) continue
          before.unshift(l)
        }
        if (before.length > 0) {
          receiverName = before[0]
          receiverAddress = before.slice(1).join(', ')
        }
      }

      // Strategy 2: "DELIVER TO" / "TO:" marker
      if (!receiverName) {
        const toIdx = lines.findIndex(l =>
          /DELIVER\s+TO\s*:?/i.test(l) || /^TO\s*:?$/i.test(l.trim())
        )
        if (toIdx >= 0) {
          const inline = lines[toIdx]
            .replace(/DELIVER\s+TO\s*:?/i, '').replace(/^TO\s*:?/i, '').trim()
          const candidates = inline ? [inline] : []
          candidates.push(...collectAddressLines(
            lines, toIdx + 1,
            /^(FROM\s*:|RETURN|POSTAGE|USPS|PRIORITY|FIRST\s+CLASS|DELIVER\s+TO|BARCODE)/i,
            3 - candidates.length
          ))
          receiverName = candidates[0] || ''
          receiverAddress = candidates.slice(1).join(', ')
        }
      }

      return { trackingNo, receiverName, receiverAddress }
    }
  },

  // ── FedEx ─────────────────────────────────────────────────────────────────
  // FedEx tracking: 12 digits, 15 digits, or 20-22 digits (96/98 prefix)
  // Uncomment and fill in once a real sample is available:
  //
  // {
  //   name: 'FedEx',
  //   detect: (_lines, fullText) => /\bFedEx\b/i.test(fullText),
  //   parse: (lines, fullText) => {
  //     // 1. Extract tracking number from fullText
  //     // 2. Find receiver block (typically after "DELIVER TO:" or "RECIPIENT:")
  //     // 3. Return { trackingNo, receiverName, receiverAddress }
  //     return { trackingNo: '', receiverName: '', receiverAddress: '' }
  //   }
  // },

]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a shipping label PDF and extract tracking / receiver info.
 * Tries each parser in CARRIER_PARSERS order; returns the first match.
 *
 * @param {File} file
 * @returns {Promise<{carrier:string, trackingNo:string, receiverName:string, receiverAddress:string}|null>}
 */
export async function parseLabelPdf(file) {
  if (!file || !file.name.toLowerCase().endsWith('.pdf')) return null
  try {
    const lines = await extractLines(file)
    console.log('[parseLabelPdf] Extracted lines:', lines)

    const fullText = lines.join('\n')
    for (const parser of CARRIER_PARSERS) {
      if (!parser.detect(lines, fullText)) continue
      const result = parser.parse(lines, fullText)
      if (result && result.trackingNo) {
        console.log(`[parseLabelPdf] Matched carrier: ${parser.name}`, result)
        return { carrier: parser.name, ...result }
      }
    }

    console.log('[parseLabelPdf] No carrier matched')
    return null
  } catch (err) {
    console.error('[parseLabelPdf] Parse error:', err)
    return null
  }
}

/**
 * Register a custom carrier parser at runtime (e.g. from a plugin or config).
 *
 * Example:
 *   import { registerCarrierParser } from '@/utils/parseLabelPdf'
 *   registerCarrierParser({
 *     name: 'DHL',
 *     detect: (_lines, fullText) => /\bDHL\b/i.test(fullText),
 *     parse: (lines, fullText) => { ... return { trackingNo, receiverName, receiverAddress } }
 *   })
 *
 * @param {{ name:string, detect:Function, parse:Function }} parser
 * @param {{ prepend?: boolean }} options  — prepend:true inserts before built-in parsers
 */
export function registerCarrierParser(parser, { prepend = false } = {}) {
  if (prepend) {
    CARRIER_PARSERS.unshift(parser)
  } else {
    CARRIER_PARSERS.push(parser)
  }
}