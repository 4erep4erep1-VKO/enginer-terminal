/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Car, MaintenanceRecord } from '../types';
import { CATEGORY_NAMES } from '../components/AddRecordForm';
import { calculateAllFluidsHealth, FluidKey } from './calcFluidHealth';

export interface GenerateServiceBookPdfOptions {
  car: Car;
  records: MaintenanceRecord[];
  currencySymbol?: string;
  distanceLabel?: string;
  qrUrl?: string;
}

/**
 * Formats numeric price with spaces as thousand separators
 */
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('ru-RU');
}

/**
 * Generates an official, beautifully styled Electronic Service Book PDF with QR code,
 * dual-limit fluid health table, service chronological registry, and financial summary.
 */
export async function generateServiceBookPdf({
  car,
  records,
  currencySymbol = '₽',
  distanceLabel = 'км',
  qrUrl,
}: GenerateServiceBookPdfOptions): Promise<void> {
  // 1. Sort records chronologically (oldest->newest is OEM standard for service books)
  const sortedRecords = [...records]
    .filter(r => r.carId === car.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Compute totals
  const totalPartsCost = sortedRecords.reduce((acc, r) => acc + (r.partsPrice || 0), 0);
  const totalLaborCost = sortedRecords.reduce((acc, r) => acc + (r.laborPrice || 0), 0);
  const grandTotalCost = totalPartsCost + totalLaborCost;

  // 3. Compute Dual-Limit Fluid Health
  const fluidsHealth = calculateAllFluidsHealth({
    carId: car.id,
    currentMileage: car.mileage || 0,
    records: sortedRecords,
  });

  const exportDateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const exportTimeStr = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 4. Generate high-resolution QR code data URL
  const targetQrUrl = qrUrl || (typeof window !== 'undefined' ? `${window.location.origin}/#car-${car.id}` : 'https://terminal.car/service-passport');
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(targetQrUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.warn('Failed to generate QR code for PDF', err);
  }

  // 5. Create an off-screen container for high-res HTML rendering
  const printContainer = document.createElement('div');
  printContainer.style.position = 'fixed';
  printContainer.style.top = '-99999px';
  printContainer.style.left = '-99999px';
  printContainer.style.width = '820px'; // standard A4 printable width in px at 96dpi
  printContainer.style.backgroundColor = '#FFFFFF';
  printContainer.style.color = '#0F172A';
  printContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  printContainer.style.padding = '36px 40px';
  printContainer.style.boxSizing = 'border-box';
  printContainer.id = 'service-book-print-container';

  // Build fluid rows
  const fluidKeys: FluidKey[] = ['engine_oil', 'brake_fluid', 'coolant', 'transmission_oil'];
  const fluidRowsHtml = fluidKeys.map((key) => {
    const f = fluidsHealth[key];
    const isCrit = f.remainingHealth < 10 || f.statusLevel === 'critical';
    const isDue = f.statusLevel === 'replace_due';
    
    const badgeColor = isCrit
      ? 'background: #FFE4E6; color: #BE123C; border: 1px solid #FDA4AF;'
      : isDue
      ? 'background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D;'
      : 'background: #D1FAE5; color: #047857; border: 1px solid #6EE7B7;';

    const limitingText = f.limitingFactor === 'days'
      ? `По времени (${f.daysPassed} из ${f.maxDays} дн.)`
      : `По пробегу (${formatNumber(f.kmPassed)} из ${formatNumber(f.maxKm)} км)`;

    return `
      <tr>
        <td style="padding: 7px 8px; border: 1px solid #CBD5E1; font-weight: 700; color: #1E293B;">
          ${f.nameRu}
        </td>
        <td style="padding: 7px 8px; border: 1px solid #CBD5E1; font-family: monospace; text-align: right; color: #334155;">
          ${formatNumber(f.kmPassed)} / ${formatNumber(f.maxKm)} км
        </td>
        <td style="padding: 7px 8px; border: 1px solid #CBD5E1; font-family: monospace; text-align: right; color: #334155;">
          ${f.daysPassed} / ${f.maxDays} дн.
        </td>
        <td style="padding: 7px 8px; border: 1px solid #CBD5E1; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <div style="width: 50px; height: 7px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.max(4, f.remainingHealth)}%; height: 100%; background: ${isCrit ? '#EF4444' : isDue ? '#F59E0B' : '#10B981'};"></div>
            </div>
            <span style="font-size: 10px; font-weight: 800; font-family: monospace; color: #0F172A;">
              ${f.remainingHealth}%
            </span>
          </div>
        </td>
        <td style="padding: 7px 8px; border: 1px solid #CBD5E1; text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 700; ${badgeColor}">
            ${f.statusText}
          </span>
          <div style="font-size: 9px; color: #64748B; margin-top: 2px;">${limitingText}</div>
        </td>
      </tr>
    `;
  }).join('');

  // Build the complete HTML template
  printContainer.innerHTML = `
    <div style="width: 100%; box-sizing: border-box;">
      
      <!-- Top Header with Deep Cyan Accents -->
      <div style="border-bottom: 3px solid #0284C7; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 14px; height: 14px; background: #0284C7; border-radius: 3px;"></div>
            <span style="font-size: 11px; font-weight: 800; color: #0284C7; letter-spacing: 1.5px; text-transform: uppercase;">
              ВАСИЛИЧ // ИНЖЕНЕРНЫЙ ТЕРМИНАЛ
            </span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">
            ЦИФРОВАЯ СЕРВИСНАЯ КНИЖКА
          </h1>
          <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #64748B;">
            Официальный электронный реестр обслуживания, регламентных замен и технического состояния
          </p>
        </div>
        <div style="text-align: right; background: #F8FAFC; padding: 8px 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 9.5px; color: #64748B; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Дата формирования</div>
          <div style="font-size: 13px; font-weight: 800; color: #0F172A;">${exportDateStr}</div>
          <div style="font-size: 10px; color: #94A3B8;">${exportTimeStr} МСК</div>
        </div>
      </div>

      <!-- Vehicle Passport Block -->
      <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="font-size: 10px; font-weight: 800; color: #0284C7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          Паспортные данные автомобиля
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1.6fr 1.2fr 1.4fr; gap: 14px;">
          <div>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 600;">Марка и модель:</div>
            <div style="font-size: 15px; font-weight: 800; color: #0F172A;">
              ${car.make} ${car.model}
            </div>
            <div style="font-size: 10.5px; color: #64748B; margin-top: 1px;">
              ${car.year} г.в. ${car.engine ? '• ' + car.engine : ''}
            </div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 600;">VIN-номер:</div>
            <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #0F172A; word-break: break-all;">
              ${car.vin || 'Не указан'}
            </div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 600;">Гос. номер:</div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A;">
              ${car.licensePlate || 'Не указан'}
            </div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: #64748B; font-weight: 600;">Текущий одометр:</div>
            <div style="font-size: 15px; font-weight: 900; color: #0284C7; font-family: monospace;">
              ${formatNumber(car.mileage)} ${distanceLabel}
            </div>
          </div>
        </div>
      </div>

      <!-- Block 1: ЗДОРОВЬЕ ЖИДКОСТЕЙ (Dual-Limit Model) -->
      <div style="margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
            <span style="color: #0284C7;">■</span> Здоровье технических жидкостей (Регламент Dual-Limit)
          </h2>
          <span style="font-size: 10px; color: #64748B;">
            Контроль по километражу и старению во времени
          </span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #1E293B; color: #FFFFFF;">
              <th style="padding: 7px 8px; text-align: left; border: 1px solid #1E293B; font-weight: 700; width: 150px;">Тех. жидкость</th>
              <th style="padding: 7px 8px; text-align: right; border: 1px solid #1E293B; font-weight: 700; width: 140px;">Пробег с замены / Лимит</th>
              <th style="padding: 7px 8px; text-align: right; border: 1px solid #1E293B; font-weight: 700; width: 130px;">Срок / Лимит</th>
              <th style="padding: 7px 8px; text-align: center; border: 1px solid #1E293B; font-weight: 700; width: 110px;">Остаток ресурса</th>
              <th style="padding: 7px 8px; text-align: center; border: 1px solid #1E293B; font-weight: 700;">Статус регламента</th>
            </tr>
          </thead>
          <tbody>
            ${fluidRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Block 2: ХРОНОЛОГИЯ ОБСЛУЖИВАНИЯ -->
      <div style="margin-bottom: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
            <span style="color: #0284C7;">■</span> Хронология обслуживания и выполненных работ
          </h2>
          <span style="font-size: 10px; color: #64748B; font-weight: 600;">
            Всего записей в реестре: <strong>${sortedRecords.length}</strong>
          </span>
        </div>

        ${
          sortedRecords.length === 0
            ? `
          <div style="border: 1px dashed #CBD5E1; border-radius: 8px; padding: 24px; text-align: center; color: #64748B; font-size: 11.5px;">
            Записи о выполненном техническом обслуживании отсутствуют.
          </div>
        `
            : `
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
            <thead>
              <tr style="background: #1E293B; color: #FFFFFF;">
                <th style="padding: 7px 6px; text-align: center; border: 1px solid #1E293B; width: 26px; font-weight: 700;">№</th>
                <th style="padding: 7px 8px; text-align: left; border: 1px solid #1E293B; width: 75px; font-weight: 700;">Дата</th>
                <th style="padding: 7px 8px; text-align: right; border: 1px solid #1E293B; width: 85px; font-weight: 700;">Пробег</th>
                <th style="padding: 7px 8px; text-align: left; border: 1px solid #1E293B; width: 105px; font-weight: 700;">Категория</th>
                <th style="padding: 7px 8px; text-align: left; border: 1px solid #1E293B; font-weight: 700;">Выполненные работы и установленные детали</th>
                <th style="padding: 7px 8px; text-align: right; border: 1px solid #1E293B; width: 95px; font-weight: 700;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${sortedRecords
                .map((r, index) => {
                  const recordTotal = (r.partsPrice || 0) + (r.laborPrice || 0);
                  const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                  const catTitle = CATEGORY_NAMES[r.category] || r.category || 'Обслуживание';
                  const partsList = r.partsUsed && r.partsUsed.length > 0 ? r.partsUsed.join(', ') : '';

                  const formattedDate = new Date(r.date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return `
                    <tr style="background: ${bg};">
                      <td style="padding: 7px 6px; text-align: center; border: 1px solid #E2E8F0; color: #64748B; font-weight: 600;">
                        ${index + 1}
                      </td>
                      <td style="padding: 7px 8px; text-align: left; border: 1px solid #E2E8F0; font-weight: 600; color: #334155; white-space: nowrap;">
                        ${formattedDate}
                      </td>
                      <td style="padding: 7px 8px; text-align: right; border: 1px solid #E2E8F0; font-weight: 800; color: #0284C7; white-space: nowrap; font-family: monospace;">
                        ${formatNumber(r.mileage)} ${distanceLabel}
                      </td>
                      <td style="padding: 7px 8px; text-align: left; border: 1px solid #E2E8F0; font-weight: 600; color: #1E293B;">
                        <span style="display: inline-block; background: #E0F2FE; color: #0369A1; padding: 1.5px 5px; border-radius: 4px; font-size: 9.5px; font-weight: 700;">
                          ${catTitle}
                        </span>
                      </td>
                      <td style="padding: 7px 8px; text-align: left; border: 1px solid #E2E8F0; color: #0F172A; line-height: 1.35;">
                        <div style="font-weight: 700; color: #0F172A;">${r.description || 'Регламентное ТО'}</div>
                        ${
                          partsList
                            ? `<div style="font-size: 9.5px; color: #475569; margin-top: 2px;">
                                <span style="color: #64748B; font-weight: 600;">Запчасти:</span> ${partsList}
                              </div>`
                            : ''
                        }
                      </td>
                      <td style="padding: 7px 8px; text-align: right; border: 1px solid #E2E8F0; font-weight: 800; color: #0F172A; white-space: nowrap; font-family: monospace;">
                        <div>${formatNumber(recordTotal)} ${currencySymbol}</div>
                        ${
                          r.partsPrice && r.laborPrice
                            ? `<div style="font-size: 8.5px; font-weight: normal; color: #94A3B8; margin-top: 1px;">
                                з/ч: ${formatNumber(r.partsPrice)} + раб: ${formatNumber(r.laborPrice)}
                              </div>`
                            : ''
                        }
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        `
        }
      </div>

      <!-- Financial Totals Block -->
      <div style="background: #0F172A; color: #FFFFFF; border-radius: 8px; padding: 14px 20px; margin-bottom: 22px;">
        <div style="font-size: 10px; font-weight: 800; color: #38BDF8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
          Итоговая финансовая сводка
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 14px; border-top: 1px solid #334155; padding-top: 10px;">
          <div>
            <div style="font-size: 10px; color: #94A3B8;">Затраты на запчасти:</div>
            <div style="font-size: 15px; font-weight: 800; color: #F1F5F9; margin-top: 1px; font-family: monospace;">
              ${formatNumber(totalPartsCost)} ${currencySymbol}
            </div>
          </div>
          <div>
            <div style="font-size: 10px; color: #94A3B8;">Затраты на сервис и работы:</div>
            <div style="font-size: 15px; font-weight: 800; color: #F1F5F9; margin-top: 1px; font-family: monospace;">
              ${formatNumber(totalLaborCost)} ${currencySymbol}
            </div>
          </div>
          <div style="background: rgba(2, 132, 199, 0.25); border: 1px solid #0284C7; padding: 6px 12px; border-radius: 6px;">
            <div style="font-size: 10px; color: #7DD3FC; font-weight: 700;">ОБЩАЯ СУММА ЗАТРАТ:</div>
            <div style="font-size: 17px; font-weight: 900; color: #38BDF8; margin-top: 1px; font-family: monospace;">
              ${formatNumber(grandTotalCost)} ${currencySymbol}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with Brand & QR Code -->
      <div style="border-top: 2px solid #E2E8F0; padding-top: 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0F172A;">
            Сформировано в приложении ВАСИЛИЧ // Инженерный Терминал
          </div>
          <div style="font-size: 9.5px; color: #64748B; margin-top: 2px;">
            Электронная верификация технической истории транспортного средства
          </div>
          <div style="font-size: 9px; font-family: monospace; color: #94A3B8; margin-top: 4px;">
            DOC-VERIFY: ${car.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}
          </div>
        </div>

        ${
          qrCodeDataUrl
            ? `
          <div style="display: flex; align-items: center; gap: 10px; text-align: right;">
            <div>
              <div style="font-size: 9.5px; font-weight: 700; color: #0F172A;">Электронный паспорт</div>
              <div style="font-size: 8.5px; color: #64748B;">Наведите камеру смартфона</div>
            </div>
            <img src="${qrCodeDataUrl}" alt="QR Passport" style="width: 54px; height: 54px; border-radius: 4px; border: 1px solid #CBD5E1;" />
          </div>
        `
            : ''
        }
      </div>

    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    // 6. Render HTML element to canvas with high resolution scale
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 210; // mm
    const pdfHeight = 297; // mm
    const margin = 8; // mm
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Handle multi-page pagination if content is taller than A4
    const pageContentHeight = pdfHeight - margin * 2;
    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageContentHeight;

    // Subsequent pages if content overflows single page
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageContentHeight;
    }

    // 7. Download the file
    const sanitizedCarName = `${car.make}_${car.model}`.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_');
    const fileName = `Сервисная_Книжка_${sanitizedCarName}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    // Cleanup DOM
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }
}
