import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
}

export default function DatePicker({ startDate, endDate, onChange, onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDateClick = (e: React.MouseEvent, day: number) => {
    e.stopPropagation();
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Reset time to midnight for accurate comparison
    clickedDate.setHours(0, 0, 0, 0);
    
    if (!startDate || (startDate && endDate)) {
      onChange(clickedDate, null);
    } else if (startDate && !endDate) {
      if (clickedDate < startDate) {
        onChange(clickedDate, null);
      } else {
        onChange(startDate, clickedDate);
        setTimeout(() => onClose(), 300);
      }
    }
  };

  const isSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    
    const isStart = startDate && date.getTime() === startDate.getTime();
    const isEnd = endDate && date.getTime() === endDate.getTime();
    
    return isStart || isEnd;
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return date > startDate && date < endDate;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl shadow-charcoal/10 border border-charcoal/5 p-6 w-[320px] z-50 cursor-default origin-top"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-serif text-lg text-charcoal">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-charcoal/5 text-charcoal/60 hover:text-charcoal transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-charcoal/40 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="w-10 h-10" />
        ))}
        
        {days.map(day => {
          const selected = isSelected(day);
          const inRange = isInRange(day);
          const past = isPast(day);
          const today = isToday(day);

          return (
            <div key={day} className="relative flex justify-center items-center w-10 h-10">
              {/* Range Background */}
              {inRange && (
                <div className="absolute inset-0 bg-charcoal/5" />
              )}
              {/* Start/End Range Background Connectors */}
              {selected && startDate && endDate && (
                <div className={`absolute inset-y-0 w-1/2 bg-charcoal/5 ${
                  startDate.getTime() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getTime() 
                    ? 'right-0' 
                    : 'left-0'
                }`} />
              )}

              <button
                disabled={past}
                onClick={(e) => handleDateClick(e, day)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all z-10 ${
                  selected 
                    ? 'bg-charcoal text-white font-bold shadow-md shadow-charcoal/20 scale-110' 
                    : past
                      ? 'text-charcoal/20 cursor-not-allowed'
                      : inRange
                        ? 'text-charcoal font-medium'
                        : today
                          ? 'text-gold font-bold bg-gold/10'
                          : 'text-charcoal/80 hover:bg-charcoal/5 hover:text-charcoal font-medium'
                }`}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-charcoal/5 flex justify-between items-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onChange(null, null);
          }}
          className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors"
        >
          Clear
        </button>
        <div className="text-xs font-medium text-charcoal">
          {startDate ? (
            endDate ? (
              `${startDate.getDate().toString().padStart(2, '0')}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getFullYear().toString().slice(-2)} to ${endDate.getDate().toString().padStart(2, '0')}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getFullYear().toString().slice(-2)}`
            ) : (
              `${startDate.getDate().toString().padStart(2, '0')}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getFullYear().toString().slice(-2)} to ...`
            )
          ) : (
            "Select dates"
          )}
        </div>
      </div>
    </motion.div>
  );
}
