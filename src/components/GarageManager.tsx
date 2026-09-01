/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Car, BodyType } from '../types';
import { 
  Car as CarIcon, 
  Plus, 
  Trash2,
  Settings,
  Pencil,
  Upload,
  Sparkles,
  Image as ImageIcon,
  X,
  Layers,
  Check,
  Loader2,
  Info
} from 'lucide-react';
import { useUserSettings } from './UserSettingsContext';
import { VehiclePhoto } from './VehiclePhoto';
import { 
  BODY_TYPES, 
  detectBodyType, 
  getAutoMatchingPhoto, 
  fetchCarPhotoOnline,
  compressImageFile 
} from '../lib/vehicleImages';

interface GarageManagerProps {
  cars: Car[];
  activeCarId: string | null;
  onSelectCar: (id: string) => void;
  onAddCar: (car: Omit<Car, 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCar?: (car: Car) => void;
  onDeleteCar?: (id: string) => void;
  onOpenSettings?: () => void;
}

export function GarageManager({ cars, activeCarId, onSelectCar, onAddCar, onUpdateCar, onDeleteCar, onOpenSettings }: GarageManagerProps) {
  const { formatMileage, distanceLabel, unconvertDistance } = useUserSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [engine, setEngine] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState<number>(100000);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [bodyType, setBodyType] = useState<BodyType>('sedan');
  const [isUploading, setIsUploading] = useState(false);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);
  const [photoSearchMessage, setPhotoSearchMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setEditingCarId(null);
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setEngine('');
    setVin('');
    setLicensePlate('');
    setMileage(100000);
    setImageUrl('');
    setBodyType('sedan');
    setPhotoSearchMessage(null);
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    setEditingCarId(null);
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setEngine('');
    setVin('');
    setLicensePlate('');
    setMileage(100000);
    setImageUrl('');
    setBodyType('sedan');
    setPhotoSearchMessage(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (car: Car) => {
    setEditingCarId(car.id);
    setMake(car.make);
    setModel(car.model);
    setYear(car.year);
    setEngine(car.engine || '');
    setVin(car.vin || '');
    setLicensePlate(car.licensePlate || '');
    setMileage(car.mileage);
    setImageUrl(car.imageUrl || '');
    setBodyType((car.bodyType as BodyType) || detectBodyType(car.make, car.model));
    setPhotoSearchMessage(null);
    setShowAddForm(true);
  };

  const handleMakeModelChange = (newMake: string, newModel: string) => {
    setMake(newMake);
    setModel(newModel);
    // Auto-detect body type if not explicitly customized
    const detected = detectBodyType(newMake, newModel);
    setBodyType(detected);
  };

  // Upload image file and compress
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setPhotoSearchMessage(null);
      const compressedDataUrl = await compressImageFile(file, 900, 0.82);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.error('Ошибка загрузки фото:', err);
      alert('Не удалось обработать файл изображения. Попробуйте другой формат (JPG, PNG, WebP).');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Auto-pick photo based on exact make & model via search API and verified OEM catalog
  const handleAutoPickPhoto = async () => {
    if (!make.trim()) {
      alert('Сначала укажите марку автомобиля');
      return;
    }

    try {
      setIsSearchingPhoto(true);
      setPhotoSearchMessage(null);
      const result = await fetchCarPhotoOnline(make, model, year);

      if (result.found && result.imageUrl) {
        setImageUrl(result.imageUrl);
        setPhotoSearchMessage(`Фото подобрано для ${make} ${model}`);
      } else {
        setImageUrl('');
        setPhotoSearchMessage('Точное фото для данной модели не найдено. Оставлен стильный векторный силуэт кузова.');
      }
    } catch (err) {
      console.error('Error auto-picking photo:', err);
      const staticMatch = getAutoMatchingPhoto(make, model);
      if (staticMatch) {
        setImageUrl(staticMatch);
        setPhotoSearchMessage(`Фото подобрано для ${make} ${model}`);
      } else {
        setImageUrl('');
        setPhotoSearchMessage('Фото не найдено. Оставлен векторный силуэт.');
      }
    } finally {
      setIsSearchingPhoto(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteCar) return;

    if (cars.length <= 1) {
      alert('Нельзя удалить единственный автомобиль из гаража');
      return;
    }

    if (window.confirm('Вы действительно хотите удалить этот автомобиль из гаража?')) {
      onDeleteCar(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) return;

    const finalBodyType = bodyType || detectBodyType(make, model);

    if (editingCarId && onUpdateCar) {
      const existingCar = cars.find(c => c.id === editingCarId);
      if (existingCar) {
        onUpdateCar({
          ...existingCar,
          make: make.trim(),
          model: model.trim(),
          year,
          engine: engine.trim() || undefined,
          vin: vin.trim() || undefined,
          licensePlate: licensePlate.trim() || undefined,
          mileage: unconvertDistance(mileage),
          imageUrl: imageUrl.trim() || undefined,
          bodyType: finalBodyType,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      onAddCar({
        id: Math.random().toString(36).substr(2, 9),
        make: make.trim(),
        model: model.trim(),
        year,
        engine: engine.trim() || undefined,
        vin: vin.trim() || undefined,
        licensePlate: licensePlate.trim() || undefined,
        mileage: unconvertDistance(mileage),
        imageUrl: imageUrl.trim() || undefined,
        bodyType: finalBodyType,
      });
    }

    resetForm();
  };

  const activeCar = cars.find(c => c.id === activeCarId);

  return (
    <div className="bg-[#111622] border border-[#1E273D] rounded-2xl p-4 sm:p-5 relative font-sans overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1E273D] pb-3 mb-3.5 gap-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <CarIcon className="w-4 h-4 text-[#06B6D4] shrink-0" />
            <span className="truncate">Автомобили в гараже</span>
          </h3>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Выберите активный автомобиль для работы с ТО, графиками и Василичем
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end shrink-0 w-full sm:w-auto">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(15);
                onOpenSettings();
              }}
              className="text-xs font-medium text-slate-300 hover:text-white bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Настройки"
              id="btn-garage-settings-shortcut"
            >
              <Settings className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
              <span className="hidden sm:inline">Настройки</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (showAddForm && !editingCarId) {
                setShowAddForm(false);
              } else {
                handleStartAdd();
              }
            }}
            className="btn-primary text-xs flex items-center gap-1 cursor-pointer shrink-0 rounded-xl"
            id="btn-toggle-add-car"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{showAddForm ? 'Скрыть форму' : 'Добавить авто'}</span>
          </button>
        </div>
      </div>

      {/* 1. Add / Edit Car Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#151C2C] border border-[#1E273D] p-3.5 sm:p-4 rounded-xl mb-3.5 space-y-3 relative shadow-md">
          <div className="text-xs font-semibold text-[#06B6D4] mb-1 flex items-center justify-between">
            <span>{editingCarId ? 'Редактирование автомобиля' : 'Новый автомобиль'}</span>
            <span className="text-[10px] text-slate-400 font-mono">ID: {editingCarId || 'AUTO'}</span>
          </div>

          {/* Photo Preview & Controls Card */}
          <div className="p-3 bg-[#0B0E14] border border-[#1E273D] rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Live Preview */}
              <div className="w-full sm:w-44 h-28 shrink-0">
                <VehiclePhoto
                  car={{ make, model, imageUrl, bodyType }}
                  size="md"
                  className="w-full h-full rounded-xl"
                  showBadge
                />
              </div>

              {/* Photo Action Controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="text-[11px] font-medium text-slate-300">
                  Фотография автомобиля
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    id="car-photo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isSearchingPhoto}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Сжатие...' : 'Загрузить фото'}</span>
                  </button>

                  {/* Auto-Pick Photo */}
                  <button
                    type="button"
                    onClick={handleAutoPickPhoto}
                    disabled={isSearchingPhoto || isUploading}
                    className="bg-[#151C2C] hover:bg-[#1E273D] text-slate-200 border border-[#1E273D] hover:border-cyan-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="Подобрать подходящее фото по марке и модели"
                  >
                    {isSearchingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{isSearchingPhoto ? 'Поиск...' : 'Авто-подбор фото'}</span>
                  </button>

                  {/* Reset Photo (Use Silhouette) */}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setPhotoSearchMessage(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Сбросить фото на векторный силуэт"
                    >
                      <X className="w-3 h-3" />
                      <span>Вектор</span>
                    </button>
                  )}
                </div>

                {photoSearchMessage && (
                  <div className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2 py-1 rounded-md flex items-center gap-1.5">
                    <Info className="w-3 h-3 shrink-0 text-cyan-400" />
                    <span>{photoSearchMessage}</span>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 leading-snug">
                  Если точное фото не найдено — отображается точный векторный силуэт кузова.
                </div>
              </div>
            </div>

            {/* Body Type Selector */}
            <div className="pt-2 border-t border-[#1E273D]/60">
              <label className="text-[11px] text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#06B6D4]" />
                <span>Тип кузова (для векторного силуэта)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {BODY_TYPES.map((bt) => {
                  const isSelected = bodyType === bt.id;
                  return (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setBodyType(bt.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-[#10151E] border-[#1E273D] text-slate-400 hover:text-slate-200 hover:bg-[#151C2C]'
                      }`}
                    >
                      <span className="truncate">{bt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Марка *</label>
              <input
                type="text"
                required
                placeholder="Lada, Toyota, Kia, BMW..."
                value={make}
                onChange={(e) => handleMakeModelChange(e.target.value, model)}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-make"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Модель *</label>
              <input
                type="text"
                required
                placeholder="Granta, Camry, RAV4, Rio..."
                value={model}
                onChange={(e) => handleMakeModelChange(make, e.target.value)}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-model"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Год выпуска</label>
              <input
                type="number"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-year"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Пробег ({distanceLabel})</label>
              <input
                type="number"
                required
                min="0"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-mileage"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Госномер</label>
              <input
                type="text"
                placeholder="A123BC77"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-plate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">Двигатель</label>
              <input
                type="text"
                placeholder="1.6L 16V, 2.0 TSI, 2.5L..."
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400"
                id="car-engine"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-300 font-medium mb-1">VIN-код (17 знаков)</label>
              <input
                type="text"
                placeholder="WBAAN310XXXXXXXXX"
                maxLength={17}
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="border border-[#1E273D] bg-[#0B0E14] p-2 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                id="car-vin"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary text-xs rounded-xl cursor-pointer"
              id="btn-car-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary text-xs rounded-xl cursor-pointer"
              id="btn-car-save"
            >
              {editingCarId ? 'Сохранить изменения' : 'Добавить авто'}
            </button>
          </div>
        </form>
      )}

      {/* 2. Active Cars List */}
      <div className="space-y-2">
        {cars.length === 0 ? (
          <div className="p-6 bg-[#0B0E14] border border-dashed border-[#1E273D] rounded-xl text-center space-y-2.5">
            <p className="text-xs text-slate-400 font-sans">
              В вашем гараже еще нет добавленных автомобилей.
            </p>
            <button
              onClick={handleStartAdd}
              className="btn-primary text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить первый автомобиль</span>
            </button>
          </div>
        ) : (
          cars.map((car) => {
            const isActive = car.id === activeCarId;
            return (
              <div
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className={`p-2.5 sm:p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all relative overflow-hidden border ${
                  isActive 
                    ? 'bg-[#151C2C] border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/20' 
                    : 'bg-[#0B0E14] border-[#1E273D] hover:border-cyan-500/30 hover:bg-[#151C2C]/50'
                }`}
                id={`car-item-${car.id}`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#06B6D4] text-slate-950 text-[9px] font-bold uppercase rounded-bl-lg">
                    Выбран
                  </div>
                )}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Dynamic Vehicle Avatar / Photo Preview */}
                  <div className="w-14 sm:w-16 h-10 sm:h-11 shrink-0">
                    <VehiclePhoto 
                      car={car} 
                      size="sm" 
                      className="w-full h-full rounded-lg"
                    />
                  </div>

                  <div className="min-w-0 truncate">
                    <h4 className="text-xs sm:text-sm font-semibold text-white font-sans truncate">
                      {car.make} {car.model}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-sans mt-0.5">
                      <span className="font-mono text-slate-300">{car.year} г.в.</span>
                      <span>·</span>
                      <span className="font-mono text-cyan-300">{formatMileage(car.mileage)}</span>
                      {car.licensePlate && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-200">{car.licensePlate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(car);
                    }}
                    className="p-1.5 bg-[#151C2C] hover:bg-[#1C253B] border border-[#1E273D] text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                    title="Редактировать авто и фото"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#06B6D4]" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, car.id)}
                    className="p-1.5 bg-[#151C2C] hover:bg-rose-950/30 border border-[#1E273D] hover:border-rose-500/40 text-rose-400 rounded-lg cursor-pointer transition-colors"
                    title="Удалить"
                    id={`btn-del-car-${car.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Car Tech Sheet */}
      {activeCar && (
        <div className="mt-4 pt-3.5 border-t border-[#1E273D] text-xs font-sans text-slate-300">
          <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center mb-3">
            <div className="w-full sm:w-48 h-28 shrink-0">
              <VehiclePhoto 
                car={activeCar} 
                size="md" 
                className="w-full h-full rounded-xl"
                showBadge 
              />
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              <div className="text-[12px] text-[#06B6D4] font-semibold">
                Техпаспорт: {activeCar.make} {activeCar.model} ({activeCar.year} г.в.)
              </div>
              <div className="flex justify-between border-b border-[#1E273D]/60 pb-1 text-xs">
                <span className="text-slate-400">VIN:</span>
                <span className="text-slate-100 font-mono">{activeCar.vin || 'Не указан'}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E273D]/60 pb-1 text-xs">
                <span className="text-slate-400">Госномер:</span>
                <span className="text-slate-100 font-mono">{activeCar.licensePlate || 'Не указан'}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E273D]/60 pb-1 text-xs">
                <span className="text-slate-400">Двигатель:</span>
                <span className="text-slate-100 font-sans">{activeCar.engine || 'Не указан'}</span>
              </div>
              <div className="flex justify-between text-xs pt-0.5">
                <span className="text-slate-400">Текущий пробег:</span>
                <span className="text-cyan-300 font-mono font-bold">{formatMileage(activeCar.mileage)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

