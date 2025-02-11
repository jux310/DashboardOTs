import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateCellProps {
  date: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
}

export function DateCell({ date, onDateChange, disabled = false }: DateCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(date);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempDate(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onDateChange(tempDate);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setTempDate(date);
      setIsEditing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (isEditing) {
    return (
      <input
        type="date"
        value={tempDate}
        onChange={handleDateChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          onDateChange(tempDate);
          setIsEditing(false);
        }}
        className="w-full p-1 border rounded"
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-2 ${
        disabled ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <span>{formatDate(date)}</span>
      {!disabled && !date && <Calendar className="w-4 h-4 text-gray-400" />}
    </div>
  );
}