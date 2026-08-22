import { useState, useEffect, useCallback } from 'react';
import { Car, CarDiagram } from '../types';

export function useCarDiagrams(activeCar: Car | null) {
  const [diagrams, setDiagrams] = useState<CarDiagram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedOfflineDiagrams, setSavedOfflineDiagrams] = useState<CarDiagram[]>([]);

  // Load saved offline diagrams for this car
  useEffect(() => {
    if (!activeCar?.id) {
      setSavedOfflineDiagrams([]);
      return;
    }
    try {
      const storageKey = `saved_car_diagrams_${activeCar.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSavedOfflineDiagrams(JSON.parse(saved));
      } else {
        setSavedOfflineDiagrams([]);
      }
    } catch (err) {
      console.error('Failed to load saved diagrams from localStorage:', err);
    }
  }, [activeCar?.id]);

  const searchDiagrams = useCallback(async (customQuery?: string) => {
    setIsLoading(true);
    try {
      const q = customQuery !== undefined ? customQuery : `${activeCar?.make || ''} ${activeCar?.model || ''} схема предохранителей электропроводка`;
      const res = await fetch('/api/diagrams/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: activeCar?.make || 'ВАЗ',
          model: activeCar?.model || '2110',
          year: activeCar?.year || 2008,
          engine: activeCar?.engine,
          query: q
        })
      });
      if (!res.ok) throw new Error('Diagram search failed');
      const data = await res.json();
      setDiagrams(data.diagrams || []);
      return data.diagrams || [];
    } catch (err) {
      console.error('Error searching diagrams:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [activeCar]);

  const toggleSaveOffline = useCallback((diagram: CarDiagram) => {
    if (!activeCar?.id) return;
    const storageKey = `saved_car_diagrams_${activeCar.id}`;
    const exists = savedOfflineDiagrams.some(d => d.id === diagram.id);
    let updated: CarDiagram[];

    if (exists) {
      updated = savedOfflineDiagrams.filter(d => d.id !== diagram.id);
    } else {
      const newDiagramItem: CarDiagram = {
        ...diagram,
        carId: activeCar.id,
        savedAt: new Date().toLocaleDateString('ru-RU')
      };
      updated = [newDiagramItem, ...savedOfflineDiagrams];
    }

    setSavedOfflineDiagrams(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update saved diagrams in localStorage:', err);
    }
  }, [activeCar?.id, savedOfflineDiagrams]);

  const saveCustomDiagram = useCallback((file: File) => {
    if (!activeCar?.id) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const userDiagram: CarDiagram = {
        id: `custom-${Date.now()}`,
        carId: activeCar.id,
        title: file.name.replace(/\.[^/.]+$/, "") || 'Собственная схема',
        category: 'wiring',
        description: `Загруженная пользователем схема / распиновка для ${activeCar.make} ${activeCar.model}.`,
        imageUrl: dataUrl,
        source: 'Галерея / Камера пользователя',
        savedAt: new Date().toLocaleDateString('ru-RU'),
        isCustomSaved: true
      };

      const storageKey = `saved_car_diagrams_${activeCar.id}`;
      const updated = [userDiagram, ...savedOfflineDiagrams];
      setSavedOfflineDiagrams(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save custom diagram:', err);
      }
    };
    reader.readAsDataURL(file);
  }, [activeCar, savedOfflineDiagrams]);

  return {
    diagrams,
    isLoading,
    savedOfflineDiagrams,
    searchDiagrams,
    toggleSaveOffline,
    saveCustomDiagram
  };
}
