(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EVENT_DATE = new Date('2026-12-20T08:00:00+07:00'); // ganti tanggal akad di sini

  // nama tamu
  const guest = new URLSearchParams(location.search).get('to');
  if (guest) $('#guest-name').textContent = guest;

  // fallback 2D partikel CSS bila WebGL tidak ada 
  window.addEventListener('scene-fallback', () => {
    const box = $('#bg-fallback');
    for (let i = 0; i < 30; i++) {
      const d = document.createElement('i'); d.className = 'css-dot';
      box.appendChild(d);
      gsap.set(d, { x: gsap.utils.random(0, innerWidth), y: gsap.utils.random(0, innerHeight), opacity: gsap.utils.random(.3, .9) });
      gsap.to(d, { y: '+=' + gsap.utils.random(40, 120), duration: gsap.utils.random(3, 6), repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
  });

  // audio + ikon toggle
  const bgm = $('#bgm'), musicBtn = $('#music-btn');
  const setIcon = (on) => {
    $('#wave-on').style.display = on ? '' : 'none';
    $('#wave-off').style.display = on ? 'none' : '';
    musicBtn.setAttribute('aria-label', on ? 'Matikan musik' : 'Nyalakan musik');
    gsap.fromTo(musicBtn, { scale: .85 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  };
  musicBtn.addEventListener('click', () => {
    if (bgm.paused) { bgm.play().catch(() => {}); setIcon(true); } else { bgm.pause(); setIcon(false); }
  });
 
  gsap.from('.cover-box > *', { y: 30, opacity: 0, stagger: .12, duration: 1.1, ease: 'power3.out' });
  gsap.to('.envelope', { y: -6, repeat: -1, yoyo: true, duration: 2, ease: 'sine.inOut' });

  let opened = false;
  $('#open-btn').addEventListener('click', () => {
    if (opened) return; opened = true;
    bgm.volume = 0;
    bgm.play().then(() => gsap.to(bgm, { volume: .6, duration: 3 })).catch(() => {});
    musicBtn.hidden = false; setIcon(true);

    // urutan amplop dari segel lepas ke flap terbuka (rotasi 3D) ke kartu naik keluar ke teks cover memudar terus cover hilang dan kamera 3D dolly-in 
    gsap.timeline()
      .to('#open-btn', { opacity: 0, duration: .3 })
      .to('.seal', { scale: 0, duration: .4, ease: 'back.in(2)' }, '<')
      .to('.env-flap', { rotationX: 180, duration: 1, ease: 'power3.inOut' })
      .set('.env-flap', { zIndex: 1 }, '-=.5')         
      .to('.env-card', { y: -130, duration: .9, ease: 'power2.out' })
      .set('.env-card', { zIndex: 6 })                  // kartu tampil di depan amplop
      .to('.env-card', { scale: 1.2, duration: .5, ease: 'power2.out' })
      .to('.cover-box > :not(.env-wrap)', { opacity: 0, duration: .4 }, '<')
      .add(() => window.dispatchEvent(new Event('invitation-open')))
      .to('#cover', { opacity: 0, duration: 1.2, ease: 'power2.inOut', delay: .4 })
      .add(() => {
        $('#cover').style.display = 'none';
        document.body.classList.remove('is-locked');
        ScrollTrigger.refresh(); initReveals(); showHint(); $('#focus-btn').hidden = false;
      });
  });

  // petunjuk interaksinya nanti muncul sebentar, hilang saat pengguna mulai berinteraksi
  function showHint() {
    const h = $('#hint'); if (reduced) { h.style.opacity = 1; }
    const t = gsap.timeline().to(h, { opacity: 1, duration: .5, delay: 1 }).to(h, { opacity: 0, duration: .6, delay: 6 });
    addEventListener('scene-interact', () => { t.kill(); gsap.to(h, { opacity: 0, duration: .4 }); }, { once: true });
  }

  // reveal saat scroll 
  function initReveals() {
    if (reduced) return;
    $$('.panel:not(#cover .panel)').forEach((el) =>
      gsap.from(el, { opacity: 0, y: 50, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } }));
  }

  // tilt 3D kartu 
  $$('.tilt').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3.out' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * 14);
      rx(-((e.clientY - r.top) / r.height - .5) * 14);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });

  // countdown flip-clock 
  (() => {
    const el = Object.fromEntries($$('.digits').map((n) => [n.dataset.u, n]));
    const pad = (n) => String(n).padStart(2, '0');
    const set = (n, v) => {
      if (n.textContent === v) return;
      n.textContent = v;
      if (!reduced) gsap.fromTo(n, { rotationX: -90, transformOrigin: '50% 0' }, { rotationX: 0, duration: .5, ease: 'power2.out' });
    };
    const tick = () => {
      let s = Math.max(0, Math.floor((EVENT_DATE - Date.now()) / 1000));
      set(el.d, pad(Math.floor(s / 86400))); s %= 86400;
      set(el.h, pad(Math.floor(s / 3600))); s %= 3600;
      set(el.m, pad(Math.floor(s / 60))); set(el.s, pad(s % 60));
    };
    tick(); setInterval(tick, 1000);
  })();

  // toast 
  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg;
    gsap.timeline().to(t, { opacity: 1, y: 0, duration: .3 }).to(t, { opacity: 0, y: 20, duration: .3, delay: 1.8 });
  };

  // perintah kamera + mode interaksi fokus 3D 
  const cmd = (c) => window.dispatchEvent(new CustomEvent('scene-cmd', { detail: c }));
  $$('[data-cmd]').forEach((b) => b.addEventListener('click', () => cmd(b.dataset.cmd)));
  addEventListener('gallery-state', (e) => { $('#gal-caption').textContent = e.detail.caption; });
  const focusBtn = $('#focus-btn');
  const setFocus = (on) => {
    document.body.classList.toggle('focus-mode', on);   
    scroll
    focusBtn.textContent = on ? 'Kembali ke undangan' : 'Mode 3D';
    if (on) toast('Geser untuk memutar, scroll untuk zoom, ketuk objek'); else cmd('release');
  };
  focusBtn.addEventListener('click', () => setFocus(!document.body.classList.contains('focus-mode')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) setFocus(false); });

  addEventListener('scene-toast', (e) => toast(e.detail));

  // RSVP itu data disimpan di array JS (hilang saat refresh) 
  (() => {
    const wishes = [
      { nama: 'Cha Eunwo', hadir: 'Hadir', pesan: 'Selamat ya Sunjae & Imsol, semoga sakinah mawaddah warahmah.' },
      { nama: 'Adel & Beomgyu', hadir: 'Hadir', pesan: 'Bahagia selalu! Sampai jumpa di Surabaya.' }
    ].reverse();
    const list = $('#wish-list');
    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const render = (onlyNewest) => {
      list.innerHTML = wishes.map((w) => `<li><b>${esc(w.nama)}</b><em>${esc(w.hadir)}</em><p>${esc(w.pesan)}</p></li>`).join('');
      gsap.from(onlyNewest ? [list.firstElementChild] : $$('li', list), { opacity: 0, x: -30, stagger: .12, duration: .7, ease: 'power3.out' });
    };
    render(false);
    $('#rsvp-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const nama = $('#f-nama').value.trim(), pesan = $('#f-pesan').value.trim();
      if (!nama || !pesan) return toast('Isi nama dan ucapan dulu');
      wishes.unshift({ nama, hadir: $('#f-hadir').value, pesan });
      render(true); e.target.reset(); toast('Ucapan terkirim');
    });
  })();

  // copy rekening 
  $('#copy-btn').addEventListener('click', async () => {
    const num = $('#acc-number').textContent.replace(/\s/g, '');
    try { await navigator.clipboard.writeText(num); }
    catch { const ta = Object.assign(document.createElement('textarea'), { value: num });
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    toast('Nomor rekening disalin');
  });
})();
