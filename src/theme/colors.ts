export const colors = {
  // Ana renkler
  primary: {
    main: '#4A90E2', // Güven verici mavi
    light: '#6AA9E9',
    dark: '#2E7BC9',
    gradient: ['#4A90E2', '#2E7BC9'],
  },
  secondary: {
    main: '#66BB6A', // Doğal yeşil
    light: '#88CB8C',
    dark: '#4C9850',
    gradient: ['#66BB6A', '#4C9850'],
  },
  accent: {
    main: '#FFA726', // Sıcak turuncu
    light: '#FFB851',
    dark: '#F57C00',
    gradient: ['#FFA726', '#F57C00'],
  },

  // Oyun renkleri (Başarı göstergeleri)
  game: {
    success: '#66BB6A', // Başarılı yardım
    error: '#EF5350', // Acil durum
    warning: '#FFB74D', // Dikkat gerektiren
    info: '#4A90E2', // Bilgilendirme
    special: '#AB47BC', // Özel başarı
  },

  // Seviye renkleri (Yardımsever seviyeleri)
  level: {
    bronze: {
      start: '#D7CCC8', // Bronz başlangıç
      end: '#BCAAA4',
      text: '#795548',
    },
    silver: {
      start: '#E0E0E0',
      end: '#BDBDBD',
      text: '#616161',
    },
    gold: {
      start: '#FFE082',
      end: '#FFD54F',
      text: '#F57F17',
    },
    platinum: {
      start: '#B2EBF2',
      end: '#80DEEA',
      text: '#006064',
    },
    diamond: {
      start: '#90CAF9',
      end: '#64B5F6',
      text: '#1565C0',
    },
  },

  // Başarı rozeti renkleri (Yardım başarıları)
  achievement: {
    locked: {
      background: '#F5F5F5',
      icon: '#BDBDBD',
      text: '#757575',
    },
    unlocked: {
      background: '#E8F5E9',
      icon: '#66BB6A',
      text: '#2E7D32',
    },
    rare: {
      background: '#E3F2FD',
      icon: '#4A90E2',
      text: '#1565C0',
    },
    epic: {
      background: '#FFF3E0',
      icon: '#FFA726',
      text: '#F57C00',
    },
    legendary: {
      background: '#F3E5F5',
      icon: '#AB47BC',
      text: '#6A1B9A',
    },
  },

  // XP ve puan renkleri (Yardım puanları)
  points: {
    xp: {
      background: '#E3F2FD',
      icon: '#4A90E2',
      text: '#1565C0',
    },
    coins: {
      background: '#FFF3E0',
      icon: '#FFA726',
      text: '#F57C00',
    },
    gems: {
      background: '#E8F5E9',
      icon: '#66BB6A',
      text: '#2E7D32',
    },
  },

  // Görev kategorileri (Yardım türleri)
  categories: {
    FEEDING: {
      background: '#FFF3E0',
      icon: '#FFA726',
      text: '#F57C00',
    },
    HEALTH: {
      background: '#FFEBEE',
      icon: '#EF5350',
      text: '#C62828',
    },
    SHELTER: {
      background: '#E3F2FD',
      icon: '#4A90E2',
      text: '#1565C0',
    },
    CLEANING: {
      background: '#E8F5E9',
      icon: '#66BB6A',
      text: '#2E7D32',
    },
    OTHER: {
      background: '#F3E5F5',
      icon: '#AB47BC',
      text: '#6A1B9A',
    },
  },

  // Görev durumları (Yardım durumları)
  status: {
    OPEN: {
      background: '#E3F2FD',
      text: '#4A90E2',
      gradient: ['#90CAF9', '#4A90E2'],
    },
    IN_PROGRESS: {
      background: '#FFF3E0',
      text: '#FFA726',
      gradient: ['#FFCC80', '#FFA726'],
    },
    COMPLETED: {
      background: '#E8F5E9',
      text: '#66BB6A',
      gradient: ['#A5D6A7', '#66BB6A'],
    },
    CANCELLED: {
      background: '#FFEBEE',
      text: '#EF5350',
      gradient: ['#EF9A9A', '#EF5350'],
    },
  },

  // Arka plan renkleri
  background: {
    primary: '#FAFAFA', // Ana arka plan
    secondary: '#FFFFFF', // İkincil arka plan
    tertiary: '#F5F5F5', // Üçüncül arka plan
    card: '#FFFFFF', // Kart arka planı
    modal: '#FFFFFF', // Modal arka planı
  },

  // Metin renkleri
  text: {
    primary: '#2C3E50', // Koyu lacivert (ana metin)
    secondary: '#34495E', // Orta lacivert (ikincil metin)
    tertiary: '#7F8C8D', // Gri (üçüncül metin)
    inverse: '#FFFFFF', // Beyaz (ters metin)
    accent: '#4A90E2', // Mavi (vurgu metni)
  },

  // Gölge ve kenarlık renkleri
  utility: {
    divider: '#ECEFF1', // Bölücü çizgi
    border: '#E3F2FD', // Kenarlık
    shadow: 'rgba(0, 0, 0, 0.1)', // Gölge
    overlay: 'rgba(0, 0, 0, 0.5)', // Kaplama
  },
}; 