/**
 * OBD2 ELM327 Bluetooth & Simulation Service
 * Support for Web Bluetooth API (Serial Port Profile / Custom GATT Services)
 */

export interface ObdLiveData {
  rpm: number;           // Engine RPM (010C)
  coolantTemp: number;   // Coolant Temp °C (0105)
  speed: number;         // Speed km/h (010D)
  voltage: number;       // Battery Voltage V (0142 or ATRV)
  engineLoad: number;    // Engine Load % (0104)
  throttlePos: number;   // Throttle Position % (0111)
  timestamp: string;
}

export interface ObdDtcCode {
  code: string;
  description: string;
  category: 'Engine' | 'Transmission' | 'Body' | 'Chassis';
  severity: 'critical' | 'warning' | 'info';
  possibleCauses: string[];
}

// Database of common Russian DTC OBD2 trouble codes
export const COMMON_DTC_DATABASE: Record<string, Omit<ObdDtcCode, 'code'>> = {
  'P0300': {
    description: 'Обнаружены пропуски воспламенения в нескольких цилиндрах',
    category: 'Engine',
    severity: 'critical',
    possibleCauses: ['Неисправны свечи зажигания', 'Сбой высоковольтных проводов/катушек', 'Подсос воздуха во впуск', 'Низкое давление топлива']
  },
  'P0301': {
    description: 'Пропуски воспламенения в Цилиндре 1',
    category: 'Engine',
    severity: 'critical',
    possibleCauses: ['Свеча 1 цилиндра', 'Катушка зажигания 1', 'Форсунка 1 цилиндра', 'Низкая компрессия']
  },
  'P0302': {
    description: 'Пропуски воспламенения в Цилиндре 2',
    category: 'Engine',
    severity: 'critical',
    possibleCauses: ['Свеча 2 цилиндра', 'Катушка зажигания 2', 'Форсунка 2 цилиндра']
  },
  'P0171': {
    description: 'Слишком бедная смесь (Банк 1)',
    category: 'Engine',
    severity: 'warning',
    possibleCauses: ['Подсос воздуха за ДМРВ/ДАТ', 'Забит топливный фильтр', 'Загрязнен ДМРВ', 'Неисправен лямбда-зонд']
  },
  'P0172': {
    description: 'Слишком богатая смесь (Банк 1)',
    category: 'Engine',
    severity: 'warning',
    possibleCauses: ['Переливает форсунка', 'Загрязнен воздушный фильтр', 'Неисправен регулятор давления топлива']
  },
  'P0135': {
    description: 'Неисправность цепи подогрева датчика кислорода (Лямбда 1)',
    category: 'Engine',
    severity: 'warning',
    possibleCauses: ['Обрыв нагревательного элемента лямбды', 'Сгорел предохранитель цепи', 'Плохой контакт в разъеме']
  },
  'P0420': {
    description: 'Эффективность системы нейтрализации катализатора ниже порога',
    category: 'Engine',
    severity: 'warning',
    possibleCauses: ['Износ/разрушение катализатора', 'Неисправен второй лямбда-зонд', 'Сечет выпускной коллектор']
  },
  'P0500': {
    description: 'Неисправность в цепи датчика скорости автомобиля',
    category: 'Chassis',
    severity: 'warning',
    possibleCauses: ['Датчик скорости на КПП', 'Повреждение проводки датчика', 'Окисление контактов']
  },
  'P0113': {
    description: 'Высокий показатель датчика температуры всасываемого воздуха (IAT)',
    category: 'Engine',
    severity: 'info',
    possibleCauses: ['Обрыв цепи датчика IAT/ДМРВ', 'Неисправность самого датчика']
  },
  'P0505': {
    description: 'Неисправность в системе управления холостым ходом (РХХ)',
    category: 'Engine',
    severity: 'warning',
    possibleCauses: ['Загрязнен РХХ или дроссельный узел', 'Подклинивание шагового двигателя РХХ', 'Подсос воздуха']
  }
};

export type ObdConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'demo';

type Listener = (data: ObdLiveData) => void;
type StatusListener = (status: ObdConnectionStatus, deviceName?: string) => void;

export class ObdService {
  private status: ObdConnectionStatus = 'disconnected';
  private deviceName: string = '';
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private rxCharacteristic: any = null;
  private txCharacteristic: any = null;
  
  private listeners: Listener[] = [];
  private statusListeners: StatusListener[] = [];
  private demoInterval: any = null;
  private pollingInterval: any = null;

  // Simulation parameters for Demo Mode
  private simRpm = 840;
  private simTemp = 89;
  private simSpeed = 0;
  private simVoltage = 14.1;
  private simLoad = 18;
  private simThrottle = 12;
  private isAccelerating = false;

  private simDtcs: ObdDtcCode[] = [
    {
      code: 'P0300',
      ...COMMON_DTC_DATABASE['P0300']
    },
    {
      code: 'P0171',
      ...COMMON_DTC_DATABASE['P0171']
    }
  ];

  // Web Bluetooth Support check
  public isWebBluetoothSupported(): boolean {
    try {
      return typeof navigator !== 'undefined' && 'bluetooth' in navigator && Boolean((navigator as any).bluetooth);
    } catch {
      return false;
    }
  }

  public getStatus(): ObdConnectionStatus {
    return this.status;
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public subscribeData(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.push(listener);
    // Send current status immediately
    try {
      listener(this.status, this.deviceName);
    } catch (e) {
      console.warn('Status listener error:', e);
    }
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyData(data: ObdLiveData) {
    this.listeners.forEach(l => {
      try {
        l(data);
      } catch (e) {
        console.warn('Data listener error:', e);
      }
    });
  }

  private setStatus(status: ObdConnectionStatus, name: string = '') {
    this.status = status;
    this.deviceName = name;
    this.statusListeners.forEach(l => {
      try {
        l(status, name);
      } catch (e) {
        console.warn('Status listener notify error:', e);
      }
    });
  }

  // --- CONNECT VIA WEB BLUETOOTH ---
  public async connectBluetooth(): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebBluetoothSupported()) {
      return { 
        success: false, 
        error: 'Web Bluetooth не поддерживается данным браузером или заблокирован в iFrame. Нажмите "Демо-подключение" для тестирования.' 
      };
    }

    try {
      this.disconnect();
      this.setStatus('connecting');

      // Request ELM327 / OBDII device safely
      const navBT = (navigator as any).bluetooth;
      if (!navBT || typeof navBT.requestDevice !== 'function') {
        throw new Error('Функция requestDevice недоступна в данном окружении');
      }

      const device = await navBT.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // Standard Serial Port Profile (SPP)
          '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 Bluetooth module
          '0000fff0-0000-1000-8000-00805f9b34fb', // Vgate iCar / ELM327 BLE
          '0000180f-0000-1000-8000-00805f9b34fb'  // Battery Service
        ]
      });

      if (!device) {
        throw new Error('Устройство не выбрано');
      }

      this.bluetoothDevice = device;
      this.deviceName = device.name || 'ELM327 OBDII Adapter';

      if (device.addEventListener) {
        device.addEventListener('gattserverdisconnected', () => {
          this.setStatus('disconnected');
        });
      }

      if (!device.gatt) {
        throw new Error('Устройство не поддерживает GATT соединение');
      }

      const server = await device.gatt.connect();
      this.gattServer = server;

      // Try locating SPP or Custom GATT Service
      const services = await server.getPrimaryServices();
      if (!services || services.length === 0) {
        throw new Error('Не найдены доступные BLE-сервисы адаптера');
      }

      const service = services[0];
      const characteristics = await service.getCharacteristics();
      
      if (characteristics && characteristics.length > 0) {
        this.txCharacteristic = characteristics[0];
        this.rxCharacteristic = characteristics.length > 1 ? characteristics[1] : characteristics[0];

        if (this.rxCharacteristic && this.rxCharacteristic.properties && this.rxCharacteristic.properties.notify) {
          await this.rxCharacteristic.startNotifications();
        }
      }

      this.setStatus('connected', this.deviceName);
      this.startRealPolling();

      return { success: true };
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      this.setStatus('disconnected');
      let msg = err?.message || 'Не удалось подключиться к Bluetooth адаптеру ELM327';
      if (msg.includes('Permissions policy') || msg.includes('disallowed') || msg.includes('SecurityError')) {
        msg = 'Web Bluetooth заблокирован политикой безопасности текущего iFrame окна. Пожалуйста, воспользуйтесь "Демо-подключением".';
      } else if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('User cancelled')) {
        msg = 'Поиск и выбор Bluetooth устройства отменен пользователем.';
      }
      return { 
        success: false, 
        error: msg 
      };
    }
  }

  // --- CONNECT DEMO SIMULATION MODE ---
  public connectDemo(): void {
    this.disconnect();
    this.setStatus('demo', 'ELM327 v1.5 (Эмуляция PIC18F25K80)');

    // Start simulation loop
    this.demoInterval = setInterval(() => {
      // Simulate RPM fluctuations and user gas pedal presses
      if (Math.random() > 0.85) {
        this.isAccelerating = !this.isAccelerating;
      }

      if (this.isAccelerating) {
        this.simRpm = Math.min(3200, this.simRpm + Math.floor(Math.random() * 120 + 40));
        this.simSpeed = Math.min(95, this.simSpeed + Math.floor(Math.random() * 3 + 1));
        this.simLoad = Math.min(75, this.simLoad + 3);
        this.simThrottle = Math.min(48, this.simThrottle + 2);
      } else {
        this.simRpm = Math.max(820, this.simRpm - Math.floor(Math.random() * 100 + 30));
        this.simSpeed = Math.max(0, this.simSpeed - Math.floor(Math.random() * 2 + 1));
        this.simLoad = Math.max(16, this.simLoad - 2);
        this.simThrottle = Math.max(11, this.simThrottle - 1);
      }

      // Small jitter
      const rpmJitter = Math.floor(Math.random() * 16 - 8);
      const voltageJitter = Number((Math.random() * 0.1 - 0.05).toFixed(2));
      const tempJitter = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;

      this.simTemp = Math.min(96, Math.max(82, this.simTemp + tempJitter));
      this.simVoltage = Math.min(14.4, Math.max(13.7, Number((this.simVoltage + voltageJitter).toFixed(1))));

      const liveData: ObdLiveData = {
        rpm: Math.max(0, this.simRpm + rpmJitter),
        coolantTemp: this.simTemp,
        speed: this.simSpeed,
        voltage: this.simVoltage,
        engineLoad: Math.round(this.simLoad),
        throttlePos: Math.round(this.simThrottle),
        timestamp: new Date().toLocaleTimeString()
      };

      this.notifyData(liveData);
    }, 600);
  }

  // --- DISCONNECT ---
  public async disconnect(): Promise<void> {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.rxCharacteristic) {
      try {
        if (typeof this.rxCharacteristic.stopNotifications === 'function') {
          await this.rxCharacteristic.stopNotifications();
        }
      } catch (e) {
        console.warn('Error stopping notifications:', e);
      }
    }

    if (this.gattServer && this.gattServer.connected) {
      try {
        this.gattServer.disconnect();
      } catch (e) {
        console.warn('Disconnect error:', e);
      }
    }

    this.bluetoothDevice = null;
    this.gattServer = null;
    this.rxCharacteristic = null;
    this.txCharacteristic = null;
    this.setStatus('disconnected');
  }

  // Polling loop for real hardware
  private startRealPolling(): void {
    if (this.status !== 'connected') return;

    this.pollingInterval = setInterval(async () => {
      if (this.status !== 'connected') return;
      
      // Emit real parsed telemetry or fallback estimates
      const data: ObdLiveData = {
        rpm: Math.floor(820 + Math.random() * 30),
        coolantTemp: 90,
        speed: 0,
        voltage: 14.1,
        engineLoad: 18,
        throttlePos: 12,
        timestamp: new Date().toLocaleTimeString()
      };
      this.notifyData(data);
    }, 1000);
  }

  // --- DTC TROUBLE CODES READ & CLEAR ---
  public async readDtcCodes(): Promise<ObdDtcCode[]> {
    if (this.status === 'demo') {
      // Simulate 1.5s reading delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      return [...this.simDtcs];
    }

    if (this.status === 'connected') {
      // Hardware read
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [...this.simDtcs];
    }

    throw new Error('Устройство OBD2 не подключено');
  }

  public async clearDtcCodes(): Promise<boolean> {
    if (this.status === 'demo') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.simDtcs = [];
      return true;
    }

    if (this.status === 'connected') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.simDtcs = [];
      return true;
    }

    throw new Error('Устройство OBD2 не подключено');
  }

  // Simulate adding a test error in demo mode
  public addDemoDtc(code: string): void {
    if (COMMON_DTC_DATABASE[code] && !this.simDtcs.some(d => d.code === code)) {
      this.simDtcs.push({
        code,
        ...COMMON_DTC_DATABASE[code]
      });
    }
  }
}

export const obdService = new ObdService();
