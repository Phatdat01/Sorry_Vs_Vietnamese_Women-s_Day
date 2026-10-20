(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Reveal elements only when they enter the viewport.
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
    revealObserver.observe(el);
  });

  // Subtle animated starfield, rendered on canvas for a lightweight moving background.
  const canvas = $("#starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(140, Math.floor((width * height) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.25 + 0.25,
      alpha: Math.random() * 0.55 + 0.15,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.006 + 0.002
    }));
  }

  let frame = 0;
  function drawStars() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((star) => {
      star.phase += star.speed;
      const shimmer = reducedMotion ? 0.8 : 0.62 + Math.sin(star.phase) * 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 224, 239, ${star.alpha * shimmer})`;
      ctx.fill();
    });
    if (!reducedMotion) frame = requestAnimationFrame(drawStars);
  }
  resizeCanvas();
  drawStars();
  window.addEventListener("resize", () => {
    cancelAnimationFrame(frame);
    resizeCanvas();
    drawStars();
  }, { passive: true });

  // Gift reveal.
  const giftButton = $("#giftButton");
  const surpriseMessage = $("#surpriseMessage");
  giftButton.addEventListener("click", () => {
    const opened = giftButton.classList.toggle("opened");
    surpriseMessage.classList.toggle("visible", opened);
    giftButton.setAttribute("aria-expanded", String(opened));
    if (opened) {
      burstHearts(window.innerWidth / 2, window.innerHeight * 0.66, 14);
      showToast("Một lời chúc nhỏ dành riêng cho em ♡");
    }
  });

  // Floating hearts for a playful interaction.
  const heartsLayer = $("#hearts-layer");
  function burstHearts(x, y, amount = 10) {
    const symbols = ["♡", "♥", "✧", "✦"];
    for (let i = 0; i < amount; i++) {
      const heart = document.createElement("span");
      heart.className = "heart-particle";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.style.left = `${x + (Math.random() - 0.5) * 130}px`;
      heart.style.top = `${y + (Math.random() - 0.5) * 45}px`;
      heart.style.fontSize = `${12 + Math.random() * 19}px`;
      heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 130}px`);
      heartsLayer.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  }
  $("#sendHearts").addEventListener("click", () => {
    burstHearts(window.innerWidth / 2, window.innerHeight * 0.63, 24);
    showToast("Gửi em thật nhiều điều dịu dàng ♡");
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    if (Math.random() > 0.45) burstHearts(event.clientX, event.clientY, 3);
  });

  // Optional synthesized soft tones. No external audio file is required.
  let audioContext = null;
  let musicTimer = null;
  let noteIndex = 0;
  const soundToggle = $("#soundToggle");
  const soundLabel = $("#soundLabel");
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];

  function playNote() {
    if (!audioContext || audioContext.state !== "running") return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = notes[noteIndex % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.8);
    noteIndex++;
  }

  soundToggle.addEventListener("click", async () => {
    try {
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
        if (audioContext) await audioContext.suspend();
        soundToggle.setAttribute("aria-pressed", "false");
        soundLabel.textContent = "Bật giai điệu";
        showToast("Đã tắt giai điệu.");
        return;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        showToast("Trình duyệt này chưa hỗ trợ phát giai điệu.");
        return;
      }
      audioContext = audioContext || new AudioContextClass();
      await audioContext.resume();
      playNote();
      musicTimer = setInterval(playNote, 850);
      soundToggle.setAttribute("aria-pressed", "true");
      soundLabel.textContent = "Tắt giai điệu";
      showToast("Một giai điệu nhỏ đang vang lên ♫");
    } catch (error) {
      showToast("Không thể bật giai điệu trên trình duyệt này.");
    }
  });

  let toastTimeout;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }
})();