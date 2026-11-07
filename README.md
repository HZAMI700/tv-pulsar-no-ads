# 📺 TV Pulsar (No Ads)

An ultra-fast, modern streaming web platform for Live Sports, Global TV Channels, Movies, and TV Series with zero annoying pop-under ads.

---

## ✨ Features

- **🏆 Live Sports Center (StreamFree API)**:
  - 16:9 widescreen broadcast-style match cards with dual-team gradients and official league crests.
  - Multi-category sports filters: Soccer, Basketball (NBA), Combat (UFC/MMA), American Football (NFL), Motorsports (F1), Tennis, Hockey, Baseball, Cricket.
  - Automated multi-server testing with auto-selection of the lowest-latency live server and instant manual switcher.
  - Active pop-under & clickjacking shield.
- **🎬 Movies & Series (TMDB + VidLink Pro)**:
  - Infinite scroll catalog with live search across both movies and TV series simultaneously.
  - Automatic resume from exact timestamp and season/episode progress tracking.
  - English and original titles, genres, ratings, and cast info.
- **📡 Global TV Channels**:
  - 450+ live channels organized by country and category.
  - Direct HLS playback with instant zero-delay loading and unmuted audio by default.
- **🎨 UI / UX**:
  - Responsive mobile-first design (2-column match grid on phones).
  - Dark mode glassmorphism with smooth transitions.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Video Engine**: HLS.js + VidLink Pro + StreamFree

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/HZAMI700/tv-pulsar-no-ads.git

# Navigate to project directory
cd tv-pulsar-no-ads

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📦 Build for Production

```bash
npm run build
```

The output will be generated in `dist/`, ready to deploy directly to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
