import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Home, Briefcase, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const labelIcons = {
  'Maison': Home,
  'Travail': Briefcase,
  'default': MapPin
};

export default function AddressAutocomplete({ value, onChange, onSelectAddress, placeholder }) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    // Filter addresses based on input
    if (value && value.length > 0) {
      const filtered = savedAddresses.filter(addr =>
        addr.address.toLowerCase().includes(value.toLowerCase()) ||
        (addr.label && addr.label.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredAddresses(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredAddresses(savedAddresses);
      setShowSuggestions(false);
    }
  }, [value, savedAddresses]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const user = await base44.auth.me();
      const addresses = await base44.entities.SavedAddress.filter(
        { user_email: user.email },
        '-created_date'
      );
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const handleSelectAddress = (address) => {
    onChange(address.address);
    if (onSelectAddress) {
      onSelectAddress(address);
    }
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (savedAddresses.length > 0 && !value) {
      setFilteredAddresses(savedAddresses);
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder || "Commencez à taper ou sélectionnez une adresse"}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {showSuggestions && filteredAddresses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
          >
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-2 font-medium">
                Adresses enregistrées
              </p>
              {filteredAddresses.map((address) => {
                const Icon = labelIcons[address.label] || labelIcons.default;
                return (
                  <button
                    key={address.id}
                    onClick={() => handleSelectAddress(address)}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {address.label && (
                          <span className="text-sm font-medium text-gray-900">
                            {address.label}
                          </span>
                        )}
                        {address.is_default && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {address.address}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}