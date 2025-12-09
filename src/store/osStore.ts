import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OSConfig {
  // Referência à chapa original
  chapaId?: string;
  chapaName?: string;
  // Snapshot das configurações (imutáveis após criação)
  paperSize?: string;
  customWidth?: number;
  customHeight?: number;
  labelWidth?: number;
  labelHeight?: number;
  columns?: number;
  rows?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  spacingHorizontal?: number;
  spacingVertical?: number;
}

export interface OS {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Configurações iniciais da O.S (snapshot da chapa)
  config?: OSConfig;
}

interface OSStore {
  osList: OS[];
  createOS: (name: string, description?: string, config?: OSConfig) => OS;
  updateOS: (id: string, updates: Partial<Omit<OS, 'id' | 'createdAt' | 'config'>>) => void;
  deleteOS: (id: string) => void;
  getOS: (id: string) => OS | undefined;
}

export const useOSStore = create<OSStore>()(
  persist(
    (set, get) => ({
      osList: [],
      
      createOS: (name, description, config) => {
        const newOS: OS = {
          id: `os-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          config,
        };
        
        set((state) => ({
          osList: [...state.osList, newOS],
        }));
        
        return newOS;
      },
      
      // Nota: config não pode ser alterado após criação (snapshot imutável)
      updateOS: (id, updates) => {
        set((state) => ({
          osList: state.osList.map((os) =>
            os.id === id
              ? { ...os, ...updates, updatedAt: new Date().toISOString() }
              : os
          ),
        }));
      },
      
      deleteOS: (id) => {
        set((state) => ({
          osList: state.osList.filter((os) => os.id !== id),
        }));
      },
      
      getOS: (id) => {
        return get().osList.find((os) => os.id === id);
      },
    }),
    {
      name: 'os-storage',
    }
  )
);
