const DAY_LABELS: Record<string, string> = {
  monday: 'Seg',
  tuesday: 'Ter',
  wednesday: 'Qua',
  thursday: 'Qui',
  friday: 'Sex',
  saturday: 'Sáb',
  sunday: 'Dom',
};

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/** Linhas legíveis do horário de funcionamento para a vitrine pública. */
export function formatOperatingHoursSummary(
  operatingHours: unknown
): { label: string; hours: string }[] {
  if (!operatingHours || typeof operatingHours !== 'object' || Array.isArray(operatingHours)) {
    return [];
  }
  const map = operatingHours as Record<string, { open?: string; close?: string; closed?: boolean }>;
  return DAY_ORDER.map((key) => {
    const day = map[key];
    if (!day) return { label: DAY_LABELS[key], hours: '—' };
    if (day.closed) return { label: DAY_LABELS[key], hours: 'Fechado' };
    if (day.open && day.close) return { label: DAY_LABELS[key], hours: `${day.open} – ${day.close}` };
    return { label: DAY_LABELS[key], hours: '—' };
  });
}
