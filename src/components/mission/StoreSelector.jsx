import React from 'react';
import { Store, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const stores = [
  { id: 'carrefour', name: 'Carrefour', color: '#004E9A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/200px-Carrefour_logo.svg.png' },
  { id: 'leclerc', name: 'E.Leclerc', color: '#E41D35', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Logo_E.Leclerc_Sans_le_texte.svg/200px-Logo_E.Leclerc_Sans_le_texte.svg.png' },
  { id: 'auchan', name: 'Auchan', color: '#E2001A', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Auchan_Logo.svg/200px-Auchan_Logo.svg.png' },
  { id: 'intermarche', name: 'Intermarché', color: '#E50019', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Intermarche_logo.svg/200px-Intermarche_logo.svg.png' },
  { id: 'lidl', name: 'Lidl', color: '#0050AA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/200px-Lidl-Logo.svg.png' },
  { id: 'aldi', name: 'Aldi', color: '#0078D4', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Aldi_Nord_201x_logo.svg/200px-Aldi_Nord_201x_logo.svg.png' },
  { id: 'monoprix', name: 'Monoprix', color: '#E4002B', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Monoprix_logo.svg/200px-Monoprix_logo.svg.png' },
  { id: 'franprix', name: 'Franprix', color: '#E40046', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Franprix_logo.svg/200px-Franprix_logo.svg.png' },
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
              <div className="flex items-center justify-center mb-2 h-12">
                {store.id === 'other' ? (
                  <span className="text-3xl">{store.logo}</span>
                ) : (
                  <img 
                    src={store.logo} 
                    alt={store.name}
                    className="max-h-10 max-w-full object-contain"
                  />
                )}
              </div>
              <p className="font-medium text-gray-700 text-sm">{store.name}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}