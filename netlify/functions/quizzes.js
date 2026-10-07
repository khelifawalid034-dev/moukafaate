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
    if (b.action === 'list') {
      const snap = await db.collection('quizzes').get();
      const quizzes = [];
      snap.forEach(d => quizzes.push({ id: d.id, ...d.data() }));
      return reply(200, { quizzes });
    }

    if (b.action === 'save') {
      const id = String(b.quizId || '');
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return reply(400, { error: 'BAD_ID' });
      const answers = Array.isArray(b.answers)
        ? b.answers.map(a => String(a).trim()).filter(Boolean) : [];
      if (!answers.length) return reply(400, { error: 'NO_ANSWERS' });
      const opens = Date.parse(b.opensAt), closes = Date.parse(b.closesAt);
      if (isNaN(opens) || isNaN(closes) || closes <= opens)
        return reply(400, { error: 'BAD_DATES' });
      const maxPoints = Math.min(Math.max(parseFloat(b.maxPoints) || 0.5, 0.05), 5);
      await db.collection('quizzes').doc(id).set({
        title: String(b.title || id).slice(0, 80),
        answers,
        maxPoints,
        opensAt: new Date(opens).toISOString(),
        closesAt: new Date(closes).toISOString(),
        active: b.active !== false
      });
      return reply(200, { ok: true });
    }

    if (b.action === 'toggle') {
      const id = String(b.quizId || '');
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return reply(400, { error: 'BAD_ID' });
      await db.collection('quizzes').doc(id).update({ active: !!b.active });
      return reply(200, { ok: true });
    }

    return reply(400, { error: 'BAD_ACTION' });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'SERVER' });
  }
};
