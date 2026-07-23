import { create } from 'zustand';

interface FilterState {
  mark: string;
  markId: string;
  model: string;
  modelId: string;
  setMark: (mark: string, markId: string) => void;
  setModel: (model: string, modelId: string) => void;
  resetFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  mark: '',
  markId: '',
  model: '',
  modelId: '',

  setMark: (mark, markId) => set({ mark, markId, model: '', modelId: '' }),
  setModel: (model, modelId) => set({ model, modelId }),

  resetFilter: () => set({ mark: '', markId: '', model: '', modelId: '' }),
}));
