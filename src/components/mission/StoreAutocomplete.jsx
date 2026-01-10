import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const BRAND_NAMES = ['Carrefour', 'E.Leclerc', 'Auchan', 'Intermarché', 'Lidl', 'Aldi', 'Monoprix', 'Franprix', 'Match', 'Casino'];

export default function StoreAutocomplete({ value, onChange, onSelect }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Rechercher les magasins via Overpass API (OpenStreetMap)
  const searchStores = async (query) => {
    if (!query || query.length < 2) {
      setStores([]);
      return;
    }

    setLoading(true);
    try {
      // Utiliser Overpass API pour chercher les supermarchés/magasins
      const overpassQuery = `
        [bbox:-5.2674,41.1556,8.2275,51.0914];
        (
          node["shop"~"supermarket|convenience|grocery"](if: t["name"] ~ "${query.replace(/"/g, '\\"')}");
          way["shop"~"supermarket|convenience|grocery"](if: t["name"] ~ "${query.replace(/"/g, '\\"')}");
          relation["shop"~"supermarket|convenience|grocery"](if: t["name"] ~ "${query.replace(/"/g, '\\"')}");
        );
        out center 20;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
      });

      const data = await response.json();
      
      // Transformer les résultats
      const results = (data.elements || []).map(elem => ({
        name: elem.tags?.name || 'Magasin',
        address: elem.tags?.['addr:street'] || '',
        lat: elem.center?.lat || elem.lat || 0,
        lng: elem.center?.lon || elem.lon || 0,
        emoji: '🏬',
        category: elem.tags?.shop === 'supermarket' ? 'Supermarché' : 'Épicerie'
      }));

      setStores(results.length > 0 ? results : getFallbackStores(query));
    } catch (error) {
      console.error('Erreur Overpass:', error);
      setStores(getFallbackStores(query));
    }
    setLoading(false);
  };

  // Fallback: liste locale si API échoue
  const getFallbackStores = (query) => {
    const fallback = [
      { name: 'Carrefour', emoji: '🏬', category: 'Hypermarché', lat: 0, lng: 0 },
      { name: 'E.Leclerc', emoji: '🏬', category: 'Hypermarché', lat: 0, lng: 0 },
      { name: 'Auchan', emoji: '🏬', category: 'Hypermarché', lat: 0, lng: 0 },
      { name: 'Intermarché', emoji: '🛒', category: 'Supermarché', lat: 0, lng: 0 },
      { name: 'Lidl', emoji: '🛒', category: 'Discount', lat: 0, lng: 0 },
      { name: 'Aldi', emoji: '🛒', category: 'Discount', lat: 0, lng: 0 },
      { name: 'Monoprix', emoji: '🛒', category: 'Supermarché', lat: 0, lng: 0 },
    ];
    return fallback.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  };

  const filteredStores = stores;

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
            searchStores(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (search) searchStores(search);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Commencez à taper le nom du magasin..."
          className="pl-10 pr-4"
        />
        {loading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
      </div>

      <AnimatePresence>
        {isOpen && (loading || filteredStores.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="px-4 py-8 flex items-center justify-center gap-2 text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Recherche des magasins...</span>
              </div>
            ) : (
              filteredStores.map((store, index) => (
                <motion.button
                  key={`${store.name}-${index}`}
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">{store.category}</p>
                      {store.lat && store.lng && (
                        <MapPin className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Highlight si sélectionné */}
                  {selectedIndex === index && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </motion.button>
              ))
            )}
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