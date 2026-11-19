/**
 * Business hours calculation for Pizzaria do Chefinho
 * Horário: Quinta a Domingo, das 18:00 às 23:00 (Fuso horário de Rio Branco/AC, UTC-5)
 */

export interface BusinessStatus {
  isOpen: boolean;
  timeString: string;
  dayName: string;
  statusText: string;
  statusDetail: string;
  operatingDays: string;
  operatingHours: string;
}

// In-memory override for testing orders outside standard hours
let overrideOpenStatus: boolean | null = null;

export function setOperatingHoursOverride(open: boolean | null) {
  overrideOpenStatus = open;
}

export function getOperatingHoursOverride(): boolean | null {
  return overrideOpenStatus;
}

export function getRioBrancoDate(): Date {
  // Convert current UTC time to Rio Branco (America/Rio_Branco, UTC-5)
  const now = new Date();
  const rioBrancoString = now.toLocaleString('en-US', { timeZone: 'America/Rio_Branco' });
  return new Date(rioBrancoString);
}

export function checkBusinessHours(): BusinessStatus {
  const rioBrancoDate = getRioBrancoDate();
  const dayOfWeek = rioBrancoDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 4 = Quinta, 5 = Sexta, 6 = Sábado
  const hours = rioBrancoDate.getHours();
  const minutes = rioBrancoDate.getMinutes();
  const currentTimeVal = hours * 60 + minutes;

  const openTimeVal = 18 * 60; // 18:00
  const closeTimeVal = 23 * 60; // 23:00

  // Operating days: Quinta (4), Sexta (5), Sábado (6), Domingo (0)
  const isOperatingDay = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  const isWithinHours = currentTimeVal >= openTimeVal && currentTimeVal < closeTimeVal;

  let naturallyOpen = isOperatingDay && isWithinHours;

  const isOpen = overrideOpenStatus !== null ? overrideOpenStatus : naturallyOpen;

  const dayNamesPt = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const currentDayName = dayNamesPt[dayOfWeek];
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  let statusDetail = '';
  if (isOpen) {
    const minutesLeft = closeTimeVal - currentTimeVal;
    if (minutesLeft > 0 && minutesLeft <= 60 && overrideOpenStatus === null) {
      statusDetail = `Fecha em ${minutesLeft} min (às 23:00)`;
    } else {
      statusDetail = 'Até as 23:00 · Forno a lenha a todo vapor!';
    }
  } else {
    if (isOperatingDay && currentTimeVal < openTimeVal) {
      statusDetail = 'Abre hoje às 18:00';
    } else if (dayOfWeek === 3) {
      statusDetail = 'Abre amanhã (Quinta) às 18:00';
    } else {
      statusDetail = 'Abre Quinta-feira às 18:00';
    }
  }

  return {
    isOpen,
    timeString: timeFormatted,
    dayName: currentDayName,
    statusText: isOpen ? 'Aberto Agora' : 'Fechado Agora',
    statusDetail,
    operatingDays: 'Quinta a Domingo',
    operatingHours: '18:00 às 23:00 (Rio Branco/AC)',
  };
}
