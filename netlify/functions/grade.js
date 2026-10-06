const crypto = require('crypto');
const { db, studentId, reply } = require('../lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(200, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'METHOD' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'BAD_JSON' }); }

  const { quizId, classCode, firstName, lastName, answers } = b;
  if (!quizId || !classCode || !firstName || !lastName || !Array.isArray(answers))
    return reply(400, { error: 'MISSING' });
  if (String(quizId).includes('/')) return reply(400, { error: 'BAD_QUIZ' });

  const quizSnap = await db.collection('quizzes').doc(String(quizId)).get();
  if (!quizSnap.exists || quizSnap.data().active === false)
    return reply(404, { error: 'NO_QUIZ' });

  const quiz = quizSnap.data();
  const key = quiz.answers || [];
  let correct = 0;
  key.forEach((a, i) => {
    if (String(answers[i]).trim() === String(a).trim()) correct++;
  });
  const maxPoints = parseFloat(quiz.maxPoints || 0.5);
  const points = parseFloat((maxPoints * correct / key.length).toFixed(2));

  const sid = studentId(classCode, firstName, lastName);
  const attemptRef = db.collection('attempts').doc(sid + '__' + quizId);
  const code = crypto.randomBytes(6).toString('hex').toUpperCase();
  const voucherRef = db.collection('vouchers').doc(code);

  try {
    await db.runTransaction(async (tx) => {
      const att = await tx.get(attemptRef);
      if (att.exists) throw new Error('ALREADY');
      tx.set(attemptRef, { at: new Date().toISOString(), correct, total: key.length });
      tx.set(voucherRef, {
        studentId: sid,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        classCode: String(classCode),
        quizId: String(quizId),
        activityTitle: quiz.title || 'تقويم',
        points,
        isUsed: false,
        createdAt: new Date().toISOString()
      });
    });
  } catch (e) {
    if (e.message === 'ALREADY') return reply(409, { error: 'ALREADY' });
    console.error(e);
    return reply(500, { error: 'SERVER' });
  }

  return reply(200, { code, points, correct, total: key.length });
};
