/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarProfile, ServiceRecord } from '../../types/car';
import { MaintenanceRecord, Car } from '../../types';
import { calculateAllFluidsHealth, FluidHealthCalculation, FluidKey } from '../calcFluidHealth';
import { VehicleContextResult, VehicleMemorySummary } from '../../types/chat';
import { useCarStore } from '../../store/useCarStore';

/**
 * Normalizes input car to unified representation
 */
function normalizeCarData(car: CarProfile | Car | null | undefined) {
  if (!car) return null;

  const make = (car as any).brand || (car as any).make || 'Автомобиль';
  const model = car.model || '';
  const generation = (car as any).generation ? ` (${(car as any).generation})` : '';
  const year = car.year ? `${car.year}` : '';
  
  let engineStr = 'Не указан';
  if (typeof car.engine === 'object' && car.engine !== null) {
    const parts = [
      car.engine.volume,
      car.engine.code,
      car.engine.power ? `(${car.engine.power})` : '',
      car.engine.type
    ].filter(Boolean);
    engineStr = parts.join(' ') || '1.6л';
  } else if (typeof car.engine === 'string' && car.engine.trim()) {
    engineStr = car.engine;
  }

  const transmission = (car as any).transmission || 'МКПП';
  const driveType = (car as any).driveType ? ` | Привод: ${(car as any).driveType}` : '';
  const currentOdometer = Number((car as any).currentOdometer ?? (car as any).mileage ?? 0);
  const vin = car.vin ? ` | VIN: ${car.vin}` : '';
  const licensePlate = (car as any).licensePlate ? ` | Госномер: ${(car as any).licensePlate}` : '';

  return {
    id: car.id,
    make,
    model,
    generation,
    year,
    engineStr,
    transmission,
    driveType,
    currentOdometer,
    vin,
    licensePlate,
    fullTitle: `${make} ${model}${generation} ${year ? `(${year})` : ''}`.trim()
  };
}

/**
 * Builds compact yet exhaustive vehicle memory context for the AI Assistant («Василич»).
 * Formats:
 * [ПАСПОРТ АВТОМОБИЛЯ]
 * [ПОСЛЕДНИЕ РЕМОНТЫ И ТО]
 * [СОСТОЯНИЕ И РЕСУРС ТЕХНИЧЕСКИХ ЖИДКОСТЕЙ]
 * [СВЯЗЬ С ТЕКУЩИМ ВОПРОСОМ И ИНТЕРАКТИВНАЯ ДИАГНОСТИКА]
 */
export function buildVehicleContext(
  car: CarProfile | Car | null,
  history: (ServiceRecord | MaintenanceRecord)[] = [],
  query: string = '',
  extraOptions?: {
    activeDtcs?: string[];
    tasks?: any[];
  }
): VehicleContextResult {
  // Resolve car from useCarStore if not passed
  let targetCar = car;
  if (!targetCar) {
    try {
      targetCar = useCarStore.getState().getActiveCar();
    } catch {
      // ignore
    }
  }

  // Resolve history from useCarStore if empty
  let targetHistory = history;
  if (!targetHistory || targetHistory.length === 0) {
    try {
      const storeRecs = useCarStore.getState().getRecordsForActiveCar();
      if (storeRecs && storeRecs.length > 0) {
        targetHistory = storeRecs;
      }
    } catch {
      // ignore
    }
  }

  const normCar = normalizeCarData(targetCar);
  const carId = normCar?.id || null;
  const currentOdometer = normCar?.currentOdometer || 0;

  // 1. Filter and sort history for this car
  const relevantCarRecords = Array.isArray(targetHistory)
    ? targetHistory.filter(r => !carId || !r.carId || r.carId === carId)
    : [];

  relevantCarRecords.sort((a, b) => {
    const timeA = new Date((a as any).date || (a as any).createdAt || 0).getTime();
    const timeB = new Date((b as any).date || (b as any).createdAt || 0).getTime();
    return timeB - timeA;
  });

  // 2. Format [ПАСПОРТ АВТОМОБИЛЯ]
  let passportBlock = '';
  if (normCar) {
    passportBlock = [
      `[ПАСПОРТ АВТОМОБИЛЯ]`,
      `Марка/Модель: ${normCar.make} ${normCar.model}${normCar.generation} (${normCar.year || 'н.д.'}) | Двигатель: ${normCar.engineStr} | КПП: ${normCar.transmission}${normCar.driveType}${normCar.licensePlate}`,
      `Текущий пробег: ${currentOdometer.toLocaleString('ru-RU')} км`
    ].join('\n');
  } else {
    passportBlock = `[ПАСПОРТ АВТОМОБИЛЯ]\nАвтомобиль в гараже не выбран. Текущий пробег: ${currentOdometer.toLocaleString('ru-RU')} км`;
  }

  // 3. Format [ПОСЛЕДНИЕ РЕМОНТЫ И ТО]
  let recentRepairsBlock = `[ПОСЛЕДНИЕ РЕМОНТЫ И ТО]\nВ сервисном журнале автомобиля пока нет записей о ТО.`;
  if (relevantCarRecords.length > 0) {
    const repairLines = relevantCarRecords.slice(0, 6).map(r => {
      const dateStr = (r as any).date ? formatDateRu((r as any).date) : 'Ранее';
      const odo = Number((r as any).odometer ?? (r as any).mileage ?? 0);
      const title = (r as any).title || (r as any).description || 'Техническое обслуживание';
      
      let partsStr = '';
      if (Array.isArray(r.partsUsed) && r.partsUsed.length > 0) {
        const pNames = r.partsUsed.map((p: any) => typeof p === 'string' ? p : p.name).filter(Boolean);
        if (pNames.length > 0) {
          partsStr = ` (${pNames.join(', ')})`;
        }
      }

      const cost = Number((r as any).totalCost ?? ((Number((r as any).partsPrice ?? (r as any).costParts ?? 0)) + (Number((r as any).laborPrice ?? (r as any).costWork ?? 0))));
      const costStr = cost > 0 ? ` [${cost.toLocaleString('ru-RU')} ₽]` : '';

      return `- ${dateStr} (${odo.toLocaleString('ru-RU')} км): ${title}${partsStr}${costStr}`;
    });

    recentRepairsBlock = `[ПОСЛЕДНИЕ РЕМОНТЫ И ТО]\n${repairLines.join('\n')}`;
  }

  // 4. Calculate [СОСТОЯНИЕ И РЕСУРС ТЕХНИЧЕСКИХ ЖИДКОСТЕЙ]
  let fluidsHealth: Record<FluidKey, FluidHealthCalculation> | null = null;
  let fluidsLifecycleBlock = `[СОСТОЯНИЕ И РЕСУРС ТЕХНИЧЕСКИХ ЖИДКОСТЕЙ]\nДанные по жидкостям не рассчитаны.`;
  const criticalWarnings: string[] = [];

  try {
    const calculationCarId = carId || 'active-car';
    // Map records to MaintenanceRecord array for calculation
    const maintenanceRecords: MaintenanceRecord[] = relevantCarRecords.map(r => ({
      id: r.id || 'rec',
      carId: calculationCarId, // Ensure matching carId so calculateAllFluidsHealth matches
      date: (r as any).date || new Date().toISOString().split('T')[0],
      description: (r as any).title || (r as any).description || '',
      category: (r as any).category || 'Oil & Fluids',
      mileage: Number((r as any).odometer ?? (r as any).mileage ?? 0),
      partsPrice: Number((r as any).costParts ?? (r as any).partsPrice ?? 0),
      laborPrice: Number((r as any).costWork ?? (r as any).laborPrice ?? 0),
      partsUsed: Array.isArray(r.partsUsed) ? r.partsUsed.map((p: any) => typeof p === 'string' ? p : p.name) : [],
      createdAt: (r as any).createdAt || new Date().toISOString(),
      updatedAt: (r as any).updatedAt || new Date().toISOString(),
    }));

    fluidsHealth = calculateAllFluidsHealth({
      carId: calculationCarId,
      currentMileage: currentOdometer,
      records: maintenanceRecords,
    });

    const formatFluidLine = (label: string, key: FluidKey) => {
      const data = fluidsHealth?.[key];
      const resource = Math.max(0, Math.min(100, Math.round(data?.remainingHealth ?? 100)));
      const lastDate = data?.lastServicedDate ? formatDateRu(data.lastServicedDate) : 'нет данных';
      const lastKm = (data?.hasServiceRecord || (data && data.lastServicedKm > 0))
        ? data.lastServicedKm.toLocaleString('ru-RU')
        : (data?.lastServicedDate ? String(data.lastServicedKm ?? 0) : '0');

      if (data && (data.statusLevel === 'critical' || resource < 10)) {
        criticalWarnings.push(`${label}: износ ${100 - resource}%, требуется срочная замена`);
      }

      return `- ${label}: ${resource}% ресурса (Последняя замена: ${lastDate}, пробег: ${lastKm} км)`;
    };

    const fluidLines: string[] = [
      formatFluidLine('Моторное масло', 'engine_oil'),
      formatFluidLine('Тормозная жидкость', 'brake_fluid'),
      formatFluidLine('Антифриз (ОЖ)', 'coolant'),
      formatFluidLine('Масло КПП', 'transmission_oil'),
    ];

    fluidsLifecycleBlock = `[СОСТОЯНИЕ И РЕСУРС ТЕХНИЧЕСКИХ ЖИДКОСТЕЙ]\n${fluidLines.join('\n')}`;
  } catch (err) {
    console.warn('[buildVehicleContext] Failed to compute fluids health:', err);
  }

  // 5. Match Past Records with User Query
  const matchedPastRecords: (ServiceRecord | MaintenanceRecord)[] = [];
  const qLower = (query || '').toLowerCase();
  
  if (qLower) {
    const symptomKeywords = [
      { term: 'масл', tags: ['масло', 'фильтр'] },
      { term: 'тормоз', tags: ['тормоз', 'колодк', 'диск', 'суппорт'] },
      { term: 'колодк', tags: ['колодк', 'диск'] },
      { term: 'свеч', tags: ['свеч', 'зажиган', 'катушк'] },
      { term: 'заводит', tags: ['свеч', 'аккумулятор', 'стартер', 'топлив'] },
      { term: 'троит', tags: ['свеч', 'катушк', 'форсунк', 'зажиган'] },
      { term: 'стуч', tags: ['подвеск', 'стойк', 'рычаг', 'амортизатор', 'втулк', 'опор'] },
      { term: 'подвеск', tags: ['подвеск', 'стойк', 'рычаг', 'шаров', 'сайлент'] },
      { term: 'кпп', tags: ['кпп', 'коробк', 'сцеплен', 'масло в кпп'] },
      { term: 'коробк', tags: ['кпп', 'коробк', 'сцеплен'] },
      { term: 'печк', tags: ['печк', 'антифриз', 'радиатор', 'термостат', 'помпа'] },
      { term: 'греет', tags: ['печк', 'антифриз', 'термостат', 'помпа'] },
      { term: 'грм', tags: ['грм', 'ремень', 'ролик', 'помпа'] },
    ];

    const activeTags: string[] = [];
    symptomKeywords.forEach(k => {
      if (qLower.includes(k.term)) {
        activeTags.push(...k.tags);
      }
    });

    if (activeTags.length > 0) {
      relevantCarRecords.forEach(r => {
        const text = `${(r as any).title || (r as any).description || ''} ${(r as any).category || ''} ${Array.isArray(r.partsUsed) ? r.partsUsed.join(' ') : ''}`.toLowerCase();
        if (activeTags.some(tag => text.includes(tag))) {
          if (!matchedPastRecords.some(m => m.id === r.id)) {
            matchedPastRecords.push(r);
          }
        }
      });
    }
  }

  // 6. Format Diagnostic Guidance & Memory Link
  let diagnosticAdviceBlock = '';
  const adviceLines: string[] = [];

  adviceLines.push(`[ПРАВИЛА ИНТЕРАКТИВНОЙ ДИАГНОСТИКИ СИМПТОМОВ ВАСИЛИЧА]`);
  adviceLines.push(`1. ТЫ ПОМНИШЬ ЭТУ МАШИНУ: Всегда опирайся на паспортные данные (${normCar?.fullTitle || 'автомобиль'}, пробег ${currentOdometer.toLocaleString('ru-RU')} км) и историю прошлых замен.`);
  adviceLines.push(`- Если пользователь спрашивает про любую жидкость (масло, антифриз, тормозуха), ищи ответ в блоке [СОСТОЯНИЕ И РЕСУРС ТЕХНИЧЕСКИХ ЖИДКОСТЕЙ] и истории ТО, называй конкретные даты и пробеги.`);

  if (matchedPastRecords.length > 0) {
    const topMatch = matchedPastRecords[0];
    const mDate = (topMatch as any).date ? formatDateRu((topMatch as any).date) : 'ранее';
    const mOdo = Number((topMatch as any).odometer ?? (topMatch as any).mileage ?? 0);
    const kmAgo = currentOdometer > mOdo ? currentOdometer - mOdo : 0;
    const mTitle = (topMatch as any).title || (topMatch as any).description;

    adviceLines.push(`2. СВЯЗЬ С ИСТОРИЕЙ РЕМОНТОВ: Внимание! Похожий узел уже обслуживался (${mDate} на ${mOdo.toLocaleString('ru-RU')} км — "${mTitle}", прошло ${kmAgo.toLocaleString('ru-RU')} км). Обязательно назови водителю эту замену («Кстати, мы меняли ${mTitle} на ${mOdo.toLocaleString('ru-RU')} км...»).`);
  } else {
    adviceLines.push(`2. В ИСТОРИИ НЕТ ЗАПИСЕЙ по обсуждаемому узлу: прямо скажи об этом («По истории замен этого узла у меня пока нет...») и не выдумывай несуществующих ремонтов.`);
  }

  adviceLines.push(`3. ПОШАГОВЫЙ ДИАЛОГ (НЕ СЫПАТЬ ЛЕКЦИЯМИ): Если водитель жалуется на симптом (стук, вибрация, плохой запуск, свист, увод руля):`);
  adviceLines.push(`   - Не выдавай длинный список из 10 причин сразу!`);
  adviceLines.push(`   - Назови 1-2 главных вероятных виновника с учетом пробега и истории.`);
  adviceLines.push(`   - Задай ОДИН конкретный вопрос для сужения поиска (например: «Звук глухой или звонкий?», «Проявляется на холодную или на горячую?», «При нажатии на тормоз или на неровностях?»).`);
  adviceLines.push(`   - В JSON-ответе в поле "quickOptions" укажи 2-4 коротких варианта ответа для быстрого клика водителем (например: ["На холодную", "На горячую", "Постоянно"]).`);

  if (criticalWarnings.length > 0) {
    adviceLines.push(`4. КРИТИЧЕСКИЕ РЕСУРСЫ: У автомобиля есть просроченные жидкости (${criticalWarnings.join('; ')}). Если симптом косвенно связан с ними — деликатно предупреди водителя.`);
  }

  adviceLines.push(`5. ПРАВИЛО ИСТОЧНИКОВ И БЕЗОПАСНОСТИ: Когда ты называешь точные моменты затяжки болтов/гаек, технические зазоры свечей, объемы или допуски жидкостей, ВСЕГДА добавляй в конце фразы источник и дисклеймер. Пример формата: 'Затяжка болтов ГБЦ: 20 Н·м + довернуть на 90° (Источник: Технологическая инструкция ВАЗ / Руководство по ремонту). ⚠️ Всегда перепроверяйте критические моменты по заводской документации!'`);

  diagnosticAdviceBlock = adviceLines.join('\n');

  // Combined full formatted context
  const formattedContext = [
    passportBlock,
    '',
    recentRepairsBlock,
    '',
    fluidsLifecycleBlock,
    '',
    diagnosticAdviceBlock
  ].join('\n');

  // Summary object for UI chips and badges
  const memorySummary: VehicleMemorySummary = {
    carHeadline: normCar ? `${normCar.make} ${normCar.model}${normCar.generation}` : 'Автомобиль',
    currentOdometer,
    recordsCount: relevantCarRecords.length,
    lastServiceTitle: relevantCarRecords[0] ? ((relevantCarRecords[0] as any).title || (relevantCarRecords[0] as any).description) : undefined,
    lastServiceKm: relevantCarRecords[0] ? Number((relevantCarRecords[0] as any).odometer ?? (relevantCarRecords[0] as any).mileage ?? 0) : undefined,
    lastServiceDate: relevantCarRecords[0] ? (relevantCarRecords[0] as any).date : undefined,
    fluidsSummary: fluidsHealth ? Object.values(fluidsHealth).map(f => ({
      key: f.fluidKey,
      name: f.nameRu,
      health: Math.round(f.remainingHealth),
      isOverdue: f.remainingHealth < 10 || f.isKmExceeded || f.isTimeExceeded,
      statusText: f.statusText,
    })) : [],
    criticalWarnings,
  };

  return {
    formattedContext,
    passportBlock,
    recentRepairsBlock,
    fluidsLifecycleBlock,
    diagnosticAdviceBlock,
    fluidsHealth,
    memorySummary,
    matchedPastRecords,
  };
}

function formatDateRu(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}
