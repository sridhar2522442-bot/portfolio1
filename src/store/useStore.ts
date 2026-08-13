import { create } from 'zustand';
import { type DeviceTier, detectDeviceTier } from '@/lib/deviceDetect';

export type HotspotId = 
  | 'about' 
  | 'skills' 
  | 'projects' 
  | 'education' 
  | 'contact' 
  | 'interests' 
  | 'easter_egg' 
  | null;

export type TimeMode = 'AUTO' | 'DAY' | 'SUNSET' | 'NIGHT';
export type ViewMode = 'room' | 'transitioning' | 'fullscreen-monitor';

interface AppState {
  hasEntered: boolean;
  activeHotspot: HotspotId;
  viewMode: ViewMode;
  isDeveloperMode: boolean;
  timeMode: TimeMode;
  isSongPlaying: boolean;
  deviceTier: DeviceTier;
  setHasEntered: (value: boolean) => void;
  setActiveHotspot: (id: HotspotId) => void;
  setViewMode: (mode: ViewMode) => void;
  setDeveloperMode: (value: boolean) => void;
  cycleTimeMode: () => void;
  toggleSong: () => void;
  setDeviceTier: (tier: DeviceTier) => void;
}

export const useStore = create<AppState>((set) => ({
  hasEntered: false,
  activeHotspot: null,
  viewMode: 'room',
  isDeveloperMode: false,
  timeMode: 'AUTO',
  isSongPlaying: false,
  deviceTier: detectDeviceTier(),
  setHasEntered: (value) => set({ hasEntered: value }),
  setActiveHotspot: (id) => set({ activeHotspot: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDeveloperMode: (value) => set({ isDeveloperMode: value }),
  cycleTimeMode: () => set((state) => {
    const modes: TimeMode[] = ['AUTO', 'DAY', 'SUNSET', 'NIGHT'];
    const currentIndex = modes.indexOf(state.timeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return { timeMode: modes[nextIndex] };
  }),
  toggleSong: () => set((state) => ({ isSongPlaying: !state.isSongPlaying })),
  setDeviceTier: (tier) => set({ deviceTier: tier }),
}));
