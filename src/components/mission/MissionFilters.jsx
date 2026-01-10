import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, MapPin, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MissionFilters({ onFilterChange, userLocation }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchRadius: 10,
    minBudget: 0,
    maxBudget: 200,
    scheduledTime: 'all',
    storeType: 'all'
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      searchRadius: 10,
      minBudget: 0,
      maxBudget: 200,
      scheduledTime: 'all',
      storeType: 'all'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filtres avancés
        {showFilters && <X className="w-4 h-4 ml-2" />}
      </Button>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mt-4 border-0 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Search Radius */}
                {userLocation && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Rayon de recherche
                      </Label>
                      <span className="text-sm font-medium text-emerald-600">
                        {filters.searchRadius} km
                      </span>
                    </div>
                    <Slider
                      value={[filters.searchRadius]}
                      onValueChange={(value) => handleFilterChange('searchRadius', value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Budget Range */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Budget estimé
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Min (€)</Label>
                      <Input
                        type="number"
                        value={filters.minBudget}
                        onChange={(e) => handleFilterChange('minBudget', parseFloat(e.target.value) || 0)}
                        min={0}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500">Max (€)</Label>
                      <Input
                        type="number"
                        value={filters.maxBudget}
                        onChange={(e) => handleFilterChange('maxBudget', parseFloat(e.target.value) || 200)}
                        min={0}
                        placeholder="200"
                      />
                    </div>
                  </div>
                </div>

                {/* Store Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Type de magasin
                  </Label>
                  <Select
                    value={filters.storeType}
                    onValueChange={(value) => handleFilterChange('storeType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les magasins" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les magasins</SelectItem>
                      <SelectItem value="Carrefour">Carrefour</SelectItem>
                      <SelectItem value="Auchan">Auchan</SelectItem>
                      <SelectItem value="Leclerc">Leclerc</SelectItem>
                      <SelectItem value="Casino">Casino</SelectItem>
                      <SelectItem value="Monoprix">Monoprix</SelectItem>
                      <SelectItem value="Franprix">Franprix</SelectItem>
                      <SelectItem value="Lidl">Lidl</SelectItem>
                      <SelectItem value="Aldi">Aldi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduled Time */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Créneau horaire
                  </Label>
                  <Select
                    value={filters.scheduledTime}
                    onValueChange={(value) => handleFilterChange('scheduledTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les créneaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les créneaux</SelectItem>
                      <SelectItem value="asap">Dès que possible</SelectItem>
                      <SelectItem value="morning">Matin (9h-12h)</SelectItem>
                      <SelectItem value="afternoon">Après-midi (14h-18h)</SelectItem>
                      <SelectItem value="evening">Soir (18h-21h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}