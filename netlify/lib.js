const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
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
