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
}

const initialState: PetsState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
};

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    setPets: (state, action: PayloadAction<Pet[]>) => {
      state.pets = action.payload;
      AsyncStorage.setItem('pets', JSON.stringify(action.payload));
    },
    addPet: (state, action: PayloadAction<Pet>) => {
      state.pets.unshift(action.payload);
      AsyncStorage.setItem('pets', JSON.stringify(state.pets));
    },
    updatePet: (state, action: PayloadAction<Pet>) => {
      const index = state.pets.findIndex(pet => pet.id === action.payload.id);
      if (index !== -1) {
        state.pets[index] = action.payload;
        AsyncStorage.setItem('pets', JSON.stringify(state.pets));
      }
    },
    deletePet: (state, action: PayloadAction<string>) => {
      state.pets = state.pets.filter(pet => pet.id !== action.payload);
      AsyncStorage.setItem('pets', JSON.stringify(state.pets));
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
} = petsSlice.actions;

export default petsSlice.reducer; 