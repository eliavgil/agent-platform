const SPREADSHEET_ID = '1jI9CkDIVyJOqmdcOdQpvq1n2wuMXNBJ6BjpLkIPWe2c'
const SHEET_BASE = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`
const SHEET_URL = `${SHEET_BASE}&gid=0`
const OUTPUTS_SHEET_URL = `${SHEET_BASE}&sheet=%D7%AA%D7%95%D7%A6%D7%A8%D7%99%D7%9D`

// Maps any CSV column header → expected JS field name
const FIELD_MAP = {
  // name
  'שם': 'name', 'שם כלי': 'name', 'tool name': 'name', 'toolname': 'name',
  // category
  'קטגוריה': 'category', 'category': 'category',
  // tagline
  'תגית': 'tagline', 'סלוגן': 'tagline', 'tagline': 'tagline', 'slogan': 'tagline',
  // description
  'תיאור': 'description', 'description': 'description', 'תיאור הכלי': 'description',
  // difficulty
  'רמת קושי': 'difficulty', 'רמה': 'difficulty', 'difficulty': 'difficulty',
  // howToUse
  'איך להשתמש': 'howToUse', 'הוראות שימוש': 'howToUse', 'how to use': 'howToUse', 'howtouse': 'howToUse',
  // logoEmoji
  'אמוגי': 'logoEmoji', 'אמוג\'י': 'logoEmoji', 'לוגו אמוגי': 'logoEmoji',
  'logoemoji': 'logoEmoji', 'logo emoji': 'logoEmoji', 'emoji': 'logoEmoji',
  // videoUrl
  'סרטון': 'videoUrl', 'קישור סרטון': 'videoUrl', 'video': 'videoUrl',
  'videourl': 'videoUrl', 'video url': 'videoUrl', 'link video': 'videoUrl', 'קישור וידאו': 'videoUrl',
  // presentationUrl
  'מצגת': 'presentationUrl', 'קישור מצגת': 'presentationUrl',
  'presentation': 'presentationUrl', 'presentationurl': 'presentationUrl', 'presentation url': 'presentationUrl',
  // example1Url
  'דוגמה 1': 'example1Url', 'דוגמא 1': 'example1Url', 'קישור דוגמה 1': 'example1Url',
  'example1': 'example1Url', 'example1url': 'example1Url', 'example 1': 'example1Url', 'example 1 url': 'example1Url', 'example1 url': 'example1Url',
  // example1Caption
  'כיתוב 1': 'example1Caption', 'כיתוב דוגמה 1': 'example1Caption',
  'example1caption': 'example1Caption', 'example1 caption': 'example1Caption', 'example 1 caption': 'example1Caption',
  // example2Url
  'דוגמה 2': 'example2Url', 'דוגמא 2': 'example2Url', 'קישור דוגמה 2': 'example2Url',
  'example2': 'example2Url', 'example2url': 'example2Url', 'example 2': 'example2Url', 'example 2 url': 'example2Url', 'example2 url': 'example2Url',
  // example2Caption
  'כיתוב 2': 'example2Caption', 'כיתוב דוגמה 2': 'example2Caption',
  'example2caption': 'example2Caption', 'example2 caption': 'example2Caption', 'example 2 caption': 'example2Caption',
  // is_active
  'פעיל': 'is_active', 'active': 'is_active', 'is active': 'is_active', 'isactive': 'is_active',
  // outputs sheet
  'שם התוצר': 'name',
  'מקצוע': 'subject',
  'נושא': 'topic',
  'כיתה': 'grade',
  'כלי ai בשימוש': 'aiTool', 'כלי ai': 'aiTool',
  'סוכן אחראי': 'agent', 'סוכן': 'agent',
}

const URL_FIELDS = new Set(['videoUrl', 'presentationUrl', 'example1Url', 'example2Url'])

function normalizeRow(raw) {
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    const clean = key.trim().toLowerCase().replace(/\s+/g, ' ')
    const mapped = FIELD_MAP[clean] ?? FIELD_MAP[key.trim()] ?? key.trim()
    // Strip values that look like labels rather than real URLs
    out[mapped] = (URL_FIELDS.has(mapped) && value && !value.startsWith('http')) ? '' : value
  }
  return out
}

function parseCSV(csv) {
  const rows = []
  let currentRow = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < csv.length) {
    const ch = csv[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < csv.length && csv[i + 1] === '"') { currentField += '"'; i += 2 }
        else { inQuotes = false; i++ }
      } else { currentField += ch; i++ }
    } else {
      if (ch === '"') { inQuotes = true; i++ }
      else if (ch === ',') { currentRow.push(currentField); currentField = ''; i++ }
      else if (ch === '\r' || ch === '\n') {
        currentRow.push(currentField); currentField = ''
        if (currentRow.some(c => c !== '')) rows.push(currentRow)
        currentRow = []
        if (ch === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') i++
        i++
      } else { currentField += ch; i++ }
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.some(c => c !== '')) rows.push(currentRow)
  }

  if (rows.length < 2) return []

  const headers = rows[0].map((h, idx) =>
    idx === 0 ? h.trim().replace(/^\uFEFF/, '') : h.trim()
  )

  return rows.slice(1)
    .map(row => {
      const obj = {}
      headers.forEach((h, idx) => { obj[h] = (row[idx] || '').trim() })
      return normalizeRow(obj)
    })
    .filter(t => t.name) // skip empty rows
}

export const getTools = async () => {
  try {
    const response = await fetch(SHEET_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const csv = await response.text()
    const tools = parseCSV(csv)
    return { data: tools, error: null }
  } catch (error) {
    console.error('Failed to fetch tools from Google Sheets:', error)
    return { data: [], error }
  }
}

export const getOutputs = async () => {
  try {
    const response = await fetch(OUTPUTS_SHEET_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const csv = await response.text()
    const outputs = parseCSV(csv)
    return { data: outputs, error: null }
  } catch (error) {
    console.error('Failed to fetch outputs from Google Sheets:', error)
    return { data: [], error }
  }
}
