/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization helper for Gemini client to prevent crashes if key is missing on startup
let aiInstance: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

const app = express();
app.use(express.json());

const PORT = 3000;

// Hardcoded PDF manual extracts to simulate a vector search database of automotive manuals
const CAR_MANUALS_DB = [
  {
    car: "BMW (E46 / E90 / F30)",
    category: "Spark Plugs",
    content: "BMW spark plug replacement interval for platinum/iridium plugs is 100,000 km (62,000 miles). For high-performance M models, it is 60,000 km. Tightening torque is exactly 25 Nm. Always use NGK or Bosch OEM certified spark plugs."
  },
  {
    car: "BMW (E46 / E90 / F30)",
    category: "Engine Oil",
    content: "Approved engine oil is BMW Longlife-01 (LL-01) or LL-04. Viscosity: 5W-30 or 5W-40. N52/N54 engines require 6.5 Liters of oil. Oil filter cover torque is 25 Nm. Drainage plug torque is 25 Nm (use a new crush washer)."
  },
  {
    car: "Toyota (RAV4 / Camry / Corolla)",
    category: "Spark Plugs",
    content: "Toyota 2AR-FE and A25A-FKS engines require iridium-tipped spark plugs (Denso FC20HR-Q8 or equivalent). Replacement interval is 120,000 km (75,000 miles). Do not gap iridium plugs manually as it damages the tip coating."
  },
  {
    car: "Toyota (RAV4 / Camry / Corolla)",
    category: "Engine Oil",
    content: "Toyota modern engines use ultra-low viscosity SAE 0W-20 engine oil meeting API SN/SM standards. Sump capacity with filter is 4.4 Liters. Replacement interval is every 10,000 km or 12 months under normal conditions."
  },
  {
    car: "Toyota (RAV4 / Camry / Corolla)",
    category: "Brakes",
    content: "Front brake pad minimum thickness safety limit is 1.5 mm (new pads are 11 mm). Guide pin tightening torque is 34 Nm. Caliper mounting bolt torque is 107 Nm. Use high-temperature silicone grease for guide pins."
  },
  {
    car: "Audi & VW (A4 / A6 / Golf 2.0 TFSI)",
    category: "Spark Plugs",
    content: "2.0 TFSI (EA888) engines require spark plug replacement every 60,000 km or 4 years. Spark plug thread torque is 30 Nm. Ensure ignition coils are fully seated and clicked. Clean any oil residue from spark plug wells."
  },
  {
    car: "Audi & VW (A4 / A6 / Golf 2.0 TFSI)",
    category: "Engine Oil",
    content: "Requires oil meeting VW 504.00 / 507.00 specification. Recommended viscosity is 5W-30 or 0W-30. Capacity is exactly 4.7 Liters. Oil filter housing torque is 25 Nm."
  },
  {
    car: "Audi & VW (A4 / A6 / Golf 2.0 TFSI)",
    category: "Timing Chain",
    content: "Timing chain elongation check is recommended starting at 100,000 km. Check measuring block 093 in VCDS; deviation over -5.0 degrees indicates excessive chain stretch, requiring timing chain and tensioner replacement."
  },
  {
    car: "Lada Kalina (2010 / 1118 / 1119 / 1117)",
    category: "Engine Oil",
    content: "Двигатели ВАЗ-21114 (1.6л 8 клапанов) и ВАЗ-21126 (1.6л 16 клапанов) требуют моторное масло уровня качества API SJ/SL/SM/SN (например, Роснефть Maximum/Premium, Лукойл Люкс). Объем сухого двигателя при заливке — 3.5 литра. Рекомендуемая вязкость: летом 10W-40, зимой 5W-40. Интервал замены — 10 000 км. Давление масла на холостых прогретого мотора не должно быть ниже 1.2 бар."
  },
  {
    car: "Lada Kalina (2010 / 1118 / 1119 / 1117)",
    category: "Spark Plugs",
    content: "Рекомендуемые свечи зажигания для 8-клапанного двигателя ВАЗ-21114: А17ДВРМ или аналоги от Bosch (WR7DCX), NGK (BPR6ES-11) с зазором 1.0–1.1 мм. Для 16-клапанных: АУ17ДВРМ или NGK BCPR6ES-11 с зазором 1.0–1.1 мм. Момент затяжки свечей зажигания составляет строго 25 Нм (2.5 кгс·м). Не затягивайте свечи без динамометрического ключа во избежание повреждения резьбы в ГБЦ."
  },
  {
    car: "Lada Kalina (2010 / 1118 / 1119 / 1117)",
    category: "Timing Belt",
    content: "Ремень ГРМ на ВАЗ-21114 (1.6 8V) подлежит проверке каждые 15 000 км и обязательной замене каждые 60 000 км вместе с натяжным роликом. При обрыве ремня ГРМ на 8-клапанном двигателе 1.6л ВАЗ-21114 поршни НЕ гнут клапаны (есть выемки). Однако на 16-клапанном ВАЗ-21126 обрыв ремня приводит к неминуемому загибу клапанов. Момент затяжки болта натяжного ролика — 35 Нм."
  },
  {
    car: "Lada Kalina (2010 / 1118 / 1119 / 1117)",
    category: "Brakes",
    content: "Минимально допустимая толщина фрикционных накладок передних тормозных колодок Lada Kalina составляет 1.5 мм (включая металлическое основание — около 5-6 мм). Момент затяжки болтов направляющих суппорта — 30 Нм. Болты скобы суппорта затягиваются моментом 70 Нм. Рекомендуется использовать смазку для направляющих суппортов на силиконовой основе (TRW PFG110)."
  }
];

// Endpoint 1: Parse maintenance speech or text into structured JSON
app.post("/api/parse-record", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, currentMileage } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing transcript text" });
      return;
    }

    const systemPrompt = `You are an expert car mechanic and data processing AI.
Analyze the user's free-form maintenance text (in Russian or English) and extract structured parameters.
The output MUST be a STRICT JSON object with no additional text or formatting outside of the JSON structure.

Here is the reference mileage: ${currentMileage || 229000} km. Use it if no mileage is specified in the text.
Interpret colloquial Russian financial slang properly (e.g., "касарь", "косарь" = 1000, "рубль" = 100, etc.).

Format JSON:
{
  "title": string,
  "parts_cost": number,
  "labor_cost": number,
  "mileage": number,
  "description": string,
  "category": "Двигатель" | "Подвеска" | "Электрика" | "Тормоза" | "Расходники"
}`;

    let response: any = null;
    const candidateModels = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await getAiClient().models.generateContent({
          model: modelName,
          contents: `Parse this maintenance description: "${text}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "Краткое название работы, например 'Замена ремня генератора'."
                },
                parts_cost: {
                  type: Type.NUMBER,
                  description: "Стоимость запчастей. Число."
                },
                labor_cost: {
                  type: Type.NUMBER,
                  description: "Стоимость работ/услуг мастера. Число."
                },
                mileage: {
                  type: Type.INTEGER,
                  description: "Пробег автомобиля в км. Если не указан, использовать переданный ориентир."
                },
                description: {
                  type: Type.STRING,
                  description: "Детальное описание выполненных работ."
                },
                category: {
                  type: Type.STRING,
                  enum: ["Двигатель", "Подвеска", "Электрика", "Тормоза", "Расходники"],
                  description: "Одна из категорий: Двигатель, Подвеска, Электрика, Тормоза, Расходники."
                }
              },
              required: ["title", "parts_cost", "labor_cost", "mileage", "description", "category"]
            }
          }
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[ParseRecord] Model ${modelName} failed, trying next candidate:`, err.message || err);
      }
    }

    if (!response || !response.text) {
      // Fallback local heuristic
      const numMatch = text.match(/\b(\d+)\s*(?:руб|р|тыс|к)?\b/i);
      const parsedResult = {
        title: text.slice(0, 40),
        parts_cost: numMatch ? parseInt(numMatch[1], 10) : 0,
        labor_cost: 0,
        mileage: currentMileage ? parseInt(currentMileage, 10) : 0,
        description: text,
        category: "Расходники"
      };
      res.json(parsedResult);
      return;
    }

    try {
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (parseErr) {
      res.json({
        title: text.slice(0, 40),
        parts_cost: 0,
        labor_cost: 0,
        mileage: currentMileage ? parseInt(currentMileage, 10) : 0,
        description: text,
        category: "Расходники"
      });
    }
  } catch (err: any) {
    console.error("Error in parse-record:", err);
    res.status(500).json({ error: "Failed to parse text", details: err.message });
  }
});

// Endpoint 2: Vasilyich Conversational Automotive Advisor & Diagnostic Copilot
app.post("/api/rag/ask", async (req, res) => {
  try {
    const {
      question,
      activeCar,
      carProfile: reqCarProfile,
      records = [],
      parts = [],
      warehouseItems = [],
      tasks = [],
      dtcs = [],
      diagnosticSessions = [],
      diagnosticSession,
      diagnosticContext,
      obdSnapshot,
      chatHistory = [],
      history = []
    } = req.body;

    const carProfile = activeCar || reqCarProfile;
    const allParts = Array.isArray(parts) && parts.length > 0 ? parts : (Array.isArray(warehouseItems) ? warehouseItems : []);
    const allChatHistory = Array.isArray(chatHistory) && chatHistory.length > 0 ? chatHistory : (Array.isArray(history) ? history : []);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 0. REAL DYNAMIC DATE & TIME CONTEXT (STAGE 11.2)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const now = new Date();
    const daysOfWeekRu = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const dayOfWeek = daysOfWeekRu[now.getDay()];
    const dateFormattedRu = now.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const isoDateStr = now.toISOString().split('T')[0];
    const timeFormattedRu = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const oneYearAgo = new Date(now.getTime());
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoFormatted = oneYearAgo.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentMileage = Number(carProfile?.mileage) || 0;
    const carTitle = carProfile ? `${carProfile.make} ${carProfile.model}` : "автомобиль";
    const carNameText = carProfile ? `${carProfile.make} ${carProfile.model} (${carProfile.year || 'год не указан'})` : "автомобиль не выбран в Гараже";
    const carEngineText = carProfile?.engine ? `, двигатель: ${carProfile.engine}` : "";
    const carVinText = carProfile?.vin ? `, VIN: ${carProfile.vin}` : "";
    const carPlateText = carProfile?.licensePlate ? `, госномер: ${carProfile.licensePlate}` : "";
    
    const carContextText = carProfile
      ? `Автомобиль: ${carProfile.make} ${carProfile.model}, ${carProfile.year || ''} г.в.${carEngineText}${carVinText}${carPlateText}, текущий реальный пробег на одометре: ${currentMileage.toLocaleString('ru-RU')} км.`
      : "Автомобиль не выбран в Гараже.";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. VEHICLE MEMORY: MAINTENANCE & REPAIR HISTORY (STRICT ISOLATION)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const activeCarId = carProfile?.id;
    let carRecords: any[] = [];
    if (Array.isArray(records)) {
      carRecords = activeCarId 
        ? records.filter((r: any) => r.carId === activeCarId || (!r.carId && !records.some((other: any) => other.carId && other.carId !== activeCarId)))
        : records;
      
      // Sort newest first by date or mileage
      carRecords.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    // Compute exact financial and maintenance memory metrics
    let totalSpentAllTime = 0;
    let totalSpentLastYear = 0;
    let recordsWithPriceCount = 0;
    let recordsWithoutPriceCount = 0;

    let lastOilRecord: any = null;
    let lastBrakeRecord: any = null;
    let lastSparkRecord: any = null;
    let lastSuspensionRecord: any = null;

    for (const r of carRecords) {
      const cost = (Number(r.partsPrice) || 0) + (Number(r.laborPrice) || 0);
      if (cost > 0) {
        recordsWithPriceCount++;
        totalSpentAllTime += cost;
      } else {
        recordsWithoutPriceCount++;
      }

      const recDate = new Date(r.date || r.createdAt || 0);
      if (recDate >= oneYearAgo) {
        totalSpentLastYear += cost;
      }

      const descLower = ((r.description || '') + ' ' + (r.category || '')).toLowerCase();
      if (!lastOilRecord && (descLower.includes('масл') || descLower.includes('маслян'))) {
        lastOilRecord = r;
      }
      if (!lastBrakeRecord && (descLower.includes('колодк') || descLower.includes('тормоз') || descLower.includes('диск'))) {
        lastBrakeRecord = r;
      }
      if (!lastSparkRecord && (descLower.includes('свеч') || descLower.includes('катушк') || descLower.includes('зажиган'))) {
        lastSparkRecord = r;
      }
      if (!lastSuspensionRecord && (descLower.includes('подвеск') || descLower.includes('сайлент') || descLower.includes('амортиз') || descLower.includes('рычаг') || descLower.includes('стойк') || descLower.includes('шаров'))) {
        lastSuspensionRecord = r;
      }
    }

    let historyContextString = "В сервисном журнале этого автомобиля пока нет сохранённых записей ТО.";
    if (carRecords.length > 0) {
      historyContextString = carRecords.map((r, idx) => {
        const recMileage = Number(r.mileage) || 0;
        const kmAgo = currentMileage > recMileage ? ` (${(currentMileage - recMileage).toLocaleString('ru-RU')} км назад)` : '';
        const partsList = r.partsUsed && r.partsUsed.length > 0 ? `Детали: ${r.partsUsed.join(", ")}.` : '';
        const costStr = (r.partsPrice || r.laborPrice) ? `Затраты: ${r.partsPrice || 0} запчасти + ${r.laborPrice || 0} работа.` : '';
        const dtcStr = r.relatedDtc ? `[DTC: ${r.relatedDtc}] ` : '';
        return `${idx + 1}. [${r.date || 'Дата не указана'} | Пробег: ${recMileage.toLocaleString('ru-RU')} км${kmAgo}]: ${dtcStr}${r.description} (Категория: ${r.category || 'Общее'}). ${partsList} ${costStr}`.trim();
      }).join("\n");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. VEHICLE MEMORY: TASKS (PLANNED & COMPLETED)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let carTasks: any[] = [];
    if (Array.isArray(tasks)) {
      carTasks = activeCarId 
        ? tasks.filter((t: any) => t.carId === activeCarId || (!t.carId && !tasks.some((other: any) => other.carId && other.carId !== activeCarId)))
        : tasks;
    }

    let tasksContextString = "Активных плановых задач нет.";
    if (carTasks.length > 0) {
      const pending = carTasks.filter(t => t.status === "pending");
      const completed = carTasks.filter(t => t.status === "completed");

      const pendingLines = pending.map(t => {
        if (t.type === "mileage" && t.targetMileage) {
          const left = t.targetMileage - currentMileage;
          return `- [План по пробегу] "${t.title}": цель ${t.targetMileage.toLocaleString('ru-RU')} км (осталось: ${left.toLocaleString('ru-RU')} км)${left <= 0 ? ' ⚠️ [ПРОСРОЧЕНО!]' : ''}${t.relatedDtc ? ` [Связано с ${t.relatedDtc}]` : ''}`;
        }
        return `- [План календарный] "${t.title}": срок до ${t.targetDate || 'не указан'}${t.relatedDtc ? ` [Связано с ${t.relatedDtc}]` : ''}`;
      });

      const completedLines = completed.slice(0, 5).map(t => 
        `- [Выполнено] "${t.title}"${t.relatedDtc ? ` (DTC: ${t.relatedDtc})` : ''}`
      );

      tasksContextString = [
        pendingLines.length > 0 ? `АКТИВНЫЕ ЗАДАЧИ В ПЛАНЕ ТО:\n${pendingLines.join("\n")}` : 'Нет незавершенных задач в плане ТО.',
        completedLines.length > 0 ? `НЕДАВНО ВЫПОЛНЕННЫЕ ЗАДАЧИ:\n${completedLines.join("\n")}` : ''
      ].filter(Boolean).join("\n\n");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. VEHICLE MEMORY: DIAGNOSTIC SESSIONS & DTC HISTORY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const sessionsList: any[] = Array.isArray(diagnosticSessions) 
      ? diagnosticSessions 
      : (diagnosticSession ? [diagnosticSession] : []);

    const carSessions = activeCarId 
      ? sessionsList.filter((s: any) => !s.carId || s.carId === activeCarId)
      : sessionsList;

    let sessionContextString = "Предыдущих диагностических сессий не зафиксировано.";
    if (carSessions.length > 0) {
      sessionContextString = carSessions.map((s, idx) => {
        const dtcs = s.initialDtcCodes || s.initialDtc || [];
        const statusMap: Record<string, string> = {
          active: 'В процессе',
          waiting_recheck: 'Ожидает повторной проверки',
          resolved: 'Успешно решена',
          unresolved: 'Не решена',
          cancelled: 'Отменена'
        };
        const checksSummary = Array.isArray(s.checks) && s.checks.length > 0 
          ? `Проверки: ${s.checks.map((c: any) => `${c.title} [${c.status}]`).join('; ')}`
          : '';
        return `Сессия #${idx + 1} (Статус: ${statusMap[s.status] || s.status}, начата ${s.startedAt || 'не указано'}, одометр: ${s.startOdometer || 0} км). Ошибки: [${dtcs.join(', ') || 'нет'}]. ${checksSummary}`;
      }).join("\n");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. PARTS / INVENTORY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let carParts: any[] = allParts;
    let partsContextString = "Склад пуст или данные не переданы.";
    if (carParts.length > 0) {
      partsContextString = carParts.map(p => `- ${p.name || p.title} (${p.category || 'Запчасть'}): ${p.quantity || 1} шт. ${p.partNumber ? `[Арт: ${p.partNumber}]` : ''}`).join("\n");
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. MANUALS & DTCS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const contextString = "Используй проверенные надежные заводские регламенты для данной модели.";
    const activeDtcsList: string[] = [];
    if (diagnosticContext?.dtc) activeDtcsList.push(diagnosticContext.dtc);
    if (Array.isArray(diagnosticContext?.dtcs)) activeDtcsList.push(...diagnosticContext.dtcs);
    if (Array.isArray(dtcs)) activeDtcsList.push(...dtcs);
    if (Array.isArray(obdSnapshot?.dtcCodes)) activeDtcsList.push(...obdSnapshot.dtcCodes);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. SYSTEM PROMPT: LIVE AUTOMOTIVE ASSISTANT (STAGE 11.4: UX-ПЕРЕОСМЫСЛЕНИЕ И ЧЕЛОВЕЧНЫЙ ДИАЛОГ)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const isTechnicalRequest = /инженерный|параметры|осциллограф|pinout|электросхема|допуски оем|моменты затяжки/i.test(question);

    const systemPrompt = `
Ты — «Василич», заботливый, толковый и доброжелательный автомеханик-наставник.
Ты общаешься с водителем в формате естественного живого чата — как опытный мастер в гараже или хороший знакомый.

ТВОЙ СОБЕСЕДНИК:
Обычный человек, который может вообще не разбираться в устройстве автомобилей или только недавно научился пользоваться смартфоном (в том числе водители старшего поколения).
Он говорит обычным разговорным языком («масло поменял», «вчера делал тормоза», «за масло отдал три с половиной», «утром плохо заводится»).

ГЛАВНЫЕ ПРИНЦИПЫ:
1. НИКАКОГО ТЕХНИЧЕСКОГО ШУМА И КАНЦЕЛЯРИТА:
   - Запрещено использовать термины вроде RAG, DTC, OBD, Telemetry, Intent, Payload, Schema, ЭБУ (если водитель сам не спросил).
   - Объясняй всё простыми, понятными человеческими словами без высокомерия и без длинных занудных лекций.
   - Один ответ = один цельный, легко читаемый текст (размер абзацев 2–4 строки).

2. ПАМЯТЬ АВТОМОБИЛЯ (ЭТАП 11.2):
   - Ты действительно помнишь эту конкретную машину (${carTitle}, текущий пробег ${currentMileage.toLocaleString('ru-RU')} км).
   - Если в истории ТО есть запись — называй точные даты и пробеги («Масло последний раз меняли 15 марта 2024 года на 45 000 км. Сейчас 52 000 — прошло 7 000 км.»).
   - Если информации нет — честно и прямо скажи: «По остальным работам у меня записей нет.» Ничего не выдумывай!

3. СКАЗАЛ → ПОНЯЛ → СДЕЛАЛ (ЭТАП 11.3 / 11.4):
   - Если водитель сообщает о выполненной работе («Сегодня поменял масло, пробег 52 тысячи, отдал 3500»):
     Коротко резюмируй:
     «Понял. Масло и фильтр — 52 000 км, сегодня, 3 500 ₽.

Записать?»
     Заполни "pendingAction" с типом "add_record" и actions: [{"type": "confirm_action", "label": "Записать"}, {"type": "cancel_action", "label": "Изменить"}]

   - Если водитель подтверждает («Да», «Записывай», «Ага», «Сохраняй»):
     Ответь: «Записал. Теперь эта замена есть в истории машины.»
     Заполни "executedAction" с типом "add_record".

   - Если водитель исправляет («Ой, не 3500, а 3800»):
     «Понял. Исправить стоимость последней работы на 3 800 ₽?

Исправить?»
     Заполни "pendingAction" с типом "update_record" и actions: [{"type": "confirm_action", "label": "Исправить"}, {"type": "cancel_action", "label": "Отмена"}]

   - Если водитель просит удалить («Я ошибся, удали последнюю запись»):
     «Понял: удалить последнюю запись о замене масла?

Удалить?»
     Заполни "pendingAction" с типом "delete_record" и actions: [{"type": "confirm_action", "label": "Да, удалить"}, {"type": "cancel_action", "label": "Нет"}]

   - Если водитель обновляет пробег («Пробег сейчас 53 тысячи»):
     «Понял, обновил текущий пробег: 53 000 км.»
     Заполни "executedAction" с типом "update_mileage".

4. ПРАВИЛО КНОПОК (СТРОГО):
   - ЕСЛИ пользователь может просто продолжить разговор — НЕ ПОКАЗЫВАТЬ КНОПКУ (массив "actions" должен быть пустым []).
   - Кнопки появляются ТОЛЬКО тогда, когда нужно подтвердить действие ("pendingAction") или показать сводку мастеру ("Показать мастеру").
   - ЗАПРЕЩЕНО создавать кнопки «Уточнить», «Создать задачу», «Проверить», «Подробнее» после обычных ответов.

РЕАЛЬНАЯ СИСТЕМНАЯ ДАТА:
Сегодня: ${dateFormattedRu} (${dayOfWeek}, ${isoDateStr}).
Текущий пробег на одометре: ${currentMileage.toLocaleString('ru-RU')} км.

ДАННЫЕ ТЕКУЩЕГО АВТОМОБИЛЯ:
${carContextText}

ПАМЯТЬ АВТОМОБИЛЯ (ИСТОРИЯ ТО):
${historyContextString}

ПЛАН ТЕХНИЧЕСКОГО ОБСЛУЖИВАНИЯ (ЗАДАЧИ):
${tasksContextString}

СПРАВОЧНИК СКЛАДА (ЗАПЧАСТИ В НАЛИЧИИ):
${partsContextString}

СПРАВОЧНАЯ БАЗА МАНУАЛОВ И РЕГЛАМЕНТОВ:
${contextString}

ФОРМАТ ОТВЕТА (СТРОГИЙ JSON):
{
  "message": "Твой живой, уважительный, ясный ответ в Markdown.",
  "pendingAction": {
    "type": "add_record" | "update_record" | "delete_record" | "update_mileage" | "add_task" | "update_car_notes",
    "data": { ... }
  },
  "executedAction": {
    "type": "add_record" | "update_record" | "delete_record" | "update_mileage" | "add_task" | "update_car_notes",
    "data": { ... }
  },
  "actions": [
    {
      "type": "confirm_action" | "cancel_action" | "navigate_service" | "create_task",
      "label": "Текст кнопки",
      "payload": { ... }
    }
  ]
}
`;

    // Only send the last 6 messages from history
    const contents: any[] = [];
    if (allChatHistory && Array.isArray(allChatHistory) && allChatHistory.length > 0) {
      const recentHistory = allChatHistory.slice(-6);
      for (const msg of recentHistory) {
        if (msg.text && typeof msg.text === "string" && msg.text.trim()) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      }
    }

    const lastItem = contents[contents.length - 1];
    if (!lastItem || lastItem.role !== "user" || lastItem.parts[0]?.text !== question) {
      contents.push({
        role: "user",
        parts: [{ text: question }]
      });
    }

    let response: any = null;
    const candidateModels = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.7-flash"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await getAiClient().models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json"
          }
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[RagAssistant] Model ${modelName} failed, trying next candidate:`, err.message || err);
      }
    }

    let rawText = response?.text || "";
    let parsedData: any = null;

    if (rawText) {
      try {
        let jsonStr = rawText.trim();
        if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        }
        parsedData = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn("Could not parse JSON response from Gemini, treating as raw text:", parseErr);
        parsedData = { message: rawText };
      }
    } else {
      // Local engineering heuristic fallback with full Stage 11.3 Natural Action Engine
      console.log("[RagAssistant] Using local Vehicle Memory & Action heuristic fallback");
      const qLower = question.toLowerCase().trim();
      const carTitle = carProfile ? `${carProfile.make} ${carProfile.model}` : "твоей машины";
      const carId = carProfile?.id || "default-car";
      
      let fallbackMessage = "";
      let pendingAction: any = null;
      let executedAction: any = null;
      const actions: any[] = [];

      // Check if previous message had a pending action and user confirms:
      const lastAssistantMsg = (allChatHistory && Array.isArray(allChatHistory))
        ? [...allChatHistory].reverse().find(m => m.sender === 'assistant' && m.pendingAction)
        : null;
      
      const isAffirmative = /^(да|давай|записывай|запиши|ага|конечно|сохраняй|сохрани|ок|подтверждаю|точно|всё верно|верно|удали|удаляй|ставь|меняй)$/i.test(qLower) ||
        qLower.includes("да, запиши") || qLower.includes("да, сохраняй") || qLower.includes("давай запишем") || qLower.includes("да, удали");

      const isCancel = /^(нет|отмена|не надо|не записывай|отмени|не надо пока)$/i.test(qLower);

      if (isCancel && lastAssistantMsg?.pendingAction) {
        fallbackMessage = "Понял, отменил. Ничего в истории не меняем.";
      } else if (isAffirmative && lastAssistantMsg?.pendingAction) {
        const pAction = lastAssistantMsg.pendingAction;
        if (pAction.type === 'add_record') {
          executedAction = pAction;
          const rData = pAction.data;
          fallbackMessage = `Записал. ${rData.description} — ${(rData.mileage || currentMileage).toLocaleString('ru-RU')} км, ${rData.partsPrice ? `${rData.partsPrice.toLocaleString('ru-RU')} ₽` : 'без указания цены'}.`;
        } else if (pAction.type === 'update_mileage') {
          executedAction = pAction;
          fallbackMessage = `Поставил текущий пробег ${(pAction.data.mileage || 0).toLocaleString('ru-RU')} км.`;
        } else if (pAction.type === 'update_record') {
          executedAction = pAction;
          fallbackMessage = `Исправил. Стоимость последней записи обновлена.`;
        } else if (pAction.type === 'delete_record') {
          executedAction = pAction;
          fallbackMessage = `Удалил последнюю запись из истории ТО.`;
        } else if (pAction.type === 'add_task') {
          executedAction = pAction;
          fallbackMessage = `Добавил задачу «${pAction.data.title}» в план ТО.`;
        }
      } 
      // Action: Change mileage ("пробег сейчас 52300", "пробег 53 000")
      else if (/пробег\s*(сейчас|стал|уже|на одометре)?\s*(\d+[\d\s]*)/i.test(qLower) || /^(сейчас\s*)?(\d{2,6})\s*км$/i.test(qLower)) {
        const match = qLower.match(/(\d+[\s\d]*)/);
        const newKm = match ? parseInt(match[0].replace(/\s+/g, ''), 10) : null;
        if (newKm && newKm > 0) {
          if (newKm < currentMileage - 5000 && currentMileage > 10000) {
            fallbackMessage = `Сейчас у машины стоит **${currentMileage.toLocaleString('ru-RU')} км**. Ты точно хочешь поставить меньший пробег **${newKm.toLocaleString('ru-RU')} км**?`;
            pendingAction = {
              type: 'update_mileage',
              data: { carId, mileage: newKm }
            };
            actions.push({ type: 'confirm_action', label: 'Изменить пробег' }, { type: 'cancel_action', label: 'Отмена' });
          } else {
            fallbackMessage = `Понял, поставил текущий пробег **${newKm.toLocaleString('ru-RU')} км**.`;
            executedAction = {
              type: 'update_mileage',
              data: { carId, mileage: newKm }
            };
          }
        }
      }
      // Action: Add record (oil, pads, plugs, filters, general repair)
      else if (/поменял|заменил|сделал|залил|поставил|обслужил|замена/i.test(qLower) && (/масл|колодк|свеч|фильтр|грм|диск|антифриз|жидкост|стойк|подвеск/i.test(qLower) || /\d{2,6}/.test(qLower))) {
        // Extract mileage
        let targetMileage = currentMileage;
        const kmMatch = qLower.match(/(?:на\s+)?(\d{2,6})\s*(?:км|тысяч|тыс)?/i);
        if (kmMatch) {
          let val = parseInt(kmMatch[1].replace(/\s+/g, ''), 10);
          if (val < 1000 && qLower.includes('тыс')) val = val * 1000;
          if (val > 1000) targetMileage = val;
        }

        // Extract price
        let partsPrice = 0;
        const priceMatch = qLower.match(/(?:отдал|за|стоило|цена|обошлось|купил за)\s*(\d+[\d\s]*)/i) || qLower.match(/(\d+[\d\s]*)\s*(?:руб|р|₽)/i);
        if (priceMatch) {
          partsPrice = parseInt(priceMatch[1].replace(/\s+/g, ''), 10);
        }

        // Determine title & category
        let description = "Техническое обслуживание";
        let category: any = "Other";
        let partsUsed: string[] = [];

        if (/масл/i.test(qLower)) {
          description = "Замена моторного масла и фильтра";
          category = "Oil & Fluids";
          partsUsed = ["Моторное масло", "Масляный фильтр"];
        } else if (/колодк|диск|тормоз/i.test(qLower)) {
          description = "Замена тормозных колодок";
          category = "Brakes";
          partsUsed = ["Тормозные колодки"];
        } else if (/свеч/i.test(qLower)) {
          description = "Замена свечей зажигания";
          category = "Engine";
          partsUsed = ["Комплект свечей зажигания"];
        } else if (/фильтр/i.test(qLower)) {
          description = "Замена фильтров";
          category = "Oil & Fluids";
          partsUsed = ["Воздушный фильтр", "Салонный фильтр"];
        } else if (/грм|ремень/i.test(qLower)) {
          description = "Замена ремня ГРМ и роликов";
          category = "Engine";
          partsUsed = ["Комплект ГРМ"];
        } else if (/подвеск|стойк|рычаг|амортиз/i.test(qLower)) {
          description = "Ремонт элементов подвески";
          category = "Suspension";
        }

        // Date extraction
        let recDate = isoDateStr;
        let dateWord = "сегодня";
        if (qLower.includes("вчера")) {
          const yDate = new Date();
          yDate.setDate(yDate.getDate() - 1);
          recDate = yDate.toISOString().split("T")[0];
          dateWord = "вчера";
        }

        // Duplicate check
        const isDuplicate = carRecords.some(r => 
          (r.date === recDate || (r.mileage && Math.abs(r.mileage - targetMileage) < 50)) &&
          (r.description.toLowerCase().includes(description.toLowerCase().slice(0, 8)) || r.category === category)
        );

        if (isDuplicate) {
          fallbackMessage = `Похоже, похожую работу (*${description}*) мы уже сохранили в истории на ${recDate === isoDateStr ? 'сегодня' : recDate} (${targetMileage.toLocaleString('ru-RU')} км).\n\nТы точно хочешь добавить ещё одну такую запись?`;
          pendingAction = {
            type: "add_record",
            data: {
              carId,
              description,
              mileage: targetMileage,
              date: recDate,
              partsPrice,
              laborPrice: 0,
              partsUsed,
              category
            }
          };
          actions.push({ type: "confirm_action", label: "Всё равно записать" }, { type: "cancel_action", label: "Отмена" });
        } else {
          fallbackMessage = `Понял:\n**${description}** — **${targetMileage.toLocaleString('ru-RU')} км**\n${dateWord}\n${partsPrice > 0 ? `**${partsPrice.toLocaleString('ru-RU')} ₽**` : 'цена не указана'}\n\nЗаписать в историю?`;
          pendingAction = {
            type: "add_record",
            data: {
              carId,
              description,
              mileage: targetMileage,
              date: recDate,
              partsPrice,
              laborPrice: 0,
              partsUsed,
              category
            }
          };
          actions.push({ type: "confirm_action", label: "Записать" }, { type: "cancel_action", label: "Отмена" });
        }
      }
      // Action: Add task / Reminder in Plan ТО ("напомни через 5000 поменять масло", "напомни через 10000")
      else if (/напомни|поставь задачу|в план то|запланируй|напомнить/i.test(qLower)) {
        let deltaKm = 5000;
        const numMatch = qLower.match(/через\s*(\d+[\d\s]*)/i);
        if (numMatch) {
          deltaKm = parseInt(numMatch[1].replace(/\s+/g, ''), 10);
          if (deltaKm < 100 && qLower.includes('тыс')) deltaKm = deltaKm * 1000;
        }

        const targetMileage = currentMileage + deltaKm;
        let taskTitle = "Техническое обслуживание";
        let taskCategory: any = "Other";

        if (/масл/i.test(qLower)) {
          taskTitle = "Замена моторного масла и фильтра";
          taskCategory = "Oil & Fluids";
        } else if (/колодк|диск|тормоз/i.test(qLower)) {
          taskTitle = "Проверка и замена тормозных колодок";
          taskCategory = "Brakes";
        } else if (/свеч/i.test(qLower)) {
          taskTitle = "Замена свечей зажигания";
          taskCategory = "Engine";
        } else if (/грм/i.test(qLower)) {
          taskTitle = "Замена ремня ГРМ";
          taskCategory = "Engine";
        } else {
          taskTitle = question.replace(/напомни|пожалуйста|в план то|через\s*\d+\s*(?:км|тыс)?/gi, '').trim() || "Плановое ТО";
        }

        fallbackMessage = `Хорошо. Поставил **${taskTitle}** на **${targetMileage.toLocaleString('ru-RU')} км** (через ${deltaKm.toLocaleString('ru-RU')} км).`;
        executedAction = {
          type: "add_task",
          data: {
            carId,
            title: taskTitle,
            type: "mileage",
            targetMileage,
            category: taskCategory
          }
        };
      }
      // Action: Fix / update last record price ("ой, не 3500, а 3800", "исправь стоимость на 3800")
      else if (/(?:не\s*\d+,\s*а\s*(\d+)|исправь\s*(?:цену|стоимость)?\s*на\s*(\d+))/i.test(qLower)) {
        const lastRec = carRecords[0];
        const match = qLower.match(/(?:не\s*\d+,\s*а\s*(\d+)|исправь\s*(?:цену|стоимость)?\s*на\s*(\d+))/i);
        const newPrice = match ? parseInt((match[1] || match[2]).replace(/\s+/g, ''), 10) : 0;
        
        if (lastRec && newPrice > 0) {
          fallbackMessage = `Понял. Исправить стоимость последней работы (*${lastRec.description}*) на **${newPrice.toLocaleString('ru-RU')} ₽**?`;
          pendingAction = {
            type: "update_record",
            data: {
              ...lastRec,
              partsPrice: newPrice
            }
          };
          actions.push({ type: "confirm_action", label: "Исправить" }, { type: "cancel_action", label: "Отмена" });
        } else {
          fallbackMessage = `Какую именно запись нужно исправить? Назови работу или пробег.`;
        }
      }
      // Action: Delete last record ("я ошибся, удали последнюю запись", "удали последнюю запись")
      else if (/удали\s*(последнюю|эту)?\s*запись/i.test(qLower) || /я ошибся.*удали/i.test(qLower)) {
        const lastRec = carRecords[0];
        if (lastRec) {
          fallbackMessage = `Удалить последнюю запись о «**${lastRec.description}**» от **${lastRec.date || 'недавно'}** (${(lastRec.mileage || 0).toLocaleString('ru-RU')} км)?`;
          pendingAction = {
            type: "delete_record",
            data: { id: lastRec.id, description: lastRec.description }
          };
          actions.push({ type: "confirm_action", label: "Удалить запись" }, { type: "cancel_action", label: "Отмена" });
        } else {
          fallbackMessage = `В истории пока нет записей для удаления.`;
        }
      }
      // Action: Add note about car ("запиши заметку: ...")
      else if (/запиши заметку|сохрани заметку/i.test(qLower)) {
        const noteText = question.replace(/запиши заметку:?|сохрани заметку:?/gi, '').trim();
        if (noteText) {
          fallbackMessage = `Записал заметку об автомобиле: *«${noteText}»*.`;
          executedAction = {
            type: "update_car_notes",
            data: { carId, note: noteText }
          };
        } else {
          fallbackMessage = `Что именно записать в заметку об автомобиле?`;
        }
      }
      // 1. Check Date / Day of Week
      else if (qLower.includes("какая сегодня дата") || qLower.includes("какой сегодня день") || qLower.includes("какое сегодня число") || qLower.includes("сегодня понедельник") || qLower.includes("сегодня пятница") || qLower.includes("сегодня вторник") || qLower.includes("сегодня среда") || qLower.includes("сегодня четверг") || qLower.includes("сегодня суббота") || qLower.includes("сегодня воскресенье") || qLower.includes("какой день недели") || qLower.includes("какая дата")) {
        fallbackMessage = `Сегодня **${dateFormattedRu}** (${dayOfWeek}).`;
      } 
      // 2. Summary for master
      else if (qLower.includes("мастер") || qLower.includes("памятка для мастера") || qLower.includes("сводка для мастера") || qLower.includes("показать мастеру")) {
        const lastRecs = carRecords.slice(0, 4).map(r => `• ${r.date || 'Недавно'} (${(r.mileage || 0).toLocaleString('ru-RU')} км): ${r.description}`).join('\n') || '• Записей в истории пока нет';
        const pendingTasks = carTasks.filter((t: any) => t.status === 'pending').map((t: any) => `• ${t.title}`).join('\n') || '• Срочных задач в плане нет';
        
        fallbackMessage = `### Сводка для автослесаря
**Автомобиль:** ${carTitle}
**Текущий пробег:** ${currentMileage.toLocaleString('ru-RU')} км.

**Что делали недавно:**
${lastRecs}

**Что требует внимания / в плане:**
${pendingTasks}

**Рекомендация:**
1. Осмотреть состояние тормозных колодок и дисков.
2. Проверить уровень и состояние технических жидкостей.
3. Провести диагностику ходовой части на подъемнике.`;
        actions.push({ type: "copy_summary", label: "Скопировать для мастера" });
      } 
      // 3. Where to start / confused ("я не разбираюсь в машинах, что мне вообще сейчас с ней делать?")
      else if (qLower.includes("не разбираюсь") || qLower.includes("не знаю") || qLower.includes("с чего начать") || qLower.includes("что мне делать") || qLower.includes("что делать с машиной") || qLower.includes("посмотри, что у меня")) {
        const pending = carTasks.filter((t: any) => t.status === "pending");
        if (pending.length > 0) {
          const firstTask = pending[0];
          fallbackMessage = `Не переживай, всё просто! Твоя **${carTitle}** на ходу (пробег ${currentMileage.toLocaleString('ru-RU')} км).\n\nСейчас в плане обслуживания есть пункт:\n• **${firstTask.title}**${firstTask.targetMileage ? ` (до ${firstTask.targetMileage.toLocaleString('ru-RU')} км)` : ''}.\n\nЕсли машина едет ровно, мотор не троит и на панели ничего лишнего не горит — срочно бежать на сервис не нужно. Когда будешь готов заняться — скажи мне, я подскажу, какие запчасти нужны.`;
        } else if (carRecords.length > 0) {
          const last = carRecords[0];
          const kmPassed = currentMileage - (last.mileage || 0);
          fallbackMessage = `Не переживай, всё просто! По твоей **${carTitle}** сейчас всё спокойно:\n\n• Пробег: **${currentMileage.toLocaleString('ru-RU')} км**.\n• Последняя замена: **${last.date}** (${kmPassed > 0 ? `прошло ${kmPassed.toLocaleString('ru-RU')} км` : 'недавно'}) — *${last.description}*.\n• Срочных задач в плане нет.\n\nЕсли посторонних стуков и скрипов нет, просто следи за уровнем масла и давлением в колесах. Если что-то забеспокоит — сразу спрашивай!`;
        } else {
          fallbackMessage = `Не переживай, помогу во всём разобраться простыми словами!\n\nПо твоей **${carTitle}** (пробег ${currentMileage.toLocaleString('ru-RU')} км) у меня пока нет записей о прошлых заменах.\n\nЕсли помнишь, когда примерно менял моторное масло — просто скажи мне («поменял масло на 45 тысячах»), и я сам сохраню это в память машины.`;
        }
      } 
      // 4. Expenses ("а что мы вообще делали с машиной за последний год?")
      else if (qLower.includes("за год") || qLower.includes("за последний год") || qLower.includes("сколько потратил") || qLower.includes("расходы за год") || qLower.includes("траты")) {
        const yearRecords = carRecords.filter(r => new Date(r.date || r.createdAt || 0) >= oneYearAgo);
        if (yearRecords.length > 0) {
          const itemsList = yearRecords.map(r => {
            const cost = (Number(r.partsPrice) || 0) + (Number(r.laborPrice) || 0);
            return `• ${r.date} — ${r.description} — ${(r.mileage || 0).toLocaleString('ru-RU')} км${cost > 0 ? ` (${cost.toLocaleString('ru-RU')} ₽)` : ''}`;
          }).join('\n');

          fallbackMessage = `За последний год по **${carTitle}** записано ${yearRecords.length} ${yearRecords.length === 1 ? 'работа' : yearRecords.length < 5 ? 'работы' : 'работ'}:\n\n${itemsList}\n\n${totalSpentLastYear > 0 ? `**Всего потрачено:** ${totalSpentLastYear.toLocaleString('ru-RU')} ₽.` : ''}\n\nПо остальным работам у меня записей нет.`;
        } else if (carRecords.length > 0) {
          fallbackMessage = `За последний год новых записей не было. По более ранней истории сохранено ${carRecords.length} записей на общую сумму ${totalSpentAllTime.toLocaleString('ru-RU')} ₽.\n\nПо остальным работам у меня записей нет.`;
        } else {
          fallbackMessage = `По **${carTitle}** у меня пока нет записей о расходах и ремонтах за последний год.`;
        }
      } 
      // 5. Oil replacement ("когда последний раз меняли масло?")
      else if (qLower.includes("масл") && (qLower.includes("когда") || qLower.includes("менял") || qLower.includes("последн") || qLower.includes("прошло") || qLower.includes("сколько км"))) {
        if (lastOilRecord) {
          const recKm = Number(lastOilRecord.mileage) || 0;
          const kmAgo = currentMileage >= recKm ? currentMileage - recKm : 0;
          fallbackMessage = `Масло последний раз меняли **${lastOilRecord.date || 'ранее'}** на **${recKm.toLocaleString('ru-RU')} км**.\n\nСейчас пробег **${currentMileage.toLocaleString('ru-RU')} км** — прошло **${kmAgo.toLocaleString('ru-RU')} км**.`;
        } else {
          fallbackMessage = `У меня в памяти пока нет записи о замене моторного масла для **${carTitle}**.\n\nЕсли помнишь, когда примерно меняли — просто скажи, я запишу в историю.`;
        }
      } 
      // 6. Brake pads
      else if (qLower.includes("колодк") || qLower.includes("диск") || (qLower.includes("тормоз") && (qLower.includes("когда") || qLower.includes("менял")))) {
        if (lastBrakeRecord) {
          const recKm = Number(lastBrakeRecord.mileage) || 0;
          const kmAgo = currentMileage >= recKm ? currentMileage - recKm : 0;
          fallbackMessage = `Передние колодки меняли **${lastBrakeRecord.date || 'ранее'}** на **${recKm.toLocaleString('ru-RU')} км** (*${lastBrakeRecord.description}*).\n\nСейчас пробег **${currentMileage.toLocaleString('ru-RU')} км** — прошло **${kmAgo.toLocaleString('ru-RU')} км**.`;
        } else {
          fallbackMessage = `У меня в памяти пока нет записи о замене тормозных колодок для **${carTitle}**.\n\nПо остальным работам у меня записей нет.`;
        }
      } 
      // 7. Spark plugs / ignition
      else if (qLower.includes("свеч") && (qLower.includes("когда") || qLower.includes("менял") || qLower.includes("забыл"))) {
        if (lastSparkRecord) {
          const recKm = Number(lastSparkRecord.mileage) || 0;
          const kmAgo = currentMileage >= recKm ? currentMileage - recKm : 0;
          fallbackMessage = `Свечи зажигания меняли **${lastSparkRecord.date || 'ранее'}** на **${recKm.toLocaleString('ru-RU')} км**.\n\nСейчас пробег **${currentMileage.toLocaleString('ru-RU')} км** — прошло **${kmAgo.toLocaleString('ru-RU')} км**.`;
        } else {
          fallbackMessage = `У меня в памяти пока нет записи о замене свечей зажигания для **${carTitle}**.\n\nПо остальным работам у меня записей нет.`;
        }
      } 
      // 8. Recurring issues: knocking / morning startup / bad start
      else if (qLower.includes("утром плохо заводится") || qLower.includes("плохо заводится") || qLower.includes("странно заводится") || qLower.includes("троит") || qLower.includes("глохнет") || qLower.includes("стучит")) {
        let matchingRecord = null;
        if (qLower.includes("заводит") || qLower.includes("троит") || qLower.includes("глохнет")) {
          matchingRecord = lastSparkRecord || carRecords.find(r => /свеч|катушк|топлив|форсунк|зажиган|аккумулятор|акб/i.test(r.description || ''));
        } else if (qLower.includes("стучит") || qLower.includes("подвеск") || qLower.includes("звук")) {
          matchingRecord = lastSuspensionRecord || carRecords.find(r => /подвеск|стойк|рычаг|амортиз|втулк|сайлент/i.test(r.description || ''));
        }

        if (qLower.includes("заводит")) {
          const sparkNote = matchingRecord ? `(кстати, свечи мы меняли на ${(matchingRecord.mileage || 0).toLocaleString('ru-RU')} км)` : '';
          fallbackMessage = `Если машина утром плохо заводится, чаще всего причина в одном из трёх:\n\n1. **Аккумулятор** — подсел или теряет пусковой ток на холодную.\n2. **Свечи зажигания** ${sparkNote} — нагар или увеличенный зазор.\n3. **Давление топлива** — насос не успевает накачать перед пуском. Попробуй включить зажигание на 3 секунды до поворота ключа.\n\nПодскажи: стартер крутит бодро или еле-еле?`;
        } else if (matchingRecord) {
          fallbackMessage = `Давай посмотрим историю: похожая проблема уже была на пробеге **${(matchingRecord.mileage || 0).toLocaleString('ru-RU')} км** (${matchingRecord.date || 'ранее'}) — тогда делали: *${matchingRecord.description}*.\n\nЯ бы проверил этот узел в первую очередь. Симптом проявляется постоянно или только на холодную?`;
        } else {
          fallbackMessage = `В истории похожих записей нет. Давай разберёмся спокойно:\n\nПодскажи, звук или проблема проявляется на холостых оборотах, на кочках или при разгоне?`;
        }
      } 
      // 9. What is planned soon / what should I do soon
      else if (qLower.includes("что скоро делать") || qLower.includes("что мне скоро делать") || qLower.includes("что мне скоро нужно сделать") || qLower.includes("скоро делать") || qLower.includes("ближайшее то") || qLower.includes("что делать дальше")) {
        const pending = carTasks.filter((t: any) => t.status === "pending");
        if (pending.length > 0) {
          const list = pending.map((t: any) => {
            const targetKm = t.targetMileage ? ` (до ${t.targetMileage.toLocaleString('ru-RU')} км)` : '';
            return `• **${t.title}**${targetKm}`;
          }).join('\n');
          fallbackMessage = `По твоей машине **${carTitle}** сейчас в плане:\n\n${list}\n\nЕсли что-то из этого уже сделал — просто скажи мне, и я запишу в историю.`;
        } else {
          fallbackMessage = `По **${carTitle}** в ближайшее время срочных задач нет. Все базовые регламенты соблюдены.\n\nСледи за уровнем масла и периодичностью ТО (каждые 7 500–10 000 км).`;
        }
      } 
      // 10. General history
      else if (qLower.includes("что мы вообще с машиной делали") || qLower.includes("что вообще делали") || qLower.includes("что делали с машиной") || qLower.includes("истори") || qLower.includes("делали с этой машиной") || qLower.includes("посмотри, что у меня по машине")) {
        if (carRecords.length > 0) {
          const recSummary = carRecords.slice(0, 5).map((r) => 
            `• ${r.date || 'Ранее'} — ${r.description} — ${(r.mileage || 0).toLocaleString('ru-RU')} км`
          ).join('\n');
          fallbackMessage = `Вот что записано по **${carTitle}**:\n\n${recSummary}\n\nВсего в истории сохранено **${carRecords.length}** записей. По остальным работам у меня записей нет.`;
        } else {
          fallbackMessage = `В истории по **${carTitle}** пока нет сохранённых записей. Ты можешь просто сказать мне о выполненных работах, и я всё запишу.`;
        }
      } 
      // Default
      else {
        fallbackMessage = `Здорово! Я Василич — помню всё по твоей **${carTitle}** (пробег ${currentMileage.toLocaleString('ru-RU')} км, в истории ${carRecords.length} записей).\n\nРассказывай, что случилось или что поменял — разберёмся обычными словами.`;
      }

      parsedData = {
        message: fallbackMessage,
        pendingAction: pendingAction,
        executedAction: executedAction,
        actions: actions,
        diagnosticData: {
          severity: "info",
          safetyWarning: "",
          recommendedChecks: []
        }
      };
    }

    const finalAnswerMessage = parsedData.message || parsedData.summary || "Ответ сформирован.";
    
    // Backwards-compatible structured response for UI
    const finalStructured = {
      summary: finalAnswerMessage,
      severity: parsedData.diagnosticData?.severity || parsedData.severity || "info",
      confidence: parsedData.diagnosticData?.confidence || parsedData.confidence || 0.95,
      facts: parsedData.facts || [],
      hypotheses: parsedData.hypotheses || [],
      requiresVerification: parsedData.requiresVerification || [],
      possibleCauses: parsedData.possibleCauses || [],
      recommendedChecks: parsedData.diagnosticData?.recommendedChecks || parsedData.recommendedChecks || [],
      recommendedParts: parsedData.diagnosticData?.recommendedParts || parsedData.recommendedParts || [],
      actions: (parsedData.actions && parsedData.actions.length > 0) ? parsedData.actions : (parsedData.diagnosticData?.actions || []),
      safetyWarning: parsedData.diagnosticData?.safetyWarning || parsedData.safetyWarning || "",
      relatedDtc: parsedData.diagnosticData?.relatedDtc || parsedData.relatedDtc || activeDtcsList[0] || undefined
    };

    res.json({
      answer: finalAnswerMessage,
      actions: parsedData.actions || finalStructured.actions || [],
      pendingAction: parsedData.pendingAction || null,
      executedAction: parsedData.executedAction || null,
      diagnosticResponse: finalStructured,
      retrievedContexts: carRecords.slice(0, 3).map(r => ({ car: carTitle, category: r.category || 'ТО' })),
      retrievedHistory: carRecords.slice(0, 5).map(r => ({ date: r.date, description: r.description }))
    });
  } catch (err: any) {
    console.error("Error in RAG assistant:", err);
    res.status(500).json({ error: "Assistant error", details: err.message });
  }
});

// Endpoint 3: Vehicle Electrical Wiring & Fuse Box Diagrams Search (REAL WEB SEARCH)
async function searchRealWebImages(searchQuery: string): Promise<Array<{ id: string; title: string; imageUrl: string; thumbnail: string; source: string; category: string; description: string }>> {
  try {
    // 1. DuckDuckGo Image Search Protocol
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`;
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const tokenHtml = await tokenRes.text();
    const vqdMatch = tokenHtml.match(/vqd=["']([^"']+)["']/i) || tokenHtml.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : null;

    let results: any[] = [];

    if (vqd) {
      const searchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQuery)}&o=json&vqd=${vqd}&f=,,,&p=1`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://duckduckgo.com/'
        }
      });

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.results && Array.isArray(data.results)) {
          results = data.results;
        }
      }
    }

    // Process and filter results into CarDiagram format
    const diagrams = results.slice(0, 10).map((item: any, idx: number) => {
      const titleLower = (item.title || '').toLowerCase();
      let category = 'wiring';
      if (titleLower.includes('предохран') || titleLower.includes('реле') || titleLower.includes('блок') || titleLower.includes('fuse')) {
        category = 'fuses';
      } else if (titleLower.includes('эбу') || titleLower.includes('датчик') || titleLower.includes('распинов') || titleLower.includes('ecu') || titleLower.includes('pinout')) {
        category = 'engine_ecm';
      } else if (titleLower.includes('зажиган') || titleLower.includes('генератор') || titleLower.includes('стартер') || titleLower.includes('ignition')) {
        category = 'ignition';
      }

      // Domain source name extraction
      let sourceDomain = 'Интернет источник';
      try {
        if (item.url) {
          sourceDomain = new URL(item.url).hostname.replace('www.', '');
        }
      } catch (e) {}

      // Proxy image through server or weserv to bypass hotlinking protection & CORS
      const directImgUrl = item.image;
      const weservFallback = `https://images.weserv.nl/?url=${encodeURIComponent(directImgUrl)}`;
      const proxiedImgUrl = `/api/diagrams/proxy-image?url=${encodeURIComponent(directImgUrl)}`;

      return {
        id: `web-diag-${Date.now()}-${idx}`,
        title: item.title || `Схема электропроводки #${idx + 1}`,
        imageUrl: proxiedImgUrl,
        originalUrl: directImgUrl,
        sourceUrl: item.url || directImgUrl,
        thumbnail: item.thumbnail ? `/api/diagrams/proxy-image?url=${encodeURIComponent(item.thumbnail)}` : weservFallback,
        source: `${sourceDomain} (${item.height ? `${item.width}x${item.height}px` : 'OEM Image'})`,
        category,
        description: `Реальное изображение из сети по запросу: «${searchQuery}». Источник: ${sourceDomain}`
      };
    });

    return diagrams;
  } catch (err) {
    console.error("Error fetching real web images:", err);
    return [];
  }
}

app.post("/api/diagrams/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { make = 'Lada', model = 'Kalina', year = 2010, engine, query = '' } = req.body;
    
    // Construct strict automotive search query
    const baseVehicle = `${make} ${model} ${year}${engine ? ` ${engine}` : ''}`;
    const fullQuery = query ? `${baseVehicle} ${query}` : `${baseVehicle} схема электропроводки блок предохранителей распиновка`;

    console.log(`[Diagram Search] Executing real web image search for: "${fullQuery}"`);

    const realDiagrams = await searchRealWebImages(fullQuery);

    res.json({ 
      diagrams: realDiagrams,
      queryExecuted: fullQuery,
      yandexSearchUrl: `https://yandex.ru/images/search?text=${encodeURIComponent(fullQuery)}`,
      googleSearchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(fullQuery)}`
    });
  } catch (err: any) {
    console.error("Error searching diagrams:", err);
    res.status(500).json({ error: "Failed to search diagrams", details: err.message });
  }
});

// Image Proxy Endpoint with Hotlink-bypass headers and Weserv.nl fallback
app.get("/api/diagrams/proxy-image", async (req: Request, res: Response): Promise<void> => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    res.status(400).send("Missing url parameter");
    return;
  }

  // Attempt 1: Direct fetch with standard browser headers
  try {
    const customHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    try {
      const parsedUrl = new URL(imageUrl);
      customHeaders['Referer'] = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;
    } catch (e) {}

    let imgRes = await fetch(imageUrl, { headers: customHeaders, redirect: 'follow' });

    // Attempt 2: If direct fetch failed or returned HTML error page (Hotlink protection)
    if (!imgRes.ok || (imgRes.headers.get("content-type") || "").includes("text/html")) {
      const weservUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`;
      imgRes = await fetch(weservUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
    }

    // Attempt 3: Secondary CORS proxy fallback (wsrv.nl)
    if (!imgRes.ok || (imgRes.headers.get("content-type") || "").includes("text/html")) {
      const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}`;
      imgRes = await fetch(wsrvUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
    }

    if (!imgRes.ok) {
      // Redirect to weserv directly as last resort
      res.redirect(`https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`);
      return;
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType.startsWith("text/") ? "image/jpeg" : contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (err) {
    console.error("Image proxy failed:", err);
    if (imageUrl) {
      res.redirect(`https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`);
    } else {
      res.status(500).send("Proxy error");
    }
  }
});


// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Engineering Terminal Server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
