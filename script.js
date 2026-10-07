(function () {
  "use strict";

  // ---- Themes: each one brings its own colors, decorations and wording ----
  var THEMES = {
    flowers:  { n: "Flowers",   e: "🌷", d: ["🌷","🌸","🌻","🌼","🌹"], a: "#d6457f", c: ["#ffe3ee","#f1e6ff","#fff6e6"], t: "Someone sent you a little surprise", s: "A bouquet is waiting for you." },
    hearts:   { n: "Hearts",    e: "💖", d: ["💖","💗","💕","💘","🩷"], a: "#dd3f78", c: ["#ffdfea","#f3e0ff","#fff0f4"], t: "Someone sent you a little surprise", s: "It was made with love." },
    stars:    { n: "Stars",     e: "✨", d: ["⭐","✨","🌟","💫","🌙"], a: "#7455cf", c: ["#e6e0ff","#d9ecff","#f6f0ff"], t: "A little surprise, just for you", s: "Something bright is waiting." },
    cute:     { n: "Cute",      e: "🧸", d: ["🧸","🐰","🍓","🎀","🐻"], a: "#e0608f", c: ["#ffe8f1","#e2f5ff","#fff7e0"], t: "Aww, you got a surprise!", s: "Someone was thinking of you." },
    birthday: { n: "Birthday",  e: "🎂", d: ["🎂","🎈","🎉","🎁","🧁"], a: "#e2527c", c: ["#fff0d2","#ffdfee","#e6f3ff"], t: "A birthday surprise for you", s: "Someone made this just for your day." },
    thanks:   { n: "Thank You", e: "🙏", d: ["🙏","💐","🤍","🌿","✨"], a: "#2f8f83", c: ["#dff5ec","#fff6df","#e8f1ff"], t: "A thank-you, just for you", s: "Someone wanted you to know." }
  };
  var MSG_MAX = 1000, NAME_MAX = 40;
  var theme = "flowers", previewing = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };

  // ---- Encoding: text <-> URL-safe base64 (handles emoji and any language) ----
  function enc(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function dec(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // The website's own address, found automatically (works on any domain)
  function baseURL() {
    return location.protocol === "file:" ? location.href.split("#")[0] : location.origin + location.pathname;
  }

  // Read and sanitize gift data from the URL; returns null if it isn't valid
  function parseGift(code) {
    try {
      var o = JSON.parse(dec(code));
      if (!o || typeof o !== "object" || typeof o.m !== "string" || !o.m) return null;
      return {
        r: String(o.r || "").slice(0, NAME_MAX),
        m: o.m.slice(0, MSG_MAX),
        s: String(o.s || "").slice(0, NAME_MAX),
        t: THEMES[o.t] ? o.t : "flowers"
      };
    } catch (e) { return null; }
  }

  function applyTheme(key) {
    var t = THEMES[key], st = document.documentElement.style;
    st.setProperty("--accent", t.a);
    st.setProperty("--bg1", t.c[0]); st.setProperty("--bg2", t.c[1]); st.setProperty("--bg3", t.c[2]);
  }

  // ---- Creator ----
  function buildThemePicker() {
    var box = $("themes");
    box.innerHTML = "";
    Object.keys(THEMES).forEach(function (key) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", key === theme);
      b.innerHTML = "<span></span>" + THEMES[key].n;
      b.firstChild.textContent = THEMES[key].e;
      b.onclick = function () { theme = key; applyTheme(key); buildThemePicker(); };
      box.appendChild(b);
    });
  }

  function drawQR(url) {
    var box = $("qr");
    box.innerHTML = "";
    try {
      new QRCode(box, { text: url, width: 232, height: 232, colorDark: "#2d1f27", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.L });
      return true;
    } catch (e) { box.innerHTML = ""; return false; }
  }

  $("msg").addEventListener("input", function () { $("cnt").textContent = this.value.length; });

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = $("rec").value.trim(), m = $("msg").value.trim(), s = $("snd").value.trim();
    if (!r || !m) { $("err").textContent = "Please add the recipient's name and your message."; return; }
    var url = baseURL() + "#gift=" + enc(JSON.stringify({ v: 1, r: r, m: m, s: s, t: theme }));
    if (!drawQR(url)) {
      $("err").textContent = "Couldn't make the QR code. Try a shorter message, or check your internet connection.";
      return;
    }
    $("err").textContent = "";
    $("link").value = url;
    $("form").classList.add("hidden");
    $("result").classList.remove("hidden");
    window.scrollTo(0, 0);
  });

  $("again").onclick = function () {
    $("result").classList.add("hidden");
    $("form").classList.remove("hidden");
    window.scrollTo(0, 0);
  };

  $("copy").onclick = function () {
    var i = $("link"), b = this;
    function ok() { b.textContent = "Copied ✓"; setTimeout(function () { b.textContent = "Copy Link"; }, 1800); }
    function fallback() {
      i.focus(); i.select(); i.setSelectionRange(0, 99999);
      try { document.execCommand("copy") ? ok() : (b.textContent = "Press and hold to copy"); }
      catch (e) { b.textContent = "Press and hold to copy"; }
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(i.value).then(ok, fallback);
    else fallback();
  };

  $("prev").onclick = function () { previewing = true; location.hash = $("link").value.split("#")[1]; };
  $("print").onclick = function () { window.print(); };
  $("back").onclick = function () { previewing = false; location.hash = ""; };

  // ---- Receiver ----
  function fall(list) {
    if (reduce) return;
    for (var i = 0; i < 16; i++) {
      var s = document.createElement("span");
      s.className = "fall";
      s.textContent = list[i % list.length];
      s.style.left = Math.random() * 94 + "vw";
      s.style.animationDuration = 4 + Math.random() * 4 + "s";
      s.style.animationDelay = Math.random() * 1.5 + "s";
      s.addEventListener("animationend", function () { this.remove(); });
      document.body.appendChild(s);
    }
  }

  function showReceiver(g) {
    var t = THEMES[g.t];
    applyTheme(g.t);
    $("creator").classList.add("hidden");
    $("receiver").classList.remove("hidden");
    $("back").classList.toggle("hidden", !previewing);
    $("pop").textContent = t.e;
    $("pop").classList.remove("go");
    $("rTitle").textContent = t.t + " " + t.e;
    $("rSub").textContent = t.s;
    $("deco").textContent = t.d.join(" ");
    $("rDear").textContent = g.r ? "Dear " + g.r + "," : "Hello,";
    $("rMsg").textContent = g.m;
    $("rSign").textContent = "— " + (g.s || "Someone who cares");
    $("intro").classList.remove("hidden");
    $("letter").classList.add("hidden");
    document.title = "You have a little surprise 💌";
    window.scrollTo(0, 0);
    $("open").onclick = function () {
      $("pop").classList.add("go");
      setTimeout(function () {
        $("intro").classList.add("hidden");
        $("letter").classList.remove("hidden");
        fall(t.d);
      }, reduce ? 0 : 520);
    };
  }

  function showCreator() {
    previewing = false;
    applyTheme(theme);
    $("receiver").classList.add("hidden");
    $("creator").classList.remove("hidden");
    document.title = "Little Surprise – make a digital gift";
  }

  // ---- Router: a #gift=... link shows the receiver, anything else shows the creator ----
  function route() {
    var m = location.hash.match(/^#gift=([A-Za-z0-9_-]+)$/), g = m && parseGift(m[1]);
    if (g) showReceiver(g); else showCreator();
  }
  window.addEventListener("hashchange", route);

  buildThemePicker();
  route();
})();
