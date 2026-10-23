/* ====== EDIT THESE ====== */
const CONFIG = {
  whatsapp: "",

  // Index 0 = Step 1; index 1 = Step 2.
  // Play our downloaded song from Step 2 onward.
  musicFiles: [
    "",            // Step 1: built-in music
    "music.mp3",   // Step 2: the question
    "music.mp3",   // Step 3: celebration
    "music.mp3",   // Step 4: date and time
    "music.mp3",   // Step 5: ride
    "music.mp3"    // Step 6: closing
  ]
};

/* ====== STEP FLOW ====== */
const steps = [...document.querySelectorAll(".step")];
let current = 1;

function typeIn(el, speed = 38) {
  if (!el.dataset.full) el.dataset.full = el.textContent;
  const text = el.dataset.full;
  el.textContent = ""; el.classList.add("typing");
  let i = 0;
  (function tick() {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, speed); else el.classList.remove("typing");
  })();
}

function go(n) {
  current = n;
  steps.forEach(s => s.classList.toggle("active", +s.dataset.step === n));
  const h = steps[n - 1].querySelector("[data-type]");
  if (h) typeIn(h);
  Music.mood(n - 1);
  if (n === 4) initDate();
}

/* step 1 -> 2 (the click also unlocks browser audio) */
document.getElementById("start").onclick = () => { Music.start(); go(2); };
document.querySelectorAll("[data-next]").forEach(b => b.onclick = () => go(current + 1));
document.getElementById("yes").onclick = () => go(3);

/* ====== THE RUNAWAY "NO" ====== */
/* ====== THE RUNAWAY "NO" (stays inside the paper) ====== */
/* ====== THE RUNAWAY "NO" (slow hop, stays inside the paper) ====== */
const no = document.getElementById("no"), yes = document.getElementById("yes");
const noLines = ["No", "Are you sure?", "Really?", "Try the other one", "Nope!", "Not today"];
let dodges = 0, lastHop = 0;
function dodge(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const now = Date.now();
  if (now - lastHop < 650) return;            // wait for the last hop to finish
  lastHop = now;
  const paper = no.closest(".paper"), p = paper.getBoundingClientRect();
  const op = no.offsetParent.getBoundingClientRect();   // coordinates are relative to this
  const first = !no.classList.contains("run");
  const cur = no.getBoundingClientRect(), y = yes.getBoundingClientRect();
  no.textContent = noLines[++dodges % noLines.length];
  no.classList.add("run");
  const w = no.offsetWidth, h = no.offsetHeight, m = 36;
  // everything below is in paper coordinates
  const cx = cur.left - p.left, cy = cur.top - p.top;
  const minX = m, maxX = p.width - w - m, minY = m, maxY = p.height - h - m;
  const clearOfYes = (x, t) => x + w < y.left - p.left - 24 || x > y.right - p.left + 24 ||
                               t + h < y.top - p.top - 24 || t > y.bottom - p.top + 24;
  let x = cx, t = cy;
  for (let i = 0; i < 50; i++) {              // short hop: 110-240px in a random direction
    const a = Math.random() * 6.283, d = 110 + Math.random() * 130;
    const nx = Math.min(maxX, Math.max(minX, cx + Math.cos(a) * d));
    const nt = Math.min(maxY, Math.max(minY, cy + Math.sin(a) * d));
    if (Math.hypot(nx - cx, nt - cy) > 90 && clearOfYes(nx, nt)) { x = nx; t = nt; break; }
  }
  // convert paper coords -> offsetParent coords
  const ox = p.left - op.left, oy = p.top - op.top;
  if (first) { no.style.left = cx + ox + "px"; no.style.top = cy + oy + "px"; no.offsetWidth; }
  no.style.left = x + ox + "px"; no.style.top = t + oy + "px";
}
["pointerenter", "pointerdown", "click", "focus"].forEach(ev => no.addEventListener(ev, dodge));
no.addEventListener("touchstart", dodge, { passive: false });

/* ====== HEARTBEAT: hearts beat faster when she hovers them or the Yes button ====== */
const hearts = document.querySelector(".hearts");
let calmTimer;
const racing = on => hearts.classList.toggle("fast", on);
document.querySelectorAll(".hearts .heart").forEach(hh => {
  hh.addEventListener("pointerenter", () => racing(true));
  hh.addEventListener("pointerleave", () => racing(false));
  hh.addEventListener("touchstart", () => { racing(true); clearTimeout(calmTimer); calmTimer = setTimeout(() => racing(false), 2000); }, { passive: true });
});
["pointerenter", "focus"].forEach(ev => yes.addEventListener(ev, () => racing(true)));
["pointerleave", "blur"].forEach(ev => yes.addEventListener(ev, () => racing(false)));

/* ====== DATE + TIME ====== */
const dateEl = document.getElementById("date"), timeEl = document.getElementById("time");
const confirmBtn = document.getElementById("confirm");
let slot = "";


function initDate() {
  const today = new Date();

  // Find the next Tuesday, including today if it's Tuesday.
  const startDate = new Date(today);
  const daysUntilTuesday = (2 - today.getDay() + 7) % 7;
  startDate.setDate(today.getDate() + daysUntilTuesday);

  // Allow dates through 14 days after the start date.
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);

  // Format dates using the local timezone.
  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  dateEl.min = formatDate(startDate);
  dateEl.max = formatDate(endDate);
}


function check() { confirmBtn.disabled = !(dateEl.value && (slot || timeEl.value)); }
document.querySelectorAll(".chip").forEach(c => c.onclick = () => {
  document.querySelectorAll(".chip").forEach(x => x.classList.remove("on"));
  c.classList.add("on"); slot = c.textContent; timeEl.value = ""; check();
});
timeEl.oninput = () => { slot = ""; document.querySelectorAll(".chip").forEach(x => x.classList.remove("on")); check(); };
dateEl.oninput = check;
let when = "", ride = "";
const picks = new Set();
confirmBtn.onclick = () => {
  const d = new Date(dateEl.value + "T00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  when = `${d}, ${slot ? slot.toLowerCase() : timeEl.value}`;
  go(5);
};

/* ====== WHAT ARE WE FEELING ====== */
const activityNext = document.getElementById("activityNext");
activityNext.disabled = true;   // always start locked, even after a refresh
document.querySelectorAll(".pick").forEach(b => b.onclick = () => {
  const k = b.dataset.pick;
  picks.has(k) ? picks.delete(k) : picks.add(k);
  b.classList.toggle("on", picks.has(k));
  activityNext.disabled = picks.size === 0;
});
activityNext.onclick = () => go(4);

/* ====== RIDE ====== */
document.querySelectorAll("[data-ride]").forEach(b => b.onclick = () => { ride = b.dataset.ride; finish(); });
let msgText = "";
const copyBtn = document.getElementById("copyBtn"), igBtn = document.getElementById("igBtn");

function finish() {
  const feel = [...picks].join(", ");
  const rideText = ride === "yes" ? "pick me up please 🚗" : "I'll get there myself";
  document.getElementById("summary").textContent = `It's a date: ${when}.`;
  document.getElementById("summary2").textContent =
    `Plan is: ${feel}. ` + (ride === "yes" ? "I'll pick you up K." : "See you K!!");

  msgText = `Yes to the date! 💌\nOur date: ${when}\nPlan: ${feel}\nRide: ${rideText}`;
  if (CONFIG.instagram) { igBtn.href = `https://ig.me/m/${CONFIG.instagram}`; igBtn.hidden = false; }

  go(6);
  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msgText)}`, "_blank");
  }
}

copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(msgText);
  } catch {
    const t = document.createElement("textarea");   // fallback for older browsers
    t.value = msgText; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove();
  }
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => (copyBtn.textContent = "Copy our plan"), 2500);
};

/* ====== MUSIC (soft synthesized loops, no files needed) ====== */
const Music = (() => {
  // each mood: bpm, chords (MIDI notes). Step 1..5
  const moods = [
    { bpm: 54, chords: [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]] },  // calm, curious
    { bpm: 66, chords: [[57,60,64,67],[53,57,60,64],[60,64,67,71],[55,59,62,65]] },  // a little suspense
    { bpm: 96, chords: [[60,64,67,72],[65,69,72,76],[67,71,74,79],[60,64,67,72]] },  // happy
    { bpm: 70, chords: [[62,66,69,73],[59,62,66,69],[55,59,62,66],[57,61,64,68]] },  // warm
    { bpm: 60, chords: [[65,69,72,76],[62,65,69,72],[58,62,65,69],[60,64,67,71]] },  // romantic
  ];
  let ctx, master, timer, m = 0, beat = 0, enabled = true, started = false, audioEl;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  function note(freq, dur, vol, type = "triangle") {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .1);
  }
  function tick() {
    const mood = moods[m], chord = mood.chords[Math.floor(beat / 8) % mood.chords.length], i = beat % 8;
    if (i === 0) note(hz(chord[0] - 12), 60 / mood.bpm * 4, .09, "sine");
    const pattern = [0, 1, 2, 3, 2, 1, 3, 2];
    note(hz(chord[pattern[i]] + (i % 4 === 3 ? 12 : 0)), 1.6, .07);
    beat++;
  }
  function loop() {
    clearInterval(timer);
    timer = setInterval(tick, 60 / moods[m].bpm * 500);
  }
  function useFile(i) {
    const f = CONFIG.musicFiles[i];

  // No custom file for this step.
  if (!f) {
    if (audioEl) {
      audioEl.pause();
      audioEl = null;
    }
    return false;
  }

  // Create a new audio player only if the song changes.
  // This lets the same song continue across steps.
  if (
    !audioEl ||
    audioEl.src !== new URL(f, document.baseURI).href
  ) {
    if (audioEl) {
      audioEl.pause();
    }

    audioEl = new Audio(f);
    audioEl.loop = true;
    audioEl.volume = 0.6;
  }

  // Respect the music on/off button.
  if (enabled) {
    audioEl.play().catch(error => {
      console.log("Audio playback failed:", error);
    });
  }

  clearInterval(timer);
  return true;
  }
  return {
    start() {
      if (started) return; started = true;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = enabled ? 1 : 0;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
      const delay = ctx.createDelay(); delay.delayTime.value = .32;
      const fb = ctx.createGain(); fb.gain.value = .35;
      delay.connect(fb); fb.connect(delay);
      master.connect(lp); lp.connect(ctx.destination); lp.connect(delay); delay.connect(ctx.destination);
      this.mood(current - 1);
    },
    mood(i) {
      m = i; beat = 0;
      if (!started) return;
      if (!useFile(i)) { if (ctx.state === "suspended") ctx.resume(); loop(); }
    },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? 1 : 0;
      if (audioEl) enabled ? audioEl.play().catch(() => {}) : audioEl.pause();
      return enabled;
    },
  };
})();
const muteBtn = document.getElementById("mute");
muteBtn.onclick = () => muteBtn.classList.toggle("off", !Music.toggle());

/* first load */
typeIn(document.querySelector("[data-step='1'] [data-type]"));