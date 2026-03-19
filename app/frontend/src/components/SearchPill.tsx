import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Calendar, Home, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import DatePicker from './DatePicker';

interface SearchParams {
  q?: string;
  property_type?: string | null;
  available_from?: string | null;
  available_to?: string | null;
}

interface SearchPillProps {
  isFixed?: boolean;
  className?: string;
  initialValue?: string;
  placeholder?: string;
  onReset?: () => void;
  onSearch?: (params: SearchParams) => void;
  editable?: boolean;
}

export default function SearchPill({ 
  isFixed = false, 
  className,
  initialValue = "",
  placeholder = "All locations",
  onReset,
  onSearch,
  editable = false,
}: SearchPillProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [availableTo, setAvailableTo] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedType, setSelectedType] = useState('All Types');
  const calendarRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = () => {
    if (!isFixed) {
      navigate('/search');
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("");
    setStartDate(null);
    setEndDate(null);
    setSelectedType('All Types');
    setPropertyType(null);
    setAvailableFrom(null);
    setAvailableTo(null);
    if (onReset) onReset();
  };

  const toggleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFixed) {
      setShowCalendar(!showCalendar);
      setShowTypeDropdown(false);
    } else {
      navigate('/search');
    }
  };

  const toggleTypeDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFixed) {
      setShowTypeDropdown(!showTypeDropdown);
      setShowCalendar(false);
    } else {
      navigate('/search');
    }
  };

  const handleSearch = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e && (e as any).stopPropagation();
    const payload = { q: value || undefined, property_type: propertyType, available_from: availableFrom, available_to: availableTo };
    if (onSearch) onSearch(payload);
    if (!isFixed) {
      const parts: string[] = [];
      if (payload.q) parts.push(`q=${encodeURIComponent(payload.q)}`);
      if (payload.property_type) parts.push(`property_type=${encodeURIComponent(payload.property_type)}`);
      if (payload.available_from) parts.push(`available_from=${encodeURIComponent(payload.available_from)}`);
      if (payload.available_to) parts.push(`available_to=${encodeURIComponent(payload.available_to)}`);
      const qs = parts.length ? `?${parts.join('&')}` : '';
      navigate(`/search${qs}`);
    }
  };

  const SPRING_TRANSITION = {
    type: "spring",
    stiffness: 70,
    damping: 20,
    mass: 1.5,
    duration: 1.2
  };

  const formatToDDMMYY = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}-${m}-${y}`;
  };

  const formatToISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateRange = () => {
    if (!startDate) return 'Add dates';
    const startStr = formatToDDMMYY(startDate);
    if (!endDate) return `${startStr} to ...`;
    const endStr = formatToDDMMYY(endDate);
    return `${startStr} to ${endStr}`;
  };

  return (
    <motion.div
      layoutId="search-pill"
      onClick={handleClick}
      transition={SPRING_TRANSITION}
      className={cn(
        "z-40 bg-white/80 backdrop-blur-md border border-charcoal/5 flex items-center overflow-visible cursor-pointer transition-shadow hover:shadow-xl hover:shadow-charcoal/5",
        isFixed 
          ? "fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl rounded-2xl shadow-sm h-16" 
          : "relative w-full max-w-3xl rounded-full shadow-lg h-20",
        className
      )}
    >
      {/* City Segment */}
      <div className={cn("flex-1 flex items-center border-r border-charcoal/10 h-full", isFixed ? "px-4" : "px-6")}>
        <motion.div 
          layoutId="search-pill-city"
          transition={SPRING_TRANSITION}
          className="flex items-center w-full overflow-hidden"
        >
          <motion.div layoutId="search-pill-city-icon" transition={SPRING_TRANSITION}>
            <MapPin className="w-4 h-4 text-charcoal/40 mr-3 shrink-0" />
          </motion.div>
          <div className="flex flex-col overflow-hidden w-full items-start">
            <motion.span 
              layoutId="search-pill-city-label"
              transition={SPRING_TRANSITION}
              className="text-[10px] uppercase tracking-wider text-charcoal/50 font-bold truncate"
            >
              Location
            </motion.span>
            <motion.input 
              layoutId="search-pill-city-input"
              transition={SPRING_TRANSITION}
              type="text" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
              placeholder={placeholder}
              className="text-sm font-medium outline-none placeholder:text-charcoal/30 placeholder:font-light placeholder:tracking-wide text-charcoal bg-transparent truncate min-w-[100px]"
              readOnly={!(isFixed || editable)} 
            />
          </div>
        </motion.div>
      </div>
      
      {/* Dates Segment */}
      <div
        ref={calendarRef}
        onClick={toggleCalendar}
        className={cn("flex-1 flex items-center border-r border-charcoal/10 hidden md:flex h-full relative hover:bg-charcoal/5 transition-colors", isFixed ? "px-4" : "px-6")}
      >
        <motion.div 
          layoutId="search-pill-dates"
          transition={SPRING_TRANSITION}
          className="flex items-center w-full overflow-hidden"
        >
          <motion.div layoutId="search-pill-dates-icon" transition={SPRING_TRANSITION}>
            <Calendar className={`w-4 h-4 mr-3 shrink-0 transition-colors ${startDate ? 'text-charcoal' : 'text-charcoal/40'}`} />
          </motion.div>
          <div className="flex flex-col overflow-hidden w-full items-start">
            <motion.span 
              layoutId="search-pill-dates-label"
              transition={SPRING_TRANSITION}
              className="text-[10px] uppercase tracking-wider text-charcoal/50 font-bold truncate"
            >
              Dates
            </motion.span>
            <motion.span 
                layoutId="search-pill-dates-value"
                transition={SPRING_TRANSITION}
                className={`text-sm font-medium truncate ${startDate ? 'text-charcoal' : 'text-charcoal/60'}`}
              >
                {formatDateRange()}
              </motion.span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showCalendar && (
            <DatePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setAvailableFrom(start ? formatToISODate(start) : null);
                setAvailableTo(end ? formatToISODate(end) : null);
              }}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Type Segment */}
      <div
        ref={typeRef}
        onClick={toggleTypeDropdown}
        className={cn("flex-1 flex items-center h-full relative hover:bg-charcoal/5 transition-colors", isFixed ? "px-4" : "px-6")}
      >
        <motion.div 
          layoutId="search-pill-type"
          transition={SPRING_TRANSITION}
          className="flex items-center w-full overflow-hidden"
        >
          <motion.div layoutId="search-pill-type-icon" transition={SPRING_TRANSITION}>
            <Home className={`w-4 h-4 mr-3 shrink-0 transition-colors ${selectedType !== 'All Types' ? 'text-charcoal' : 'text-charcoal/40'}`} />
          </motion.div>
          <div className="flex flex-col overflow-hidden w-full items-start">
            <motion.span 
              layoutId="search-pill-type-label"
              transition={SPRING_TRANSITION}
              className="text-[10px] uppercase tracking-wider text-charcoal/50 font-bold truncate"
            >
              Type
            </motion.span>
            <motion.span 
              layoutId="search-pill-type-value"
              transition={SPRING_TRANSITION}
              className={`text-sm font-medium truncate ${selectedType !== 'All Types' ? 'text-charcoal' : 'text-charcoal/60'}`}
            >
              {selectedType}
            </motion.span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showTypeDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl shadow-charcoal/10 border border-charcoal/5 p-3 w-[240px] z-50 cursor-default origin-top flex flex-col gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {['All Types', 'Guest House', 'Boys PG', 'Girls PG', 'Serviced Apartment'].map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedType(type);
                    setPropertyType(type === 'All Types' ? null : type);
                    setShowTypeDropdown(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-charcoal text-white'
                      : 'text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal'
                  }`}
                >
                  {type}
                  {selectedType === type && <Check className="w-4 h-4" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className={cn("flex items-center justify-center h-full gap-2", isFixed ? "pr-2" : "pr-2")}>
        {/* Search Button */}
        <motion.button 
          layoutId="search-button"
          transition={SPRING_TRANSITION}
          className={cn(
            "rounded-full bg-charcoal text-white flex items-center justify-center hover:bg-black transition-colors shrink-0",
            isFixed ? "w-10 h-10" : "w-12 h-12"
          )}
          onClick={(e) => { e.stopPropagation(); handleSearch(e); }}
        >
          <Search className="w-5 h-5" />
        </motion.button>

        {/* Reset Button */}
        <AnimatePresence>
          {isFixed && (value || startDate || selectedType !== 'All Types') && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: '2rem' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              onClick={handleReset}
              className="h-8 rounded-full bg-charcoal/5 text-charcoal flex items-center justify-center hover:bg-charcoal/10 transition-colors shrink-0 overflow-hidden"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
