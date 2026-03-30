// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

// Generate app icons from SVG using built-in Canvas API
// Usage: node scripts/generate-icons.js

const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const BUILD_DIR = join(__dirname, '..', 'apps', 'desktop', 'build');
mkdirSync(BUILD_DIR, { recursive: true });

// Create SVG icon - Freedom Studio bold "FS" neon text
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="outerGlow">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="blur" in2="SourceAlpha" operator="out" result="outerBlur"/>
      <feMerge>
        <feMergeNode in="outerBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="#0a0a0a"/>
  <rect width="512" height="512" rx="80" fill="none" stroke="#00ff88" stroke-width="3" stroke-opacity="0.25"/>

  <!-- FS text — bold monospace neon green -->
  <text x="256" y="310" text-anchor="middle" font-family="monospace" font-weight="900"
        font-size="240" fill="#00ff88" filter="url(#glow)" letter-spacing="-12">FS</text>

  <!-- Subtle accent line bottom -->
  <line x1="120" y1="400" x2="392" y2="400" stroke="#00ff88" stroke-width="3" opacity="0.3"/>
  <circle cx="120" y1="400" cy="400" r="4" fill="#00ff88" opacity="0.4"/>
  <circle cx="392" y1="400" cy="400" r="4" fill="#00ff88" opacity="0.4"/>
</svg>`;

writeFileSync(join(BUILD_DIR, 'icon.svg'), svgIcon);
console.log('Created icon.svg');

// Create a simple PNG using raw pixel data for BMP/ICO
// We'll create a minimal 256x256 ICO by embedding a PNG

// For the ICO, we need to use a different approach since we can't use Canvas in plain Node
// Let's create a simple BMP-based ICO

// Create a proper PNG-based ICO for crisp rendering
const { deflateSync } = require('zlib');

// Create a minimal PNG buffer from RGBA pixel data
function createPNG(width, height, rgbaData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let i = 0; i < 8; i++) k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
      table[n] = k;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(typeData), 0);
    return Buffer.concat([len, typeData, crcVal]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - filter each row with filter type 0 (None)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter type: None
    rgbaData.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = deflateSync(rawData);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    iend,
  ]);
}

function renderFSIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const cornerR = size * 0.15;

  // Higher-res letter grids for better scaling
  // F letter (7 wide, 10 tall)
  const F = [
    '1111111',
    '1111111',
    '1100000',
    '1100000',
    '1111110',
    '1111110',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
  ];
  // S letter (7 wide, 10 tall)
  const S = [
    '0111110',
    '1111111',
    '1100000',
    '1110000',
    '0111110',
    '0011111',
    '0000011',
    '0000011',
    '1111111',
    '0111110',
  ];

  const gridW = 16; // 7 + 2 gap + 7
  const gridH = 10;
  const letterGrid = [];
  for (let r = 0; r < gridH; r++) {
    letterGrid.push(F[r] + '00' + S[r]);
  }

  const textBlockW = size * 0.72;
  const textBlockH = size * 0.52;
  const cellW = textBlockW / gridW;
  const cellH = textBlockH / gridH;
  const textOffsetX = (size - textBlockW) / 2;
  const textOffsetY = (size - textBlockH) / 2;

  function isInsideRoundedRect(x, y, w, h, r) {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    if (x < r && y < r) return Math.sqrt((r - x) ** 2 + (r - y) ** 2) <= r;
    if (x >= w - r && y < r) return Math.sqrt((x - (w - r)) ** 2 + (r - y) ** 2) <= r;
    if (x < r && y >= h - r) return Math.sqrt((r - x) ** 2 + (y - (h - r)) ** 2) <= r;
    if (x >= w - r && y >= h - r) return Math.sqrt((x - (w - r)) ** 2 + (y - (h - r)) ** 2) <= r;
    return true;
  }

  // Anti-aliased edge distance for rounded rect
  function roundedRectAlpha(x, y, w, h, r) {
    if (!isInsideRoundedRect(x, y, w, h, r)) {
      // Check if we're close to the edge for anti-aliasing
      const closest = Math.min(
        x < r && y < r ? Math.sqrt((r - x) ** 2 + (r - y) ** 2) - r : 999,
        x >= w - r && y < r ? Math.sqrt((x - (w - r)) ** 2 + (r - y) ** 2) - r : 999,
        x < r && y >= h - r ? Math.sqrt((r - x) ** 2 + (y - (h - r)) ** 2) - r : 999,
        x >= w - r && y >= h - r ? Math.sqrt((x - (w - r)) ** 2 + (y - (h - r)) ** 2) - r : 999
      );
      if (closest < 1) return 1 - closest;
      return 0;
    }
    return 1;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const bgAlpha = roundedRectAlpha(x, y, size, size, cornerR);

      if (bgAlpha > 0) {
        let r = 10, g = 10, b = 10, a = Math.round(255 * bgAlpha);

        // Check text
        const tx = x - textOffsetX;
        const ty = y - textOffsetY;
        if (tx >= 0 && ty >= 0) {
          const col = Math.floor(tx / cellW);
          const row = Math.floor(ty / cellH);
          if (col < gridW && row < gridH && letterGrid[row][col] === '1') {
            // Calculate sub-pixel coverage for anti-aliasing
            const subX = (tx / cellW) - col;
            const subY = (ty / cellH) - row;
            // Slight glow at edges
            const edgeDist = Math.min(subX, 1 - subX, subY, 1 - subY);
            const brightness = edgeDist < 0.15 ? 0.8 + 0.2 * (edgeDist / 0.15) : 1;
            r = 0;
            g = Math.round(255 * brightness);
            b = Math.round(136 * brightness);
            a = Math.round(255 * bgAlpha);
          }
        }

        // Subtle border glow
        const borderInset = 1.5;
        if (bgAlpha > 0 && bgAlpha < 1) {
          r = 0; g = 100; b = 54; a = Math.round(200 * bgAlpha);
        }

        rgba[offset] = r;
        rgba[offset + 1] = g;
        rgba[offset + 2] = b;
        rgba[offset + 3] = a;
      }
    }
  }
  return rgba;
}

function createPNGICO(sizes) {
  const images = sizes.map(size => ({
    size,
    data: createPNG(size, size, renderFSIcon(size)),
  }));

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let dataOffset = headerSize + dirSize;
  const totalSize = dataOffset + images.reduce((sum, img) => sum + img.data.length, 0);
  const ico = Buffer.alloc(totalSize);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(images.length, 4);

  for (let i = 0; i < images.length; i++) {
    const dirOffset = headerSize + (i * dirEntrySize);
    const img = images[i];
    ico[dirOffset] = img.size >= 256 ? 0 : img.size;
    ico[dirOffset + 1] = img.size >= 256 ? 0 : img.size;
    ico[dirOffset + 2] = 0;
    ico[dirOffset + 3] = 0;
    ico.writeUInt16LE(1, dirOffset + 4);
    ico.writeUInt16LE(32, dirOffset + 6);
    ico.writeUInt32LE(img.data.length, dirOffset + 8);
    ico.writeUInt32LE(dataOffset, dirOffset + 12);
    img.data.copy(ico, dataOffset);
    dataOffset += img.data.length;
  }

  return ico;
}

// Generate ICO with multiple sizes (PNG-based for crisp rendering)
const ico = createPNGICO([16, 24, 32, 48, 64, 128, 256]);
writeFileSync(join(BUILD_DIR, 'icon.ico'), ico);
console.log('Created icon.ico');

// Also save individual PNGs for Linux
const linuxIconsDir = join(BUILD_DIR, 'icons');
mkdirSync(linuxIconsDir, { recursive: true });
for (const size of [16, 32, 48, 128, 256, 512]) {
  const png = createPNG(size, size, renderFSIcon(size));
  writeFileSync(join(linuxIconsDir, `${size}x${size}.png`), png);
}
writeFileSync(join(linuxIconsDir, '512x512.svg'), svgIcon);

console.log('All icons generated successfully!');
console.log(`Output: ${BUILD_DIR}`);
