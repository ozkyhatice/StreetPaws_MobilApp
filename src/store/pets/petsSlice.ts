import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  gender: string;
  description: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'found' | 'lost' | 'adoption';
  ownerId?: string;
  createdAt: number;
}

interface PetsState {
  pets: Pet[];
  selectedPet: Pet | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: string;
    status?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
  };
}

const initialState: PetsState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
  filters: {},
};

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    setPets: (state, action: PayloadAction<Pet[]>) => {
      state.pets = action.payload;
    },
    addPet: (state, action: PayloadAction<Pet>) => {
      state.pets.unshift(action.payload);
    },
    updatePet: (state, action: PayloadAction<Pet>) => {
      const index = state.pets.findIndex(pet => pet.id === action.payload.id);
      if (index !== -1) {
        state.pets[index] = action.payload;
      }
    },
    deletePet: (state, action: PayloadAction<string>) => {
      state.pets = state.pets.filter(pet => pet.id !== action.payload);
    },
    setSelectedPet: (state, action: PayloadAction<Pet | null>) => {
      state.selectedPet = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<PetsState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setPets,
  addPet,
  updatePet,
  deletePet,
  setSelectedPet,
  setLoading,
  setError,
  setFilters,
  clearFilters,
} = petsSlice.actions;

export default petsSlice.reducer; 