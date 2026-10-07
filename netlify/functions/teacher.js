const crypto = require('crypto');
const { db, reply } = require('../lib');

const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(200, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'METHOD' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'BAD_JSON' }); }

  const real = process.env.TEACHER_PASSWORD;
  if (!real) return reply(500, { error: 'NO_PASSWORD_SET' });
  if (!safeEqual(b.password || '', real)) return reply(401, { error: 'WRONG_PASSWORD' });

  try {
    const snap = await db.collection('students').get();
    const students = [];
    snap.forEach(d => students.push(d.data()));
    return reply(200, { students });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'SERVER' });
  }
};
