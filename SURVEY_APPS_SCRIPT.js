// ── Google Apps Script ────────────────────────────────────────────────────────
// 1. פתח את הגיליון: https://docs.google.com/spreadsheets/d/1hrR-NyiugQvTsZ3gtaptUsIwRFmOkIIknWoMiGn1XwA
// 2. תפריט: Extensions → Apps Script
// 3. מחק את כל הקוד הקיים והדבק את הקוד הזה
// 4. שמור (Ctrl+S)
// 5. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. לחץ Deploy, אשר הרשאות, והעתק את ה-URL שמתקבל
// 7. הוסף את ה-URL לקובץ .env:
//    VITE_SURVEY_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec

const SHEET_NAME = 'תגובות סקר'

const HEADERS = [
  'חותמת זמן',
  'שם מלא',
  'מקצועות',
  'שנות ותק',
  'תפקידים נוספים',
  'תדירות שימוש AI',
  'רצון לשלב AI (1-5)',
  'חסם עיקרי',
  'רלוונטיות כלים',
  'נכונות לשיתוף פעולה (1-5)',
  'הערות',
]

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    let sheet = ss.getSheetByName(SHEET_NAME)

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME)
      sheet.appendRow(HEADERS)
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setBackground('#4f46e5')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
      sheet.setFrozenRows(1)
    }

    const data = JSON.parse(e.postData.contents)

    sheet.appendRow([
      data.timestamp   || new Date().toISOString(),
      data.name        || '',
      data.subjects    || '',
      data.seniority   || '',
      data.roles       || '',
      data.aiFrequency || '',
      data.aiDesire    || '',
      data.mainObstacle || '',
      data.toolsMatrix || '',
      data.collaboration || '',
      data.comments    || '',
    ])

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// Test function — run this manually in the Apps Script editor to verify
function testPost() {
  const mock = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        name: 'בדיקה',
        subjects: 'מתמטיקה',
        seniority: '5 שנים',
        roles: '',
        aiFrequency: 'פעם ביום',
        aiDesire: 4,
        mainObstacle: 'חוסר זמן ללמידה',
        toolsMatrix: 'ChatGPT / Claude: רלוונטי | Gemini / NotebookLM: מאד רלוונטי',
        collaboration: 5,
        comments: 'בדיקה בלבד',
      }),
    },
  }
  const result = doPost(mock)
  Logger.log(result.getContent())
}
