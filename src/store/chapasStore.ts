import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Chapa {
  id: string;
  name: string;
  // Dimensões da chapa
  width: number;  // mm
  height: number; // mm
  // Dimensões da etiqueta
  labelWidth: number;  // mm
  labelHeight: number; // mm
  // Layout
  columns: number;
  rows: number;
  // Margens (opcionais, padrão 5mm)
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  // Espaçamento (opcionais, padrão 2mm)
  spacingHorizontal?: number;
  spacingVertical?: number;
  // Metadados
  createdAt: string;
  updatedAt: string;
}

interface ChapasStore {
  chapas: Chapa[];
  createChapa: (chapa: Omit<Chapa, 'id' | 'createdAt' | 'updatedAt'>) => Chapa;
  updateChapa: (id: string, updates: Partial<Omit<Chapa, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteChapa: (id: string) => void;
  getChapa: (id: string) => Chapa | undefined;
  getChapaByName: (name: string) => Chapa | undefined;
}

export const useChapasStore = create<ChapasStore>()(
  persist(
    (set, get) => ({
      chapas: [],
      
      createChapa: (chapaData) => {
        const newChapa: Chapa = {
          ...chapaData,
          id: `chapa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          chapas: [...state.chapas, newChapa],
        }));
        
        return newChapa;
      },
      
      updateChapa: (id, updates) => {
        set((state) => ({
          chapas: state.chapas.map((chapa) =>
            chapa.id === id
              ? { ...chapa, ...updates, updatedAt: new Date().toISOString() }
              : chapa
          ),
        }));
      },
      
      deleteChapa: (id) => {
        set((state) => ({
          chapas: state.chapas.filter((chapa) => chapa.id !== id),
        }));
      },
      
      getChapa: (id) => {
        return get().chapas.find((chapa) => chapa.id === id);
      },
      
      getChapaByName: (name) => {
        return get().chapas.find((chapa) => chapa.name.toLowerCase() === name.toLowerCase());
      },
    }),
    {
      name: 'chapas-storage',
    }
  )
);

// Função auxiliar para calcular total de etiquetas por chapa
export function calcularTotalEtiquetas(chapa: Chapa): number {
  return chapa.columns * chapa.rows;
}
