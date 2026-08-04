/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ParsingResult, RecordCategory } from '../types';

const categoryMap: Record<string, RecordCategory> = {
  'Двигатель': 'Engine',
  'Подвеска': 'Suspension',
  'Электрика': 'Electrical',
  'Тормоза': 'Brakes',
  'Расходники': 'Oil & Fluids'
};

export function useRecordParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsingResult | null>(null);

  const parseRecordText = async (text: string, currentMileage?: number): Promise<ParsingResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/parse-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, currentMileage }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status} failed to parse transcript.`);
      }

      const rawData = await response.json();
      
      // Map the rigid Gemini response schema to front-end expected properties
      const mappedResult: ParsingResult = {
        description: rawData.title || rawData.description || text,
        mileage: rawData.mileage || currentMileage,
        partsPrice: rawData.parts_cost || 0,
        laborPrice: rawData.labor_cost || 0,
        category: categoryMap[rawData.category] || 'Engine',
        partsUsed: rawData.description ? [rawData.description] : []
      };

      setResult(mappedResult);
      return mappedResult;
    } catch (err: any) {
      console.error('Record parser error:', err);
      setError(err.message || 'Unknown parsing error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    parseRecordText,
    clearResult,
    isLoading,
    error,
    result,
  };
}
