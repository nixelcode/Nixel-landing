//FORM END POINT LINK=======================================

const CONFIG = {
  formEndpoint: "https://formsubmit.co/ajax/nixelcode@gmail.com",
};

//=====================================================================

const container = document.getElementById("mainContainer");
const cover = document.getElementById("cover");
const goButton = document.getElementById("goButton");
const backButton = document.getElementById("backButton");
const demosSection = document.getElementById("demosSection");
const demosHeader = document.getElementById("demosHeader");
const demosList = document.getElementById("demosList");

// 1) Cover  <->  Demos transition

let openTimeline = null;
let isOpen = false;
let coverHidesOnOpen = true;

function pauseAllVideos() {
  document.querySelectorAll(".demo--video").forEach((v) => v.pause());
}

function addDemosEntrance(tl) {
  const cards = gsap.utils.toArray(".demo--card");
  tl.from(demosHeader, { autoAlpha: 0, y: 14, duration: 0.8 }, 0.5)
    .from(demosList, { autoAlpha: 0, y: 14, duration: 0.8 }, 0.5)
    .from(
      cards,
      { autoAlpha: 0, y: 26, duration: 0.7, stagger: 0.08, ease: "power2.out" },
      0.75,
    );
}

if (window.gsap) {
  const mm = gsap.matchMedia();

  // ---------- Desktop ----------

  mm.add("(min-width: 1024px)", () => {
    coverHidesOnOpen = false;
    gsap.set(cover, { "--p": 0 });

    const tl = gsap.timeline({ paused: true });
    tl.set(demosSection, { visibility: "visible" }, 0)
      .to(cover, { "--p": 1, duration: 1.1, ease: "power3.inOut" }, 0)
      .to(goButton, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(backButton, { autoAlpha: 1, duration: 0.4 }, 0.6);
    addDemosEntrance(tl);
    openTimeline = tl;

    return () => {
      openTimeline = null;
      isOpen = false;
      cover.style.removeProperty("--p");
    };
  });

  // ---------- Tablet & Phone ----------

  mm.add("(max-width: 1023px)", () => {
    coverHidesOnOpen = true;

    const tl = gsap.timeline({ paused: true });
    tl.set(demosSection, { visibility: "visible" }, 0)
      .to(cover, { xPercent: -140, duration: 1.1, ease: "power3.inOut" }, 0)
      .to(backButton, { autoAlpha: 1, duration: 0.4 }, 0.6);
    addDemosEntrance(tl);
    openTimeline = tl;

    return () => {
      openTimeline = null;
      isOpen = false;
      cover.inert = false;
    };
  });
}

goButton.addEventListener("click", () => {
  if (!openTimeline) return;
  isOpen = true;
  openTimeline.timeScale(1).play();
  if (coverHidesOnOpen) cover.inert = true;
});

backButton.addEventListener("click", () => {
  if (!openTimeline) return;
  isOpen = false;
  pauseAllVideos();
  cover.inert = false;
  openTimeline.timeScale(2.5).reverse();
});

//2) Smooth (inertial) wheel scrolling

function enableSmoothWheel(el) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let target = 0;
  let current = 0;
  let raf = null;

  const maxScroll = () => el.scrollHeight - el.clientHeight;
  const setTop = (v) => el.scrollTo({ top: v, behavior: "instant" });

  function tick() {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      setTop(current);
      raf = null;
      return;
    }
    setTop(current);
    raf = requestAnimationFrame(tick);
  }

  el.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.deltaY === 0) return;

      const ta = e.target.closest && e.target.closest("textarea");
      if (ta && ta.scrollHeight > ta.clientHeight) {
        const atTop = ta.scrollTop <= 0 && e.deltaY < 0;
        const atBottom =
          ta.scrollTop + ta.clientHeight >= ta.scrollHeight - 1 && e.deltaY > 0;
        if (!atTop && !atBottom) return;
      }

      e.preventDefault();
      if (!raf) {
        current = el.scrollTop;
        target = current;
      }
      const unit =
        e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? el.clientHeight : 1;
      target = Math.min(Math.max(target + e.deltaY * unit, 0), maxScroll());
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: false },
  );
}

enableSmoothWheel(demosList);

//3) Demo video players (custom play / pause)

const players = [];

document.querySelectorAll(".demo--media").forEach((media) => {
  const video = media.querySelector(".demo--video");
  const playBtn = media.querySelector(".demo--play");
  const source = video.querySelector("source");
  let raf = null;

  const markEmpty = () => {
    media.classList.add("is-empty");
    media.classList.remove("is-playing");
  };

  if (source) source.addEventListener("error", markEmpty);
  video.addEventListener("error", markEmpty);
  video.addEventListener("loadedmetadata", () =>
    media.classList.remove("is-empty"),
  );

  const loop = () => {
    raf = requestAnimationFrame(loop);
  };

  video.addEventListener("play", () => {
    players.forEach((p) => p.video !== video && p.video.pause());
    media.classList.add("is-playing", "has-played");
    playBtn.setAttribute("aria-label", "توقف ویدیو");
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  });

  const onStop = () => {
    media.classList.remove("is-playing");
    playBtn.setAttribute("aria-label", "پخش ویدیو");
    cancelAnimationFrame(raf);
  };
  video.addEventListener("pause", onStop);
  video.addEventListener("ended", onStop);

  media.addEventListener("click", () => {
    if (media.classList.contains("is-empty")) return;
    if (video.paused) {
      const p = video.play();
      if (p && p.catch) p.catch(markEmpty);
    } else {
      video.pause();
    }
  });

  players.push({ video, media });
});

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          const v = entry.target.querySelector(".demo--video");
          if (v && !v.paused) v.pause();
        }
      });
    },
    { root: demosList, threshold: 0.2 },
  );
  players.forEach((p) => io.observe(p.media));
}

//4) Fullscreen mobile screenshot viewer

const viewer = document.getElementById("viewer");
const viewerScroller = document.getElementById("viewerScroller");
const viewerImage = document.getElementById("viewerImage");
const viewerTitle = document.getElementById("viewerTitle");
const viewerClose = document.getElementById("viewerClose");
const viewerProgress = document.getElementById("viewerProgress");
const viewerHint = document.getElementById("viewerHint");
const viewerFrame = viewerImage.parentElement;

let lastTrigger = null;

function openViewer(btn) {
  lastTrigger = btn;
  pauseAllVideos();

  const images = btn.dataset.image
    .split(",")
    .map((src) => src.trim())
    .filter(Boolean);

  const title = btn.dataset.title || "";

  viewerTitle.textContent = title;
  viewerScroller.scrollTo({ top: 0, behavior: "instant" });
  viewerProgress.style.transform = "scaleX(0)";
  viewerHint.classList.remove("is-hidden");

  // حذف فریم‌های اضافی قبلی
  viewerScroller
    .querySelectorAll(".viewer--extra")
    .forEach((frame) => frame.remove());

  // نمایش عکس اول
  viewerFrame.classList.remove("is-loaded");
  viewerImage.src = images[0] || "";
  viewerImage.alt = ` نسخه موبایل ${title}`;

  // ساخت فریم برای عکس‌های بعدی
  images.slice(1).forEach((src, index) => {
    const frame = document.createElement("div");
    frame.className = "viewer--frame viewer--extra";

    const loader = document.createElement("div");
    loader.className = "viewer--loader";
    loader.setAttribute("aria-hidden", "true");

    const img = document.createElement("img");
    img.alt = `${title} - تصویر ${index + 2}`;
    img.decoding = "async";

    img.addEventListener("load", () => {
      frame.classList.add("is-loaded");
    });

    img.addEventListener("error", () => {
      frame.classList.add("is-loaded");
      img.alt = "بارگذاری تصویر ناموفق بود";
    });

    frame.append(loader, img);
    viewerScroller.append(frame);

    img.src = src;
  });

  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  container.inert = true;
  viewerScroller.focus({ preventScroll: true });
}

function closeViewer() {
  if (!viewer.classList.contains("is-open")) return;
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  container.inert = false;
  if (lastTrigger) lastTrigger.focus({ preventScroll: true });
}

viewerImage.addEventListener("load", () =>
  viewerFrame.classList.add("is-loaded"),
);
viewerImage.addEventListener("error", () => {
  viewerFrame.classList.add("is-loaded");
  viewerTitle.textContent += " — بارگذاری تصویر ناموفق بود";
});

document.querySelectorAll(".demo--view").forEach((btn) => {
  btn.addEventListener("click", () => openViewer(btn));
});

viewerClose.addEventListener("click", closeViewer);

viewerScroller.addEventListener("click", (e) => {
  if (e.target === viewerScroller) closeViewer();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeViewer();
});

viewerScroller.addEventListener(
  "scroll",
  () => {
    const max = viewerScroller.scrollHeight - viewerScroller.clientHeight;
    const p = max > 0 ? viewerScroller.scrollTop / max : 0;
    viewerProgress.style.transform = `scaleX(${p})`;
    if (viewerScroller.scrollTop > 40) viewerHint.classList.add("is-hidden");
  },
  { passive: true },
);

enableSmoothWheel(viewerScroller);

//5) Contact form

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const sendBtn = form.querySelector(".send--button");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setFieldError(input, message) {
  const err = input.parentElement.querySelector(".field--error");
  err.textContent = message || "";
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function validate() {
  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  let firstBad = null;

  const check = (input, msg) => {
    setFieldError(input, msg);
    if (msg && !firstBad) firstBad = input;
  };

  check(name, name.value.trim().length < 2 ? "لطفاً نام خودت رو بنویس." : "");
  check(
    email,
    !EMAIL_RE.test(email.value.trim()) ? "یه ایمیل معتبر وارد کن." : "",
  );
  check(
    message,
    message.value.trim().length < 5 ? "پیامت رو کامل‌تر بنویس." : "",
  );

  if (firstBad) firstBad.focus();
  return !firstBad;
}

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = "form--status" + (type ? ` is-${type}` : "");
}

form.querySelectorAll("input, textarea").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.hasAttribute("aria-invalid")) setFieldError(input, "");
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  sendBtn.classList.add("is-loading");
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    form.reset();
    setStatus("پیامت ارسال شد. ممنون!", "success");
  } catch (err) {
    setStatus("ارسال نشد. لطفاً دوباره تلاش کن.", "error");
  } finally {
    sendBtn.classList.remove("is-loading");
    setStatus("", "");
  }
});

//6) Buy button

document.getElementById("buyButton").addEventListener("click", (e) => {
  const href = e.currentTarget.getAttribute("href");
  if (!href || href === "#") e.preventDefault();
});
