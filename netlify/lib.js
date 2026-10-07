const admin = require('firebase-admin');

const clean = s => String(s || '')
  .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/\u060C/g, ',')
  .replace(/[\u00A0\u200E\u200F\u202A-\u202E\uFEFF]/g, ' ')
  .trim();

const fixPem = k => {
  const body = String(k || '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\\s*n/g, '')
    .replace(/[^A-Za-z0-9+\/=]/g, '');
  return '-----BEGIN PRIVATE KEY-----\n' +
    body.match(/.{1,64}/g).join('\n') +
    '\n-----END PRIVATE KEY-----\n';
};

if (!admin.apps.length) {
  const cred = JSON.parse(clean(process.env.FIREBASE_KEY));
  cred.private_key = fixPem(cred.private_key);
  admin.initializeApp({ credential: admin.credential.cert(cred) });
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
