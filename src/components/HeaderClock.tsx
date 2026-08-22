import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function HeaderClock() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const offsetMinutes = now.getTimezoneOffset();
      const offsetSign = offsetMinutes <= 0 ? '+' : '-';
      const absOffsetMinutes = Math.abs(offsetMinutes);
      const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, '0');
      const offsetMins = String(absOffsetMinutes % 60).padStart(2, '0');
      const offsetStr = `GMT${offsetSign}${offsetHours}:${offsetMins}`;

      setTimeStr(`${day}.${month}.${year} ${hours}:${minutes}:${seconds} (${offsetStr})`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <span className="block text-blueprint-cyan text-[9px] tracking-wider uppercase">SYS_TIME</span>
      <span className="text-cyan-200 font-semibold flex items-center justify-end gap-1">
        <Clock className="w-3 h-3 text-blueprint-cyan" /> {timeStr || '---'}
      </span>
    </div>
  );
}
