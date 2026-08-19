import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Speaker, Headphones, Check, X } from 'lucide-react';

interface AirplayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AirplayModal: React.FC<AirplayModalProps> = ({ isOpen, onClose }) => {
  const [selectedDevice, setSelectedDevice] = React.useState('iPhone');

  const devices = [
    { id: 'iPhone', name: 'Este dispositivo', type: 'phone', icon: Smartphone },
    { id: 'AirPods', name: 'AirPods Pro (Darling)', type: 'headphones', icon: Headphones },
    { id: 'HomePod', name: 'HomePod - Sala de estar', type: 'speaker', icon: Speaker },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-zinc-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl text-white"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Speaker className="w-5 h-5 text-white/70" />
                <h3 className="font-bold text-base">Salida de audio</h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {devices.map((dev) => {
                const Icon = dev.icon;
                const isSelected = selectedDevice === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => {
                      setSelectedDevice(dev.id);
                      setTimeout(onClose, 300);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-white/20 border border-white/20 shadow-md text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold text-sm">{dev.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
