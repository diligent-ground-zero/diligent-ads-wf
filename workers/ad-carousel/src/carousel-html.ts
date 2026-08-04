export function buildCarouselHtml(workerOrigin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ad Carousel</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .carousels {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 100%;
      transform: rotate3d(1, 1, 1, 5deg);
    }

    .carousel-wrapper {
      width: 100%;
      position: relative;
      /* clip horizontally without clipping shadows vertically */
      overflow-x: clip;
      overflow-y: visible;
      padding: 6px 0;
      mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
    }

    .carousel-track {
      display: flex;
      gap: 16px;
      will-change: transform;
    }

    .creative-card {
      flex-shrink: 0;
      width: 325px;
      height: 325px;
      border-radius: 22px;
      overflow: hidden;
      position: relative;
      background: #181818;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    }

    .creative-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .creative-card img.loaded {
      opacity: 1;
      transform: scale(1);
    }

    .creative-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.06);
      pointer-events: none;
    }

    .controls {
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shuffle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 100px;
      color: rgba(255,255,255,0.65);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      cursor: pointer;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      user-select: none;
    }

    .shuffle-btn:hover {
      background: rgba(255,255,255,0.09);
      border-color: rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.9);
    }

    .shuffle-btn:active { transform: scale(0.97); }

    .shuffle-btn.loading {
      pointer-events: none;
      opacity: 0.6;
    }

    .shuffle-btn svg { width: 13px; height: 13px; }

    .shuffle-btn.loading svg {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .carousel-track { gap: 8px; }
      .creative-card { width: 163px; height: 163px; border-radius: 11px; }
      .creative-card::after { border-radius: 11px; }
    }
  </style>
</head>
<body>
  <div class="carousels">
    <div class="carousel-wrapper">
      <div class="carousel-track" id="track1"></div>
    </div>
    <div class="carousel-wrapper">
      <div class="carousel-track" id="track2"></div>
    </div>
  </div>
  <!-- <div class="controls">
    <button class="shuffle-btn" id="shuffleBtn" aria-label="Shuffle ads">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
      </svg>
      Shuffle
    </button>
  </div> -->

  <script>
    gsap.registerPlugin(CustomEase);
    CustomEase.create("cardIn", "M0,0 C0.14,0 0.18,0.58 0.26,0.72 0.36,0.88 0.52,1.02 1,1");

    const WORKER_ORIGIN = "${workerOrigin}";
    const CARD_WIDTH = window.innerWidth <= 768 ? 171 : 341; // mobile: 163+8, desktop: 325+16
    const track1 = document.getElementById("track1");
    const track2 = document.getElementById("track2");
    // const shuffleBtn = document.getElementById("shuffleBtn");
    let tween1 = null;
    let tween2 = null;

    async function fetchAds() {
      const res = await fetch(WORKER_ORIGIN + "/api/shuffle?count=24");
      const data = await res.json();
      return data.ads || [];
    }

    function renderTrack(track, ads) {
      track.innerHTML = "";
      // Double for seamless loop
      [...ads, ...ads].forEach(ad => {
        const card = document.createElement("div");
        card.className = "creative-card";
        const img = document.createElement("img");
        img.src = ad.url;
        img.alt = "";
        img.decode().then(() => img.classList.add("loaded")).catch(() => img.classList.add("loaded"));
        card.appendChild(img);
        track.appendChild(card);
      });
    }

    function startLoops(count1, count2) {
      if (tween1) tween1.kill();
      if (tween2) tween2.kill();

      const w1 = CARD_WIDTH * count1;
      const w2 = CARD_WIDTH * count2;

      // Row 1: scroll left
      gsap.set(track1, { x: 0 });
      tween1 = gsap.to(track1, {
        x: -w1,
        duration: count1 * 5,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % w1)
        }
      });

      // Row 2: scroll right
      gsap.set(track2, { x: 0 });
      tween2 = gsap.to(track2, {
        x: w2,
        duration: count2 * 5.5,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => {
            const v = parseFloat(x) % w2;
            return -w2 + ((v + w2) % w2);
          })
        }
      });
    }

    // async function shuffleCards() {
    //   shuffleBtn.classList.add("loading");
    //   tween1 && tween1.pause();
    //   tween2 && tween2.pause();

    //   // Animate both rows out
    //   const allCards = document.querySelectorAll(".creative-card");
    //   await gsap.to(allCards, {
    //     y: 28,
    //     opacity: 0,
    //     scale: 0.95,
    //     stagger: { each: 0.025, from: "random" },
    //     duration: 0.3,
    //     ease: "power2.in"
    //   });

    //   const ads = await fetchAds();

    //   // Split ads across rows so no image appears in both
    //   const half = Math.ceil(ads.length / 2);
    //   renderTrack(track1, ads.slice(0, half));
    //   renderTrack(track2, ads.slice(half));

    //   // Animate both rows in
    //   const newCards = document.querySelectorAll(".creative-card");
    //   gsap.set(newCards, { y: -24, opacity: 0, scale: 0.96 });
    //   await gsap.to(newCards, {
    //     y: 0,
    //     opacity: 1,
    //     scale: 1,
    //     stagger: { each: 0.04, from: "start" },
    //     duration: 0.5,
    //     ease: "cardIn"
    //   });

    //   startLoops(half, ads.length - half);
    //   shuffleBtn.classList.remove("loading");
    // }

    // shuffleBtn.addEventListener("click", shuffleCards);

    // Init
    (async () => {
      const ads = await fetchAds();
      const half = Math.ceil(ads.length / 2);
      renderTrack(track1, ads.slice(0, half));
      renderTrack(track2, ads.slice(half));

      const cards = document.querySelectorAll(".creative-card");
      gsap.set(cards, { opacity: 0, y: 16 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        stagger: { each: 0.04, from: "start" },
        duration: 0.55,
        ease: "cardIn",
        onComplete: () => startLoops(half, ads.length - half)
      });
    })();
  </script>
</body>
</html>`;
}
