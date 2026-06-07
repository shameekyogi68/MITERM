import { MEMBER_DISTANCES, FUEL_LITERS } from './constants';

export interface CalculationInput {
  attendees: string[];
  petrolPrice: number;
  additionalExpenses: Array<{ type: string; amount: number }>;
}

export interface CalculationOutput {
  shares: Record<string, number>;
  finalShares: Record<string, number>;
  totalCost: number;
  fuelCost: number;
  additionalTotal: number;
  weights: Record<string, number>;
  points: Record<string, number>;
  rawShares: Record<string, number>;
  roundedFuelShares: Record<string, number>;
  roundingDifference: number;
}

function roundToNearest10(n: number): number {
  return Math.round(n / 10) * 10;
}

function sumExpenses(expenses: Array<{ amount: number }>): number {
  return expenses.reduce((acc, e) => acc + e.amount, 0);
}

export function calculateShares(input: CalculationInput): CalculationOutput {
  const { attendees, petrolPrice, additionalExpenses } = input;

  // ─── Validation ───────────────────────────────────────────────
  if (!attendees.includes('Shameek')) {
    throw new Error('Shameek must always be present in the ride.');
  }
  if (attendees.length < 2) {
    throw new Error('Minimum 2 members required.');
  }

  // ─── Step 1: Fuel cost ────────────────────────────────────────
  const fuelCost = FUEL_LITERS * petrolPrice;
  const additionalTotal = sumExpenses(additionalExpenses);
  const totalCost = fuelCost + additionalTotal;

  // ─── Step 2: Weights by scenario ─────────────────────────────
  const count = attendees.length;
  const weights: Record<string, number> = {};

  if (count === 6) {
    for (const name of attendees) {
      if (name === 'Shameek' || name === 'Shreekumar') weights[name] = 1.10;
      else if (name === 'Sathwik') weights[name] = 0.85;
      else weights[name] = 0.95;
    }
  } else if (count === 5) {
    const frontSeat = new Set(['Shameek']);
    if (attendees.includes('Shreekumar')) frontSeat.add('Shreekumar');

    for (const name of attendees) {
      weights[name] = frontSeat.has(name) ? 1.05 : 1.00;
    }
  } else {
    for (const name of attendees) {
      weights[name] = 1.00;
    }
  }

  // ─── Step 3: Points (distance × weight) ──────────────────────
  const points: Record<string, number> = {};
  let totalPoints = 0;

  for (const name of attendees) {
    const dist = MEMBER_DISTANCES[name];
    if (dist === undefined) throw new Error(`Unknown member: ${name}`);
    const pt = dist * weights[name];
    points[name] = pt;
    totalPoints += pt;
  }

  // ─── Step 4: Raw fuel shares ──────────────────────────────────
  const rawShares: Record<string, number> = {};
  for (const name of attendees) {
    rawShares[name] = fuelCost * (points[name] / totalPoints);
  }

  // ─── Step 5: Round fuel shares to nearest ₹10 ────────────────
  const roundedFuelShares: Record<string, number> = {};
  let totalRounded = 0;
  for (const name of attendees) {
    const r = roundToNearest10(rawShares[name]);
    roundedFuelShares[name] = r;
    totalRounded += r;
  }

  // ─── Step 6: Rounding adjustment → Shameek absorbs diff ──────
  const roundingDifference = fuelCost - totalRounded;
  const adjustedFuelShares = { ...roundedFuelShares };

  if (Math.abs(roundingDifference) > 20) {
    adjustedFuelShares['Shameek'] = roundedFuelShares['Shameek'] + roundingDifference;
  }

  // ─── Step 7: Additional expenses split equally ────────────────
  const perPersonAdditional =
    attendees.length > 0 ? roundToNearest10(additionalTotal / attendees.length) : 0;

  const finalShares: Record<string, number> = {};
  for (const name of attendees) {
    finalShares[name] = adjustedFuelShares[name] + perPersonAdditional;
  }

  return {
    shares: adjustedFuelShares,
    finalShares,
    totalCost,
    fuelCost,
    additionalTotal,
    weights,
    points,
    rawShares,
    roundedFuelShares,
    roundingDifference,
  };
}
