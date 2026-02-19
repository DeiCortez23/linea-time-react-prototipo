import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Calendar = React.forwardRef(({ 
  mode = "single", 
  selected, 
  onSelect, 
  locale = es, 
  disabled,
  className = "",
  ...props 
}, ref) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const isDateDisabled = (date) => {
    if (!disabled) return false;
    if (typeof disabled === 'function') {
      try {
        return disabled(date);
      } catch (error) {
        console.error("Error in disabled function:", error);
        return false;
      }
    }
    return false;
  };

  // ✅ SOLUCIÓN MEJORADA: Manejo seguro de clics en fechas usando UTC
  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    if (onSelect) {
      try {
        // ✅ CORRECCIÓN: Crear fecha UTC para mantener el día exacto
        const utcDate = new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ));
        onSelect(utcDate);
      } catch (error) {
        console.error("Error in calendar date selection:", error);
      }
    }
  };

  const weekdays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Get empty days at start of month for proper alignment
  const startDay = getDay(monthStart);
  const emptyDays = Array(startDay).fill(null);

  return (
    <div
      ref={ref}
      className={`p-3 bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      {...props}
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#4c0519]"
          type="button"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        
        <h2 className="font-semibold text-gray-900 text-sm">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#4c0519]"
          type="button"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div 
            key={day} 
            className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty days for alignment */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-8" />
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isDisabled = isDateDisabled(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={`
                h-8 w-8 flex items-center justify-center text-sm rounded-md transition-all
                focus:outline-none focus:ring-2 focus:ring-[#4c0519] focus:ring-offset-1
                ${isSelected 
                  ? 'bg-[#4c0519] text-white font-medium shadow-sm' 
                  : isCurrentMonthDay 
                    ? 'text-gray-900 hover:bg-gray-100 hover:text-[#4c0519]' 
                    : 'text-gray-400'
                }
                ${isDisabled 
                  ? 'opacity-40 cursor-not-allowed' 
                  : 'cursor-pointer hover:scale-105'
                }
              `}
              type="button"
              aria-label={`Seleccionar ${format(day, 'd MMMM yyyy', { locale })}`}
              aria-selected={isSelected}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
});