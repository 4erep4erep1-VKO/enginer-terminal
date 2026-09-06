/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaintenanceRecord } from '../types';

export type FluidKey = 'engine_oil' | 'brake_fluid' | 'coolant' | 'transmission_oil';

export interface FluidPreset {
  key: FluidKey;
  name: string;
  nameRu: string;
  shortName: string;
  maxKm: number;
  maxDays: number;
  description: string;
  category: string;
}

/**
 * Default resource intervals if not customized by user:
 * • Моторное масло: 7 500 км / 365 дней (1 год)
 * • Тормозная жидкость: 40 000 км / 730 дней (2 года)
 * • Антифриз: 60 000 км / 1095 дней (3 года)
 * • Масло КПП: 60 000 км / 1460 дней (4 года)
 */
export const DEFAULT_FLUID_PRESETS: Record<FluidKey, FluidPreset> = {
  engine_oil: {
    key: 'engine_oil',
    name: 'Engine Oil',
    nameRu: 'Моторное масло',
    shortName: 'Масло ДВС',
    maxKm: 7500,
    maxDays: 365,
    description: 'Регламентная смазка ДВС и защита от нагара',
    category: 'Oil & Fluids',
  },
  brake_fluid: {
    key: 'brake_fluid',
    name: 'Brake Fluid',
    nameRu: 'Тормозная жидкость',
    shortName: 'Тормозная жидк.',
    maxKm: 40000,
    maxDays: 730,
    description: 'Гигроскопичная жидкость контура тормозов (DOT 4 / 5.1)',
    category: 'Brakes',
  },
  coolant: {
    key: 'coolant',
    name: 'Coolant',
    nameRu: 'Антифриз (ОЖ)',
    shortName: 'Антифриз',
    maxKm: 60000,
    maxDays: 1095,
    description: 'Теплоноситель радиатора и ингибитор коррозии',
    category: 'Oil & Fluids',
  },
  transmission_oil: {
    key: 'transmission_oil',
    name: 'Transmission Oil',
    nameRu: 'Масло КПП',
    shortName: 'Масло КПП',
    maxKm: 60000,
    maxDays: 1460,
    description: 'Смазка зубчатых передач коробки, раздатки или редуктора',
    category: 'Transmission',
  },
};

export type FluidStatusLevel = 'normal' | 'replace_due' | 'critical';

export interface FluidHealthCalculation {
  fluidKey: FluidKey;
  nameRu: string;
  shortName: string;
  currentKm: number;
  lastServicedKm: number;
  lastServicedDate: string | null;
  kmPassed: number;
  daysPassed: number;
  maxKm: number;
  maxDays: number;
  kmPercent: number;
  daysPercent: number;
  totalWearPercent: number;
  remainingHealth: number; // 0..100
  statusLevel: FluidStatusLevel; // >30%: 'normal', 10..30%: 'replace_due', <10%: 'critical'
  statusText: string; // "В норме" | "Требуется замена (Срок/Пробег)" | "Критический износ / Потеря свойств"
  limitingFactor: 'km' | 'days' | 'both_zero';
  wearReasonText: string | null; // e.g. "(Старение по времени: > 365 дней)"
  hasServiceRecord: boolean;
  isTimeExceeded: boolean;
  isKmExceeded: boolean;
}

/**
 * Pure calculation of fluid wear according to Dual-Limit model:
 * kmPercent = ((currentKm - lastServicedKm) / maxKm) * 100;
 * daysPercent = ((currentDate - lastServicedDateInDays) / maxDays) * 100;
 * totalWearPercent = Math.min(100, Math.max(kmPercent, daysPercent));
 * remainingHealth = 100 - totalWearPercent;
 */
export function calculateFluidWear({
  currentKm,
  lastServicedKm,
  lastServicedDate,
  maxKm,
  maxDays,
  referenceDate = new Date(),
}: {
  currentKm: number;
  lastServicedKm: number;
  lastServicedDate: string | Date | null;
  maxKm: number;
  maxDays: number;
  referenceDate?: Date;
}): {
  kmPassed: number;
  daysPassed: number;
  kmPercent: number;
  daysPercent: number;
  totalWearPercent: number;
  remainingHealth: number;
  isTimeExceeded: boolean;
  isKmExceeded: boolean;
  limitingFactor: 'km' | 'days' | 'both_zero';
  wearReasonText: string | null;
} {
  const safeCurrentKm = Math.max(0, currentKm || 0);
  const safeLastKm = Math.max(0, lastServicedKm || 0);
  const safeMaxKm = Math.max(1, maxKm || 7500);
  const safeMaxDays = Math.max(1, maxDays || 365);

  const kmPassed = Math.max(0, safeCurrentKm - safeLastKm);
  const kmPercent = (kmPassed / safeMaxKm) * 100;

  let daysPassed = 0;
  if (lastServicedDate) {
    const parsedDate = typeof lastServicedDate === 'string' ? new Date(lastServicedDate) : lastServicedDate;
    if (!isNaN(parsedDate.getTime())) {
      const diffMs = Math.max(0, referenceDate.getTime() - parsedDate.getTime());
      daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }

  const daysPercent = (daysPassed / safeMaxDays) * 100;
  const rawMaxWear = Math.max(kmPercent, daysPercent);
  const totalWearPercent = Math.min(100, Math.max(0, rawMaxWear));
  const remainingHealth = Math.round(Math.max(0, 100 - totalWearPercent));

  const isTimeExceeded = daysPassed > safeMaxDays;
  const isKmExceeded = kmPassed > safeMaxKm;

  let limitingFactor: 'km' | 'days' | 'both_zero' = 'km';
  if (kmPercent === 0 && daysPercent === 0) {
    limitingFactor = 'both_zero';
  } else if (daysPercent >= kmPercent) {
    limitingFactor = 'days';
  } else {
    limitingFactor = 'km';
  }

  // Reason text formatting (especially when aging by time is dominant or exceeded)
  let wearReasonText: string | null = null;
  if (isTimeExceeded) {
    wearReasonText = `(Старение по времени: > ${safeMaxDays} дней)`;
  } else if (isKmExceeded) {
    const excessKm = kmPassed - safeMaxKm;
    wearReasonText = `(Превышен пробег: +${excessKm.toLocaleString('ru-RU')} км)`;
  } else if (daysPercent > kmPercent && daysPercent >= 70) {
    wearReasonText = `(Ресурс по времени: ${daysPassed}/${safeMaxDays} дн.)`;
  } else if (kmPercent >= daysPercent && kmPercent >= 70) {
    wearReasonText = `(Ресурс по пробегу: ${kmPassed.toLocaleString('ru-RU')}/${safeMaxKm.toLocaleString('ru-RU')} км)`;
  }

  return {
    kmPassed,
    daysPassed,
    kmPercent,
    daysPercent,
    totalWearPercent,
    remainingHealth,
    isTimeExceeded,
    isKmExceeded,
    limitingFactor,
    wearReasonText,
  };
}

/**
 * Searches service history to find the most recent maintenance record matching the fluid type
 */
export function findLastServiceForFluid(
  fluidKey: FluidKey,
  records: MaintenanceRecord[],
  carId: string | null
): { lastServicedKm: number; lastServicedDate: string | null; record: MaintenanceRecord | null } {
  if (!carId) {
    return { lastServicedKm: 0, lastServicedDate: null, record: null };
  }

  const carRecords = records
    .filter(r => r.carId === carId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const rec of carRecords) {
    const desc = (rec.description || '').toLowerCase();
    const parts = (rec.partsUsed || []).map(p => p.toLowerCase()).join(' ');
    const fullText = `${desc} ${parts} ${rec.category || ''}`;

    let isMatch = false;

    switch (fluidKey) {
      case 'engine_oil':
        // Must mention oil and not solely transmission or brake
        const isBrakeOrTransmOnly =
          /(тормозн.*жидк|dot\s?4|dot\s?5\.1|масло.*(кпп|акпп|мкпп|коробк|вариатор)|трансмиссион)/i.test(fullText) &&
          !/(моторн.*масл|масло.*двс|масло.*двигател|масло.*фильтр)/i.test(fullText);

        if (!isBrakeOrTransmOnly) {
          if (
            /(моторн.*масл|масло.*двс|масло.*двигател|масло.*фильтр|замен.*масл|двс.*масл|engine.*oil|5w-?30|5w-?40|0w-?20|0w-?30|10w-?40|shell|motul|mobil|castrol|лукойл|генезис)/i.test(
              fullText
            )
          ) {
            isMatch = true;
          } else if (rec.category === 'Oil & Fluids' && /(масло|фильтр|то-?\d+|маслян)/i.test(fullText)) {
            isMatch = true;
          }
        }
        break;

      case 'brake_fluid':
        if (
          /(тормозн.*жидк|тормозух|dot\s?4|dot\s?5\.1|dot\s?3|brake.*fluid|замен.*тж|прокач.*тормоз|жидкость.*тормоз)/i.test(
            fullText
          )
        ) {
          isMatch = true;
        }
        break;

      case 'coolant':
        if (
          /(антифриз|охлаждающ.*жидк|тосол|coolant|antifreeze|g11|g12|g12\+|g12\+\+|g13|hepu|felix|замен.*ож|радиатор.*жидк)/i.test(
            fullText
          )
        ) {
          isMatch = true;
        }
        break;

      case 'transmission_oil':
        if (
          /(масло.*(кпп|акпп|мкпп|коробк|вариатор|редуктор|раздаточ|мост)|трансмиссион.*масл|atf|75w-?90|75w-?80|dexron|cvt.*fluid|dsg.*oil)/i.test(
            fullText
          )
        ) {
          isMatch = true;
        }
        break;
    }

    if (isMatch) {
      return {
        lastServicedKm: rec.mileage || 0,
        lastServicedDate: rec.date || null,
        record: rec,
      };
    }
  }

  return { lastServicedKm: 0, lastServicedDate: null, record: null };
}

/**
 * Computes health status for all 4 key fluids for a given car
 */
export function calculateAllFluidsHealth({
  carId,
  currentMileage,
  records,
  customLimits = {},
  customLastService = {},
  referenceDate = new Date(),
}: {
  carId: string | null;
  currentMileage: number;
  records: MaintenanceRecord[];
  customLimits?: Partial<Record<FluidKey, { maxKm?: number; maxDays?: number }>>;
  customLastService?: Partial<Record<FluidKey, { lastServicedKm?: number; lastServicedDate?: string }>>;
  referenceDate?: Date;
}): Record<FluidKey, FluidHealthCalculation> {
  const keys: FluidKey[] = ['engine_oil', 'brake_fluid', 'coolant', 'transmission_oil'];
  const results = {} as Record<FluidKey, FluidHealthCalculation>;

  for (const key of keys) {
    const preset = DEFAULT_FLUID_PRESETS[key];
    const userLimit = customLimits[key];
    const maxKm = userLimit?.maxKm && userLimit.maxKm > 0 ? userLimit.maxKm : preset.maxKm;
    const maxDays = userLimit?.maxDays && userLimit.maxDays > 0 ? userLimit.maxDays : preset.maxDays;

    // Find service from history
    const detected = findLastServiceForFluid(key, records, carId);

    // Apply manual override if specified
    const manual = customLastService[key];
    const lastServicedKm = manual?.lastServicedKm !== undefined ? manual.lastServicedKm : detected.lastServicedKm;
    const lastServicedDate = manual?.lastServicedDate !== undefined ? manual.lastServicedDate : detected.lastServicedDate;
    const hasServiceRecord = Boolean(detected.record || manual?.lastServicedKm !== undefined || manual?.lastServicedDate);

    const wear = calculateFluidWear({
      currentKm: currentMileage,
      lastServicedKm,
      lastServicedDate,
      maxKm,
      maxDays,
      referenceDate,
    });

    // Determine status level strictly according to user requirements:
    // • 🟢 Зеленый (> 30%): "В норме"
    // • 🟡 Оранжевый (10% - 30%): "Требуется замена (Срок/Пробег)"
    // • 🔴 Красный (< 10%): "Критический износ / Потеря свойств"
    let statusLevel: FluidStatusLevel = 'normal';
    let statusText = 'В норме';

    if (wear.remainingHealth < 10) {
      statusLevel = 'critical';
      statusText = 'Критический износ / Потеря свойств';
    } else if (wear.remainingHealth <= 30) {
      statusLevel = 'replace_due';
      statusText = 'Требуется замена (Срок/Пробег)';
    } else {
      statusLevel = 'normal';
      statusText = 'В норме';
    }

    results[key] = {
      fluidKey: key,
      nameRu: preset.nameRu,
      shortName: preset.shortName,
      currentKm: currentMileage,
      lastServicedKm,
      lastServicedDate,
      kmPassed: wear.kmPassed,
      daysPassed: wear.daysPassed,
      maxKm,
      maxDays,
      kmPercent: wear.kmPercent,
      daysPercent: wear.daysPercent,
      totalWearPercent: wear.totalWearPercent,
      remainingHealth: wear.remainingHealth,
      statusLevel,
      statusText,
      limitingFactor: wear.limitingFactor,
      wearReasonText: wear.wearReasonText,
      hasServiceRecord,
      isTimeExceeded: wear.isTimeExceeded,
      isKmExceeded: wear.isKmExceeded,
    };
  }

  return results;
}
