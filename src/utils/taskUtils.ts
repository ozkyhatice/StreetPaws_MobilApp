export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return '#E8F5E9';
    case 'IN_PROGRESS':
      return '#FFF8E1';
    case 'OPEN':
      return '#FFE0E0';
    default:
      return '#E0E0E0';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'IN_PROGRESS':
      return 'Devam Ediyor';
    case 'OPEN':
      return 'Açık';
    default:
      return 'Bilinmiyor';
  }
}; 