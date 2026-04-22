import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getTools, getOutputs, getToolEmoji } from '../lib/googleSheets'
import { ChevronLeft, ChevronRight, ExternalLink, Video, FileText, Menu, X } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const LEADERBOARD_URL =
  'https://docs.google.com/spreadsheets/d/17WWVtK7hKwt2-LW8AA4Gw7ouiHkXoFThyB8bdi9te8s/export?format=csv&gid=0'

const STEPS = [
  {
    num: '01', icon: '📝', color: 'from-indigo-500 to-purple-500',
    title: 'מלאו טופס בקשה',
    desc: 'תארו את הצורך שלכם — מקצוע, כיתה, ומה תרצו לעשות עם AI בשיעור',
  },
  {
    num: '02', icon: '🤝', color: 'from-purple-500 to-pink-500',
    title: 'סוכן AI יצור קשר',
    desc: 'תלמיד מומחה יקרא את הבקשה ויפנה אליכם ישירות, בדרך כלל תוך 24 שעות',
  },
  {
    num: '03', icon: '🚀', color: 'from-pink-500 to-orange-400',
    title: 'עובדים יחד',
    desc: 'שלחו קבצים, שוחחו בצ׳אט, והסוכן ייצור פתרון AI מותאם בדיוק לכם',
  },
]

// Tool logos
const TOOL_LOGOS = {
  'Gemini':         'https://upload.wikimedia.org/wikipedia/commons/1/1d/Google_Gemini_icon_2025.svg',
  'NotebookLM':     'https://upload.wikimedia.org/wikipedia/commons/5/57/NotebookLM_logo.svg',
  'StudyWise':      'https://framerusercontent.com/images/4quFySEBAybfqylG0TqkmbAQA0.png',
  'ChatGPT':        'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Claude':         'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
  'DALL-E':         'https://upload.wikimedia.org/wikipedia/commons/9/97/OpenAI_logo_2025.svg',
  'Grammarly':      'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammarly_logo.svg',
  'Wolfram Alpha':  'https://upload.wikimedia.org/wikipedia/commons/e/e3/Wolfram_Alpha_2022.svg',
  'Khanmigo':       'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Khan Academy':   'https://upload.wikimedia.org/wikipedia/commons/f/f6/Khan_Academy_logo_%282018%29.svg',
  'Canva':          'https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg',
  'MagicSchool AI': 'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'MagicSchool':    'https://cdn.prod.website-files.com/645187265d5e5e386be40629/6960237ddf1dfc1de13a396f_logo.png',
  'Suno':           'https://suno.com/apple-touch-icon.png',
  'Base44':         'https://base44.com/apple-touch-icon.png',
}

// Logos scattered decoratively around the hero
const SCATTERED_LOGOS = [
  // Left column (top → bottom)
  { file: 'black-gemini-logo_svgstack_com_37151775116405.png',        pos: { top: '8%',    left: '4%'  }, size: 48, rotate: '-6deg' },
  { file: 'chatgpt-monocolor-logo-icon_svgstack_com_4611775116925.png', pos: { top: '34%',  left: '3%'  }, size: 44, rotate: '4deg'  },
  { file: 'midjourney-logo-icon_svgstack_com_4581775116879.png',       pos: { top: '60%',   left: '4%'  }, size: 46, rotate: '-3deg' },
  { file: 'github-logo-svg_svgstack_com_28391775117020.png',           pos: { bottom: '8%', left: '7%'  }, size: 42, rotate: '6deg'  },
  // Right column (top → bottom)
  { file: 'black-claude-logo_svgstack_com_36981775116477.png',         pos: { top: '9%',    right: '4%' }, size: 46, rotate: '5deg'  },
  { file: 'grok-ai-app-logo_svgstack_com_37211775116703.png',          pos: { top: '36%',   right: '3%' }, size: 44, rotate: '-4deg' },
  { file: 'black-cohere-logo_svgstack_com_37031775117384.png',          pos: { top: '62%',   right: '4%' }, size: 46, rotate: '3deg'  },
  { file: 'black-fireworks-ai-logo_svgstack_com_37101775117469.png',   pos: { bottom: '7%', right: '7%' }, size: 42, rotate: '-5deg' },
]

function getLogoUrl(name = '') {
  if (TOOL_LOGOS[name]) return TOOL_LOGOS[name]
  const key = Object.keys(TOOL_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  )
  return key ? TOOL_LOGOS[key] : null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashStr(str) {
  let h = 5381
  for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function parseCsvLine(line) {
  const cells = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  cells.push(cur.trim())
  return cells
}

async function fetchStudentNames() {
  try {
    const res = await fetch(LEADERBOARD_URL)
    if (!res.ok) return []
    const csv = await res.text()
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []
    const headers = parseCsvLine(lines[0]).map(h =>
      h.trim().replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
    )
    const nameIdx = headers.findIndex(h => h.includes('שם'))
    const logoIdx = headers.findIndex(h => h.toLowerCase().replace(/\s/g, '') === 'logourl')
    const emojiIdx = headers.findIndex(h => h.toLowerCase() === 'emoji' || h === 'אמוגי')
    if (nameIdx === -1) return []
    return lines.slice(1)
      .map(l => {
        const cells = parseCsvLine(l)
        const name = (cells[nameIdx] || '').trim().replace(/[\u200B-\u200D\uFEFF\u202A-\u202E"]/g, '')
        const rawLogo = logoIdx !== -1 ? (cells[logoIdx] || '').trim() : ''
        const rawEmoji = emojiIdx !== -1 ? (cells[emojiIdx] || '').trim() : ''
        return {
          name,
          logoUrl: rawLogo.startsWith('http') ? rawLogo : '',
          emoji: rawEmoji,
        }
      })
      .filter(s => s.name.length > 1)
  } catch { return [] }
}

// ── Agent SVGs — Unique Robot designs ────────────────────────────────────────

const ROBOT_PALETTES = [
  ['#6366f1','#a5b4fc'],  // indigo
  ['#0ea5e9','#7dd3fc'],  // sky
  ['#10b981','#6ee7b7'],  // emerald
  ['#f59e0b','#fcd34d'],  // amber
  ['#ef4444','#fca5a5'],  // red
  ['#8b5cf6','#c4b5fd'],  // violet
  ['#06b6d4','#67e8f9'],  // cyan
  ['#f97316','#fdba74'],  // orange
]

function RobotFigure({ c, variant = 0 }) {
  if (variant === 0) return (
    // Classic blocky: square head with antenna, rectangular body, round porthole eye
    <svg viewBox="0 0 100 120" width="56" height="67">
      <line x1="50" y1="5" x2="50" y2="15" stroke={c[0]} strokeWidth="2"/>
      <circle cx="50" cy="5" r="3" fill={c[1]}/>
      <rect x="28" y="15" width="44" height="36" rx="4" fill={c[0]}/>
      <circle cx="40" cy="30" r="7" fill="#050a14"/>
      <circle cx="60" cy="30" r="7" fill="#050a14"/>
      <circle cx="40" cy="30" r="4" fill={c[1]} opacity="0.9"/>
      <circle cx="60" cy="30" r="4" fill={c[1]} opacity="0.9"/>
      <circle cx="41" cy="29" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="61" cy="29" r="1.5" fill="white" opacity="0.8"/>
      <rect x="38" y="42" width="24" height="4" rx="2" fill={c[1]} opacity="0.5"/>
      <rect x="44" y="51" width="12" height="6" rx="2" fill={c[0]} opacity="0.8"/>
      <rect x="22" y="57" width="56" height="42" rx="6" fill={c[0]}/>
      <rect x="32" y="64" width="36" height="22" rx="3" fill="#050a14" opacity="0.5"/>
      <circle cx="41" cy="70" r="3.5" fill={c[1]} opacity="0.8"/>
      <circle cx="52" cy="70" r="3.5" fill={c[1]} opacity="0.8"/>
      <circle cx="63" cy="70" r="3.5" fill={c[1]} opacity="0.8"/>
      <rect x="35" y="78" width="30" height="4" rx="2" fill={c[1]} opacity="0.4"/>
      <rect x="6" y="58" width="14" height="36" rx="6" fill={c[0]}/>
      <rect x="80" y="58" width="14" height="36" rx="6" fill={c[0]}/>
      <circle cx="13" cy="97" r="6" fill={c[1]} opacity="0.8"/>
      <circle cx="87" cy="97" r="6" fill={c[1]} opacity="0.8"/>
      <rect x="30" y="99" width="15" height="16" rx="4" fill={c[0]}/>
      <rect x="55" y="99" width="15" height="16" rx="4" fill={c[0]}/>
    </svg>
  )
  if (variant === 1) return (
    // Round/cute: circle head, oval body, disc eyes, stubby arms
    <svg viewBox="0 0 100 120" width="56" height="67">
      <circle cx="50" cy="28" r="24" fill={c[0]}/>
      <circle cx="26" cy="28" r="5" fill={c[0]}/>
      <circle cx="74" cy="28" r="5" fill={c[0]}/>
      <ellipse cx="41" cy="26" rx="8" ry="9" fill="#050a14"/>
      <ellipse cx="59" cy="26" rx="8" ry="9" fill="#050a14"/>
      <ellipse cx="41" cy="26" rx="5" ry="6" fill={c[1]} opacity="0.9"/>
      <ellipse cx="59" cy="26" rx="5" ry="6" fill={c[1]} opacity="0.9"/>
      <circle cx="43" cy="24" r="2" fill="white" opacity="0.7"/>
      <circle cx="61" cy="24" r="2" fill="white" opacity="0.7"/>
      <path d="M42,38 Q50,45 58,38" stroke={c[1]} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="50" cy="82" rx="26" ry="28" fill={c[0]}/>
      <ellipse cx="50" cy="84" rx="14" ry="14" fill="#050a14" opacity="0.3"/>
      <circle cx="46" cy="80" r="3.5" fill={c[1]} opacity="0.7"/>
      <circle cx="56" cy="80" r="3.5" fill={c[1]} opacity="0.7"/>
      <ellipse cx="18" cy="74" rx="8" ry="12" fill={c[0]}/>
      <ellipse cx="82" cy="74" rx="8" ry="12" fill={c[0]}/>
      <ellipse cx="40" cy="111" rx="10" ry="6" fill={c[0]}/>
      <ellipse cx="60" cy="111" rx="10" ry="6" fill={c[0]}/>
    </svg>
  )
  if (variant === 2) return (
    // Tall/slim: hexagon head, tall narrow body, thin arms with claws
    <svg viewBox="0 0 100 120" width="56" height="67">
      <polygon points="50,5 65,14 65,32 50,41 35,32 35,14" fill={c[0]}/>
      <ellipse cx="50" cy="22" rx="9" ry="6" fill="#050a14"/>
      <ellipse cx="50" cy="22" rx="6" ry="4" fill={c[1]} opacity="0.9"/>
      <circle cx="52" cy="21" r="2" fill="white" opacity="0.7"/>
      <rect x="42" y="32" width="16" height="3" rx="1.5" fill={c[1]} opacity="0.5"/>
      <rect x="46" y="41" width="8" height="8" rx="2" fill={c[0]}/>
      <rect x="34" y="49" width="32" height="52" rx="5" fill={c[0]}/>
      <rect x="40" y="56" width="20" height="18" rx="3" fill="#050a14" opacity="0.4"/>
      <circle cx="50" cy="65" r="5" fill={c[1]} opacity="0.7"/>
      <line x1="44" y1="77" x2="56" y2="77" stroke={c[1]} strokeWidth="1.5" opacity="0.5"/>
      <line x1="44" y1="81" x2="56" y2="81" stroke={c[1]} strokeWidth="1" opacity="0.4"/>
      <rect x="18" y="50" width="8" height="32" rx="4" fill={c[0]}/>
      <rect x="74" y="50" width="8" height="32" rx="4" fill={c[0]}/>
      <path d="M18,82 L14,90 M22,82 L18,90 M22,82 L26,90" stroke={c[1]} strokeWidth="2" strokeLinecap="round"/>
      <path d="M82,82 L78,90 M82,82 L86,90 M78,82 L74,90" stroke={c[1]} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  if (variant === 3) return (
    // Wide/stocky: wide square head with visor band, broad body with rivets
    <svg viewBox="0 0 100 120" width="56" height="67">
      <rect x="16" y="8" width="68" height="42" rx="5" fill={c[0]}/>
      <rect x="16" y="21" width="68" height="14" rx="2" fill="#050a14" opacity="0.7"/>
      <rect x="24" y="24" width="20" height="8" rx="2" fill={c[1]} opacity="0.8"/>
      <rect x="56" y="24" width="20" height="8" rx="2" fill={c[1]} opacity="0.8"/>
      <rect x="30" y="40" width="40" height="5" rx="2.5" fill="#050a14" opacity="0.4"/>
      <line x1="38" y1="42.5" x2="42" y2="42.5" stroke={c[1]} strokeWidth="1.5" opacity="0.6"/>
      <line x1="48" y1="42.5" x2="52" y2="42.5" stroke={c[1]} strokeWidth="1.5" opacity="0.6"/>
      <line x1="58" y1="42.5" x2="62" y2="42.5" stroke={c[1]} strokeWidth="1.5" opacity="0.6"/>
      <rect x="42" y="50" width="16" height="6" rx="2" fill={c[0]}/>
      <rect x="12" y="56" width="76" height="44" rx="7" fill={c[0]}/>
      {[18,30,70,82].map((x, i) => <circle key={`rt${i}`} cx={x} cy="62" r="3" fill={c[1]} opacity="0.6"/>)}
      {[18,30,70,82].map((x, i) => <circle key={`rb${i}`} cx={x} cy="94" r="3" fill={c[1]} opacity="0.6"/>)}
      <rect x="28" y="64" width="44" height="26" rx="4" fill="#050a14" opacity="0.45"/>
      <rect x="34" y="70" width="14" height="8" rx="2" fill={c[1]} opacity="0.6"/>
      <rect x="52" y="70" width="14" height="8" rx="2" fill={c[1]} opacity="0.6"/>
      <rect x="-2" y="57" width="14" height="38" rx="6" fill={c[0]}/>
      <rect x="88" y="57" width="14" height="38" rx="6" fill={c[0]}/>
      <rect x="-2" y="93" width="16" height="10" rx="4" fill={c[1]} opacity="0.8"/>
      <rect x="86" y="93" width="16" height="10" rx="4" fill={c[1]} opacity="0.8"/>
    </svg>
  )
  if (variant === 4) return (
    // Retro: rounded-rect head with big round eyes + mouth indicator, retro chest panel
    <svg viewBox="0 0 100 120" width="56" height="67">
      <rect x="24" y="6" width="52" height="44" rx="12" fill={c[0]}/>
      <circle cx="39" cy="24" r="10" fill="#050a14"/>
      <circle cx="61" cy="24" r="10" fill="#050a14"/>
      <circle cx="39" cy="24" r="6.5" fill={c[1]} opacity="0.9"/>
      <circle cx="61" cy="24" r="6.5" fill={c[1]} opacity="0.9"/>
      <circle cx="41" cy="22" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="63" cy="22" r="2.5" fill="white" opacity="0.7"/>
      <circle cx="41" cy="40" r="2.5" fill={c[1]} opacity="0.9"/>
      <circle cx="50" cy="40" r="2.5" fill={c[1]} opacity="0.5"/>
      <circle cx="59" cy="40" r="2.5" fill={c[1]} opacity="0.7"/>
      <rect x="43" y="50" width="14" height="7" rx="2" fill={c[0]}/>
      <rect x="20" y="57" width="60" height="44" rx="8" fill={c[0]}/>
      <rect x="28" y="64" width="44" height="28" rx="4" fill="#050a14" opacity="0.5"/>
      <circle cx="36" cy="72" r="5" fill={c[0]} opacity="0.7"/>
      <circle cx="36" cy="72" r="3" fill={c[1]} opacity="0.8"/>
      <circle cx="52" cy="69" r="4" fill={c[0]} opacity="0.7"/>
      <circle cx="52" cy="69" r="2.5" fill={c[1]} opacity="0.8"/>
      <rect x="58" y="67" width="8" height="16" rx="2" fill={c[1]} opacity="0.5"/>
      <rect x="33" y="80" width="4" height="8" rx="1" fill={c[1]} opacity="0.6"/>
      <rect x="40" y="77" width="4" height="11" rx="1" fill={c[1]} opacity="0.8"/>
      <rect x="47" y="79" width="4" height="9" rx="1" fill={c[1]} opacity="0.5"/>
      <rect x="4" y="58" width="14" height="36" rx="6" fill={c[0]}/>
      <rect x="82" y="58" width="14" height="36" rx="6" fill={c[0]}/>
      <circle cx="11" cy="96" r="6" fill={c[1]} opacity="0.7"/>
      <circle cx="89" cy="96" r="6" fill={c[1]} opacity="0.7"/>
    </svg>
  )
  if (variant === 5) return (
    // Futuristic: angular diamond head, sleek tapered body, angled arms
    <svg viewBox="0 0 100 120" width="56" height="67">
      <polygon points="50,4 72,22 50,40 28,22" fill={c[0]}/>
      <line x1="38" y1="18" x2="46" y2="26" stroke={c[1]} strokeWidth="3" strokeLinecap="round"/>
      <line x1="54" y1="18" x2="62" y2="26" stroke={c[1]} strokeWidth="3" strokeLinecap="round"/>
      <line x1="45" y1="34" x2="55" y2="34" stroke={c[1]} strokeWidth="1.5" opacity="0.6"/>
      <rect x="44" y="40" width="12" height="8" rx="2" fill={c[0]}/>
      <polygon points="30,48 70,48 76,100 24,100" fill={c[0]}/>
      <polygon points="44,52 56,52 60,90 40,90" fill="#050a14" opacity="0.4"/>
      <line x1="50" y1="56" x2="50" y2="86" stroke={c[1]} strokeWidth="1.5" opacity="0.7"/>
      <circle cx="50" cy="65" r="5" fill={c[1]} opacity="0.8"/>
      <circle cx="50" cy="65" r="2.5" fill="white" opacity="0.5"/>
      <polygon points="30,48 16,52 10,84 24,80" fill={c[0]}/>
      <polygon points="70,48 84,52 90,84 76,80" fill={c[0]}/>
      <polygon points="17,84 10,90 17,96 24,90" fill={c[1]} opacity="0.8"/>
      <polygon points="83,84 76,90 83,96 90,90" fill={c[1]} opacity="0.8"/>
    </svg>
  )
  if (variant === 6) return (
    // Industrial: hard-angled box head with diagonal visor, chunky body with vents
    <svg viewBox="0 0 100 120" width="56" height="67">
      <rect x="20" y="6" width="60" height="42" rx="3" fill={c[0]}/>
      <polygon points="20,20 80,14 80,30 20,36" fill="#050a14" opacity="0.75"/>
      <rect x="28" y="20" width="16" height="8" rx="1" fill={c[1]} opacity="0.85"/>
      <rect x="56" y="18" width="16" height="8" rx="1" fill={c[1]} opacity="0.85"/>
      <circle cx="24" cy="10" r="2.5" fill={c[1]} opacity="0.6"/>
      <circle cx="76" cy="10" r="2.5" fill={c[1]} opacity="0.6"/>
      <circle cx="24" cy="44" r="2.5" fill={c[1]} opacity="0.6"/>
      <circle cx="76" cy="44" r="2.5" fill={c[1]} opacity="0.6"/>
      <rect x="40" y="48" width="20" height="8" rx="2" fill={c[0]}/>
      <rect x="14" y="56" width="72" height="48" rx="4" fill={c[0]}/>
      {[62,68,74,80,86,92].map((y, i) => (
        <rect key={`v${i}`} x="20" y={y} width="26" height="3" rx="1" fill="#050a14" opacity="0.5"/>
      ))}
      <rect x="50" y="62" width="30" height="28" rx="3" fill="#050a14" opacity="0.5"/>
      <circle cx="59" cy="70" r="4" fill={c[1]} opacity="0.8"/>
      <circle cx="71" cy="70" r="4" fill={c[1]} opacity="0.8"/>
      <rect x="54" y="78" width="22" height="7" rx="2" fill={c[1]} opacity="0.4"/>
      <rect x="0" y="57" width="14" height="40" rx="4" fill={c[0]}/>
      <rect x="86" y="57" width="14" height="40" rx="4" fill={c[0]}/>
      <rect x="0" y="95" width="16" height="8" rx="3" fill={c[1]} opacity="0.7"/>
      <rect x="84" y="95" width="16" height="8" rx="3" fill={c[1]} opacity="0.7"/>
    </svg>
  )
  // variant === 7 — Friendly: oval head, soft rounded body, wave arms
  return (
    <svg viewBox="0 0 100 120" width="56" height="67">
      <ellipse cx="50" cy="25" rx="24" ry="22" fill={c[0]} transform="rotate(-5,50,25)"/>
      <circle cx="40" cy="22" r="7" fill="#050a14"/>
      <circle cx="60" cy="22" r="7" fill="#050a14"/>
      <circle cx="40" cy="22" r="4.5" fill={c[1]} opacity="0.9"/>
      <circle cx="60" cy="22" r="4.5" fill={c[1]} opacity="0.9"/>
      <circle cx="41.5" cy="20.5" r="1.8" fill="white" opacity="0.7"/>
      <circle cx="61.5" cy="20.5" r="1.8" fill="white" opacity="0.7"/>
      <path d="M40,32 Q50,40 60,32" stroke={c[1]} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="30" cy="30" rx="5" ry="3" fill={c[1]} opacity="0.25"/>
      <ellipse cx="70" cy="30" rx="5" ry="3" fill={c[1]} opacity="0.25"/>
      <rect x="44" y="46" width="12" height="7" rx="3" fill={c[0]}/>
      <rect x="22" y="53" width="56" height="46" rx="18" fill={c[0]}/>
      <circle cx="50" cy="70" r="10" fill="#050a14" opacity="0.3"/>
      <circle cx="50" cy="70" r="6" fill={c[1]} opacity="0.7"/>
      <circle cx="50" cy="70" r="3" fill="white" opacity="0.4"/>
      <path d="M22,62 Q10,55 8,68 Q6,80 14,84" stroke={c[0]} strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d="M78,62 Q90,55 92,68 Q94,80 86,84" stroke={c[0]} strokeWidth="10" fill="none" strokeLinecap="round"/>
      <ellipse cx="38" cy="100" rx="10" ry="7" fill={c[0]}/>
      <ellipse cx="62" cy="100" rx="10" ry="7" fill={c[0]}/>
    </svg>
  )
}

// ── AutoCarousel — CSS-animation based (works in Safari) ──────────────────────
// Uses @keyframes translateX instead of scrollLeft (Safari rounds fractional
// scrollLeft to 0, so scrollLeft += 0.7 never moves anything in Safari).

const CAROUSEL_SPEED = 45 // px per second

function AutoCarousel({ children, gap = 16 }) {
  const trackRef = useRef(null)
  const hoveredRef = useRef(false)
  const durRef = useRef(40)
  const items = React.Children.toArray(children)

  // Calculate duration from actual content width so speed is consistent.
  // Uses scrollWidth (not offsetWidth) — more reliable in Safari for max-content elements.
  // Double-RAF + setTimeout fallback ensures layout has settled before we measure.
  useEffect(() => {
    const el = trackRef.current
    if (!el || items.length === 0) return

    let cancelled = false
    const startAnim = () => {
      if (cancelled) return
      // scrollWidth = full rendered width including overflow; for a max-content flex row
      // this is reliable across Chrome, Firefox, and Safari.
      const totalW = el.scrollWidth
      const halfW = totalW / 2
      if (!halfW) return
      const dur = Math.max(6, halfW / CAROUSEL_SPEED)
      durRef.current = dur
      // Reset then reapply so Safari registers the new animation
      el.style.animation = 'none'
      void el.getBoundingClientRect() // force reflow
      el.style.animation = `carousel-ticker ${dur}s linear infinite`
      el.style.animationPlayState = 'running'
    }

    // Two-pass: RAF to wait for paint, then measure
    let raf1 = requestAnimationFrame(() => {
      let raf2 = requestAnimationFrame(() => {
        startAnim()
        // Safari sometimes still returns 0 after two RAFs — retry once
        if (!el.scrollWidth) setTimeout(startAnim, 100)
      })
      return () => cancelAnimationFrame(raf2)
    })
    return () => { cancelled = true; cancelAnimationFrame(raf1) }
  }, [items.length]) // re-run when item count changes (async data loads)

  const setPlayState = (running) => {
    if (trackRef.current)
      trackRef.current.style.animationPlayState = running ? 'running' : 'paused'
  }

  const onEnter = () => { hoveredRef.current = true;  setPlayState(false) }
  const onLeave = () => { hoveredRef.current = false; setPlayState(true)  }

  // Seek by adjusting animation-delay (negative delay = already elapsed time)
  const seekBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    const dur = durRef.current

    // Read current translateX from computed style
    const cs = window.getComputedStyle(el)
    const transformStr = cs.transform || cs.webkitTransform || 'none'
    let curX = 0
    if (transformStr !== 'none') {
      try {
        curX = new DOMMatrix(transformStr).m41
      } catch {
        const m = transformStr.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+)/)
        if (m) curX = parseFloat(m[1])
      }
    }

    const halfW = el.scrollWidth / 2
    if (!halfW) return

    const fraction = Math.max(0, Math.min(1, -curX / halfW))
    const currentSec = fraction * dur
    const jump = dur / 8 // jump ~1/8 of the loop per click
    const newSec = ((currentSec - dir * jump) % dur + dur) % dur

    el.style.animationName = 'none'
    void el.getBoundingClientRect() // force reflow so next line takes effect
    el.style.animationName = 'carousel-ticker'
    el.style.animationDelay = `${-newSec}s`
    el.style.animationPlayState = hoveredRef.current ? 'paused' : 'running'
  }

  return (
    <div
      className="relative group overflow-hidden"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Left button */}
      <button
        onClick={() => seekBy(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                   flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(15,23,42,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(15,23,42,0.12)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.1)'}
      >
        <ChevronLeft size={20} className="text-gray-600" />
      </button>

      {/* Track — direction:ltr so items flow left-to-right inside RTL page */}
      <div className="px-10 py-3">
        <div
          ref={trackRef}
          style={{ display: 'flex', gap, direction: 'ltr', width: 'max-content' }}
        >
          {items}
          {items}
        </div>
      </div>

      {/* Right button */}
      <button
        onClick={() => seekBy(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                   flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(15,23,42,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(15,23,42,0.12)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.1)'}
      >
        <ChevronRight size={20} className="text-gray-600" />
      </button>
    </div>
  )
}

// ── ToolCard (light theme) ─────────────────────────────────────────────────────

function HomeToolCard({ tool }) {
  const [hovered, setHovered] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  const logoUrl = tool.logoUrl || getLogoUrl(tool.name)

  const diffColor = tool.difficulty === 'קל'
    ? { bg: 'rgba(16,185,129,0.1)', text: '#059669' }
    : tool.difficulty === 'בינוני'
    ? { bg: 'rgba(245,158,11,0.1)', text: '#d97706' }
    : { bg: 'rgba(239,68,68,0.1)', text: '#dc2626' }

  return (
    <div
      dir="rtl"
      className="flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-250 cursor-default"
      style={{
        width: 188,
        background: hovered ? '#f0f4ff' : '#ffffff',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.3)' : '#e2e8f0'}`,
        boxShadow: hovered ? '0 4px 20px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="relative h-28 flex items-center justify-center overflow-hidden"
           style={{ background: '#f8fafc' }}>
        {logoUrl && !imgFailed ? (
          <>
            <img src={logoUrl} aria-hidden="true"
                 className="absolute inset-0 w-full h-full object-cover scale-150 opacity-25 pointer-events-none"
                 style={{ filter: 'blur(16px)' }} />
            <img src={logoUrl} alt={tool.name}
                 className="relative max-h-24 max-w-[85%] object-contain drop-shadow-sm"
                 onError={() => setImgFailed(true)} />
          </>
        ) : (
          <span className="text-4xl select-none">{tool.logoEmoji || '🤖'}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {tool.category && (
          <span className="text-xs font-semibold text-indigo-500 block mb-1">{tool.category}</span>
        )}
        <h3 className="font-bold text-sm leading-snug" style={{ color: '#0f172a' }}>{tool.name}</h3>
        {tool.tagline && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#64748b' }}>
            {tool.tagline}
          </p>
        )}

        {/* Expanded on hover */}
        {hovered && (
          <div className="mt-3 pt-3 space-y-2 animate-fade-in"
               style={{ borderTop: '1px solid #e2e8f0' }}>
            {tool.description && (
              <p className="text-xs leading-relaxed line-clamp-4" style={{ color: '#374151' }}>
                {tool.description}
              </p>
            )}
            {tool.howToUse && (
              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: '#6b7280' }}>
                {tool.howToUse}
              </p>
            )}
            <div className="flex gap-2 flex-wrap pt-1">
              {tool.videoUrl && (
                <a href={tool.videoUrl} target="_blank" rel="noopener noreferrer"
                   onClick={e => e.stopPropagation()}
                   className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                   style={{ background: '#f1f5f9', color: '#374151' }}
                   onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                   onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <Video size={12} /> סרטון
                </a>
              )}
              {tool.presentationUrl && (
                <a href={tool.presentationUrl} target="_blank" rel="noopener noreferrer"
                   onClick={e => e.stopPropagation()}
                   className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                   style={{ background: '#f1f5f9', color: '#374151' }}
                   onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                   onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <FileText size={12} /> מצגת
                </a>
              )}
            </div>
            {tool.difficulty && (
              <span className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: diffColor.bg, color: diffColor.text }}>
                {tool.difficulty}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ExampleCard (light theme) ──────────────────────────────────────────────────

function HomeExampleCard({ example }) {
  const [hovered, setHovered] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)
  // Prefer the clean logo map (Wikipedia SVGs), fall back to sheet URL
  const logoUrl = getLogoUrl(example.aiTool) || example.logoUrl || ''

  return (
    <div
      dir="rtl"
      className="flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-250 cursor-default"
      style={{
        width: 220,
        background: hovered ? '#fff7ed' : '#ffffff',
        border: `1px solid ${hovered ? 'rgba(249,115,22,0.3)' : '#e2e8f0'}`,
        boxShadow: hovered ? '0 4px 20px rgba(249,115,22,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo / emoji banner */}
      <div className="relative h-28 flex items-center justify-center overflow-hidden"
           style={{ background: hovered ? 'rgba(249,115,22,0.08)' : '#f8fafc' }}>
        {logoUrl && !imgFailed ? (
          <>
            <img src={logoUrl} aria-hidden="true"
                 className="absolute inset-0 w-full h-full object-cover scale-150 opacity-25 pointer-events-none"
                 style={{ filter: 'blur(16px)' }} />
            <img src={logoUrl} alt={example.aiTool}
                 className="relative max-h-24 max-w-[85%] object-contain drop-shadow-sm"
                 onError={() => setImgFailed(true)} />
          </>
        ) : (
          <span className="text-4xl select-none leading-none">{example.emoji}</span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold leading-snug mb-1" style={{ color: '#0f172a' }}>{example.name}</h3>
        {(example.subject || example.topic || example.grade) && (
          <p className="text-xs mb-1.5" style={{ color: '#64748b' }}>
            {[example.subject, example.topic, example.grade].filter(Boolean).join(' · ')}
          </p>
        )}
        {example.shortDesc && (
          <p className="text-xs leading-relaxed" style={{
            color: '#475569',
            display: '-webkit-box',
            WebkitLineClamp: hovered ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: hovered ? 'visible' : 'hidden',
          }}>
            {example.shortDesc}
          </p>
        )}
        {hovered && example.link && (
          <div className="mt-3">
            <a href={example.link} target="_blank" rel="noopener noreferrer"
               onClick={e => e.stopPropagation()}
               className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
               style={{ background: 'rgba(249,115,22,0.1)', color: '#ea580c' }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
               onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}>
              <ExternalLink size={11} /> פתח תוצר
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

function HomeAgentCard({ student }) {
  const { name, logoUrl, emoji } = student
  const [imgFailed, setImgFailed] = useState(false)
  const h = hashStr(name)
  const palette = ROBOT_PALETTES[h % ROBOT_PALETTES.length]
  const variant = h % 8
  const showImg = logoUrl && !imgFailed
  const showEmoji = !showImg && emoji
  const showRobot = !showImg && !showEmoji

  return (
    <div className="flex-shrink-0 w-44 rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-1"
         style={{
           background: '#ffffff',
           border: `1px solid ${palette[0]}25`,
           boxShadow: `0 2px 8px ${palette[0]}15`,
         }}>
      <div className="flex justify-center mb-3">
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: showImg ? 64 : 64,
            height: showImg ? 64 : 80,
            borderRadius: showImg ? '50%' : '1rem',
            background: `${palette[0]}10`,
            border: `1px solid ${palette[0]}20`,
          }}
        >
          {showImg && (
            <img src={logoUrl} alt={name}
                 className="w-full h-full object-cover"
                 onError={() => setImgFailed(true)} />
          )}
          {showEmoji && <span className="text-3xl select-none">{emoji}</span>}
          {showRobot && <RobotFigure c={palette} variant={variant} />}
        </div>
      </div>
      <h3 className="font-bold text-sm leading-snug" style={{ color: '#0f172a' }}>{name}</h3>
      <div className="mt-2 w-6 h-0.5 mx-auto rounded-full" style={{ background: palette[0] }} />
    </div>
  )
}

// ── StepCard (light theme) ─────────────────────────────────────────────────────

function StepCard({ step, idx }) {
  return (
    <div className="relative flex flex-col items-center text-center opacity-0 animate-fade-up"
         style={{ animationDelay: `${idx * 0.2}s`, animationFillMode: 'forwards' }}>
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-black text-lg shadow-lg mb-4`}>
        {step.num}
      </div>
      <h3 className="font-bold text-base mb-2" style={{ color: '#0f172a' }}>{step.title}</h3>
      <p className="text-sm leading-relaxed max-w-[200px]" style={{ color: '#475569' }}>{step.desc}</p>
    </div>
  )
}

// ── SectionHeading (light theme) ──────────────────────────────────────────────

function SectionHeading({ badge, title, sub, badgeColor = '#6366f1' }) {
  return (
    <div className="text-center mb-10">
      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
            style={{
              background: `${badgeColor}15`,
              color: badgeColor,
              border: `1px solid ${badgeColor}25`,
            }}>
        {badge}
      </span>
      <h2 className="text-3xl font-black mb-3" style={{ color: '#0f172a' }}>{title}</h2>
      {sub && <p className="text-base max-w-xl mx-auto" style={{ color: '#475569' }}>{sub}</p>}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, profile, loading, signOut, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [tools, setTools] = useState([])
  const [students, setStudents] = useState([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [agentsLoading, setAgentsLoading] = useState(true)

  const [outputs, setOutputs] = useState([])
  const [emojiMap, setEmojiMap] = useState({})

  useEffect(() => {
    getTools().then(({ data }) => {
      setTools(data || [])
      setToolsLoading(false)
      const map = {}
      for (const t of (data || [])) {
        if (t.name && t.logoEmoji) map[t.name.toLowerCase()] = t.logoEmoji
      }
      setEmojiMap(map)
    })
    getOutputs().then(({ data }) => setOutputs(data || []))
    fetchStudentNames().then(names => { setStudents(names); setAgentsLoading(false) })
  }, [])

  const examples = outputs.map(o => ({
    name: o.name,
    aiTool: o.aiTool,
    logoUrl: o.logoUrl || '',
    emoji: o.logoEmoji || emojiMap[o.aiTool?.toLowerCase()] || getToolEmoji(o.aiTool) || '🤖',
    shortDesc: o.shortDesc || o.description || '',
    subject: o.subject,
    topic: o.topic,
    grade: o.grade,
    link: o.link,
  }))

  const dashRoute =
    profile?.role === 'admin' ? '/admin' :
    profile?.role === 'agent' ? '/agent' : '/teacher'

  const ctaTo = !user
    ? '/login'
    : profile?.role === 'teacher'
    ? '/teacher/new-request'
    : dashRoute

  const S1        = '#07080f'   // hero dark background (unchanged)
  const LIGHT_BG  = '#f8fafc'   // sections background
  const LIGHT_ALT = '#f1f5f9'   // alternate sections

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: LIGHT_BG }}>

      {/* ── CSS ───────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        .font-orbitron { font-family: 'Orbitron', 'Inter', monospace; }
        .cta-primary:hover { box-shadow: 0 6px 28px rgba(249,115,22,0.45), 0 2px 8px rgba(249,115,22,0.2); }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b"
           style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', borderColor: '#e2e8f0' }}>

        {/* Main bar */}
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between" dir="ltr">

          {/* Left: logo */}
          <a href="#top" className="flex items-center gap-2">
            <img src="/logo3.png" alt="Prometheus" className="h-7 w-7 object-contain" />
            <span className="font-bold text-sm tracking-wide" style={{ color: '#0f172a' }}>
              AI פרומפתאוס
            </span>
          </a>

          {/* Left: CTA (always visible) + hamburger */}
          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 text-sm font-semibold rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.10)', color: '#4338ca', border: '1px solid rgba(99,102,241,0.20)' }}>
                    {profile?.full_name?.split(' ')[0] || 'שלום'}
                  </span>
                  {profile?.role !== 'admin' && (
                    <Link to={dashRoute}
                          className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors"
                          style={{
                            background: profile?.role === 'agent' ? 'rgba(168,85,247,0.12)' : 'rgba(99,102,241,0.10)',
                            color: profile?.role === 'agent' ? '#a855f7' : '#4338ca',
                            border: `1px solid ${profile?.role === 'agent' ? 'rgba(168,85,247,0.30)' : 'rgba(99,102,241,0.20)'}`,
                          }}>
                      {profile?.role === 'agent' ? 'לאיזור הסוכן' : 'לאיזור המורה'}
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin"
                          className="px-3 py-1.5 text-sm font-semibold rounded-xl"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.30)' }}>
                      ניהול
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login"
                      className="px-4 py-1.5 text-sm font-semibold rounded-xl transition-all cta-primary"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
                  כניסה
                </Link>
              )
            )}

            {/* Hamburger button */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="border-t" style={{ borderColor: '#e2e8f0', background: '#ffffff' }}>
            <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1" dir="rtl">
              {[['#agents','הסוכנים'], ['#how','איך זה עובד']].map(([href, label]) => (
                <a key={href} href={href}
                   onClick={() => setMenuOpen(false)}
                   className="px-3 py-2 text-sm rounded-lg transition-colors"
                   style={{ color: '#475569' }}
                   onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a' }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
                  {label}
                </a>
              ))}
              <Link to="/outputs"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-sm rounded-lg transition-colors"
                    style={{ color: '#475569' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
                תוצרים
              </Link>
              {user && (
                <button
                  onClick={() => { signOut(); setMenuOpen(false) }}
                  className="px-3 py-2 text-sm rounded-lg text-right transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}>
                  יציאה
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden flex items-center justify-center px-4"
               style={{ minHeight: '92vh', background: '#ffffff' }}>

        {/* Scattered tool logos — decorative, desktop only */}
        {SCATTERED_LOGOS.map(({ file, pos, size, rotate }) => (
          <img key={file} src={`/logos/${file}`} alt="" aria-hidden="true"
               className="absolute object-contain pointer-events-none hidden lg:block"
               style={{ ...pos, width: size, height: size, opacity: 0.35, transform: `rotate(${rotate})` }} />
        ))}

        {/* Soft gradient blobs */}
        <div className="absolute pointer-events-none" style={{
          top: '-8%', left: '-6%', width: '560px', height: '560px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)',
        }}/>
        <div className="absolute pointer-events-none" style={{
          bottom: '-10%', right: '-6%', width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)',
        }}/>
        <div className="absolute pointer-events-none" style={{
          top: '55%', left: '55%', width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)',
          transform: 'translate(-50%, -50%)',
        }}/>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full mx-auto" dir="rtl">

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
                style={{
                  background: 'rgba(249,115,22,0.08)',
                  color: '#ea580c',
                  border: '1px solid rgba(249,115,22,0.22)',
                }}>
            סוכני AI שקמה
          </span>

          {/* Brand */}
          <p className="font-orbitron tracking-[0.28em] mb-5"
             style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {Array.from('PROMPTHEUS').map((ch, i) => (
              <span key={i} style={i === 0 || i === 4 ? { color: '#f97316' } : {}}>{ch}</span>
            ))}
            <span style={{ fontSize: '0.6em', color: '#f97316', marginRight: '3px' }}> AI</span>
          </p>

          {/* Headline */}
          <h1 className="font-black leading-tight mb-5"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', color: '#0f172a', letterSpacing: '-0.02em' }}>
            מביאים את הבינה לכיתה
          </h1>

          {/* Description */}
          <p className="text-base leading-relaxed mb-9 max-w-lg" style={{ color: '#64748b' }}>
            קבוצת תלמידים מוכשרים יוצרים עבור מורים תוצרי AI בהזמנה אישית<br />
            המורים על הפדגוגיה — התלמידים על הטכנולוגיה<br />
            יחד, מביאים את הבינה לכיתה!
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap justify-center mb-12">
            <Link to={ctaTo}
                  className="px-7 py-3 rounded-2xl font-semibold text-sm transition-all cta-primary"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(249,115,22,0.28)',
                  }}>
              הזמן תוצר AI ←
            </Link>
            <Link to="/outputs"
                  className="px-7 py-3 rounded-2xl font-semibold text-sm transition-all"
                  style={{ background: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#0f172a' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}>
              תוצרים לדוגמה
            </Link>
          </div>

        </div>
      </section>

      {/* ── Examples Section ───────────────────────────────────────────── */}
      {examples.length > 0 && (
        <section id="examples" style={{ background: LIGHT_BG, paddingTop: '80px', paddingBottom: '80px' }}>
          <div className="max-w-6xl mx-auto px-6">
            <SectionHeading
              badge="תוצרים"
              title="מה אפשר לבנות?"
              sub="דוגמאות אמיתיות שנוצרו בעזרת הסוכנים שלנו"
              badgeColor="#f97316"
            />
            <AutoCarousel>
              {examples.map((ex, i) => <HomeExampleCard key={i} example={ex} />)}
            </AutoCarousel>
            <div className="text-center mt-8">
              <Link to="/outputs"
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(249,115,22,0.08)', color: '#c2410c', border: '1px solid rgba(249,115,22,0.2)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}>
                לגלריית כל התוצרים ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Tools Section ──────────────────────────────────────────────── */}
      <section id="tools" style={{ background: LIGHT_ALT, paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            badge="למורים"
            title="ארגז הכלים"
            sub="כלי AI שנבחרו בקפידה לסיוע בהוראה — עמדו על כלי לפרטים נוספים"
            badgeColor="#6366f1"
          />

          {toolsLoading ? (
            <div className="flex gap-4 px-12 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 rounded-2xl overflow-hidden animate-pulse bg-white"
                     style={{ border: '1px solid #e2e8f0' }}>
                  <div className="h-28 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 rounded w-12 bg-gray-100" />
                    <div className="h-4 rounded w-20 bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AutoCarousel>
              {tools.map(tool => <HomeToolCard key={tool.name} tool={tool} />)}
            </AutoCarousel>
          )}

          <div className="text-center mt-8">
            <Link to={ctaTo}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#4338ca', border: '1px solid rgba(99,102,241,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
              שלח בקשה עם הכלי שבחרת ←
            </Link>
          </div>
        </div>
      </section>

      {/* ── Agents Section ─────────────────────────────────────────────── */}
      <section id="agents" style={{ background: LIGHT_BG, paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            badge="הצוות שלנו"
            title="הסוכנים שלנו"
            sub="תלמידים מומחי AI מכיתות י–יב, מוכנים לעזור לכם בכיתה"
            badgeColor="#8b5cf6"
          />

          {agentsLoading ? (
            <div className="flex gap-4 px-12 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-44 rounded-2xl p-5 animate-pulse bg-white"
                     style={{ border: '1px solid #e2e8f0' }}>
                  <div className="w-16 h-20 rounded-2xl mx-auto mb-3 bg-gray-100" />
                  <div className="h-4 rounded w-24 mx-auto bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <AutoCarousel>
              {students.map(s => <HomeAgentCard key={s.name} student={s} />)}
            </AutoCarousel>
          )}

          <div className="text-center mt-8">
            <Link to={ctaTo}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              בחר סוכן ושלח בקשה ←
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how" style={{ background: LIGHT_ALT, paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <SectionHeading
            badge="התהליך"
            title="איך זה עובד?"
            sub="שלושה צעדים פשוטים להכניס AI לכיתה שלכם"
            badgeColor="#14b8a6"
          />

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
            <div className="hidden sm:block absolute top-7 right-[calc(33%+28px)] left-[calc(33%+28px)] h-0.5"
                 style={{ background: 'linear-gradient(to left,rgba(139,92,246,0.3),rgba(99,102,241,0.3))' }} />
            {STEPS.map((step, i) => <StepCard key={i} step={step} idx={i} />)}
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '💬', title: 'צ׳אט ישיר',    desc: 'שוחחו עם הסוכן בזמן אמת דרך הפלטפורמה' },
              { icon: '📎', title: 'שיתוף קבצים', desc: 'שלחו תכניות שיעור, עבודות תלמידים, או כל קובץ אחר' },
              { icon: '🎯', title: 'פתרון מותאם', desc: 'הסוכן יבנה פתרון AI בדיוק לנושא ולכיתה שלכם' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-5 text-center bg-white"
                   style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#0f172a' }}>{item.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to={ctaTo}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-base transition-all shadow-xl"
                  style={{ background: '#6366f1' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}>
              📝 לטופס הבקשה
            </Link>
            <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
              חינם לחלוטין • בדרך כלל מגיבים תוך 24 שעות
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#03040a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              className="py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo3.png" alt="Prometheus" className="h-8 w-8 object-contain opacity-70" />
            <div>
              <p className="text-white font-bold text-sm">פרומפתאוס AI</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                יד מרדכי • {new Date().getFullYear()}
              </p>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            סוכני בינה מלאכותית תלמידיים — מחברים מורים לעתיד של החינוך
          </p>
          <div className="flex gap-3">
            <Link to="/outputs"
                  className="text-xs px-4 py-2 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              תוצרים
            </Link>
            <Link to="/login"
                  className="text-xs px-4 py-2 rounded-xl transition-colors text-white"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
              כניסה לפלטפורמה
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
