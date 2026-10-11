/* موصّل منصة مكافآت: يوضع مرة واحدة هنا، وتستعمله كل التقويمات */
(function () {
  var SITE = 'https://splendorous-biscuit-4ecc2d.netlify.app/';
  var API = SITE + '.netlify/functions/';
  var CL = [["ad5z7eb3","2 آداب وفلسفة 3"],["f3id7xai","2 تسيير واقتصاد 3"],["ritwws5i","2 تسيير واقتصاد 2"],["vynajots","2 تقني رياضي 1"],["5qririln","2 علمي 3"],["afdw3t2k","1 ج م ع ت 7"],["gwsnatci","1 ج م ع ت 8"],["45pptqxn","1 ج م ع ت 9"],["2noo223m","1 ج م ع ت 10"],["enrt6unl","1 ج م آداب 7"]];
  var MSG = {
    ALREADY: 'لقد أنجزت هذا التقويم من قبل، والقسيمة تُمنح مرة واحدة فقط.',
    NOT_STARTED: 'لم يحن موعد هذا التقويم بعد.',
    NO_QUIZ: 'هذا التقويم غير مسجّل في المنصة. أخبر أستاذك.',
    MISSING: 'بيانات ناقصة.',
    NOT_ALLOWED: 'هذا التقويم غير مخصص لقسمك.',
    SERVER: 'حدث خطأ، حاول مجدداً.'
  };
  var INP = 'width:100%;padding:12px;margin:5px 0 10px;background:#0a1f18;border:1.5px solid #b7950b;border-radius:12px;color:#fff;font-size:1rem;font-family:inherit;box-sizing:border-box';
  var BTN = 'width:100%;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;font-size:1.05rem;font-weight:800;cursor:pointer;font-family:inherit;margin-top:6px;display:block;text-align:center;text-decoration:none;box-sizing:border-box';
  var me = null, busy = false;
  try { me = JSON.parse(localStorage.getItem('mk_me') || 'null'); } catch (e) {}

  function open() {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:Tajawal,Arial,sans-serif;color:#fff;overflow:auto';
    var card = document.createElement('div');
    card.style.cssText = 'background:#123026;border:2px solid #f39c12;border-radius:20px;padding:20px;width:100%;max-width:420px';
    ov.appendChild(card);
    document.body.appendChild(ov);
    return { ov: ov, card: card };
  }

  /* في بداية التقويم: يدخل التلميذ بياناته مرة واحدة */
  function ask(cb, quizId) {
    var o = open(), card = o.card;
    var opts = '<option value="" disabled selected>-- اختر القسم --</option>' +
      CL.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('');
    card.innerHTML =
      '<h2 style="color:#f1c40f;text-align:center;margin-bottom:6px">🎮 من أنت؟</h2>' +
      '<p style="color:#ccc;font-size:.88rem;text-align:center;margin-bottom:10px;line-height:1.7">اكتب اسمك ولقبك بشكل صحيح، فبهما تُسجَّل نقاطك في منصة مكافآت.</p>' +
      '<div id="mk-e" style="display:none;background:rgba(231,76,60,.25);border:1px solid #e74c3c;border-radius:10px;padding:8px;text-align:center;margin-bottom:8px"></div>' +
      '<select id="mk-c" style="' + INP + '">' + opts + '</select>' +
      '<input id="mk-k" placeholder="رمز القسم" style="' + INP + '">' +
      '<input id="mk-f" placeholder="الاسم" maxlength="30" style="' + INP + '">' +
      '<input id="mk-l" placeholder="اللقب" maxlength="30" style="' + INP + '">' +
      '<button id="mk-b" style="' + BTN + '">ابدأ اللعب 🚀</button>';
    function $(id) { return card.querySelector('#' + id); }
    if (me) { $('mk-c').value = me.c || ''; $('mk-f').value = me.f || ''; $('mk-l').value = me.l || ''; }
    $('mk-b').onclick = function () {
      var c = $('mk-c').value, k = $('mk-k').value.trim().toLowerCase();
      var f = $('mk-f').value.trim().replace(/\s+/g, ' '), l = $('mk-l').value.trim().replace(/\s+/g, ' ');
      var e = $('mk-e');
      function bad(m) { e.textContent = m; e.style.display = 'block'; }
      if (!c) return bad('اختر القسم!');
      if (k !== c) return bad('رمز القسم غير صحيح!');
      if (!f || !l) return bad('اكتب الاسم واللقب!');
      me = { c: c, f: f, l: l };
      try { localStorage.setItem('mk_me', JSON.stringify(me)); } catch (x) {}
      if (!quizId) { o.ov.remove(); if (cb) cb(); return; }
      var btn = $('mk-b'); btn.disabled = true; btn.textContent = 'جاري التحقق...';
      function back(m) { btn.disabled = false; btn.textContent = 'ابدأ اللعب 🚀'; bad(m); }
      fetch(API + 'grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quizId, classCode: c, firstName: f, lastName: l, check: true })
      }).then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      }).then(function (x) {
        if (!x.ok) return back(MSG[x.d.error] || MSG.SERVER);
        o.ov.remove(); if (cb) cb();
      }).catch(function () { back(MSG.SERVER); });
    };
  }

  /* في نهاية التقويم: إرسال الإجابات وعرض القسيمة مباشرة */
  function finish(quizId, answers) {
    if (busy) return;
    if (!me) return ask(function () { finish(quizId, answers); });
    busy = true;
    var o = open(), card = o.card;
    card.innerHTML = '<div style="text-align:center"><div style="font-size:3rem">⏳</div><h2>جاري التصحيح...</h2></div>';

    function fail(code) {
      var retry = code !== 'ALREADY' && code !== 'NOT_STARTED' && code !== 'NO_QUIZ';
      card.innerHTML = '<div style="text-align:center"><div style="font-size:3rem">⚠️</div><h3 style="margin:8px 0">' +
        (MSG[code] || MSG.SERVER) + '</h3>' +
        (retry ? '<button id="mk-r" style="' + BTN + '">حاول مجدداً</button>' : '') + '</div>';
      busy = false;
      if (retry) card.querySelector('#mk-r').onclick = function () { o.ov.remove(); finish(quizId, answers); };
    }

    fetch(API + 'grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: quizId, classCode: me.c, firstName: me.f, lastName: me.l, answers: answers })
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, d: d }; });
    }).then(function (x) {
      if (!x.ok) return fail(x.d.error);
      var d = x.d, ratio = d.correct / d.total;
      var em = ratio === 1 ? '🏆' : ratio >= 0.5 ? '🌟' : '💪';
      var h = '<div style="text-align:center"><div style="font-size:3.2rem">' + em + '</div>' +
        '<h2>أجبت صح على ' + d.correct + ' من ' + d.total + '</h2>';
      if (d.practice) {
        h += '<p style="color:#ccc;margin-top:10px">انتهى وقت المكافأة، كان هذا تدريباً فقط ولا قسيمة.</p>';
        card.innerHTML = h + '</div>';
        busy = false;
        return;
      }
      var link = SITE + '#c=' + encodeURIComponent(me.c) + '&f=' + encodeURIComponent(me.f) +
        '&l=' + encodeURIComponent(me.l) + '&v=' + encodeURIComponent(d.code);
      h += '<p style="margin-top:10px">قسيمتك (' + Number(d.points).toFixed(2) + ' نقطة):</p>' +
        '<div id="mk-v" style="font-size:1.7rem;letter-spacing:3px;background:#0a1f18;border:2px dashed #f1c40f;border-radius:14px;padding:14px;margin:10px 0;color:#f1c40f;font-weight:900;word-break:break-all;direction:ltr"></div>' +
        '<a href="' + link + '" style="' + BTN + '">أضف نقاطي الآن ➜</a>' +
        '<button id="mk-p" style="' + BTN + ';background:#444">نسخ القسيمة 📋</button>' +
        '<p style="color:#ccc;font-size:.88rem;margin-top:10px;line-height:1.7">اضغط «أضف نقاطي الآن» فتُفتح منصة مكافآت وبياناتك وقسيمتك جاهزة. وإن لم تفعل، فاحفظ القسيمة وأدخلها قبل إغلاق الاستقبال، فهي لا تنفع لغيرك.</p></div>';
      card.innerHTML = h;
      card.querySelector('#mk-v').textContent = d.code;
      card.querySelector('#mk-p').onclick = function () {
        var t = this;
        (navigator.clipboard ? navigator.clipboard.writeText(d.code) : Promise.reject())
          .then(function () { t.textContent = 'تم النسخ ✅'; })
          .catch(function () { prompt('انسخ القسيمة:', d.code); });
      };
    }).catch(function () { fail('SERVER'); });
  }

  window.MK = { ask: ask, finish: finish };
})();
