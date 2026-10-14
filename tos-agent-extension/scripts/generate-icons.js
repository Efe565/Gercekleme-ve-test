/**
 * ToS-Agent TR - Saf Node.js (zlib) ile Gerçek PNG İkon Üretici
 * Harici bağımlılık gerektirmeden 16x16, 48x48, 128x128 geçerli PNG dosyaları üretir.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Tablosu ve Fonksiyonu
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function generatePng(size) {
  // RGBA pikselleri (Mavi-Cyan kalkan ikonu)
  // Her satır 1 filtre baytı (0) + size * 4 bayt (R, G, B, A)
  const rowLen = 1 + size * 4;
  const rawData = Buffer.alloc(rowLen * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Merkez mesafesi (Kalkan / Daire şekli)
      const cx = (x - size / 2) / (size / 2);
      const cy = (y - size / 2) / (size / 2);
      const dist = Math.sqrt(cx * cx + cy * cy);

      if (dist <= 0.88) {
        // Gradyan: Üstte Cyan (#38bdf8), altta Koyu Mavi (#0284c7)
        const t = y / size;
        const r = Math.round(56 * (1 - t) + 2 * t);
        const g = Math.round(189 * (1 - t) + 132 * t);
        const b = Math.round(248 * (1 - t) + 199 * t);

        // Kalkanın içindeki simge efekti (merkezde beyaz parıltı)
        if (Math.abs(cx) < 0.25 && cy > -0.4 && cy < 0.4) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Şeffaf arka plan
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // PNG Başlığı
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT (Deflate ile sıkıştırılmış piksel verisi)
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Dosyaları oluştur
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const pngBuf = generatePng(size);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, pngBuf);
  console.log(`[Icon Generator] ${size}x${size} PNG ikonu üretildi -> ${filePath}`);
});
