/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Car, MaintenanceRecord } from '../types';
import { CATEGORY_NAMES } from '../components/AddRecordForm';

export interface GenerateServiceBookPdfOptions {
  car: Car;
  records: MaintenanceRecord[];
  currencySymbol?: string;
  distanceLabel?: string;
}

/**
 * Formats numeric price with spaces as thousand separators
 */
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('ru-RU');
}

/**
 * Generates an official, beautifully styled Electronic Service Book PDF.
 */
export async function generateServiceBookPdf({
  car,
  records,
  currencySymbol = '₽',
  distanceLabel = 'км',
}: GenerateServiceBookPdfOptions): Promise<void> {
  // 1. Sort records chronologically (newest first or oldest first; chronological oldest->newest is OEM standard)
  const sortedRecords = [...records]
    .filter(r => r.carId === car.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Compute totals
  const totalPartsCost = sortedRecords.reduce((acc, r) => acc + (r.partsPrice || 0), 0);
  const totalLaborCost = sortedRecords.reduce((acc, r) => acc + (r.laborPrice || 0), 0);
  const grandTotalCost = totalPartsCost + totalLaborCost;

  const exportDateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const exportTimeStr = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 3. Create an off-screen container for high-res HTML rendering
  const printContainer = document.createElement('div');
  printContainer.style.position = 'fixed';
  printContainer.style.top = '-99999px';
  printContainer.style.left = '-99999px';
  printContainer.style.width = '800px'; // standard A4 printable width in px at 96dpi
  printContainer.style.backgroundColor = '#FFFFFF';
  printContainer.style.color = '#0F172A';
  printContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  printContainer.style.padding = '36px 40px';
  printContainer.style.boxSizing = 'border-box';
  printContainer.id = 'service-book-print-container';

  // Build the HTML template
  printContainer.innerHTML = `
    <div style="width: 100%; box-sizing: border-box;">
      <!-- Header Banner -->
      <div style="border-bottom: 2px solid #0284C7; padding-bottom: 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 12px; height: 12px; background: #0284C7; border-radius: 2px;"></div>
            <span style="font-size: 11px; font-weight: 700; color: #0284C7; letter-spacing: 1.5px; text-transform: uppercase;">
              Автомобильный Инженерный Терминал
            </span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px;">
            СЕРВИСНАЯ КНИЖКА АВТОМОБИЛЯ
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
            Официальный электронный реестр технического обслуживания и регламентных работ
          </p>
        </div>
        <div style="text-align: right; background: #F1F5F9; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: 600;">Дата выгрузки</div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${exportDateStr}</div>
          <div style="font-size: 10px; color: #94A3B8;">${exportTimeStr}</div>
        </div>
      </div>

      <!-- Vehicle Passport Card -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #0284C7; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          Паспортные данные транспортного средства
        </div>
        <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.2fr 1.3fr; gap: 14px;">
          <div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600;">Автомобиль:</div>
            <div style="font-size: 15px; font-weight: 800; color: #0F172A;">
              ${car.make} ${car.model}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
              ${car.year} г.в. ${car.engine ? '• ' + car.engine : ''}
            </div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600;">VIN-номер:</div>
            <div style="font-size: 12px; font-family: monospace; font-weight: 700; color: #0F172A; word-break: break-all;">
              ${car.vin || 'Не указан'}
            </div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600;">Гос. номер:</div>
            <div style="font-size: 13px; font-weight: 700; color: #0F172A;">
              ${car.licensePlate || 'Не указан'}
            </div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600;">Текущий одометр:</div>
            <div style="font-size: 14px; font-weight: 800; color: #0284C7;">
              ${formatNumber(car.mileage)} ${distanceLabel}
            </div>
          </div>
        </div>
      </div>

      <!-- Service History Section -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 15px; font-weight: 700; color: #0F172A;">
            История технического обслуживания и ремонтов
          </h2>
          <span style="font-size: 11px; color: #64748B; font-weight: 600;">
            Всего записей: <strong>${sortedRecords.length}</strong>
          </span>
        </div>

        ${
          sortedRecords.length === 0
            ? `
          <div style="border: 1px dashed #CBD5E1; border-radius: 8px; padding: 28px; text-align: center; color: #64748B; font-size: 12px;">
            Записи о техническом обслуживании отсутствуют.
          </div>
        `
            : `
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #0F172A; color: #FFFFFF;">
                <th style="padding: 9px 8px; text-align: center; border: 1px solid #0F172A; width: 28px; font-weight: 700;">№</th>
                <th style="padding: 9px 8px; text-align: left; border: 1px solid #0F172A; width: 75px; font-weight: 700;">Дата</th>
                <th style="padding: 9px 8px; text-align: right; border: 1px solid #0F172A; width: 85px; font-weight: 700;">Пробег</th>
                <th style="padding: 9px 8px; text-align: left; border: 1px solid #0F172A; width: 110px; font-weight: 700;">Система / Узел</th>
                <th style="padding: 9px 8px; text-align: left; border: 1px solid #0F172A; font-weight: 700;">Выполненные работы и запчасти</th>
                <th style="padding: 9px 8px; text-align: right; border: 1px solid #0F172A; width: 95px; font-weight: 700;">Стоимость</th>
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
                      <td style="padding: 8px 6px; text-align: center; border: 1px solid #E2E8F0; color: #64748B; font-weight: 600;">
                        ${index + 1}
                      </td>
                      <td style="padding: 8px 6px; text-align: left; border: 1px solid #E2E8F0; font-weight: 600; color: #334155; white-space: nowrap;">
                        ${formattedDate}
                      </td>
                      <td style="padding: 8px 6px; text-align: right; border: 1px solid #E2E8F0; font-weight: 700; color: #0284C7; white-space: nowrap;">
                        ${formatNumber(r.mileage)} ${distanceLabel}
                      </td>
                      <td style="padding: 8px 6px; text-align: left; border: 1px solid #E2E8F0; font-weight: 600; color: #1E293B;">
                        <span style="display: inline-block; background: #E0F2FE; color: #0369A1; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                          ${catTitle}
                        </span>
                      </td>
                      <td style="padding: 8px 8px; text-align: left; border: 1px solid #E2E8F0; color: #0F172A; line-height: 1.4;">
                        <div style="font-weight: 600; color: #0F172A;">${r.description || 'Регламентное ТО'}</div>
                        ${
                          partsList
                            ? `<div style="font-size: 10px; color: #64748B; margin-top: 3px;">
                                <strong style="color: #475569;">Запчасти:</strong> ${partsList}
                              </div>`
                            : ''
                        }
                      </td>
                      <td style="padding: 8px 8px; text-align: right; border: 1px solid #E2E8F0; font-weight: 800; color: #0F172A; white-space: nowrap;">
                        <div>${formatNumber(recordTotal)} ${currencySymbol}</div>
                        ${
                          r.partsPrice && r.laborPrice
                            ? `<div style="font-size: 9px; font-weight: normal; color: #94A3B8; margin-top: 2px;">
                                (з/ч: ${formatNumber(r.partsPrice)} + раб: ${formatNumber(r.laborPrice)})
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

      <!-- Financial Summary Totals Block -->
      <div style="background: #0F172A; color: #FFFFFF; border-radius: 10px; padding: 18px 24px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #38BDF8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
          Итоговая финансовая сводка по обслуживанию
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; border-top: 1px solid #334155; padding-top: 14px;">
          <div>
            <div style="font-size: 11px; color: #94A3B8;">Затраты на запчасти:</div>
            <div style="font-size: 16px; font-weight: 700; color: #F1F5F9; margin-top: 2px;">
              ${formatNumber(totalPartsCost)} ${currencySymbol}
            </div>
          </div>
          <div>
            <div style="font-size: 11px; color: #94A3B8;">Затраты на работы и сервис:</div>
            <div style="font-size: 16px; font-weight: 700; color: #F1F5F9; margin-top: 2px;">
              ${formatNumber(totalLaborCost)} ${currencySymbol}
            </div>
          </div>
          <div style="background: rgba(2, 132, 199, 0.25); border: 1px solid #0284C7; padding: 8px 14px; border-radius: 8px;">
            <div style="font-size: 11px; color: #7DD3FC; font-weight: 600;">ОБЩАЯ СУММА ЗАТРАТ:</div>
            <div style="font-size: 19px; font-weight: 800; color: #38BDF8; margin-top: 2px;">
              ${formatNumber(grandTotalCost)} ${currencySymbol}
            </div>
          </div>
        </div>
      </div>

      <!-- Official Footer Stamp -->
      <div style="border-top: 1px solid #E2E8F0; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94A3B8;">
        <div>
          Электронная сервисная книжка сформирована в системе <strong>Автомобильный Инженерный Терминал</strong>
        </div>
        <div style="font-family: monospace; font-weight: 600;">
          DOC-REF: ${car.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    // 4. Render HTML element to canvas with high resolution scale
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
    const margin = 10; // mm
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

    // 5. Download the file
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
