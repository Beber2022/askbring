import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STORES = [
  { name: 'Carrefour', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Hypermarché' },
  { name: 'E.Leclerc', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Hypermarché' },
  { name: 'Auchan', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Hypermarché' },
  { name: 'Intermarché', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Lidl', logo: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23FF0000%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2260%22 font-size=%2740%27 fill=%22white%22 text-anchor=%22middle%22 font-weight=%22bold%22%3ELidl%3C/text%3E%3C/svg%3E', category: 'Discount' },
  { name: 'Aldi', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Discount' },
  { name: 'Monoprix', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Franprix', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Match', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Casino', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Carrefour Market', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
  { name: 'Carrefour Express', logo: 'https://images.unsplash.com/photo-1568901346375-23c9450fc58c?w=200&h=200&fit=crop', category: 'Supermarché' },
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
                {/* Logo */}
                <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = store.name.charAt(0);
                    }}
                  />
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