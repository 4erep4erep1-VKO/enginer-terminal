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

    const response = await getAiClient().models.generateContent({
      model: "gemini-3.5-flash",
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

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from Gemini parser");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (err: any) {
    console.error("Error in parse-record:", err);
    res.status(500).json({ error: "Failed to parse service description", details: err.message });
  }
});

// Endpoint 2: RAG automotive advisor (combines manual retrieval + prompt augmentation)
app.post("/api/rag-assistant", async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, carProfile, records, parts, tasks, assistantTone, currency, distanceUnit } = req.body;
    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "Missing question" });
      return;
    }

    const carContextText = carProfile
      ? `Car Profile: ${carProfile.make} ${carProfile.model} (${carProfile.year}), Mileage: ${carProfile.mileage} km.`
      : "No specific car profile selected. Assist in general automotive engineering terms.";

    // Format tasks context
    let tasksContextString = "Активных плановых задач или напоминаний по обслуживанию сейчас нет.";
    if (tasks && Array.isArray(tasks)) {
      const pendingTasks = tasks.filter((t: any) => t.carId === (carProfile?.id) && t.status === "pending");
      if (pendingTasks.length > 0) {
        tasksContextString = pendingTasks.map(t => {
          if (t.type === "mileage") {
            const left = t.targetMileage - (carProfile?.mileage || 0);
            return `- [Задача по пробегу] "${t.title}": целевой пробег ${t.targetMileage} км (текущий пробег автомобиля ${carProfile?.mileage || 0} км, осталось: ${left} км).${left <= 0 ? ' ВНИМАНИЕ: СРОК ВЫПОЛНЕНИЯ ПРЕВЫШЕН (ТРЕБУЕТСЯ СРОЧНОЕ ОБСЛУЖИВАНИЕ!)' : ''}`;
          } else {
            return `- [Календарная задача] "${t.title}": срок до ${t.dueDate || 'не указан'}.`;
          }
        }).join("\n");
      }
    }

    // Keyword search over personal maintenance history
    let historyContextString = "В истории обслуживания нет подходящих записей по этому запросу.";
    const matchingRecords: any[] = [];
    if (records && Array.isArray(records)) {
      const queryLower = question.toLowerCase();
      const filtered = records.filter(r => {
        const descMatch = r.description?.toLowerCase().includes(queryLower) || false;
        const catMatch = r.category?.toLowerCase().includes(queryLower) || false;
        const stemMatch = (queryLower.includes("масл") && r.description?.toLowerCase().includes("масл")) ||
                          (queryLower.includes("свеч") && r.description?.toLowerCase().includes("свеч")) ||
                          (queryLower.includes("грм") && (r.description?.toLowerCase().includes("грм") || r.description?.toLowerCase().includes("ремен"))) ||
                          (queryLower.includes("колод") && (r.description?.toLowerCase().includes("колод") || r.description?.toLowerCase().includes("тормоз")));
        return descMatch || catMatch || stemMatch;
      });
      if (filtered.length > 0) {
        matchingRecords.push(...filtered.slice(0, 3));
        historyContextString = filtered.slice(0, 3).map(r => 
          `[Запись от ${r.date} (Пробег: ${r.mileage} км)]: ${r.description}. Категория: ${r.category}. Использовано: ${r.partsUsed?.join(", ") || "нет деталей"}. Цена запчастей: ${r.partsPrice} руб, Работа: ${r.laborPrice} руб.`
        ).join("\n");
      }
    }

    // Keyword search over warehouse spare parts to find parts in stock matching the user query
    let partsContextString = "На складе нет подходящих запасных частей для данного запроса.";
    if (parts && Array.isArray(parts)) {
      const queryLower = question.toLowerCase();
      const filteredParts = parts.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(queryLower) || false;
        const partNumMatch = p.partNumber?.toLowerCase().includes(queryLower) || false;
        
        const stemMatch = (queryLower.includes("масл") && p.name?.toLowerCase().includes("масл")) ||
                          (queryLower.includes("свеч") && p.name?.toLowerCase().includes("свеч")) ||
                          (queryLower.includes("грм") && (p.name?.toLowerCase().includes("грм") || p.name?.toLowerCase().includes("ремен"))) ||
                          (queryLower.includes("колод") && (p.name?.toLowerCase().includes("колод") || p.name?.toLowerCase().includes("тормоз")));
        return nameMatch || partNumMatch || stemMatch;
      });

      if (filteredParts.length > 0) {
        partsContextString = filteredParts.slice(0, 3).map(p => 
          `[Запчасть] "${p.name}" (Артикул: ${p.partNumber || "нет"}), Кол-во: ${p.quantity}, Цена: ${p.price} руб, Ячейка: ${p.location || "не указана"}.`
        ).join("\n");
      }
    }

    const relevantManuals = CAR_MANUALS_DB.filter(m => {
      const qLower = question.toLowerCase();
      const carMatch = carProfile ? (
        m.car.toLowerCase().includes(carProfile.make.toLowerCase()) || 
        m.car.toLowerCase().includes(carProfile.model.toLowerCase())
      ) : false;
      const contentMatch = qLower.includes(m.category.toLowerCase()) || 
                            m.content.toLowerCase().split(/\s+/).some(word => word.length > 4 && qLower.includes(word));
      return carMatch || contentMatch;
    });

    const contextList = relevantManuals;
    const contextString = contextList.length > 0 
      ? contextList.map(m => `[Руководство ${m.car} - ${m.category}]: ${m.content}`).join("\n\n")
      : "";

    let toneDescription = "Ты — Опытный инженер-механик «Василич». Твой стиль — профессиональный, практичный, с легким гаражным юмором, дружелюбный, но строго технически выверенный. Ты безупречно знаешь конструкцию автомобилей, можешь употреблять слова вроде 'хозяин', 'дядя', 'аппарат'. Твоя цель — дать исчерпывающий, технически точный совет с легким колоритом.";
    if (assistantTone === "strict") {
      toneDescription = "Ты — Строгий технический инженер-консультант. Твой стиль — исключительно профессиональный, сухой, технически выверенный, официальный и лаконичный. Ты не используешь разговорный сленг, шутки или панибратские обращения вроде 'хозяин', 'дядя' и т.д. Опирайся на точные стандарты, каталожные номера и инструкции завода-изготовителя.";
    } else if (assistantTone === "brief") {
      toneDescription = "Ты — Краткий бортовой компьютер-терминал. Твой стиль — предельно лаконичный, сжатый, без лишних слов. Отвечай в виде конкретных списков, прямых цифр и ключевых рекомендаций. Избегай длинных вступлений и подробных рассуждений.";
    }

    const currSymbol = currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "₸";
    const distUnitLabel = distanceUnit === "mi" ? "милях" : "км";

    const systemPrompt = `
Инструкция для ИИ Ассистента:
${toneDescription}

ОТБОР КОНТЕКСТА:
Текущий автомобиль пользователя: ${carContextText}
Выбранная пользователем валюта: ${currSymbol}
Выбранная пользователем единица пробега: в ${distUnitLabel}

ПРАВИЛА И СЦЕНАРИИ ОТВЕТА:
1. Если вопрос касается технических параметров или моментов затяжки (например, 25 Нм для свечей, 35 Нм для ролика ГРМ), тепловых зазоров или зазоров свечей, указывай их обязательно. Если блок RETRIEVED FACTORY MANUALS пуст (то есть мануал под конкретную иномарку или другую модель еще не загружен в базу knowledge_base), ты не должен выдумывать заводские моменты затяжки и параметры, а должен честно сказать: "Инструкцию конкретно на этот аппарат я еще не курил, но по опыту и общим техническим регламентам скажу следующее..." и выдать проверенные общие инженерные рекомендации по озвученной проблеме.
2. Проверь личную историю обслуживания владельца (раздел PERSONAL MAINTENANCE HISTORY). Если пользователь спрашивает про деталь, которую он недавно менял, обязательно упомяни это (например: «Судя по твоим записям, ты менял ГРМ на пробеге 228 000 км. Сейчас у тебя 229 000 км — ремень прошел всего 1 000 км, менять еще очень рано!»).
3. Проверь наличие запасных частей на складе (раздел SPARE PARTS IN STOCK). Если пользователь спрашивает про ремонт или замену узла, и в деталях на складе есть подходящая запчасть, обязательно скажи об этом (укажи точное название, количество, стоимость за единицу и ячейку хранения, если они есть!). Напиши владельцу что-то в духе: «Кстати, заглянул в твои закрома на складе — у тебя там лежит...». Если ничего подходящего на складе нет, то так и скажи.
4. Проверь плановые задачи и ТО (раздел PLANNED TASKS & REMINDERS). Если пользователь спрашивает "что нужно сделать", "какие задачи висят", "что по ТО" или про планирование, вытащи список невыполненных задач и просроченного ТО под текущий пробег и дай дельный совет по ним. Если есть просроченное ТО (где целевой пробег меньше текущего пробега), обязательно поругай владельца за затягивание и посоветуй поскорее сделать обслуживание!
5. Пиши структурированно, красиво оформляя Markdown-разметкой. Используй жирные заголовки, списки, таблицы если необходимо.
6. Ответ давай строго на русском языке, технически грамотно, кратко и по делу.
7. Все числовые значения пробега в тексте указывай в ${distUnitLabel}, а все финансовые величины в ${currSymbol}.

---
RETRIEVED FACTORY MANUALS (Заводские руководства по ремонту):
${contextString}

---
PERSONAL MAINTENANCE HISTORY (История ремонтов этого автомобиля из базы данных):
${historyContextString}

---
SPARE PARTS IN STOCK (Запасные части в наличии на складе):
${partsContextString}

---
PLANNED TASKS & REMINDERS (Запланированные работы и регламентные напоминания):
${tasksContextString}

---
${carContextText}`;

    const response = await getAiClient().models.generateContent({
      model: "gemini-3.6-flash",
      contents: question,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({
      answer: response.text,
      retrievedContexts: contextList.map(m => ({ car: m.car, category: m.category })),
      retrievedHistory: matchingRecords.map(r => ({ date: r.date, description: r.description }))
    });
  } catch (err: any) {
    console.error("Error in RAG assistant:", err);
    res.status(500).json({ error: "Assistant error", details: err.message });
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
