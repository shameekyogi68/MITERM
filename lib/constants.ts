export const MEMBER_DISTANCES: Record<string, number> = {
  Shameek: 252,
  Shreekumar: 250,
  Rahul: 250,
  Sanjay: 244,
  Prashant: 236,
  Sathwik: 114,
};

export const ALL_MEMBERS = Object.keys(MEMBER_DISTANCES);

export const MILEAGE = 15;
export const ROUTE_DISTANCE = 252;
export const FUEL_LITERS = ROUTE_DISTANCE / MILEAGE; // 16.8

export const EXPENSE_TYPES = ['TOLL', 'PARKING', 'MAINTENANCE', 'FASTAG', 'OTHER'] as const;

export const OVERDUE_DAYS = 3;

export const ADMIN_PARAM = 'admin';
export const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'shameekyogi68';

export const MEMBER_WEIGHTS_6: Record<string, number> = {
  Shameek: 1.10,
  Shreekumar: 1.10,
  Rahul: 0.95,
  Sanjay: 0.95,
  Prashant: 0.95,
  Sathwik: 0.85,
};
