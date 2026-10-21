// Official Logo for Dr. Heba El Shawarbi Pharmacy
// Rendered as an optimized, responsive vector SVG data URL & component for crisp display at any scale

export const PHARMACY_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <!-- Background and Ring Gradients -->
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a4ea3" />
      <stop offset="50%" stop-color="#0755b8" />
      <stop offset="100%" stop-color="#053b82" />
    </linearGradient>

    <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3385" />
      <stop offset="100%" stop-color="#d8085b" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5d77f" />
      <stop offset="50%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#aa8012" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0755b8" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Outer Protective Glow and Border -->
  <circle cx="250" cy="250" r="240" fill="#ffffff" stroke="url(#goldGrad)" stroke-width="4" filter="url(#shadow)"/>
  
  <!-- Outer Deep Blue Border Ring -->
  <circle cx="250" cy="250" r="230" fill="none" stroke="url(#blueGrad)" stroke-width="12" />
  
  <!-- Inner Pink Accent Ring -->
  <circle cx="250" cy="250" r="218" fill="none" stroke="url(#pinkGrad)" stroke-width="3" stroke-dasharray="6,4" />

  <!-- Inner Circle Background -->
  <circle cx="250" cy="250" r="208" fill="#f8fbff" />

  <!-- Subtle Medical Cross in Background -->
  <g opacity="0.08">
    <rect x="220" y="80" width="60" height="340" rx="14" fill="#0755b8" />
    <rect x="80" y="220" width="340" height="60" rx="14" fill="#0755b8" />
  </g>

  <!-- Circular Text Paths -->
  <path id="textArcTop" d="M 70,250 A 180,180 0 0,1 430,250" fill="none" />
  <path id="textArcBottom" d="M 430,250 A 180,180 0 0,1 70,250" fill="none" />

  <!-- Top Arabic Text -->
  <text font-family="'Cairo', 'Segoe UI', Tahoma, sans-serif" font-size="28" font-weight="900" fill="#0755b8" letter-spacing="1">
    <textPath href="#textArcTop" startOffset="50%" text-anchor="middle">
      صيدلية د. هبه الشواربي
    </textPath>
  </text>

  <!-- Bottom English Text -->
  <text font-family="'Cairo', 'Segoe UI', Arial, sans-serif" font-size="19" font-weight="800" fill="#f20c69" letter-spacing="2.5">
    <textPath href="#textArcBottom" startOffset="50%" text-anchor="middle">
      EL SHAWARBI PHARMACY
    </textPath>
  </text>

  <!-- Side Star Emblems -->
  <g fill="url(#goldGrad)">
    <!-- Right Star -->
    <polygon points="432,250 435,242 443,242 437,247 439,255 432,251 425,255 427,247 421,242 429,242" />
    <!-- Left Star -->
    <polygon points="68,250 71,242 79,242 73,247 75,255 68,251 61,255 63,247 57,242 65,242" />
  </g>

  <!-- Center Emblem: Bowl of Hygieia (Chalice + Snake) with Modern Clinical Precision -->
  <g transform="translate(250, 252)">
    <!-- Glow behind chalice -->
    <circle cx="0" cy="-5" r="75" fill="#ffffff" filter="url(#shadow)" opacity="0.9" />

    <!-- Chalice / Cup of Healing -->
    <!-- Base Foot -->
    <path d="M -42,76 C -30,68 30,68 42,76 L 38,84 C 20,86 -20,86 -38,84 Z" fill="url(#blueGrad)" />
    <!-- Stem -->
    <path d="M -8,25 L 8,25 L 6,70 L -6,70 Z" fill="url(#blueGrad)" />
    <!-- Stem Accent Ring -->
    <rect x="-14" y="45" width="28" height="6" rx="3" fill="url(#goldGrad)" />
    
    <!-- Cup Body (Chalice) -->
    <path d="M -60,-25 C -58,25 -22,30 0,30 C 22,30 58,25 60,-25 C 40,-18 20,-15 0,-15 C -20,-15 -40,-18 -60,-25 Z" fill="url(#blueGrad)" />
    <!-- Cup Rim Highlight -->
    <ellipse cx="0" cy="-25" rx="60" ry="11" fill="#0c63d4" stroke="url(#goldGrad)" stroke-width="2.5" />
    <ellipse cx="0" cy="-25" rx="52" ry="7" fill="#ffffff" opacity="0.25" />

    <!-- Golden Medicinal Cross Emblem inside Chalice -->
    <g transform="translate(0, 0) scale(0.65)">
      <rect x="-7" y="-22" width="14" height="44" rx="4" fill="url(#pinkGrad)" />
      <rect x="-22" y="-7" width="44" height="14" rx="4" fill="url(#pinkGrad)" />
      <circle cx="0" cy="0" r="4" fill="#ffffff" />
    </g>

    <!-- Serpent of Healing (Asclepius / Hygieia Snake) -->
    <!-- Snake Body coiled around stem and rising above rim -->
    <path d="
      M -20,72
      C -36,60 -25,40 -5,44
      C 20,48 24,25 0,22
      C -26,18 -30,-5 -15,-20
      C -5,-30 20,-35 32,-48
      C 40,-58 28,-72 10,-72
      C -8,-72 -18,-62 -14,-50
      C -11,-42 2,-42 2,-48
      C 2,-55 -8,-58 -10,-55
    " fill="none" stroke="url(#goldGrad)" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Snake Head reaching over the cup -->
    <g transform="translate(-14, -54) rotate(-35)">
      <!-- Head shape -->
      <path d="M 0,0 C 4,-7 14,-7 16,0 C 14,8 4,8 0,0 Z" fill="url(#goldGrad)" />
      <!-- Snake Eye -->
      <circle cx="11" cy="-1.5" r="1.5" fill="#0755b8" />
      <!-- Flickering Tongue -->
      <path d="M 16,0 L 22,-2 M 22,-2 L 25,-4 M 22,-2 L 25,0" fill="none" stroke="#f20c69" stroke-width="1.2" stroke-linecap="round" />
    </g>
  </g>
</svg>`;

// Base64 Data URL for use in <img src="..." /> and favicons
export const DEFAULT_PHARMACY_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(PHARMACY_LOGO_SVG)}`;
