/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  mileage: number;
  ownerId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordCategory =
  | 'Engine'
  | 'Suspension'
  | 'Brakes'
  | 'Transmission'
  | 'Electrical'
  | 'Body'
  | 'Oil & Fluids'
  | 'Diagnostics'
  | 'Other';

export interface MaintenanceRecord {
  id: string;
  carId: string;
  userId?: string;
  description: string;
  mileage: number;
  partsPrice: number;
  laborPrice: number;
  date: string;
  category: RecordCategory;
  partsUsed?: string[];
  photoUrls?: string[];
  voiceTranscript?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  carId?: string;
  userId?: string;
  name: string;
  partNumber?: string;
  quantity: number;
  price: number;
  supplier?: string;
  location?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsingResult {
  description: string;
  mileage?: number;
  partsPrice?: number;
  laborPrice?: number;
  category?: RecordCategory;
  partsUsed?: string[];
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'add_record' | 'add_part' | 'navigate';
    payload: any;
  };
}

export type TaskType = 'simple' | 'mileage';
export type TaskStatus = 'pending' | 'completed';

export interface VehicleTask {
  id: string;
  carId: string;
  userId?: string;
  title: string;
  type: TaskType;
  targetMileage?: number;
  targetDate?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'KZT' | 'RUB' | 'USD' | 'EUR';
export type DistanceUnit = 'km' | 'mi';
export type VolumeUnit = 'L' | 'gal';
export type AssistantTone = 'vasilich' | 'strict' | 'brief';

export interface UserSettings {
  userId?: string;
  currency: Currency;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  assistantTone: AssistantTone;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}



