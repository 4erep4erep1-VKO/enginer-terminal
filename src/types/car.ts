/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Car Engine Specs
 */
export interface CarEngineInfo {
  volume: string;      // e.g. "1.6л"
  type: string;        // e.g. "Бензин", "Дизель", "Гибрид", "Электро"
  power?: string;      // e.g. "106 л.с."
  code?: string;       // e.g. "VAZ-21127", "M54B30"
}

/**
 * Single Unified "Car Passport" Interface (CarProfile)
 */
export interface CarProfile {
  id: string;
  brand: string;                                    // Марка (LADA, Toyota, BMW, etc.)
  model: string;                                    // Модель (Granta FL, Camry, 320i, etc.)
  generation?: string;                              // Поколение (e.g. "FL", "XV70", "E90")
  year: number;                                     // Год выпуска
  engine: CarEngineInfo | string;                   // Двигатель (объект или форматированная строка)
  transmission: string;                             // МКПП / АКПП / Робот / Вариатор
  driveType?: string;                               // Передний / Задний / Полный
  vin?: string;                                     // VIN-номер
  licensePlate?: string;                            // Гос. номер
  currentOdometer: number;                          // Текущий пробег (км)
  photoUrl?: string;                                // URL или base64 фото автомобиля
  notes?: string;                                   // Пользовательские заметки

  // Backward-compatibility properties with legacy Car type
  make?: string;                                    // Alias for brand
  mileage?: number;                                 // Alias for currentOdometer
  imageUrl?: string;                                // Alias for photoUrl
  ownerId?: string;
  userId?: string;
  bodyType?: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Service Record Categories
 */
export type ServiceCategory = 'maintenance' | 'repair' | 'symptom' | 'tuning';

/**
 * Part used in service
 */
export interface ServicePartUsed {
  name: string;
  price?: number;
  partNumber?: string;
  quantity?: number;
}

/**
 * Single Unified Service Record Interface
 */
export interface ServiceRecord {
  id: string;
  carId: string;
  date: string;                                     // ISO string (YYYY-MM-DD or full ISO)
  odometer: number;                                 // Пробег на момент ТО
  title: string;                                    // Что произошло / Название работы
  category: ServiceCategory;                        // 'maintenance' | 'repair' | 'symptom' | 'tuning'
  worksDone: string[];                              // Выполненные работы
  partsUsed: ServicePartUsed[];                     // Использованные запчасти и жидкости
  costWork: number;                                 // Стоимость работ
  costParts: number;                                // Стоимость запчастей
  totalCost: number;                                // Общая стоимость
  comment?: string;                                 // Комментарий / Заметка
  source: 'voice' | 'text' | 'manual' | 'receipt_photo';

  // Backward-compatibility aliases for legacy MaintenanceRecord
  description?: string;                             // Alias for title
  mileage?: number;                                 // Alias for odometer
  partsPrice?: number;                              // Alias for costParts
  laborPrice?: number;                              // Alias for costWork
  relatedDtc?: string;
  relatedTaskId?: string;
  voiceTranscript?: string;
  attachments?: string[];
  photoUrls?: string[];
  photoReceiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Structured Parsed Entry from Voice / Text Input before confirmation
 */
export interface ParsedServiceEntry {
  title: string;
  odometer: number;
  worksDone: string[];
  partsUsed: ServicePartUsed[];
  costParts: number;
  costWork: number;
  totalCost: number;
  category: ServiceCategory;
  comment?: string;
  rawTranscript: string;
  photoUrls?: string[];
  attachments?: string[];
}
