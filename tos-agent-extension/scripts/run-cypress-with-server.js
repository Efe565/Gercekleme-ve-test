/**
 * ToS-Agent TR - Sunucu Başlatıcı ve Cypress Otomasyon Betiği
 * 1. Test sunucusunu ayağa kaldırır
 * 2. Cypress E2E testlerini çalıştırır (ve videoyu kaydeder)
 * 3. Video çıktısını doğrular ve sunucuyu kapatır.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const server = require('./serve-test-pages');

console.log('[E2E Runner] Test sunucusu hazır, Cypress başlatılıyor...\n');

const isWindows = process.platform === 'win32';
const cypressCmd = isWindows ? 'npx.cmd' : 'npx';

const cypressProcess = spawn(cypressCmd, ['cypress', 'run', '--spec', 'cypress/e2e/tos_agent_demo.cy.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

cypressProcess.on('close', (code) => {
  console.log(`\n[E2E Runner] Cypress ${code === 0 ? 'BAŞARIYLA' : 'HATAYLA'} tamamlandı (Çıkış Kodu: ${code})`);

  // Video dosyasını kontrol et
  const videoDir = path.join(__dirname, '..', 'cypress', 'videos');
  if (fs.existsSync(videoDir)) {
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      console.log(`\n===============================================================`);
      console.log(`   🎬 CYPRESS DEMO VİDEOSU BAŞARIYLA KAYDEDİLDİ:             `);
      videoFiles.forEach(v => {
        const fullPath = path.join(videoDir, v);
        const stats = fs.statSync(fullPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   - ${v} (${sizeMb} MB)`);
        console.log(`   - Yol: ${fullPath}`);
      });
      console.log(`   - İster: ≤ 90 sn (Mutlu Yol + Dürüst Belirsizlik + Savunma)`);
      console.log(`===============================================================\n`);
    }
  }

  // Sunucuyu kapat
  server.close(() => {
    console.log('[E2E Runner] Test sunucusu kapatıldı.');
    process.exit(code);
  });
});
