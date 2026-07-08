export type SpaceRentalUnit = 'whole_room' | 'workstation';
export type SpaceRentalMode = 'time' | 'full_day';

export interface SpaceOpeningSlot {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Spaces {
  _id: string;
  name: string;
  description: string;
  hourlyRate: number;
  dailyRate: number;
  rentalUnit: SpaceRentalUnit;
  rentalModes: SpaceRentalMode[];
  timeSlotMinutes: number;
  workstationCount: number;
  openingHours: SpaceOpeningSlot[];
  isAvailable: boolean;
}
