import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTools, getOutputs } from '../lib/googleSheets'
import { ChevronLeft, ChevronRight, ExternalLink, Video, FileText } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const LEADERBOARD_URL =
  'https://docs.google.com/spreadsheets/d/1TTuD5vvmE9BhNMDqwsNDXsLEgjUVm54nkqMiFaw_8zY/export?format=csv'

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

const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  left: `${(i * 13 + 3) % 100}%`,
  delay: `${((i * 37) % 60) / 10}s`,
  duration: `${4 + ((i * 23) % 50) / 10}s`,
  size: 0.8 + (i % 3) * 0.7,
  drift: `${((i * 17) % 120) - 60}px`,
  opacity: 0.15 + (i % 5) * 0.07,
}))

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
}
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

async function fetchStudentNames() {
  try {
    const res = await fetch(LEADERBOARD_URL)
    if (!res.ok) return []
    const csv = await res.text()
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, ''))
    const nameIdx = headers.findIndex(h => h.includes('שם'))
    if (nameIdx === -1) return []
    return lines.slice(1)
      .map(l => {
        const cells = l.split(',')
        return (cells[nameIdx] || '').trim().replace(/[\u200B-\u200D\uFEFF\u202A-\u202E"]/g, '')
      })
      .filter(n => n.length > 1)
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

// ── TorchSVG ──────────────────────────────────────────────────────────────────
function TorchSVG() {
  return (
    <svg viewBox="0 0 240 460" width="160" height="307" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="tMetal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#07152a"/><stop offset="30%" stopColor="#0f2a55"/>
          <stop offset="50%" stopColor="#1a4888" stopOpacity="0.9"/>
          <stop offset="70%" stopColor="#0f2a55"/><stop offset="100%" stopColor="#07152a"/>
        </linearGradient>
        <linearGradient id="tBronze" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2e1a06"/><stop offset="40%" stopColor="#7a5218"/>
          <stop offset="60%" stopColor="#b88028"/><stop offset="100%" stopColor="#2e1a06"/>
        </linearGradient>
        <radialGradient id="tOuterFlame" cx="50%" cy="85%" r="65%">
          <stop offset="0%" stopColor="#cc1800"/>
          <stop offset="50%" stopColor="#ee4400" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#ff5500" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="tMidFlame" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#ff7700"/>
          <stop offset="55%" stopColor="#ff9900"/>
          <stop offset="100%" stopColor="#ffbb00" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="tInnerFlame" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor="#ffdd00"/>
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0.3"/>
        </radialGradient>
        <radialGradient id="tCore" cx="50%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#ffffcc"/>
          <stop offset="100%" stopColor="#ffee44" stopOpacity="0"/>
        </radialGradient>
        <filter id="tGlow"><feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="tFlameBlur">
          <feGaussianBlur stdDeviation="7" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* FLAME */}
      <g filter="url(#tFlameBlur)">
        <path className="tFlameOuter"
          d="M120,132 C148,128 162,98 155,68 C150,44 136,16 120,8 C104,16 90,44 85,68 C78,98 92,128 120,132Z"
          fill="url(#tOuterFlame)" opacity="0.9"/>
        <path className="tFlameLickL"
          d="M113,132 C90,118 72,86 82,58 C89,40 101,26 113,20 C106,32 99,54 105,76 C110,94 116,118 113,132Z"
          fill="#ee3300" opacity="0.5"/>
        <path className="tFlameLickR"
          d="M127,132 C150,118 168,86 158,58 C151,40 139,26 127,20 C134,32 141,54 135,76 C130,94 124,118 127,132Z"
          fill="#ee3300" opacity="0.5"/>
        <path className="tFlameMid"
          d="M120,132 C142,128 152,104 146,80 C142,58 132,32 120,26 C108,32 98,58 94,80 C88,104 98,128 120,132Z"
          fill="url(#tMidFlame)"/>
        <path className="tFlameInner"
          d="M120,132 C133,130 140,110 136,90 C132,70 128,52 120,46 C112,52 108,70 104,90 C100,110 107,130 120,132Z"
          fill="url(#tInnerFlame)"/>
        <path className="tFlameCore"
          d="M120,132 C126,130 130,116 128,102 C126,90 124,80 120,76 C116,80 114,90 112,102 C110,116 114,130 120,132Z"
          fill="url(#tCore)"/>
        <circle cx="103" cy="74" r="2"   fill="#ffee00" style={{animation:'tSpark1 1.5s ease-out 0.2s infinite'}}/>
        <circle cx="138" cy="66" r="1.5" fill="#ff8800" style={{animation:'tSpark2 1.8s ease-out 0.7s infinite'}}/>
        <circle cx="126" cy="56" r="1"   fill="#fffaaa" style={{animation:'tSpark3 1.3s ease-out 1.1s infinite'}}/>
        <circle cx="110" cy="48" r="1.5" fill="#ffcc00" style={{animation:'tSpark4 1.6s ease-out 0.4s infinite'}}/>
      </g>

      {/* TORCH BOWL */}
      <ellipse cx="120" cy="133" rx="26" ry="10" fill="#3a2008" stroke="#9a7022" strokeWidth="1"/>
      <rect x="94"  y="133" width="52" height="22" rx="3" fill="url(#tBronze)"/>
      <ellipse cx="120" cy="155" rx="28" ry="9" fill="#2a1806" stroke="#7a5518" strokeWidth="0.8"/>

      {/* TORCH HANDLE */}
      <rect x="109" y="154" width="22" height="118" rx="3" fill="url(#tBronze)"/>
      {[170,186,200,214,228,242,254,262].map((y, i) => (
        <rect key={i} x="107" y={y} width="26" height="5" rx="2" fill="#2a1806" stroke="#8a6018" strokeWidth="0.5"/>
      ))}

      {/* MECHANICAL FIST */}
      {/* PALM */}
      <rect x="62" y="272" width="116" height="50" rx="10" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.4"/>
      <line x1="80" y1="272" x2="80" y2="322" stroke="#1a6aff" strokeWidth="0.8" opacity=".5"/>
      <line x1="160" y1="272" x2="160" y2="322" stroke="#1a6aff" strokeWidth="0.8" opacity=".5"/>
      <circle cx="90" cy="296" r="3" fill="#22aaff" opacity=".9" filter="url(#tGlow)"/>
      <circle cx="150" cy="300" r="2.5" fill="#22aaff" opacity=".7" filter="url(#tGlow)"/>
      <circle cx="120" cy="310" r="2.5" fill="#22aaff" opacity=".7" filter="url(#tGlow)"/>

      {/* INDEX FINGER */}
      <rect x="68" y="226" width="20" height="48" rx="8" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.2"/>
      <circle cx="78" cy="250" r="5.5" fill="#07152a" stroke="#2266bb" strokeWidth="1.3"/>
      <rect x="71" y="247" width="14" height="5" rx="2" fill="#040d1c"/>

      {/* MIDDLE FINGER */}
      <rect x="93" y="216" width="20" height="58" rx="8" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.2"/>
      <circle cx="103" cy="242" r="5.5" fill="#07152a" stroke="#2266bb" strokeWidth="1.3"/>
      <rect x="96" y="239" width="14" height="5" rx="2" fill="#040d1c"/>

      {/* RING FINGER */}
      <rect x="118" y="220" width="20" height="54" rx="8" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.2"/>
      <circle cx="128" cy="246" r="5.5" fill="#07152a" stroke="#2266bb" strokeWidth="1.3"/>
      <rect x="121" y="243" width="14" height="5" rx="2" fill="#040d1c"/>

      {/* PINKY */}
      <rect x="143" y="232" width="18" height="42" rx="7" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.2"/>
      <circle cx="152" cy="253" r="5" fill="#07152a" stroke="#2266bb" strokeWidth="1.3"/>
      <rect x="146" y="250" width="12" height="5" rx="2" fill="#040d1c"/>

      {/* THUMB — side */}
      <rect x="46" y="255" width="22" height="42" rx="8" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.2"/>
      <circle cx="57" cy="268" r="5" fill="#07152a" stroke="#2266bb" strokeWidth="1.5"/>
      <rect x="50" y="265" width="14" height="4" rx="2" fill="#040d1c"/>
      <rect x="50" y="275" width="14" height="4" rx="2" fill="#040d1c"/>

      {/* WRIST */}
      <rect x="70" y="308" width="100" height="36" rx="8" fill="url(#tMetal)" stroke="#18489a" strokeWidth="1.4"/>
      <rect x="78" y="316" width="84" height="8"  rx="3" fill="#040d1c" stroke="#0a3060" strokeWidth="0.6"/>
      <rect x="78" y="327" width="84" height="8"  rx="3" fill="#040d1c" stroke="#0a3060" strokeWidth="0.6"/>

      {/* FOREARM */}
      <rect x="76" y="342" width="88" height="110" rx="9" fill="url(#tMetal)" stroke="#10223e" strokeWidth="1.4"/>
      {[356,376,396,416,436].map((y, i) => (
        <rect key={i} x="83" y={y} width="74" height="12" rx="3" fill="#040d1c" stroke="#0a2850" strokeWidth="0.5"/>
      ))}
      <line x1="88"  y1="344" x2="88"  y2="452" stroke="#0a6aff" strokeWidth="1" opacity=".6" filter="url(#tGlow)"/>
      <line x1="152" y1="344" x2="152" y2="452" stroke="#0a6aff" strokeWidth="1" opacity=".6" filter="url(#tGlow)"/>
      {/* Elbow cap */}
      <ellipse cx="120" cy="452" rx="44" ry="14" fill="#07152a" stroke="#18448a" strokeWidth="1.6"/>
      <ellipse cx="120" cy="452" rx="30" ry="9"  fill="#040d1c" stroke="#0a2860" strokeWidth="0.9"/>
      <circle  cx="120" cy="452" r="7"           fill="#07152a" stroke="#2060c0" strokeWidth="1.2"/>
    </svg>
  )
}

// ── AutoCarousel — slow auto-scroll + hover pause + manual buttons ─────────────

function AutoCarousel({ children, gap = 16, speed = 0.7 }) {
  const ref = useRef(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let rafId
    const tick = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += speed
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [speed])

  const scroll = (dir) => {
    pausedRef.current = true
    ref.current?.scrollBy({ left: dir * 400, behavior: 'smooth' })
    setTimeout(() => { pausedRef.current = false }, 1600)
  }

  const items = React.Children.toArray(children)

  return (
    <div className="relative group"
         onMouseEnter={() => { pausedRef.current = true }}
         onMouseLeave={() => { pausedRef.current = false }}>
      {/* Left button */}
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full
                   flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(15,23,42,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(15,23,42,0.12)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(15,23,42,0.1)'}
      >
        <ChevronLeft size={20} className="text-gray-600" />
      </button>

      {/* Scroll track — direction: ltr for consistent scrollLeft */}
      <div ref={ref}
           className="flex items-start px-12 py-3 scrollbar-hide"
           style={{ gap, direction: 'ltr', overflowX: 'scroll' }}>
        {items}
        {items}
      </div>

      {/* Right button */}
      <button
        onClick={() => scroll(1)}
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
  const logoUrl = getLogoUrl(tool.name)

  const diffColor = tool.difficulty === 'קל'
    ? { bg: 'rgba(16,185,129,0.1)', text: '#059669' }
    : tool.difficulty === 'בינוני'
    ? { bg: 'rgba(245,158,11,0.1)', text: '#d97706' }
    : { bg: 'rgba(239,68,68,0.1)', text: '#dc2626' }

  return (
    <div
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
      <div className="h-28 flex items-center justify-center p-5"
           style={{ background: '#f8fafc' }}>
        {logoUrl && !imgFailed ? (
          <img src={logoUrl} alt={tool.name}
               className="max-h-16 max-w-full object-contain"
               onError={() => setImgFailed(true)} />
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

  return (
    <div
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
      {/* Emoji banner */}
      <div className="h-28 flex flex-col items-center justify-center gap-2"
           style={{ background: hovered ? 'rgba(249,115,22,0.08)' : '#f8fafc' }}>
        <span className="text-4xl select-none leading-none">{example.emoji}</span>
        {example.aiTool && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>
            {example.aiTool}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold leading-snug mb-1" style={{ color: '#0f172a' }}>{example.name}</h3>
        {(example.subject || example.grade) && (
          <p className="text-xs mb-1.5" style={{ color: '#64748b' }}>
            {[example.subject, example.grade].filter(Boolean).join(' · ')}
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

// ── AgentCard (FBI/Bond style, light theme) ────────────────────────────────────

function HomeAgentCard({ name }) {
  const h = hashStr(name)
  const palette = ROBOT_PALETTES[h % ROBOT_PALETTES.length]
  const variant = h % 8

  return (
    <div className="flex-shrink-0 w-44 rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-1"
         style={{
           background: '#ffffff',
           border: `1px solid ${palette[0]}25`,
           boxShadow: `0 2px 8px ${palette[0]}15`,
         }}>
      <div className="flex justify-center mb-3">
        <div className="w-16 h-20 rounded-2xl flex items-center justify-center"
             style={{ background: `${palette[0]}10`, border: `1px solid ${palette[0]}20` }}>
          <RobotFigure c={palette} variant={variant} />
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
      <div className="text-4xl mb-3">{step.icon}</div>
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
    emoji: o.logoEmoji || emojiMap[o.aiTool?.toLowerCase()] || '🤖',
    shortDesc: o.shortDesc || o.description || '',
    subject: o.subject,
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

      {/* ── CSS Animations ────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
        .font-orbitron { font-family: 'Orbitron', 'Inter', monospace; }

        .tFlameOuter  { transform-origin:120px 132px; animation:tFlicker  .75s ease-in-out infinite; }
        .tFlameLickL  { transform-origin:95px  132px; animation:tLickL    1.1s  ease-in-out .3s infinite; }
        .tFlameLickR  { transform-origin:145px 132px; animation:tLickR    1.1s  ease-in-out .6s infinite; }
        .tFlameMid    { transform-origin:120px 132px; animation:tFlicker  .55s ease-in-out .08s infinite; }
        .tFlameInner  { transform-origin:120px 132px; animation:tInnerF   .45s ease-in-out .15s infinite; }
        .tFlameCore   { transform-origin:120px 132px; animation:tInnerF   .35s ease-in-out infinite; }

        @keyframes tFlicker {
          0%,100%{transform:scaleX(1) scaleY(1) rotate(-1deg);}
          20%{transform:scaleX(.94) scaleY(1.07) rotate(1.5deg);}
          40%{transform:scaleX(1.05) scaleY(.95) rotate(-.5deg);}
          60%{transform:scaleX(.97) scaleY(1.05) rotate(1deg);}
          80%{transform:scaleX(1.03) scaleY(.97) rotate(-1.5deg);}
        }
        @keyframes tInnerF {
          0%,100%{transform:scaleY(1) translateY(0);}
          33%{transform:scaleY(1.11) translateY(-4px);}
          66%{transform:scaleY(.91) translateY(2px);}
        }
        @keyframes tLickL{0%,100%{transform:rotate(-3deg) scaleX(1);}50%{transform:rotate(4deg) scaleX(1.12);}}
        @keyframes tLickR{0%,100%{transform:rotate(3deg) scaleX(1);}50%{transform:rotate(-4deg) scaleX(1.12);}}
        @keyframes tSpark1{0%{transform:translate(0,0);opacity:1;}100%{transform:translate(-22px,-52px);opacity:0;}}
        @keyframes tSpark2{0%{transform:translate(0,0);opacity:1;}100%{transform:translate(18px,-45px);opacity:0;}}
        @keyframes tSpark3{0%{transform:translate(0,0);opacity:1;}100%{transform:translate(14px,-38px);opacity:0;}}
        @keyframes tSpark4{0%{transform:translate(0,0);opacity:1;}100%{transform:translate(-12px,-32px);opacity:0;}}

        @keyframes torchGlow {
          0%,100%{filter:drop-shadow(0 0 8px #ff6600aa) drop-shadow(0 0 22px #ff440044);}
          50%{filter:drop-shadow(0 0 18px #ffaa00cc) drop-shadow(0 0 44px #ff660077);}
        }
        .torch-wrap{animation:torchGlow 1.8s ease-in-out infinite;}

        @keyframes particleRise{
          0%{transform:translateY(0) translateX(0);opacity:0;}
          10%{opacity:var(--pop);}
          90%{opacity:calc(var(--pop)*.4);}
          100%{transform:translateY(-110vh) translateX(var(--d));opacity:0;}
        }
        @keyframes gridShimmer{0%,100%{opacity:.08;}50%{opacity:.16;}}
        .hero-grid{animation:gridShimmer 5s ease-in-out infinite;}

        .cta-primary:hover{box-shadow:0 0 28px #f97316aa,0 8px 30px #f9731655;}
        .cta-secondary:hover{box-shadow:0 0 20px #6366f188;}
      `}</style>

      {/* ── Navbar (light) ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 border-b"
           style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', borderColor: '#e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/Logo_promptheus.png" alt="Prometheus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-sm hidden sm:block tracking-wide" style={{ color: '#0f172a' }}>
              פרומפתאוס AI
            </span>
          </a>
          <div className="flex items-center gap-1">
            {[['#tools','ארגז הכלים'],['#agents','הסוכנים'],['#how','איך זה עובד']].map(([href, label]) => (
              <a key={href} href={href}
                 className="px-3 py-2 text-sm rounded-lg transition-colors hidden md:block"
                 style={{ color: '#475569' }}
                 onMouseEnter={e => e.target.style.color='#0f172a'}
                 onMouseLeave={e => e.target.style.color='#475569'}>
                {label}
              </a>
            ))}
            <Link to="/outputs"
                  className="px-3 py-2 text-sm rounded-lg transition-colors hidden md:block"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => e.target.style.color='#0f172a'}
                  onMouseLeave={e => e.target.style.color='#475569'}>
              תוצרים
            </Link>
            {!loading && (
              user ? (
                <div className="flex items-center gap-2 mr-2">
                  <span className="px-3 py-1.5 text-sm font-semibold rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.10)', color: '#4338ca',
                                 border: '1px solid rgba(99,102,241,0.20)' }}>
                    {profile?.full_name?.split(' ')[0] || 'שלום'}
                  </span>
                  {profile?.role !== 'admin' && (
                    <Link
                      to={dashRoute}
                      className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors"
                      style={{
                        background: profile?.role === 'agent'
                          ? 'rgba(168,85,247,0.12)' : 'rgba(99,102,241,0.10)',
                        color: profile?.role === 'agent' ? '#a855f7' : '#4338ca',
                        border: `1px solid ${profile?.role === 'agent'
                          ? 'rgba(168,85,247,0.30)' : 'rgba(99,102,241,0.20)'}`,
                      }}>
                      {profile?.role === 'agent' ? 'לאיזור הסוכן' : 'לאיזור המורה'}
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin"
                          className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706',
                                   border: '1px solid rgba(245,158,11,0.30)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.22)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}>
                      ניהול
                    </Link>
                  )}
                  <button onClick={signOut}
                          className="px-3 py-1.5 text-sm rounded-xl transition-colors"
                          style={{ color: '#64748b', border: '1px solid #e2e8f0' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                    יציאה
                  </button>
                </div>
              ) : (
                <Link to="/login"
                      className="mr-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cta-primary"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff' }}>
                  כניסה
                </Link>
              )
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero (dark, split layout) ────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden"
               style={{ minHeight: '100vh', background: `radial-gradient(ellipse 900px 700px at 50% 40%, #0e1840 0%, ${S1} 65%)` }}>

        {/* Grid */}
        <div className="hero-grid absolute inset-0 pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)', backgroundSize: '55px 55px', opacity: .08 }}/>

        {/* Horizon glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 700px 300px at 50% 100%,rgba(249,115,22,.06) 0%,transparent 70%)' }}/>

        {/* Particles */}
        {PARTICLES.map(p => (
          <div key={p.id} className="absolute rounded-full pointer-events-none"
               style={{
                 left: p.left, bottom: '-5px',
                 width: `${p.size}px`, height: `${p.size}px`,
                 background: p.id % 3 === 0 ? '#f97316' : p.id % 3 === 1 ? '#6366f1' : '#22aaff',
                 '--pop': p.opacity, '--d': p.drift,
                 animation: `particleRise ${p.duration} linear ${p.delay} infinite`,
               }}/>
        ))}

        {/* ── 3-column hero content ── */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8"
             style={{ minHeight: '100vh' }}>

          {/* Top row: texts flanking the torch */}
          <div className="flex items-start justify-center w-full max-w-5xl"
               style={{ gap: '1.5rem' }}>

            {/* RIGHT side in RTL — "סוכני בינה שקמה" */}
            <div className="flex-1 flex items-start justify-start pt-10 sm:pt-20">
              <h2 className="font-black text-xl sm:text-3xl lg:text-4xl leading-tight text-white">
                סוכני בינה שקמה
              </h2>
            </div>

            {/* CENTER — Torch */}
            <div className="flex-shrink-0 torch-wrap">
              <TorchSVG />
            </div>

            {/* LEFT side in RTL — "PromPtheus.Ai" */}
            <div className="flex-1 flex items-start justify-end pt-10 sm:pt-20">
              <h2 className="font-orbitron font-black text-xl sm:text-3xl lg:text-4xl leading-tight text-white text-left">
                PromPtheus.<span style={{ color: '#f97316' }}>Ai</span>
              </h2>
            </div>
          </div>

          {/* Below torch: subtitle + CTAs */}
          <div className="text-center mt-6 sm:mt-8 px-4">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold max-w-2xl mx-auto leading-relaxed"
               style={{ color: '#f97316' }}>
              תלמידים מסייעים למורים להכניס AI לכיתה
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap mt-8">
              <a href="#tools"
                 className="cta-secondary px-8 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300"
                 style={{ border: '1.5px solid rgba(249,115,22,.5)', color: '#fb923c', background: 'rgba(249,115,22,.08)' }}>
                🛠️ גלה את הכלים
              </a>
              <Link to={ctaTo}
                    className="cta-secondary px-8 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300"
                    style={{ border: '1.5px solid rgba(99,102,241,.5)', color: '#a5b4fc', background: 'rgba(99,102,241,.08)' }}>
                📝 שלח בקשה
              </Link>
            </div>
          </div>
        </div>

        {/* Wave — dark to light */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 50L60 40C120 30 240 12 360 8C480 4 600 12 720 18C840 24 960 28 1080 24C1200 20 1320 10 1380 6L1440 2V50H0Z"
                  fill={LIGHT_BG}/>
          </svg>
        </div>
      </section>

      {/* ── Tools Section ──────────────────────────────────────────────── */}
      <section id="tools" style={{ background: LIGHT_BG, paddingTop: '80px', paddingBottom: '80px' }}>
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

      {/* ── Examples Section ───────────────────────────────────────────── */}
      {examples.length > 0 && (
        <section id="examples" style={{ background: LIGHT_ALT, paddingTop: '80px', paddingBottom: '80px' }}>
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
              {students.map(name => <HomeAgentCard key={name} name={name} />)}
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
            <img src="/Logo_promptheus.png" alt="Prometheus" className="h-8 w-8 object-contain opacity-70" />
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
