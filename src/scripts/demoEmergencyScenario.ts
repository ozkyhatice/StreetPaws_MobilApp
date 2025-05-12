/**
 * Acil Durum Akışı Demo Senaryosu
 * 
 * Bu senaryo, acil durum oluşturma, göreve dönüştürme, görevin bir kullanıcı tarafından
 * üstlenilmesi, tamamlanması, onaylanması ve achievement sayısının artmasını gösteren
 * komple bir demo akışını simüle eder.
 */

import { EmergencyService, EmergencyRequest } from '../services/emergencyService';
import { TaskService } from '../services/taskService';
import { XPService } from '../services/xpService';
import { Task } from '../types/task';

// Kullanıcı verileri
const DEMO_USER = {
  id: 'demo_user_1',
  name: 'Demo Kullanıcı'
};

const ADMIN_USER = {
  id: 'admin_user_1',
  name: 'Admin Kullanıcı'
};

/**
 * Demo senaryoyu çalıştırır
 */
async function runDemo() {
  console.log('\n=== 🚨 ACİL DURUM - GÖREV AKIŞI SENARYOSU 🚨 ===\n');
  
  try {
    // Servisleri başlat
    const emergencyService = EmergencyService.getInstance();
    const taskService = TaskService.getInstance();
    const xpService = XPService.getInstance();
    
    // 1. Adım: Kategori bazlı achievement durumunu kontrol et (öncesi)
    console.log('\n🔍 ADIM 1: Önceki İstatistikleri Kontrol Et');
    const beforeStats = await xpService.getTaskProgress(DEMO_USER.id);
    console.log(`Önceki HEALTH kategorisi sayısı: ${beforeStats.currentTasksCount.HEALTH || 0}`);
    
    // 2. Adım: Acil durum oluştur
    console.log('\n📱 ADIM 2: Acil Durum Oluştur');
    const emergency: Omit<EmergencyRequest, 'id'> = {
      title: 'Yaralı Kedi Acil Yardım',
      description: 'Kadıköy meydanda yaralı bir kedi bulundu, acil veteriner yardımı gerekiyor.',
      location: 'Kadıköy Meydan, İstanbul',
      animalType: 'Kedi',
      urgency: 'high',
      contactPhone: '5551234567',
      imageUrl: 'https://picsum.photos/seed/emergency/400/300',
      userId: ADMIN_USER.id,
      userName: ADMIN_USER.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    const emergencyId = await emergencyService.createEmergencyRequest(emergency);
    console.log(`✅ Acil durum oluşturuldu: ${emergencyId}`);
    
    // İlgili görev ID'sini al (gerçek senaryoda bu veri tabanından alınır)
    const taskId = `task_${emergencyId}`;
    
    // 3. Adım: Acil durumla oluşturulan görevi göster
    console.log('\n🔍 ADIM 3: Oluşturulan Görevi Göster');
    const task = await taskService.getTask(taskId);
    if (task) {
      console.log(`Görev ID: ${task.id}`);
      console.log(`Başlık: ${task.title}`);
      console.log(`Kategori: ${task.category}`);
      console.log(`Durum: ${task.status}`);
      console.log(`XP Ödülü: ${task.xpReward}`);
    } else {
      throw new Error(`Görev bulunamadı: ${taskId}`);
    }
    
    // 4. Adım: Görevi demo kullanıcıya ata
    console.log('\n👤 ADIM 4: Görevi Kullanıcıya Ata');
    await taskService.assignTask(taskId, DEMO_USER.id);
    console.log(`✅ Görev ${DEMO_USER.name} kullanıcısına atandı`);
    
    // 5. Adım: Görevi tamamla
    console.log('\n✔️ ADIM 5: Görevi Tamamla');
    await taskService.completeTask(taskId, DEMO_USER.id, DEMO_USER.name);
    console.log(`✅ Görev ${DEMO_USER.name} tarafından tamamlandı ve onay bekliyor`);
    
    // 6. Adım: Görevi onayla
    console.log('\n👍 ADIM 6: Görevi Onayla');
    await taskService.approveTask(taskId, ADMIN_USER.id, ADMIN_USER.name);
    console.log(`✅ Görev ${ADMIN_USER.name} tarafından onaylandı`);
    
    // 7. Adım: Kategori bazlı achievement durumunu kontrol et (sonrası)
    console.log('\n🔍 ADIM 7: Güncellenmiş İstatistikleri Kontrol Et');
    const afterStats = await xpService.getTaskProgress(DEMO_USER.id);
    console.log(`Sonraki HEALTH kategorisi sayısı: ${afterStats.currentTasksCount.HEALTH || 0}`);
    
    // Sonuç göster
    console.log('\n📊 SONUÇ:');
    console.log(`HEALTH kategorisi sayısı: ${beforeStats.currentTasksCount.HEALTH || 0} => ${afterStats.currentTasksCount.HEALTH || 0}`);
    
    if (afterStats.currentTasksCount.HEALTH > beforeStats.currentTasksCount.HEALTH) {
      console.log('✅ Achievement başarıyla artırıldı!');
    } else {
      console.log('❌ Achievement artırılamadı!');
    }
    
    console.log('\n=== 🎉 SENARYO BAŞARIYLA TAMAMLANDI 🎉 ===\n');
  } catch (error) {
    console.error('❌ Senaryo çalıştırılırken hata oluştu:', error);
  }
}

// Eğer bu dosya doğrudan çalıştırılırsa, demo'yu başlat
if (require.main === module) {
  runDemo().then(() => {
    console.log('Demo tamamlandı.');
  }).catch(error => {
    console.error('Demo çalıştırılırken hata oluştu:', error);
  });
} 