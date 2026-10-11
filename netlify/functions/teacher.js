const crypto = require('crypto');
const { admin, db, reply } = require('../lib');

const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

// حذف دفعات صغيرة (حد Firestore 500 عملية للدفعة)
async function deleteRefs(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach(r => batch.delete(r));
    await batch.commit();
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return reply(200, {});
  if (event.httpMethod !== 'POST') return reply(405, { error: 'METHOD' });

  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'BAD_JSON' }); }

  const real = process.env.TEACHER_PASSWORD;
  if (!real) return reply(500, { error: 'NO_PASSWORD_SET' });
  if (!safeEqual(b.password || '', real)) return reply(401, { error: 'WRONG_PASSWORD' });

  try {
    if (b.action === 'delete') {
      const id = String(b.id || '');
      if (!id || id.includes('/') || id.length > 300) return reply(400, { error: 'BAD_ID' });

      const refs = [db.collection('students').doc(id)];

      // محاولاته (معرّفها: معرّف التلميذ + __ + رمز التقويم)
      const prefix = id + '__';
      const FP = admin.firestore.FieldPath.documentId();
      const att = await db.collection('attempts')
        .where(FP, '>=', prefix).where(FP, '<', prefix + '\uf8ff').get();
      att.forEach(d => refs.push(d.ref));

      // قسائمه (المستعملة وغير المستعملة)
      const vs = await db.collection('vouchers').where('studentId', '==', id).get();
      vs.forEach(d => refs.push(d.ref));

      await deleteRefs(refs);
      return reply(200, { ok: true, deleted: refs.length });
    }

    const snap = await db.collection('students').get();
    const students = [];
    snap.forEach(d => students.push({ id: d.id, ...d.data() }));
    return reply(200, { students });
  } catch (e) {
    console.error(e);
    return reply(500, { error: 'SERVER' });
  }
};
