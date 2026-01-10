import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STORES = [
  { name: 'Carrefour', emoji: '🏬', category: 'Hypermarché' },
  { name: 'E.Leclerc', emoji: '🏬', category: 'Hypermarché' },
  { name: 'Auchan', emoji: '🏬', category: 'Hypermarché' },
  { name: 'Intermarché', emoji: '🛒', category: 'Supermarché' },
  { name: 'Lidl', emoji: '🛒', category: 'Discount' },
  { name: 'Aldi', emoji: '🛒', category: 'Discount' },
  { name: 'Monoprix', emoji: '🛒', category: 'Supermarché' },
  { name: 'Franprix', emoji: '🛒', category: 'Supermarché' },
  { name: 'Match', emoji: '🛒', category: 'Supermarché' },
  { name: 'Casino', emoji: '🛒', category: 'Supermarché' },
  { name: 'Carrefour Market', emoji: '🏬', category: 'Supermarché' },
  { name: 'Carrefour Express', emoji: '🏬', category: 'Supermarché' },
];

export default function StoreAutocomplete({ value, onChange, onSelect }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filteredStores = STORES.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    // Prioritize exact matches and starts-with matches
    const aStarts = a.name.toLowerCase().startsWith(search.toLowerCase());
    const bStarts = b.name.toLowerCase().startsWith(search.toLowerCase());
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleSelectStore = (store) => {
    setSearch(store.name);
    onChange(store.name);
    onSelect?.(store);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setSelectedIndex(prev => Math.min(prev + 1, filteredStores.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        e.preventDefault();
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          handleSelectStore(filteredStores[selectedIndex]);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Commencez à taper le nom du magasin..."
          className="pl-10 pr-4"
        />
      </div>

      <AnimatePresence>
        {isOpen && filteredStores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {filteredStores.map((store, index) => (
              <motion.button
                key={store.name}
                onClick={() => handleSelectStore(store)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors border-b last:border-b-0 ${
                  selectedIndex === index
                    ? 'bg-emerald-50'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
               {/* Logo/Emoji */}
               <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border border-emerald-200 text-lg">
                 {store.emoji}
               </div>

                {/* Infos */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">{store.name}</p>
                  <p className="text-xs text-gray-500">{store.category}</p>
                </div>

                {/* Highlight si sélectionné */}
                {selectedIndex === index && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {search && filteredStores.length === 0 && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 text-center"
        >
          <p className="text-gray-500 text-sm">Aucun magasin trouvé</p>
          <p className="text-xs text-gray-400 mt-1">Vous pouvez saisir un nom personnalisé</p>
        </motion.div>
      )}
    </div>
  );
}