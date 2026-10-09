/* موصّل منصة المكافآت: يوضع مرة واحدة هنا، وتستعمله كل التقويمات */
(function () {
  var SITE = 'https://splendorous-biscuit-4ecc2d.netlify.app/';
  var API = SITE + '.netlify/functions/';
  var CL = [["ad5z7eb3","2 آداب وفلسفة 3"],["f3id7xai","2 تسيير واقتصاد 3"],["ritwws5i","2 تسيير واقتصاد 2"],["vynajots","2 تقني رياضي 1"],["5qririln","2 علمي 3"],["afdw3t2k","1 ج م ع ت 7"],["gwsnatci","1 ج م ع ت 8"],["45pptqxn","1 ج م ع ت 9"],["2noo223m","1 ج م ع ت 10"],["enrt6unl","1 ج م آداب 7"]];
  var MSG = {
    ALREADY: 'لقد أنجزت هذا التقويم من قبل، والقسيمة تُمنح مرة واحدة فقط.',
    NOT_STARTED: 'لم يحن موعد هذا التقويم بعد.',
    NO_QUIZ: 'هذا التقويم غير مسجّل في المنصة. أخبر أستاذك.',
    MISSING: 'أكمل كل الخانات.',
    SERVER: 'حدث خطأ، حاول مجدداً.'
  };
  var busy = false;

  function el(tag, css, html) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    return e;
  }
  var INP = 'width:100%;padding:12px;margin:5px 0 10px;background:#0a1f18;border:1.5px solid #b7950b;border-radius:12px;color:#fff;font-size:1rem;font-family:inherit;box-sizing:border-box';
  var BTN = 'width:100%;padding:14px;border:0;border-radius:14px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;font-size:1.05rem;font-weight:800;cursor:pointer;font-family:inherit;margin-top:6px;display:block;text-align:center;text-decoration:none;box-sizing:border-box';

  function finish(quizId, answers) {
    if (busy) return;
    busy = true;
    var ov = el('div', 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:14px;direction:rtl;font-family:Tajawal,Arial,sans-serif;color:#fff;overflow:auto');
    var card = el('div', 'background:#123026;border:2px solid #f39c12;border-radius:20px;padding:20px;width:100%;max-width:420px');
    ov.appendChild(card);
    document.body.appendChild(ov);

    var opts = '<option value="" disabled selected>-- اختر القسم --</option>' +
      CL.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('');
    card.innerHTML =
      '<h2 style="color:#f1c40f;text-align:center;margin-bottom:10px">🎁 احصل على قسيمتك</h2>' +
      '<div id="mk-e" style="display:none;background:rgba(231,76,60,.25);border:1px solid #e74c3c;border-radius:10px;padding:8px;text-align:center;margin-bottom:8px"></div>' +
      '<select id="mk-c" style="' + INP + '">' + opts + '</select>' +
      '<input id="mk-k" placeholder="رمز القسم" style="' + INP + '">' +
      '<input id="mk-f" placeholder="الاسم" maxlength="30" style="' + INP + '">' +
      '<input id="mk-l" placeholder="اللقب" maxlength="30" style="' + INP + '">' +
      '<button id="mk-b" style="' + BTN + '">تصحيح وإرسال ✅</button>';

    function $(id) { return card.querySelector('#' + id); }
    function err(m) { var e = $('mk-e'); e.textContent = m; e.style.display = 'block'; }

    try { // تذكّر البيانات ليسهل التقويم التالي
      var s = JSON.parse(localStorage.getItem('mk_me') || '{}');
      if (s.c) $('mk-c').value = s.c;
      if (s.f) $('mk-f').value = s.f;
      if (s.l) $('mk-l').value = s.l;
    } catch (e) {}

    $('mk-b').onclick = function () {
      var c = $('mk-c').value, k = $('mk-k').value.trim().toLowerCase();
      var f = $('mk-f').value.trim(), l = $('mk-l').value.trim();
      if (!c) return err('اختر القسم!');
      if (k !== c) return err('رمز القسم غير صحيح!');
      if (!f || !l) return err('اكتب الاسم واللقب!');
      try { localStorage.setItem('mk_me', JSON.stringify({ c: c, f: f, l: l })); } catch (e) {}
      var b = $('mk-b'); b.disabled = true; b.textContent = 'جاري التصحيح...';

      fetch(API + 'grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quizId, classCode: c, firstName: f, lastName: l, answers: answers })
      }).then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, d: d }; });
      }).then(function (x) {
        if (!x.ok) {
          b.disabled = false; b.textContent = 'تصحيح وإرسال ✅';
          return err(MSG[x.d.error] || MSG.SERVER);
        }
        var d = x.d, ratio = d.correct / d.total;
        var em = ratio === 1 ? '🏆' : ratio >= 0.5 ? '🌟' : '💪';
        var body = '<div style="text-align:center"><div style="font-size:3.2rem">' + em + '</div>' +
          '<h2>أجبت صح على ' + d.correct + ' من ' + d.total + '</h2>';
        if (d.practice) {
          body += '<p style="color:#ccc;margin-top:10px">انتهى وقت المكافأة، كان هذا تدريباً فقط ولا قسيمة.</p>';
        } else {
          body += '<p style="margin-top:10px">قسيمتك (' + Number(d.points).toFixed(2) + ' نقطة):</p>' +
            '<div id="mk-v" style="font-size:1.7rem;letter-spacing:3px;background:#0a1f18;border:2px dashed #f1c40f;border-radius:14px;padding:14px;margin:10px 0;color:#f1c40f;font-weight:900;word-break:break-all;direction:ltr"></div>' +
            '<button id="mk-p" style="' + BTN + '">نسخ القسيمة 📋</button>' +
            '<p style="color:#ccc;font-size:.9rem;margin:10px 0;line-height:1.7">أدخلها في منصة المكافآت <b>بنفس اسمك ولقبك وقسمك</b> قبل إغلاق الاستقبال. لا تنفع لغيرك.</p>' +
            '<a href="' + SITE + '" style="' + BTN + '">الذهاب إلى منصة المكافآت</a>';
        }
        card.innerHTML = body + '</div>';
        if (!d.practice) {
          card.querySelector('#mk-v').textContent = d.code;
          card.querySelector('#mk-p').onclick = function () {
            var t = this;
            (navigator.clipboard ? navigator.clipboard.writeText(d.code) : Promise.reject())
              .then(function () { t.textContent = 'تم النسخ ✅'; })
              .catch(function () { prompt('انسخ القسيمة:', d.code); });
          };
        }
      }).catch(function () {
        b.disabled = false; b.textContent = 'تصحيح وإرسال ✅';
        err(MSG.SERVER);
      });
    };
  }

  window.MK = { finish: finish };
})();
