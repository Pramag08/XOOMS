import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Calendar, Home, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleClick = () => {
    if (!isFixed) {
      navigate('/search');
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("");
    if (onReset) onReset();
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

  return (
    <motion.div
      layoutId="search-pill"
      onClick={handleClick}
      transition={SPRING_TRANSITION}
      className={cn(
        "z-40 bg-white/80 backdrop-blur-md border border-charcoal/5 flex items-center overflow-hidden cursor-pointer transition-shadow hover:shadow-xl hover:shadow-charcoal/5",
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
              className="text-sm font-medium outline-none placeholder:text-charcoal bg-transparent truncate min-w-[100px]" 
              readOnly={!(isFixed || editable)} 
            />
          </div>
        </motion.div>
      </div>
      
      {/* Dates Segment */}
      <div className={cn("flex-1 flex items-center border-r border-charcoal/10 hidden md:flex h-full", isFixed ? "px-4" : "px-6")}>
        <motion.div 
          layoutId="search-pill-dates"
          transition={SPRING_TRANSITION}
          className="flex items-center w-full overflow-hidden"
        >
          <motion.div layoutId="search-pill-dates-icon" transition={SPRING_TRANSITION}>
            <Calendar className="w-4 h-4 text-charcoal/40 mr-3 shrink-0" />
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
                className="text-sm font-medium text-charcoal truncate"
              >
                {availableFrom && availableTo ? `${availableFrom} → ${availableTo}` : 'Add dates'}
              </motion.span>
            {isFixed && (
              <div className="ml-3 flex gap-2 items-center">
                <input type="date" value={availableFrom || ''} onChange={(e) => setAvailableFrom(e.target.value || null)} className="text-xs" />
                <input type="date" value={availableTo || ''} onChange={(e) => setAvailableTo(e.target.value || null)} className="text-xs" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Type Segment */}
      <div className={cn("flex-1 flex items-center h-full", isFixed ? "px-4" : "px-6")}>
        <motion.div 
          layoutId="search-pill-type"
          transition={SPRING_TRANSITION}
          className="flex items-center w-full overflow-hidden"
        >
          <motion.div layoutId="search-pill-type-icon" transition={SPRING_TRANSITION}>
            <Home className="w-4 h-4 text-charcoal/40 mr-3 shrink-0" />
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
              className="text-sm font-medium text-charcoal truncate"
            >
              {propertyType || 'All Types'}
            </motion.span>
            {isFixed && (
              <select value={propertyType || ''} onChange={(e) => setPropertyType(e.target.value || null)} className="ml-3 text-sm">
                <option value="">All Types</option>
                <option value="Guest House">Guest House</option>
                <option value="Boys PG">Boys PG</option>
                <option value="Girls PG">Girls PG</option>
                <option value="Serviced Apartment">Serviced Apartment</option>
              </select>
            )}
          </div>
        </motion.div>
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
          {isFixed && value && (
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
