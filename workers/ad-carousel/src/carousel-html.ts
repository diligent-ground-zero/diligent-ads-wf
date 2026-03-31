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
      background: #080808;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .carousel-wrapper {
      width: 100%;
      position: relative;
      overflow: hidden;
      padding: 28px 0;
      mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    }

    .carousel-track {
      display: flex;
      gap: 20px;
      will-change: transform;
    }

    .ad-card {
      flex-shrink: 0;
      width: 300px;
      height: 300px;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      background: #181818;
      box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8);
    }

    .ad-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .ad-card img.loaded {
      opacity: 1;
      transform: scale(1);
    }

    .ad-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.07);
      pointer-events: none;
    }

    .controls {
      margin-top: 24px;
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

    .shuffle-btn:active {
      transform: scale(0.97);
    }

    .shuffle-btn.loading {
      pointer-events: none;
      opacity: 0.6;
    }

    .shuffle-btn svg {
      width: 13px;
      height: 13px;
    }

    .shuffle-btn.loading svg {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="carousel-wrapper">
    <div class="carousel-track" id="track"></div>
  </div>
  <div class="controls">
    <button class="shuffle-btn" id="shuffleBtn" aria-label="Shuffle ads">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 3 21 3 21 8"></polyline>
        <line x1="4" y1="20" x2="21" y2="3"></line>
        <polyline points="21 16 21 21 16 21"></polyline>
        <line x1="15" y1="15" x2="21" y2="21"></line>
      </svg>
      Shuffle
    </button>
  </div>

  <script>
    gsap.registerPlugin(CustomEase);

    CustomEase.create("glide", "M0,0 C0.11,0 0.16,0.36 0.21,0.5 0.28,0.68 0.34,0.87 0.4,0.96 0.48,1.06 0.6,1.01 1,1");
    CustomEase.create("cardIn", "M0,0 C0.14,0 0.18,0.58 0.26,0.72 0.36,0.88 0.52,1.02 1,1");

    const WORKER_ORIGIN = "${workerOrigin}";
    const CARD_WIDTH = 320;
    const track = document.getElementById("track");
    const shuffleBtn = document.getElementById("shuffleBtn");
    let loopTween = null;

    async function fetchAds() {
      const res = await fetch(WORKER_ORIGIN + "/api/shuffle?count=12");
      const data = await res.json();
      return data.ads || [];
    }

    function renderCards(ads, doubled = true) {
      track.innerHTML = "";
      const items = doubled ? [...ads, ...ads] : ads;
      items.forEach(ad => {
        const card = document.createElement("div");
        card.className = "ad-card";
        const img = document.createElement("img");
        img.src = ad.url;
        img.alt = "";
        img.decode().then(() => img.classList.add("loaded")).catch(() => img.classList.add("loaded"));
        card.appendChild(img);
        track.appendChild(card);
      });
    }

    function startLoop(adCount) {
      if (loopTween) loopTween.kill();
      const totalWidth = CARD_WIDTH * adCount;
      gsap.set(track, { x: 0 });
      loopTween = gsap.to(track, {
        x: -totalWidth,
        duration: adCount * 3.5,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % totalWidth)
        }
      });
    }

    async function shuffleCards() {
      shuffleBtn.classList.add("loading");
      if (loopTween) loopTween.pause();

      const cards = track.querySelectorAll(".ad-card");
      await gsap.to(cards, {
        y: 32,
        opacity: 0,
        scale: 0.95,
        stagger: { each: 0.035, from: "random" },
        duration: 0.3,
        ease: "power2.in"
      });

      const ads = await fetchAds();
      renderCards(ads, true);

      const newCards = track.querySelectorAll(".ad-card");
      gsap.set(newCards, { y: -28, opacity: 0, scale: 0.96 });
      await gsap.to(newCards, {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: { each: 0.055, from: "start" },
        duration: 0.55,
        ease: "cardIn"
      });

      startLoop(ads.length);
      shuffleBtn.classList.remove("loading");
    }

    shuffleBtn.addEventListener("click", shuffleCards);

    (async () => {
      const ads = await fetchAds();
      renderCards(ads, true);
      const cards = track.querySelectorAll(".ad-card");
      gsap.set(cards, { opacity: 0, y: 20 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        stagger: { each: 0.06, from: "start" },
        duration: 0.6,
        ease: "cardIn",
        onComplete: () => startLoop(ads.length)
      });
    })();
  </script>
</body>
</html>`;
}
