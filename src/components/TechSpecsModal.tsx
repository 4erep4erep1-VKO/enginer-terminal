/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Car, CarDiagram } from '../types';
import { DiagramLightboxModal } from './DiagramLightboxModal';
import { DiagramImage } from './DiagramImage';
import { useCarDiagrams } from '../hooks/useCarDiagrams';
import { 
  BookOpen, 
  X, 
  Wrench, 
  Zap, 
  Bot, 
  Gauge, 
  Sliders, 
  Layers, 
  Table,
  Check,
  AlertCircle,
  Search,
  Droplets,
  Disc,
  Wind,
  Cpu,
  Filter,
  Image,
  BookmarkCheck,
  Bookmark,
  ZoomIn,
  Loader2,
  RefreshCw,
  Upload,
  Plus
} from 'lucide-react';

interface TechSpecsModalProps {
  activeCar: Car | null;
  onClose: () => void;
  onAskVasilich: (question: string) => void;
}

export interface SpecCategory {
  id: 'all' | 'engine' | 'fluids' | 'electrics' | 'chassis' | 'climate' | 'diagrams';
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface SpecItem {
  id: string;
  categoryId: 'engine' | 'fluids' | 'electrics' | 'chassis' | 'climate';
  badge: string;
  title: string;
  shortDesc: string;
  sectionTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: SpecCategory[] = [
  { id: 'all', title: 'Все разделы', icon: Table },
  { id: 'diagrams', title: 'Схемы и электрика', icon: Image },
  { id: 'engine', title: 'Двигатель и ГБЦ', icon: Cpu },
  { id: 'fluids', title: 'Жидкости и объемы', icon: Droplets },
  { id: 'electrics', title: 'Электрика и датчики', icon: Zap },
  { id: 'chassis', title: 'Ходовая и тормоза', icon: Disc },
  { id: 'climate', title: 'Климат и кондиционер', icon: Wind },
];

const SPEC_ITEMS: SpecItem[] = [
  // --- ДВИГАТЕЛЬ И ГБЦ ---
  {
    id: 'engine-torque',
    categoryId: 'engine',
    badge: 'Крутящие моменты',
    title: 'Моменты затяжки ДВС и ГБЦ',
    shortDesc: 'Моменты затяжки болтов ГБЦ, крышки клапанов, поддона, шатунных и коренных вкладышей, свечей зажигания.',
    sectionTitle: 'Моменты затяжки (ГБЦ, крышка клапанов, поддон, шатунные/коренные вкладыши, свечи)',
    icon: Wrench,
  },
  {
    id: 'engine-valves',
    categoryId: 'engine',
    badge: 'Зазоры ГРМ',
    title: 'Регулировка зазоров клапанов',
    shortDesc: 'Порядок, тепловые зазоры впускных и выпускных клапанов (на холодную и на горячую), размеры шайб/гидрокомпенсаторы.',
    sectionTitle: 'Порядок и зазоры регулировки клапанов (впуск/выпуск, на холодную/горячую)',
    icon: Sliders,
  },
  {
    id: 'engine-timing',
    categoryId: 'engine',
    badge: 'ГРМ / Цепь',
    title: 'Схема и метки установки ГРМ',
    shortDesc: 'Совмещение шкивов, метки распредвала и коленвала, процедура натяжения ремня или цепи ГРМ.',
    sectionTitle: 'Схема и метки установки ГРМ / цепи',
    icon: Cpu,
  },
  {
    id: 'engine-compression',
    categoryId: 'engine',
    badge: 'Диагностика ЦПГ',
    title: 'Компрессия цилиндров',
    shortDesc: 'Заводская норма компрессии (бар), минимальный допустимый порог и предельный перепад между цилиндрами.',
    sectionTitle: 'Компрессия (норма, минимально допустимая, разница по цилиндрам)',
    icon: Gauge,
  },

  // --- ТЕХНИЧЕСКИЕ ЖИДКОСТИ И ОБЪЕМЫ ---
  {
    id: 'fluids-engine-oil',
    categoryId: 'fluids',
    badge: 'Моторное масло',
    title: 'Моторное масло и фильтрация',
    shortDesc: 'Заправочный объем с фильтром, вязкость SAE (5W-30/5W-40), допуски API/ACEA, интервал сервиса.',
    sectionTitle: 'Моторное масло (объем, допуски SAE/API, период замены)',
    icon: Droplets,
  },
  {
    id: 'fluids-gear-oil',
    categoryId: 'fluids',
    badge: 'Трансмиссия',
    title: 'Масло КПП / АКПП / Редуктора',
    shortDesc: 'Заправочный объем трансмиссионного масла, спецификации (75W-90, ATF, GL-4/GL-5) и регламент.',
    sectionTitle: 'Масло КПП/АКПП/Редуктора (объем, тип)',
    icon: Layers,
  },
  {
    id: 'fluids-coolant',
    categoryId: 'fluids',
    badge: 'Охлаждение',
    title: 'Охлаждающая жидкость (Антифриз)',
    shortDesc: 'Полный объем системы охлаждения, рекомендованный тип антифриза (G11, G12, G12+, G13) и развоздушивание.',
    sectionTitle: 'Охлаждающая жидкость (объем, тип антифриза)',
    icon: Droplets,
  },
  {
    id: 'fluids-brake-powersteering',
    categoryId: 'fluids',
    badge: 'Тормоза и ГУР',
    title: 'Тормозная жидкость и ГУР',
    shortDesc: 'Допуски тормозной жидкости (DOT4, DOT5.1), спецжидкости гидроусилителя руля (Pentosin, ATF) и объемы.',
    sectionTitle: 'Тормозная жидкость и ГУР (допуски DOT/Power Steering)',
    icon: Layers,
  },

  // --- ЭЛЕКТРООБОРУДОВАНИЕ И ДАТЧИКИ ---
  {
    id: 'electrics-fuses',
    categoryId: 'electrics',
    badge: 'Предохранители',
    title: 'Блоки предохранителей и реле',
    shortDesc: 'Назначение, номинал и схема расположения предохранителей в салоне и подкапотном блоке.',
    sectionTitle: 'Схема блоков предохранителей и реле (номиналы, назначение цепей)',
    icon: Zap,
  },
  {
    id: 'electrics-sensors',
    categoryId: 'electrics',
    badge: 'Датчики и ЭБУ',
    title: 'Параметры датчиков и сопротивления',
    shortDesc: 'Эталонные значения сопротивления (Ом) ДТОЖ, ДПКВ, ДПРВ, ДПДЗ, ДМРВ и напряжение лямбда-зондов.',
    sectionTitle: 'Параметры и сопротивления датчиков (ДТОЖ, ДПКВ, ДПДЗ, ДМРВ, лямбда)',
    icon: Cpu,
  },
  {
    id: 'electrics-spark-plugs',
    categoryId: 'electrics',
    badge: 'Свечи зажигания',
    title: 'Свечи зажигания и катушки',
    shortDesc: 'Калильное число, маркировка OEM (NGK/Denso/Bosch), межэлектродный зазор (мм) и сопротивление ВВ-проводов.',
    sectionTitle: 'Свечи зажигания (маркировка OEM, зазор между электродами, сопротивление проводов)',
    icon: Zap,
  },

  // --- ХОДОВАЯ И ТОРМОЗНАЯ СИСТЕМА ---
  {
    id: 'chassis-alignment',
    categoryId: 'chassis',
    badge: 'Сход-Развал',
    title: 'Углы установки колес (Сход-развал)',
    shortDesc: 'Заводские параметры схождения, развала и кастера (продольного наклона оси) для передней и задней оси.',
    sectionTitle: 'Углы установки колес (сход, развал, кастер)',
    icon: Disc,
  },
  {
    id: 'chassis-brakes',
    categoryId: 'chassis',
    badge: 'Тормозные диски',
    title: 'Толщина дисков и колодок',
    shortDesc: 'Номинальная и минимально допустимая остаточная толщина передних/задних дисков, барабанов и колодок (мм).',
    sectionTitle: 'Минимально допустимая толщина тормозных дисков и колодок',
    icon: Disc,
  },

  // --- КЛИМАТ И КОНДИЦИОНЕР ---
  {
    id: 'climate-freon',
    categoryId: 'climate',
    badge: 'Фреон A/C',
    title: 'Заправка автокондиционера',
    shortDesc: 'Тип хладагента (R134a/R1234yf), заправочный вес фреона (граммы) и объем компрессорного масла PAG/POE.',
    sectionTitle: 'Кондиционер (тип фреона, масса заправки в граммах, тип и объем компрессорного масла)',
    icon: Wind,
  },
];

export function TechSpecsModal({ activeCar, onClose, onAskVasilich }: TechSpecsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SpecCategory['id']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [diagramSearchInput, setDiagramSearchInput] = useState('');
  const [selectedLightboxDiagram, setSelectedLightboxDiagram] = useState<CarDiagram | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const carName = activeCar ? `${activeCar.make} ${activeCar.model}` : 'Автомобиль';

  const {
    diagrams,
    savedOfflineDiagrams,
    isLoading: isLoadingDiagrams,
    searchDiagrams,
    toggleSaveOffline,
    saveCustomDiagram,
  } = useCarDiagrams(activeCar);

  const handleSearchDiagrams = (customQuery?: string) => {
    const q = customQuery || diagramSearchInput.trim() || undefined;
    searchDiagrams(q);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    saveCustomDiagram(file);
  };

  useEffect(() => {
    if (selectedCategory === 'diagrams' && diagrams.length === 0) {
      handleSearchDiagrams();
    }
  }, [selectedCategory]);

  const handleToggleSaveOffline = (diagram: CarDiagram) => {
    toggleSaveOffline(diagram);
  };

  const filteredItems = useMemo(() => {
    return SPEC_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        item.title.toLowerCase().includes(query) ||
        item.shortDesc.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query) ||
        item.sectionTitle.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSelectPreset = (item: SpecItem) => {
    const carMake = activeCar?.make || 'выбранного';
    const carModel = activeCar?.model || 'автомобиля';
    const carYear = activeCar?.year ? `${activeCar.year} г.в.` : '';
    const carEngine = activeCar?.engine || 'стандартный';

    const fullPrompt = `Выдай точные заводские параметры и OEM-спецификации из сервисного мануала для автомобиля ${carMake} ${carModel} (${carYear}, двигатель ${carEngine}) по разделу: ${item.sectionTitle}. Оформи ответ в виде четкой таблицы с единицами измерения (Н·м, мм, л, Ом, бар).`;

    onAskVasilich(fullPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md transition-all duration-300 font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[calc(100vh-80px)] md:max-h-[92vh] mb-14 md:mb-0 flex flex-col overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] text-cyan-400 tracking-wider font-semibold uppercase flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>OEM-Справочник механика</span>
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>Спецификации:</span>
              <span className="text-cyan-300">{carName}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Закрыть справочник"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Active Car passport HUD */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Live Filter Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по параметрам (свечи, затяжка, предохранитель, масло)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Car Info Tag */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-3 shrink-0 text-xs">
              <span className="text-slate-400">Автомобиль:</span>
              <span className="text-cyan-300 font-semibold">
                {activeCar ? `${activeCar.make} ${activeCar.model} (${activeCar.year})` : 'Не выбран'}
              </span>
            </div>
          </div>

          {/* Categories Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.id;
              const count = cat.id === 'all' 
                ? SPEC_ITEMS.length 
                : SPEC_ITEMS.filter(i => i.categoryId === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area with Cards or Diagrams */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {selectedCategory === 'diagrams' ? (
            <div className="space-y-5">
              {/* Diagrams Search Control Header */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Запрос для схемы (${activeCar ? `${activeCar.make} ${activeCar.model}` : 'автомобиля'})...`}
                      value={diagramSearchInput}
                      onChange={(e) => setDiagramSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchDiagrams()}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    onClick={() => handleSearchDiagrams()}
                    disabled={isLoadingDiagrams}
                    className="btn-primary min-h-[40px] px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingDiagrams ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    <span>Найти схемы электропроводки</span>
                  </button>
                </div>

                {/* Query Quick Presets & Upload */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Быстрые запросы:</span>
                    <button
                      onClick={() => {
                        const q = `${activeCar?.make || ''} ${activeCar?.model || ''} схема предохранителей и реле распиновка`;
                        setDiagramSearchInput(q);
                        handleSearchDiagrams(q);
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 text-xs rounded-lg cursor-pointer"
                    >
                      ⚡ Предохранители
                    </button>
                    <button
                      onClick={() => {
                        const q = `${activeCar?.make || ''} ${activeCar?.model || ''} распиновка ЭБУ и датчиков`;
                        setDiagramSearchInput(q);
                        handleSearchDiagrams(q);
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 text-xs rounded-lg cursor-pointer"
                    >
                      🔌 Распиновка ЭБУ
                    </button>
                    <button
                      onClick={() => {
                        const q = `${activeCar?.make || ''} ${activeCar?.model || ''} схема зажигания генератор стартер`;
                        setDiagramSearchInput(q);
                        handleSearchDiagrams(q);
                      }}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 text-xs rounded-lg cursor-pointer"
                    >
                      🔋 Генератор и стартер
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleCustomFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary min-h-[34px] px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Загрузить свою схему</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Diagrams Grid */}
              <div className="space-y-3">
                {isLoadingDiagrams ? (
                  <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      Идет поиск схем электропроводки и документации...
                    </p>
                  </div>
                ) : diagrams.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl">
                    <Image className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      Схемы не найдены. Попробуйте уточнить поисковый запрос выше.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {diagrams.map((diag) => {
                      const isSaved = savedOfflineDiagrams.some(d => d.id === diag.id);
                      return (
                        <div
                          key={diag.id}
                          className="border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden hover:border-cyan-400 transition-all flex flex-col justify-between group"
                        >
                          <div 
                            onClick={() => setSelectedLightboxDiagram(diag)}
                            className="relative h-44 bg-slate-900 cursor-pointer overflow-hidden group/img border-b border-slate-800 flex items-center justify-center p-2"
                          >
                            <DiagramImage
                              diagram={diag}
                              carName={carName}
                              className="max-h-full max-w-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="px-3 py-1.5 bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1">
                                <ZoomIn className="w-4 h-4" />
                                Масштаб
                              </span>
                            </div>
                            <span className="absolute top-2 left-2 text-[10px] font-semibold text-cyan-300 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800">
                              {diag.category}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-slate-100 leading-tight group-hover:text-cyan-300 transition-colors">
                                {diag.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {diag.description}
                              </p>
                            </div>

                            <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
                              <button
                                onClick={() => setSelectedLightboxDiagram(diag)}
                                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Открыть</span>
                              </button>

                              <button
                                onClick={() => handleToggleSaveOffline(diag)}
                                className={`py-1.5 px-3 rounded-lg border text-xs transition-all flex items-center gap-1 cursor-pointer ${
                                  isSaved
                                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-400'
                                }`}
                                title={isSaved ? 'Сохранено оффлайн' : 'Сохранить для работы без интернета'}
                              >
                                {isSaved ? (
                                  <>
                                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>В гараже</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Сохранить</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Offline Saved Diagrams Section */}
              {savedOfflineDiagrams.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                    <span>Сохраненные оффлайн-схемы в гараже ({savedOfflineDiagrams.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {savedOfflineDiagrams.map((savedDiag) => (
                      <div
                        key={`saved-${savedDiag.id}`}
                        className="bg-slate-950 border border-emerald-800/40 p-2.5 rounded-xl flex flex-col justify-between hover:border-emerald-400 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <DiagramImage
                            diagram={savedDiag}
                            carName={carName}
                            className="w-12 h-12 object-contain bg-slate-900 border border-emerald-800/40 rounded-lg shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-white truncate">
                              {savedDiag.title}
                            </h5>
                            <span className="text-[10px] text-emerald-400/80 block">
                              {savedDiag.savedAt || 'Оффлайн'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedLightboxDiagram(savedDiag)}
                          className="w-full py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer font-semibold"
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Открыть оффлайн</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/50 space-y-2">
              <Filter className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                По вашему запросу "{searchQuery}" ничего не найдено.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredItems.map((spec) => {
                const IconComp = spec.icon;
                return (
                  <div 
                    key={spec.id}
                    className="bento-card p-4 rounded-2xl flex flex-col justify-between group hover:border-cyan-400 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                          {spec.badge}
                        </span>
                        <IconComp className="w-4 h-4 text-cyan-400" />
                      </div>

                      <h3 className="text-sm font-bold text-slate-100 mb-1.5 group-hover:text-cyan-300 transition-colors">
                        {spec.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {spec.shortDesc}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectPreset(spec)}
                      className="btn-primary w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4 shrink-0" />
                      <span>Выгрузить OEM-спецификацию</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick static specs passport */}
          <div className="mt-6 border border-slate-800 bg-slate-950 p-4 rounded-2xl">
            {activeCar ? (
              <>
                <h4 className="text-xs font-bold text-cyan-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Активный автомобиль: {activeCar.make} {activeCar.model}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-300">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Марка и модель</span>
                    <span className="font-semibold text-slate-100">{activeCar.make} {activeCar.model} ({activeCar.year})</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Двигатель</span>
                    <span className="font-semibold text-slate-100">{activeCar.engine || 'Не указан'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">VIN / Кузов</span>
                    <span className="font-mono text-slate-100">{activeCar.vin || 'Не указан'}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Госномер</span>
                    <span className="font-mono text-slate-100">{activeCar.licensePlate || 'Не указан'}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 flex items-center gap-2 p-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Автомобиль не выбран. Перейдите в раздел <strong>Гараж</strong>, чтобы выбрать авто.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Василич сгенерирует таблицу OEM-параметров и предоставит схемы ремонта.
          </span>
          <button
            onClick={onClose}
            className="btn-secondary min-h-[38px] px-4 text-xs font-semibold rounded-xl cursor-pointer ml-auto"
          >
            Закрыть
          </button>
        </div>

      </div>

      {/* Lightbox Modal Popup */}
      {selectedLightboxDiagram && (
        <DiagramLightboxModal
          diagram={selectedLightboxDiagram}
          carName={activeCar ? `${activeCar.make} ${activeCar.model}` : undefined}
          carId={activeCar?.id}
          isSavedOffline={savedOfflineDiagrams.some(d => d.id === selectedLightboxDiagram.id)}
          onToggleSaveOffline={handleToggleSaveOffline}
          onClose={() => setSelectedLightboxDiagram(null)}
        />
      )}
    </div>
  );
}
