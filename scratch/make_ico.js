const fs = require('fs');

// Create a valid 32x32 32-bit RGBA ICO file in pure Node.js
function createIcoBuffer(width, height) {
  const numColors = 0; // 256 or 0 for 32bit
  const bpp = 32;
  const imageSize = width * height * 4 + 40 + (width * height / 8); // RGBA pixel array + BITMAPINFOHEADER + AND mask
  const headerSize = 6 + 16; // ICONDIR (6) + ICONDIRENTRY (16)
  const totalSize = headerSize + imageSize;

  const buf = Buffer.alloc(totalSize);

  // --- ICONDIR ---
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type 1 = ICO
  buf.writeUInt16LE(1, 4); // 1 image

  // --- ICONDIRENTRY ---
  buf.writeUInt8(width, 6);        // Width (32)
  buf.writeUInt8(height, 7);       // Height (32)
  buf.writeUInt8(numColors, 8);    // Color count
  buf.writeUInt8(0, 9);            // Reserved
  buf.writeUInt16LE(1, 10);        // Color planes
  buf.writeUInt16LE(bpp, 12);      // Bits per pixel (32)
  buf.writeUInt32LE(imageSize, 14); // Size of image data
  buf.writeUInt32LE(headerSize, 18); // Offset to image data

  // --- BITMAPINFOHEADER ---
  const bmpOffset = headerSize;
  buf.writeUInt32LE(40, bmpOffset + 0);       // biSize
  buf.writeInt32LE(width, bmpOffset + 4);      // biWidth
  buf.writeInt32LE(height * 2, bmpOffset + 8); // biHeight (double height for XOR + AND masks)
  buf.writeUInt16LE(1, bmpOffset + 12);       // biPlanes
  buf.writeUInt16LE(bpp, bmpOffset + 14);     // biBitCount
  buf.writeUInt32LE(0, bmpOffset + 16);       // biCompression (BI_RGB)
  buf.writeUInt32LE(imageSize - 40, bmpOffset + 20); // biSizeImage

  // --- PIXELS (Rotera Roundtable Theme: Deep Navy BG #14213D, Verdigris Ring #2F6E62, Brass Top Node #C9973C) ---
  const pixelOffset = bmpOffset + 40;
  const cx = 15.5;
  const cy = 15.5;
  const outerR2 = 12 * 12;
  const innerR2 = 8 * 8;

  // ICO pixels are stored bottom-to-top
  for (let y = 0; y < height; y++) {
    const py = height - 1 - y; // flip y
    for (let x = 0; x < width; x++) {
      const idx = pixelOffset + (y * width + x) * 4;
      const dx = x - cx;
      const dy = py - cy;
      const dist2 = dx * dx + dy * dy;

      // Check for top node (brass #C9973C) around (15.5, 5.5)
      const nodeDx = x - 15.5;
      const nodeDy = py - 5.5;
      const nodeDist2 = nodeDx * nodeDx + nodeDy * nodeDy;

      if (nodeDist2 <= 3.5 * 3.5) {
        // Brass gold node: #C9973C (BGRA)
        buf.writeUInt8(0x3C, idx + 0); // B
        buf.writeUInt8(0x97, idx + 1); // G
        buf.writeUInt8(0xC9, idx + 2); // R
        buf.writeUInt8(0xFF, idx + 3); // A
      } else if (dist2 <= outerR2 && dist2 >= innerR2) {
        // Verdigris ring: #2F6E62 (BGRA)
        buf.writeUInt8(0x62, idx + 0); // B
        buf.writeUInt8(0x9E, idx + 1); // G
        buf.writeUInt8(0x2F, idx + 2); // R
        buf.writeUInt8(0xFF, idx + 3); // A
      } else if (dist2 <= 15 * 15) {
        // Dark navy background: #14213D (BGRA)
        buf.writeUInt8(0x3D, idx + 0); // B
        buf.writeUInt8(0x21, idx + 1); // G
        buf.writeUInt8(0x14, idx + 2); // R
        buf.writeUInt8(0xFF, idx + 3); // A
      } else {
        // Transparent outside circle
        buf.writeUInt8(0, idx + 0);
        buf.writeUInt8(0, idx + 1);
        buf.writeUInt8(0, idx + 2);
        buf.writeUInt8(0, idx + 3);
      }
    }
  }

  return buf;
}

const icoBuf = createIcoBuffer(32, 32);
fs.writeFileSync('public/favicon.ico', icoBuf);
console.log('Valid Rotera binary favicon.ico generated! Size:', icoBuf.length, 'bytes');
