import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingBag, ImageIcon, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ProductSearch from './ProductSearch';
import ProductRecognition from './ProductRecognition';

export default function ShoppingListEditor({ items, onChange, storeName }) {
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [itemImages, setItemImages] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    // Generate images for new items
    items.forEach((item, index) => {
      if (!itemImages[index] && item.item) {
        generateImage(item.item, index);
      }
    });
  }, [items]);

  const generateImage = async (itemName, index) => {
    try {
      const prompt = `Photo de produit alimentaire en haute qualité: ${itemName}. Vue de face, fond blanc, style catalogue supermarché.`;
      const { url } = await base44.integrations.Core.GenerateImage({ prompt });
      setItemImages(prev => ({ ...prev, [index]: url }));
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const updatedItems = [
      ...items,
      { item: newItem.trim(), quantity: newQuantity, checked: false }
    ];
    onChange(updatedItems);
    setNewItem('');
    setNewQuantity(1);
  };

  const addProductFromSearch = (product) => {
    const updatedItems = [
      ...items,
      { item: product.item, quantity: product.quantity, checked: false }
    ];
    onChange(updatedItems);
  };

  const addProductFromPhoto = (product) => {
    const updatedItems = [
      ...items,
      { item: product.item, quantity: product.quantity, checked: false }
    ];
    onChange(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
  };

  const updateQuantity = (index, quantity) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, quantity: parseInt(quantity) || 1 } : item
    );
    onChange(updatedItems);
  };

  return (
    <div className="space-y-4">
      {/* Product Search and Recognition */}
      {storeName && (
        <div className="flex gap-2">
          <div className="flex-1">
            <ProductSearch 
              storeName={storeName} 
              onAddProduct={addProductFromSearch}
            />
          </div>
          <ProductRecognition 
            storeName={storeName}
            onProductAdd={addProductFromPhoto}
          />
        </div>
      )}

      {/* Add item form */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Ou ajouter manuellement un article..."
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="h-12"
          />
        </div>
        <Input
          type="number"
          value={newQuantity}
          onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
          min={1}
          className="w-20 h-12 text-center"
        />
        <Button 
          onClick={addItem}
          className="h-12 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Items list */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun article dans la liste</p>
              <p className="text-sm">Commencez à ajouter des articles</p>
            </div>
          ) : (
            <AnimatePresence>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {itemImages[index] ? (
                        <button
                          onClick={() => {
                            setSelectedImage(itemImages[index]);
                            setImageZoom(1);
                          }}
                          className="relative group cursor-zoom-in"
                        >
                          <img 
                            src={itemImages[index]} 
                            alt={item.item}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 group-hover:border-emerald-400 transition-colors"
                          />
                          <ZoomIn className="absolute inset-0 w-4 h-4 m-auto text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400 animate-pulse" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium">{item.item}</p>
                        <p className="text-xs text-gray-500">{item.quantity} unité{item.quantity > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        min={1}
                        className="w-16 h-8 text-center text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {items.length} article{items.length > 1 ? 's' : ''} • {items.reduce((sum, item) => sum + item.quantity, 0)} unités au total
        </p>
      )}

      {/* Image Zoom Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-2xl p-0 bg-black border-0">
          <div className="relative bg-black flex items-center justify-center min-h-96">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Image with zoom */}
            <div className="overflow-auto max-h-96 flex items-center justify-center w-full">
              <img
                src={selectedImage}
                alt="Zoomed product"
                style={{
                  transform: `scale(${imageZoom})`,
                  transition: 'transform 0.2s'
                }}
                className="cursor-zoom-in"
                onWheel={(e) => {
                  e.preventDefault();
                  const newZoom = Math.min(3, Math.max(1, imageZoom + (e.deltaY > 0 ? -0.1 : 0.1)));
                  setImageZoom(newZoom);
                }}
              />
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setImageZoom(Math.max(1, imageZoom - 0.2))}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm px-2 flex items-center">
                {Math.round(imageZoom * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setImageZoom(Math.min(3, imageZoom + 0.2))}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom hint */}
            <p className="absolute top-4 left-4 text-white text-xs opacity-75">
              Molette pour zoomer
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}