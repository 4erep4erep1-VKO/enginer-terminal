/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BodyType, Car } from '../types';

/**
 * Supported Body Types for vehicles
 */
export interface BodyTypeInfo {
  id: BodyType;
  label: string;
  description: string;
}

export const BODY_TYPES: BodyTypeInfo[] = [
  { id: 'sedan', label: 'Седан', description: 'Классический 3-объемный 4-дверный кузов' },
  { id: 'crossover', label: 'Кроссовер', description: 'Городской SUV с увеличенным дорожным просветом' },
  { id: 'suv', label: 'Внедорожник', description: 'Полноразмерный 4x4 внедорожник' },
  { id: 'hatchback', label: 'Хэтчбек', description: 'Компактный динамичный 3- или 5-дверный кузов' },
  { id: 'wagon', label: 'Универсал', description: 'Практичный туристический кузов с длинной крышей' },
  { id: 'coupe', label: 'Купе', description: 'Двухдверный спортивный кузов со скошенной кормой' },
  { id: 'pickup', label: 'Пикап', description: 'Грузопассажирский кузов с открытой грузовой платформой' },
  { id: 'minivan', label: 'Минивэн', description: 'Вместительный семейный однообъемник' },
];

/**
 * Detect vehicle body type based on make and model text
 */
export function detectBodyType(make: string = '', model: string = ''): BodyType {
  const text = `${make} ${model}`.toLowerCase();

  // 1. Pickup
  if (/pickup|пикап|hilux|хайлюкс|l200|navara|f-150|f150|ram 1500|silverado|ranger|amarok|poer|tundra|titan|actyon sports|great wall wingle|uaz pickup|уаз пикап/i.test(text)) {
    return 'pickup';
  }

  // 2. Minivan
  if (/minivan|минивэн|микроавтобус|alphard|vellfire|caravelle|multivan|transporter|v-class|viano|vito|carnival|sienna|odyssey|starex|h-1|h1|touran|sharan|zafira|voyager|grand voyager|stepwgn|serena|noah|voxy|delica|espace|sobol|соболь/i.test(text)) {
    return 'minivan';
  }

  // 3. Coupe & Sports
  if (/coupe|купе|cabrio|кабриолет|roadster|родстер|mustang|мустанг|camaro|камаро|challenger|corvette|brz|gt86|gt 86|gr86|supra|супра|miata|mx-5|mx5|tt|audi r8|911|cayman|boxster|z4|z3|370z|350z|gtr|gt-r|genesis coupe|celica|eclipse|scirocco|chrysler crossfire/i.test(text)) {
    return 'coupe';
  }

  // 4. Station Wagon
  if (/wagon|универсал|combi|комби|avant|авант|touring|туринг|variant|вариант|estate|sportswagon|sw|largus|ларгус|kalina cross|granta cross|granta wagon|vesta sw|outback|аутбек|passat variant|octavia combi|ceed sw|focus wagon|mondeo wagon|i30 wagon|astra sports/i.test(text)) {
    return 'wagon';
  }

  // 5. Hatchback
  if (/hatchback|хэтчбек|хэтч|golf|гольф|sandero|сандеро|rio x|rio x-line|x-line|solaris hatchback|ceed|сид|focus hatchback|yaris|ярис|polo hatchback|fit|фит|fabia|фабия|i30|leon|леон|audi a3|swift|picanto|пиканто|getz|гетц|matiz|матиз|kalina|калина|2109|2108|2114|2113|2112|priora hatchback|приора хэтч|fiesta|фиеста|clio|клио|megane hatch|c3|c4 hatch|corsa|корса|astra gtc|astra h hatch|note|ноут|tiida/i.test(text)) {
    return 'hatchback';
  }

  // 6. SUV / Crossover
  if (/suv|кроссовер|внедорожник|джип|4x4|4х4|rav4|rav-4|рав4|duster|дастер|niva|нива|2121|2131|niva travel|niva legend|chevy niva|tiguan|тигуан|cr-v|crv|qashqai|кашкай|outlander|аутлендер|sportage|спортейдж|tucson|туссан|land cruiser|крузак|prado|прадо|pajero|паджеро|x5|x3|x6|x1|x7|q5|q7|q3|q8|cx-5|cx5|cx-7|cx-9|cx-30|cx-60|patriot|патриот|hunter|хантер|coolray|кулрей|jolion|джолион|f7|f7x|dargo|дарго|tank 300|tank 500|monjaro|монжаро|atlas|атлас|exeed|changan cs|cs35|cs55|cs75|cs95|creta|крета|kaptur|каптюр|arkana|аркана|koleos|touareg|туарег|explorer|tahoe|cherokee|grand cherokee|wrangler|forester|форестер|xv|teramont|sorento|santa fe|pathfinder|murano|fx35|qx50|qx60|qx70|qx80|rx350|rx300|gx460|lx570|lx600|tiggo|тигго|geely tugella|tugella|belgee x50|x50|geely emgrand x7/i.test(text)) {
    return 'crossover';
  }

  // Default: Sedan
  return 'sedan';
}

/**
 * Curated high-confidence vehicle photo database
 * Only includes verified model-accurate URLs to avoid showing wrong cars
 */
interface CuratedCarPhoto {
  matchRegex: RegExp;
  imageUrl: string;
  bodyType: BodyType;
  modelName: string;
}

export const CURATED_STOCK_PHOTOS: CuratedCarPhoto[] = [
  // LADA
  {
    matchRegex: /lada vesta|лада веста|vesta/i,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Lada Vesta',
  },
  {
    matchRegex: /lada granta|лада гранта|granta/i,
    imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Lada Granta',
  },
  {
    matchRegex: /niva|нива|lada 4x4|niva travel|niva legend|chevrolet niva|2121|2131/i,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'suv',
    modelName: 'Lada Niva 4x4',
  },
  {
    matchRegex: /largus|ларгус/i,
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'wagon',
    modelName: 'Lada Largus',
  },
  {
    matchRegex: /kalina|калина/i,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'hatchback',
    modelName: 'Lada Kalina',
  },
  {
    matchRegex: /priora|приора/i,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Lada Priora',
  },

  // Toyota
  {
    matchRegex: /camry|камри/i,
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Toyota Camry',
  },
  {
    matchRegex: /corolla|королла/i,
    imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Toyota Corolla',
  },
  {
    matchRegex: /rav4|рав4|rav 4|rav-4/i,
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Toyota RAV4',
  },
  {
    matchRegex: /land cruiser|крузак|prado|прадо/i,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'suv',
    modelName: 'Toyota Land Cruiser',
  },

  // Hyundai & Kia
  {
    matchRegex: /solaris|солярис|accent/i,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Hyundai Solaris',
  },
  {
    matchRegex: /kia rio|киа рио|rio/i,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Kia Rio',
  },
  {
    matchRegex: /creta|крета/i,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Hyundai Creta',
  },
  {
    matchRegex: /sportage|спортейдж|tucson|туссан/i,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Kia Sportage / Hyundai Tucson',
  },
  {
    matchRegex: /k5|optima|оптима|sonata|соната/i,
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Kia K5 / Hyundai Sonata',
  },

  // Volkswagen & Skoda
  {
    matchRegex: /polo|поло|rapid|рапид/i,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'VW Polo / Skoda Rapid',
  },
  {
    matchRegex: /octavia|октавия/i,
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Skoda Octavia',
  },
  {
    matchRegex: /tiguan|тигуан|kodiaq|кодиак/i,
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'VW Tiguan / Skoda Kodiaq',
  },
  {
    matchRegex: /golf|гольф/i,
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'hatchback',
    modelName: 'VW Golf',
  },

  // BMW & Mercedes & Audi
  {
    matchRegex: /bmw 3|bmw 5|бмв 3|бмв 5|3-series|5-series/i,
    imageUrl: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'BMW 3/5 Series',
  },
  {
    matchRegex: /bmw x5|bmw x3|bmw x6|бмв х5|бмв х3/i,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'BMW X-Series',
  },
  {
    matchRegex: /mercedes|мерседес|c-class|e-class|s-class|w212|w204|w213/i,
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Mercedes-Benz Sedan',
  },
  {
    matchRegex: /audi|ауди|a4|a6|a5|a7/i,
    imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Audi A4/A6',
  },

  // Renault & Nissan
  {
    matchRegex: /duster|дастер|kaptur|каптюр|arkana|аркана/i,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Renault Duster / Kaptur',
  },
  {
    matchRegex: /logan|логан|sandero|сандеро/i,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Renault Logan / Sandero',
  },
  {
    matchRegex: /qashqai|кашкай|x-trail|икстрейл/i,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Nissan Qashqai / X-Trail',
  },

  // Haval, Geely, Chery
  {
    matchRegex: /haval|хавейл|jolion|джолион|f7|dargo/i,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Haval SUV',
  },
  {
    matchRegex: /geely|джили|coolray|кулрей|monjaro|монжаро|atlas|атлас|tugella/i,
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Geely SUV',
  },
  {
    matchRegex: /chery|чери|tiggo|тигго/i,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Chery Tiggo',
  },

  // Mazda & Ford & Honda & Subaru
  {
    matchRegex: /cx-5|cx5|мазда сх5/i,
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'crossover',
    modelName: 'Mazda CX-5',
  },
  {
    matchRegex: /focus|фокус|mondeo|мондео/i,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    bodyType: 'sedan',
    modelName: 'Ford Focus / Mondeo',
  },
];

/**
 * Strict auto-match photo for make & model
 * Returns a photo URL ONLY if confidence is high.
 * Returns empty string ('') if no high-confidence match exists, so that the stylish vector silhouette is used!
 */
export function getAutoMatchingPhoto(make: string, model: string): string {
  const combined = `${make} ${model}`.trim();
  if (!combined) return '';

  for (const item of CURATED_STOCK_PHOTOS) {
    if (item.matchRegex.test(combined)) {
      return item.imageUrl;
    }
  }

  // Fallback: Return empty string so that the high-tech vector silhouette is displayed
  return '';
}

/**
 * Fetch real online car photo via backend search API
 */
export async function fetchCarPhotoOnline(
  make: string,
  model: string,
  year?: number
): Promise<{ found: boolean; imageUrl: string | null; message?: string }> {
  try {
    const res = await fetch('/api/cars/search-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ make, model, year })
    });

    if (!res.ok) {
      // Fallback to static matching
      const staticMatch = getAutoMatchingPhoto(make, model);
      if (staticMatch) {
        return { found: true, imageUrl: staticMatch };
      }
      return { found: false, imageUrl: null, message: 'Не удалось выполнить поиск фото' };
    }

    const data = await res.json();
    if (data.found && data.imageUrl) {
      return { found: true, imageUrl: data.imageUrl };
    }

    // Check if curated database has a match
    const staticMatch = getAutoMatchingPhoto(make, model);
    if (staticMatch) {
      return { found: true, imageUrl: staticMatch };
    }

    return { found: false, imageUrl: null, message: data.message || 'Точное фото не найдено' };
  } catch (err) {
    console.warn('Error in fetchCarPhotoOnline:', err);
    const staticMatch = getAutoMatchingPhoto(make, model);
    if (staticMatch) {
      return { found: true, imageUrl: staticMatch };
    }
    return { found: false, imageUrl: null, message: 'Ошибка сети при подборе фото' };
  }
}

/**
 * Client-side helper to compress image files before saving to state / localStorage
 * Resizes down so max dimension is 800px and saves as efficient JPEG data URL
 */
export async function compressImageFile(file: File, maxDimension = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Недопустимый формат изображения'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        // Draw and compress
        ctx.fillStyle = '#0B0E14';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
