const { db, studentId, reply } = require('../lib');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(200, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'METHOD' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'BAD_JSON' }); }

  const code = String(b.code || '').trim().toUpperCase();
  const { classCode, firstName, lastName } = b;
  if (!code || !classCode || !firstName || !lastName)
    return reply(400, { error: 'MISSING' });
  if (code.includes('/')) return reply(404, { error: 'INVALID' });

  const sid = studentId(classCode, firstName, lastName);
  const voucherRef = db.collection('vouchers').doc(code);
  const studentRef = db.collection('students').doc(sid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const vSnap = await tx.get(voucherRef);
      const sSnap = await tx.get(studentRef);

      if (!vSnap.exists) throw new Error('INVALID');
      const v = vSnap.data();
      if (v.studentId !== sid) throw new Error('NOT_YOURS');
      if (v.isUsed) throw new Error('USED');

      const pts = parseFloat(v.points || 0);
      const activity = {
        title: v.activityTitle || 'تقويم',
        code,
        points: pts,
        date: new Date().toLocaleDateString('ar-DZ')
      };

      tx.update(voucherRef, { isUsed: true, claimedAt: new Date().toISOString() });

      let total;
      if (!sSnap.exists) {
        total = pts;
        tx.set(studentRef, {
          firstName: v.firstName,
          lastName: v.lastName,
          classCode: v.classCode,
          totalPoints: total,
          activities: [activity]
        });
      } else {
        const d = sSnap.data();
        total = parseFloat(((d.totalPoints || 0) + pts).toFixed(2));
        tx.update(studentRef, {
          totalPoints: total,
          activities: [...(d.activities || []), activity]
        });
      }
      return { points: pts, total };
    });
    return reply(200, result);
  } catch (e) {
    if (['INVALID', 'NOT_YOURS', 'USED'].includes(e.message))
      return reply(400, { error: e.message });
    console.error(e);
    return reply(500, { error: 'SERVER' });
  }
};
