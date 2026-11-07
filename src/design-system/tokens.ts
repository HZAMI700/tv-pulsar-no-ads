export const themeTokens = {
  colors: {
    // Surface & Background (Deep Space OLED)
    bgBase: '#07080D',
    bgSurface: '#0E1018',
    bgElevated: '#151722',
    bgGlass: 'rgba(14, 16, 24, 0.78)',
    bgGlassHover: 'rgba(24, 27, 39, 0.88)',
    bgGlassActive: 'rgba(32, 36, 52, 0.95)',

    // Borders & Separators
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.16)',
    borderHover: 'rgba(255, 255, 255, 0.28)',
    borderPrimaryGlow: 'rgba(255, 24, 56, 0.45)',

    // Accents (TOD TV Brand Crimson)
    primary: '#FF1838',
    primaryHover: '#FF3853',
    primaryGlow: 'rgba(255, 24, 56, 0.38)',
    primaryGradient: 'linear-gradient(135deg, #FF1838 0%, #E00624 100%)',
    heroGradient: 'linear-gradient(to top, #07080D 0%, rgba(7, 8, 13, 0.85) 45%, rgba(7, 8, 13, 0.2) 100%)',
    heroSideGradient: 'linear-gradient(to right, #07080D 0%, rgba(7, 8, 13, 0.6) 40%, transparent 100%)',

    // Functional & Meta Badges
    liveGreen: '#00E676',
    liveGreenGlow: 'rgba(0, 230, 118, 0.4)',
    gold: '#FFB800',
    goldGlow: 'rgba(255, 184, 0, 0.35)',
    tech4k: '#00F2FE',
    tech4kGlow: 'rgba(0, 242, 254, 0.35)',
    spoilerMask: 'rgba(7, 8, 13, 0.92)',

    // Text & Content
    textPrimary: '#FFFFFF',
    textSecondary: '#A2A7B8',
    textMuted: '#646A80',
    textInverse: '#07080D',
  },
  typography: {
    fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Cairo", Inter, Roboto, sans-serif',
    fontDisplay: '"Cabinet Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  animation: {
    easeSpring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeSmooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    durationFast: '150ms',
    durationNormal: '250ms',
    durationSlow: '450ms',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  shadows: {
    card: '0 8px 24px rgba(0, 0, 0, 0.45)',
    cardHover: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 24, 56, 0.15)',
    glowPrimary: '0 0 25px rgba(255, 24, 56, 0.5)',
    glowGreen: '0 0 20px rgba(0, 230, 118, 0.5)',
  },
};
