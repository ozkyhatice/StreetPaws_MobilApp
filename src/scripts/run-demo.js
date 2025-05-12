#!/usr/bin/env node

/**
 * Bu script, demo senaryoyu çalıştırmak için kullanılır.
 * 
 * Kullanım:
 * npm run demo
 * 
 * veya
 * 
 * node src/scripts/run-demo.js
 */

const path = require('path');
const { spawnSync } = require('child_process');

console.log('🚀 Demo senaryoyu başlatılıyor...');

try {
  const result = spawnSync('ts-node', [path.join(__dirname, 'demoEmergencyScenario.ts')], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error('❌ Demo senaryosu çalıştırılırken hata oluştu:', result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`❌ Demo senaryosu hata koduyla sonlandı: ${result.status}`);
    process.exit(result.status);
  }

  console.log('✅ Demo senaryosu başarıyla tamamlandı!');
} catch (error) {
  console.error('❌ Beklenmeyen bir hata oluştu:', error);
  process.exit(1);
} 