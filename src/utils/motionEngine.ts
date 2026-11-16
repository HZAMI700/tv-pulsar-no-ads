/**
 * PULSAR Motion Engine
 * Analytical Damped Harmonic Oscillator + Deterministic Timeline
 */

export function spring(
  t: number,
  stiffness = 240,
  damping = 22,
  mass = 1
): number {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * w0 * t) *
        (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
    );
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

export const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export interface PulsarTimelineSelectors {
  screens?: (HTMLElement | null)[];
  bottomTabs?: (HTMLElement | null)[];
  topNavItems?: (HTMLElement | null)[];
  heroArtwork?: HTMLElement | null;
  playButton?: HTMLElement | null;
  channelCards?: NodeListOf<HTMLElement> | HTMLElement[];
  matchCards?: NodeListOf<HTMLElement> | HTMLElement[];
  downloadCards?: NodeListOf<HTMLElement> | HTMLElement[];
  storageFill?: HTMLElement | null;
  favoriteCard?: HTMLElement | null;
  touchCursor?: HTMLElement | null;
}

/**
 * Deterministic frame evaluator for Playwright + FFmpeg capture
 * Call window.seek(t) for any timestamp t in [0, 10] seconds
 */
export function createPulsarTimeline(selectors: PulsarTimelineSelectors) {
  const {
    screens = [],
    bottomTabs = [],
    topNavItems = [],
    heroArtwork,
    playButton,
    channelCards,
    matchCards,
    downloadCards,
    storageFill,
    favoriteCard,
    touchCursor,
  } = selectors;

  const TAB_SWITCH_TIMES = [0.0, 2.0, 4.2, 6.4, 8.2];

  function seek(t: number) {
    // 1. Determine active screen index
    let activeIdx = 0;
    for (let i = 0; i < TAB_SWITCH_TIMES.length; i++) {
      if (t >= TAB_SWITCH_TIMES[i]) activeIdx = i;
    }

    // 2. Screen transitions (RTL horizontal slide + spring scale)
    screens.forEach((screen, idx) => {
      if (!screen) return;
      const enterStart = TAB_SWITCH_TIMES[idx];

      if (idx === activeIdx) {
        const s = idx === 0 ? 1 : spring(t - enterStart, 260, 24);
        const translateX = (1 - s) * -36; // RTL slide from left
        const scale = lerp(0.96, 1, s);
        screen.style.opacity = `${clamp(s * 1.4, 0, 1)}`;
        screen.style.transform = `translate3d(${translateX}px, 0, 0) scale(${scale})`;
        screen.style.pointerEvents = 'auto';
      } else if (idx === activeIdx - 1 && t - TAB_SWITCH_TIMES[activeIdx] < 0.45) {
        const exitS = spring(t - TAB_SWITCH_TIMES[activeIdx], 260, 26);
        screen.style.opacity = `${clamp(1 - exitS * 1.6, 0, 1)}`;
        screen.style.transform = `translate3d(${exitS * 28}px, 0, 0) scale(${lerp(1, 0.96, exitS)})`;
        screen.style.pointerEvents = 'none';
      } else {
        screen.style.opacity = '0';
        screen.style.pointerEvents = 'none';
      }
    });

    // 3. Bottom navigation & top bar highlight sync
    bottomTabs.forEach((tab, idx) => {
      if (!tab) return;
      const isActive = idx === activeIdx;
      const bounce = isActive ? spring(t - TAB_SWITCH_TIMES[idx], 380, 18) : 0;
      tab.classList.toggle('is-active', isActive);
      tab.style.transform = isActive
        ? `translate3d(0, ${-3 * Math.sin(bounce * Math.PI)}px, 0) scale(${lerp(1, 1.08, bounce)})`
        : 'translate3d(0, 0, 0) scale(1)';
    });

    // 4. Home Hero ("VISIONQUEST") breathing zoom + "تشغيل" tactile press (t = 1.1s)
    if (heroArtwork) {
      const ambientZoom = 1 + 0.03 * Math.sin(t * 0.9);
      heroArtwork.style.transform = `scale(${ambientZoom})`;
    }
    if (playButton) {
      const pressDown = spring(t - 1.1, 450, 22);
      const pressUp = spring(t - 1.32, 320, 18);
      const scale = 1 - 0.07 * pressDown + 0.07 * pressUp;
      playButton.style.transform = `scale(${scale})`;
    }

    // 5. Staggered Channel Cards (beIN SPORTS AR 1–7, t >= 2.0s)
    if (channelCards) {
      const arr = Array.from(channelCards);
      arr.forEach((card, i) => {
        if (!card) return;
        const localT = t - (2.05 + i * 0.065);
        const s = spring(localT, 250, 22);
        card.style.opacity = `${clamp(s * 1.5, 0, 1)}`;
        card.style.transform = `translate3d(0, ${(1 - s) * 28}px, 0) scale(${lerp(0.94, 1, s)})`;
      });
    }

    // 6. Staggered UEFA Nations League Match Cards (t >= 4.2s)
    if (matchCards) {
      const arr = Array.from(matchCards);
      arr.forEach((card, i) => {
        if (!card) return;
        const localT = t - (4.25 + i * 0.06);
        const s = spring(localT, 270, 23);
        card.style.opacity = `${clamp(s * 1.5, 0, 1)}`;
        card.style.transform = `translate3d(0, ${(1 - s) * 26}px, 0) scale(${lerp(0.95, 1, s)})`;
      });
    }

    // 7. Downloads Storage Bar ("21.7GB available") + Episode Cards (t >= 6.4s)
    if (storageFill) {
      const barS = spring(t - 6.45, 180, 24);
      storageFill.style.transform = `scaleX(${clamp(barS, 0, 1)})`;
    }
    if (downloadCards) {
      const arr = Array.from(downloadCards);
      arr.forEach((card, i) => {
        if (!card) return;
        const localT = t - (6.5 + i * 0.09);
        const s = spring(localT, 240, 22);
        card.style.opacity = `${clamp(s * 1.5, 0, 1)}`;
        card.style.transform = `translate3d(${(1 - s) * -24}px, 0, 0)`;
      });
    }

    // 8. Settings & Favorites Card (t >= 8.2s)
    if (favoriteCard) {
      const favS = spring(t - 8.3, 250, 21);
      favoriteCard.style.opacity = `${clamp(favS * 1.5, 0, 1)}`;
      favoriteCard.style.transform = `translate3d(0, ${(1 - favS) * 22}px, 0) scale(${lerp(0.96, 1, favS)})`;
    }

    // 9. Synthetic Touch Cursor if provided
    if (touchCursor) {
      touchCursor.style.opacity = t > 0.5 && t < 9.5 ? '1' : '0';
    }
  }

  if (typeof window !== 'undefined') {
    (window as any).seek = seek;
  }

  return { seek };
}
