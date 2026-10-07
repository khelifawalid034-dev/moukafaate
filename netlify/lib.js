const admin = require('firebase-admin');

const clean = s => String(s || '')
  .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/\u060C/g, ',')
  .replace(/[\u00A0\u200E\u200F\u202A-\u202E\uFEFF]/g, ' ')
  .trim();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(clean(process.env.FIREBASE_KEY)))
  });
}
const db = admin.firestore();

const normalize = s => String(s || '').normalize('NFKC')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[\/\\.#$\[\]]/g, '')
  .replace(/\s+/g, ' ').trim().toLowerCase();

const studentId = (c, f, l) =>
  (String(c) + '_' + normalize(f) + '_' + normalize(l)).replace(/\s+/g, '_');

const reply = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  body: JSON.stringify(body)
});

module.exports = { admin, db, studentId, reply };
