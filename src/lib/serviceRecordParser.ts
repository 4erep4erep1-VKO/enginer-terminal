/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedServiceEntry, ServiceCategory, ServicePartUsed } from '../types/car';

/**
 * Local-First rule-based and regex parser for automotive voice/text entries.
 * Works 100% offline with zero network latency.
 */
export function parseServiceTranscriptLocally(
  text: string,
  currentCarOdometer: number = 0
): ParsedServiceEntry {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. EXTRACT ODOMETER (Пробег)
  let odometer = currentCarOdometer;
  // Regex pattern matching:
  // "на 60000 км", "на 60 000", "пробег 185000", "на пробеге 72000", "60000 км", "на 60 тысячах"
  const thousandsMatch = lower.match(/(?:на|пробег|пробеге)\s*(\d+(?:[.,]\d+)?)\s*(?:тыс|тысяч)/i);
  if (thousandsMatch) {
    const val = parseFloat(thousandsMatch[1].replace(',', '.'));
    if (!isNaN(val)) {
      odometer = Math.round(val * 1000);
    }
  } else {
    const odoMatch = lower.match(/(?:на|пробег(?:е)?|одометр(?:е)?)\s*:?\s*(\d+[\s\d]*)\s*(?:км)?/i) ||
                     lower.match(/(\d+[\s\d]*)\s*(?:км|километр)/i);
    if (odoMatch) {
      const parsed = parseInt(odoMatch[1].replace(/\s+/g, ''), 10);
      if (!isNaN(parsed) && parsed > 500) {
        odometer = parsed;
      }
    }
  }

  // 2. EXTRACT COSTS (Стоимость запчастей, работ, общая)
  let costParts = 0;
  let costWork = 0;
  let totalCost = 0;

  // Check for explicit "работа X"
  const workCostMatch = lower.match(/(?:работа|за работу|мастер(?:у)?|стоимость работ|установка)\s*:?\s*(\d+[\s\d]*)\s*(?:тг|тенге|₸|руб|р|тыс)?/i);
  if (workCostMatch) {
    const val = parseInt(workCostMatch[1].replace(/\s+/g, ''), 10);
    if (!isNaN(val)) costWork = val;
  }

  // Check for explicit "запчасти X" or general cost "за X тенге/рублей"
  const partsCostMatch = lower.match(/(?:запчаст(?:и|ей)|детали|деталь)\s*:?\s*(\d+[\s\d]*)\s*(?:тг|тенге|₸|руб|р|тыс)?/i);
  if (partsCostMatch) {
    const val = parseInt(partsCostMatch[1].replace(/\s+/g, ''), 10);
    if (!isNaN(val)) costParts = val;
  }

  // General cost match: "за 6000 тенге", "6000 ₸", "ценa 4500", "обошлось в 5000"
  const generalCostMatch = lower.match(/(?:за|обошлось в|цена|стоимость|отдал|купил за)\s*(\d+[\s\d]*)\s*(?:тг|тенге|₸|руб|р|тыс)?/i) ||
                           lower.match(/(\d+[\s\d]*)\s*(?:тг|тенге|₸|рублей|руб|тысяч тенге)/i);

  if (generalCostMatch) {
    const val = parseInt(generalCostMatch[1].replace(/\s+/g, ''), 10);
    if (!isNaN(val)) {
      if (costParts === 0 && costWork === 0) {
        costParts = val;
      } else if (costParts === 0 && costWork > 0 && val !== costWork) {
        costParts = val;
      }
    }
  }

  totalCost = (costParts || 0) + (costWork || 0);

  // 3. CATEGORY & TITLE DETECTION
  let category: ServiceCategory = 'maintenance';
  let title = '';
  const worksDone: string[] = [];
  const partsUsed: ServicePartUsed[] = [];

  // Keywords detection
  const isSparkPlugs = lower.includes('свеч');
  const isOil = lower.includes('масл') || lower.includes('залил') || lower.includes('фильтр');
  const isBrakes = lower.includes('тормоз') || lower.includes('колодк') || lower.includes('суппорт') || lower.includes('диск');
  const isSuspension = lower.includes('подвеск') || lower.includes('стойк') || lower.includes('амортизатор') || lower.includes('рычаг') || lower.includes('сайлент');
  const isCoolant = lower.includes('антифриз') || lower.includes('охлаждайк') || lower.includes('радиатор');
  const isTransmission = lower.includes('коробк') || lower.includes('акпп') || lower.includes('мкпп') || lower.includes('вариатор') || lower.includes('редуктор');
  const isTuning = lower.includes('тюнинг') || lower.includes('шумк') || lower.includes('тонировк') || lower.includes('чехлы');
  const isRepair = lower.includes('ремонт') || lower.includes('застучал') || lower.includes('сломал') || lower.includes('починил');

  if (isSparkPlugs) {
    category = 'maintenance';
    title = 'Замена свечей зажигания';
    worksDone.push('Замена комплекта свечей зажигания');

    // Extract brand if mentioned (e.g. NGK, Denso, Bosch, Brisk)
    const brandMatch = clean.match(/(?:свечи|свечей)?\s*(NGK|Denso|Bosch|Brisk|Torch|Finwhale|Champion|[А-ЯЁA-Z]{2,}[\w-]*)/i);
    const brandName = brandMatch && brandMatch[1] && !['поменял', 'заменил', 'свечи'].includes(brandMatch[1].toLowerCase())
      ? `Свечи ${brandMatch[1].toUpperCase()}`
      : 'Свечи зажигания (комплект)';
    partsUsed.push({ name: brandName, price: costParts > 0 ? costParts : undefined });
  } else if (isOil) {
    category = 'maintenance';
    title = 'Замена моторного масла и фильтра';
    worksDone.push('Замена моторного масла', 'Замена масляного фильтра');

    // Extract oil brand or viscosity if mentioned (e.g. Лукойл, Shell, Mobil, 5W-40, 5W-30)
    const viscMatch = clean.match(/(\d+W-\d+)/i);
    const oilBrandMatch = clean.match(/(Лукойл|Shell|Mobil|Motul|ZIC|Total|Elf|Castrol|Rolf|Sintec|Genesis|Liqui Moly)[\w\s-]*/i);
    const oilName = oilBrandMatch
      ? `Моторное масло ${oilBrandMatch[0].trim()}`
      : (viscMatch ? `Моторное масло ${viscMatch[0]}` : 'Моторное масло');
    partsUsed.push({ name: oilName, price: costParts > 0 ? costParts : undefined });
    partsUsed.push({ name: 'Масляный фильтр' });
  } else if (isBrakes) {
    category = 'repair';
    title = 'Обслуживание тормозной системы';
    if (lower.includes('колодк')) {
      title = lower.includes('передн') ? 'Замена передних тормозных колодок' : (lower.includes('задн') ? 'Замена задних тормозных колодок' : 'Замена тормозных колодок');
      worksDone.push(title);
      const brakeBrand = clean.match(/(Brembo|TRW|Ferodo|ATE|Hi-Q|Sangsin|NiBK|Hankook|Fenox)[\w\s-]*/i);
      partsUsed.push({
        name: brakeBrand ? `Колодки ${brakeBrand[0].trim()}` : 'Тормозные колодки',
        price: costParts > 0 ? costParts : undefined
      });
    } else {
      worksDone.push('Ревизия тормозов');
    }
  } else if (isSuspension) {
    category = 'repair';
    title = 'Ремонт подвески / ходовой части';
    worksDone.push('Замена элементов подвески');
  } else if (isCoolant) {
    category = 'maintenance';
    title = 'Замена охлаждающей жидкости (антифриза)';
    worksDone.push('Слив старого и залив свежего антифриза');
    partsUsed.push({ name: 'Антифриз', price: costParts > 0 ? costParts : undefined });
  } else if (isTransmission) {
    category = 'maintenance';
    title = 'Замена масла в трансмиссии';
    worksDone.push('Замена трансмиссионного масла');
    partsUsed.push({ name: 'Трансмиссионное масло', price: costParts > 0 ? costParts : undefined });
  } else if (isTuning) {
    category = 'tuning';
    title = 'Дооснащение / Тюнинг';
    worksDone.push('Установка дополнительного оборудования');
  } else if (isRepair) {
    category = 'repair';
    title = 'Ремонтные работы';
    worksDone.push('Устранение неисправности');
  } else {
    // Fallback title from user text
    title = clean.length > 50 ? clean.substring(0, 47) + '...' : clean;
    worksDone.push(title);
  }

  // If no parts extracted but cost is present, add generic entry
  if (partsUsed.length === 0 && costParts > 0) {
    partsUsed.push({ name: 'Расходные материалы / Запчасти', price: costParts });
  }

  return {
    title,
    odometer,
    worksDone,
    partsUsed,
    costParts,
    costWork,
    totalCost,
    category,
    rawTranscript: clean,
  };
}

/**
 * Universal Parser: Tries light AI parsing via backend endpoint if online,
 * falls back cleanly and immediately to local parsing on any error or offline state.
 */
export async function parseServiceTranscript(
  text: string,
  currentCarOdometer: number = 0,
  carContext?: { make?: string; model?: string; year?: number }
): Promise<ParsedServiceEntry> {
  const localResult = parseServiceTranscriptLocally(text, currentCarOdometer);

  // If offline or short input, return local parse immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return localResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

    const res = await fetch('/api/parse-service-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: text,
        currentOdometer: currentCarOdometer,
        carContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.parsed) {
        return {
          title: data.parsed.title || localResult.title,
          odometer: Number(data.parsed.odometer || localResult.odometer),
          worksDone: Array.isArray(data.parsed.worksDone) && data.parsed.worksDone.length > 0
            ? data.parsed.worksDone
            : localResult.worksDone,
          partsUsed: Array.isArray(data.parsed.partsUsed) && data.parsed.partsUsed.length > 0
            ? data.parsed.partsUsed
            : localResult.partsUsed,
          costParts: Number(data.parsed.costParts ?? localResult.costParts),
          costWork: Number(data.parsed.costWork ?? localResult.costWork),
          totalCost: Number(data.parsed.totalCost ?? localResult.totalCost),
          category: data.parsed.category || localResult.category,
          comment: data.parsed.comment || undefined,
          rawTranscript: text,
        };
      }
    }
  } catch (e) {
    // Network or server error - silently fallback to local rule-based parse
    console.warn('AI parser endpoint unavailable or timed out; using local parser:', e);
  }

  return localResult;
}
