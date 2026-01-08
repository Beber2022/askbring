import React from 'react';
import { Store, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const stores = [
  { id: 'carrefour', name: 'Carrefour', color: '#004E9A', logo: '🛒' },
  { id: 'leclerc', name: 'E.Leclerc', color: '#E41D35', logo: '🏪' },
  { id: 'auchan', name: 'Auchan', color: '#E2001A', logo: '🛍️' },
  { id: 'intermarche', name: 'Intermarché', color: '#E50019', logo: '🏬' },
  { id: 'lidl', name: 'Lidl', color: '#0050AA', logo: '🛒' },
  { id: 'monoprix', name: 'Monoprix', color: '#E4002B', logo: '🏪' },
  { id: 'franprix', name: 'Franprix', color: '#E40046', logo: '🛍️' },
  { id: 'other', name: 'Autre', color: '#6B7280', logo: '🏬' },
];

export default function StoreSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stores.map((store) => (
        <motion.div
          key={store.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`cursor-pointer transition-all duration-200 border-2 ${
              selected === store.name
                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                : 'border-gray-100 hover:border-emerald-200 hover:shadow-md'
            }`}
            onClick={() => onSelect(store.name)}
          >
            <CardContent className="p-4 text-center relative">
              {selected === store.name && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{store.logo}</div>
              <p className="font-medium text-gray-700 text-sm">{store.name}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}