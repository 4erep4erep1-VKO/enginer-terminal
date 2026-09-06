/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CarProfile, ServiceRecord } from './car';
import { FluidHealthCalculation, FluidKey } from '../lib/calcFluidHealth';
import { MaintenanceRecord, Car, DiagnosticResponse, AppActionPayload } from '../types';

export type DiagnosticStepType = 'question' | 'inspection' | 'conclusion' | 'action';

export interface DiagnosticQuickOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

export interface InteractiveDiagnosticState {
  isActive: boolean;
  symptom?: string;
  stepNumber: number;
  totalSteps?: number;
  currentQuestion?: string;
  quickOptions?: DiagnosticQuickOption[];
  detectedSuspects?: string[];
  crossReferencedHistory?: {
    recordTitle: string;
    date?: string;
    mileage?: number;
    relevanceNote: string;
  }[];
}

export interface VehicleMemorySummary {
  carHeadline: string;
  currentOdometer: number;
  recordsCount: number;
  lastServiceTitle?: string;
  lastServiceKm?: number;
  lastServiceDate?: string;
  fluidsSummary: {
    key: FluidKey;
    name: string;
    health: number;
    isOverdue: boolean;
    statusText: string;
  }[];
  criticalWarnings: string[];
}

export interface BuildVehicleContextOptions {
  car: CarProfile | Car | null;
  history: (ServiceRecord | MaintenanceRecord)[];
  query?: string;
  activeDtcs?: string[];
  tasks?: any[];
  userPreferences?: {
    tone?: 'vasilich' | 'engineer' | 'concise';
  };
}

export interface VehicleContextResult {
  formattedContext: string;
  passportBlock: string;
  recentRepairsBlock: string;
  fluidsLifecycleBlock: string;
  diagnosticAdviceBlock: string;
  fluidsHealth: Record<FluidKey, FluidHealthCalculation> | null;
  memorySummary: VehicleMemorySummary;
  matchedPastRecords: (ServiceRecord | MaintenanceRecord)[];
}
