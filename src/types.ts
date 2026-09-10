/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarEngineInfo } from './types/car';
import { VehicleMemorySummary } from './types/chat';
export * from './types/car';
export * from './types/chat';

export type BodyType =
  | 'sedan'
  | 'crossover'
  | 'suv'
  | 'hatchback'
  | 'wagon'
  | 'coupe'
  | 'pickup'
  | 'minivan';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  engineInfo?: CarEngineInfo;
  vin?: string;
  licensePlate?: string;
  mileage: number;
  odometer?: number;
  imageUrl?: string;
  bodyType?: BodyType;
  ownerId: string;
  userId?: string;
  notes?: string;
  // Unified CarProfile extensions
  brand?: string;
  generation?: string;
  transmission?: string;
  driveType?: string;
  currentOdometer?: number;
  photoUrl?: string;
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

export interface PartUsageItem {
  partId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface MaintenanceRecord {
  id: string;
  carId: string;
  userId?: string;
  description: string;
  title?: string;
  mileage: number;
  odometer?: number;
  partsPrice: number;
  laborPrice: number;
  date: string;
  category: RecordCategory;
  partsUsed?: string[];
  partsUsedDetails?: PartUsageItem[];
  photoUrls?: string[];
  attachments?: string[];
  photoReceiptUrl?: string;
  voiceTranscript?: string;
  comment?: string;
  totalCost?: number;
  source?: 'manual' | 'task' | 'dtc' | 'ai' | 'voice' | 'obd';
  relatedTaskId?: string;
  relatedDtc?: string;
  relatedPartIds?: string[];
  diagnosticSessionId?: string;
  obdSnapshotId?: string;
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
  reservedQuantity?: number;
  price: number;
  supplier?: string;
  location?: string;
  ownerId?: string;
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

export interface DiagnosticPossibleCause {
  title: string;
  probability?: 'high' | 'medium' | 'low';
  explanation?: string;
}

export interface DiagnosticRecommendedCheck {
  step: number;
  title: string;
  description?: string;
  expectedResult?: string;
  status?: 'pending' | 'passed' | 'failed' | 'skipped';
}

export interface DiagnosticRecommendedPart {
  name: string;
  partNumber?: string;
  quantity?: number;
  reason?: string;
}

export interface DiagnosticAction {
  type:
    | 'confirm_action'
    | 'cancel_action'
    | 'ask_vasilich'
    | 'show_diagram'
    | 'check_inventory'
    | 'create_task'
    | 'open_obd'
    | 'recheck'
    | 'navigate_service'
    | 'show_summary'
    | 'copy_summary';
  label: string;
  payload?: any;
}

export interface DiagnosticResponse {
  summary: string;
  severity: 'info' | 'warning' | 'critical';
  confidence?: number;
  facts?: string[];
  hypotheses?: string[];
  requiresVerification?: string[];
  possibleCauses: DiagnosticPossibleCause[];
  recommendedChecks: DiagnosticRecommendedCheck[];
  recommendedParts: DiagnosticRecommendedPart[];
  actions: DiagnosticAction[];
  safetyWarning?: string;
  relatedDtc?: string;
  sourceContext?: {
    carId?: string;
    obdSnapshotId?: string;
    sessionId?: string;
  };
}

export type DiagnosticSessionStatus = 
  | 'active' 
  | 'waiting_recheck' 
  | 'resolved' 
  | 'unresolved' 
  | 'cancelled';

export interface DiagnosticSessionCheckStep {
  id?: string;
  step?: number;
  title: string;
  action?: string;
  targetComponent?: string;
  procedure?: string;
  expectedResult?: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
  note?: string;
}

export interface DiagnosticSession {
  id: string;
  carId: string;
  startedAt: string;
  completedAt?: string;
  resolvedAt?: string;
  startOdometer: number;
  currentOdometer?: number;
  endOdometer?: number;
  status: DiagnosticSessionStatus;
  initialDtcCodes?: string[];
  currentDtcCodes?: string[];
  finalDtcCodes?: string[];
  initialDtc?: string[]; // Backwards compatibility
  initialObdSnapshot?: ObdSnapshot;
  finalObdSnapshot?: ObdSnapshot;
  initialObdSnapshotId?: string;
  finalObdSnapshotId?: string;
  relatedTaskIds?: string[];
  linkedTaskIds?: string[];
  relatedServiceRecordIds?: string[];
  linkedRecordIds?: string[];
  diagnosticResult?: 'resolved' | 'unresolved' | 'partial' | 'cancelled' | string;
  checks?: DiagnosticSessionCheckStep[];
  stepsHistory?: Array<{
    step: string;
    timestamp: string;
    result?: string;
    title?: string;
    notes?: string;
  }>;
  facts?: string[];
  hypotheses?: string[];
  requiresVerification?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppActionPayload {
  type: 'add_record' | 'update_record' | 'delete_record' | 'update_mileage' | 'add_task' | 'update_car_notes';
  data: any;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  userQuery?: string;
  isWelcome?: boolean;
  taskAdded?: boolean;
  actions?: DiagnosticAction[];
  safetyWarning?: string;
  diagnosticResponse?: DiagnosticResponse;
  suggestedAction?: {
    type: 'add_record' | 'add_part' | 'navigate';
    payload: any;
  };
  pendingAction?: AppActionPayload;
  executedAction?: AppActionPayload;
  actionStatus?: 'pending' | 'executed' | 'cancelled';
  quickOptions?: string[];
  vehicleMemory?: VehicleMemorySummary;
}

export type TaskType = 'simple' | 'mileage';
export type TaskStatus = 'pending' | 'completed';

export interface TaskPartRequirement {
  partId: string;
  quantity: number;
  name?: string;
}

export interface VehicleTask {
  id: string;
  carId: string;
  userId?: string;
  title: string;
  description?: string;
  type: TaskType;
  targetMileage?: number;
  targetDate?: string;
  status: TaskStatus;
  photos?: string[];
  relatedDtc?: string;
  relatedPartIds?: string[];
  requiredParts?: TaskPartRequirement[];
  source?: 'manual' | 'dtc' | 'ai' | 'maintenance' | 'voice' | 'obd';
  obdSnapshotId?: string;
  diagnosticSessionId?: string;
  category?: RecordCategory;
  createdAt: string;
  updatedAt: string;
}

export interface DtcDiagnosisPayload {
  type: 'dtc_diagnosis';
  dtcCode: string;
  dtcDescription: string;
  severity?: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    engine?: string;
    mileage?: number;
    vin?: string;
  };
  obdSnapshot?: ObdSnapshot | null;
  relevantParts?: Part[];
  recentMaintenance?: MaintenanceRecord[];
}

export type Currency = 'KZT' | 'RUB' | 'USD' | 'EUR';
export type DistanceUnit = 'km' | 'mi';
export type VolumeUnit = 'L' | 'gal';
export type PressureUnit = 'bar' | 'kPa' | 'PSI';
export type AssistantTone = 'vasilich' | 'strict' | 'brief';

export interface UserSettings {
  userId?: string;
  currency: Currency;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  pressureUnit?: PressureUnit;
  assistantTone: AssistantTone;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface ObdDtcCode {
  code: string;
  description: string;
  category?: 'Engine' | 'Transmission' | 'Body' | 'Chassis' | string;
  severity?: 'critical' | 'warning' | 'info' | string;
  possibleCauses?: string[];
}

export interface ObdSnapshot {
  timestamp: string;
  isoTimestamp?: string;
  carId?: string;
  deviceName: string;
  mode: 'demo' | 'bluetooth' | 'disconnected';
  telemetry: {
    rpm: number;
    coolantTemp: number;
    speed: number;
    voltage: number;
    throttle?: number;
    fuelTrim?: string;
    maf?: string;
  };
  dtcCodes: ObdDtcCode[];
  carName?: string;
}

export interface CarDiagram {
  id: string;
  carId?: string;
  title: string;
  category: 'fuses' | 'wiring' | 'engine_ecm' | 'lighting' | 'ignition' | string;
  description: string;
  imageUrl: string;
  originalUrl?: string;
  sourceUrl?: string;
  thumbnail?: string;
  source?: string;
  savedAt?: string;
  isCustomSaved?: boolean;
  pinouts?: { pin: string; color: string; signal: string }[];
}




