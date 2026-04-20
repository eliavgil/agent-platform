/**
 * One-time migration: pulls outputs from Google Sheets and inserts into Supabase.
 *
 * Run with:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node supabase/migrate_outputs.js
 *
 * Or copy-paste into a browser console while logged in as admin on the site.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SPREADSHEET_ID = '1jI9CkDIVyJOqmdcOdQpvq1n2wuMXNBJ6BjpLkIPWe2c'
const OUTPUTS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=%D7%AA%D7%95%D7%A6%D7%A8%D7%99%D7%9D`

const FIELD_MAP = {
  'שם התוצר': 'name',
  'מקצוע': 'subject',
  'נושא': 'topic',
  'כיתה': 'grade',
  'כלי ai בשימוש': 'ai_tool', 'כלי ai': 'ai_tool', 'כלי': 'ai_tool',
  'סוכן אחראי': 'agent', 'סוכן': 'agent',
  'תיאור קצר': 'short_desc', 'קצר': 'short_desc',
  'תיאור מלא': 'full_desc', 'מלא': 'full_desc', 'תיאור מפורט': 'full_desc',
  'ביקורת': 'review', 'ביקורת מורה': 'review', 'חוות דעת': 'review',
  'שם המורה': 'reviewer_name', 'שם מורה': 'reviewer_name',
  'קישור': 'link', 'לינק': 'link', 'קישור לתוצר': 'link', 'link': 'link',
  'קטגוריה': 'category', 'category': 'category',
  'אמוגי': 'logo_emoji', "אמוג'י": 'logo_emoji', 'emoji': 'logo_emoji',
  'logourl': 'logo_url', 'logo url': 'logo_url', 'לוגו': 'logo_url',
}

function parseCSV(csv) {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean)
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
  return lines.slice(1).map(line => {
    const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || []
    const obj = {}
    headers.forEach((h, i) => {
      const val = (cols[i] || '').replace(/^"|"$/g, '').trim()
      const field = FIELD_MAP[h] ?? FIELD_MAP[h.replace(/\s+/g, ' ')] ?? h
      if (val) obj[field] = val
    })
    return obj
  }).filter(r => r.name)
}

async function migrate() {
  console.log('Fetching from Google Sheets...')
  const res = await fetch(OUTPUTS_SHEET_URL)
  const csv = await res.text()
  const rows = parseCSV(csv)
  console.log(`Found ${rows.length} rows`)

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { error } = await supabase.from('outputs').insert(rows)
  if (error) {
    console.error('Migration failed:', error)
  } else {
    console.log(`✓ Migrated ${rows.length} outputs to Supabase`)
  }
}

migrate()
