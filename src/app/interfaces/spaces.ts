export type SpaceRentalUnit = 'whole_room' | 'workstation';
export type SpaceRentalMode = 'time' | 'full_day';
export type SpacePaymentMethod = 'cash' | 'stripe' | 'paypal' | 'nexi';

export interface SpaceOpeningSlot {
  day: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  maxConsecutiveTimeSlots?: number;
}

export interface SpaceExceptionalClosure {
  startDate: string | Date;
  endDate: string | Date;
  reason?: string;
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
  maxConsecutiveTimeSlots?: number;
  workstationCount: number;
  courseCreationAdvanceHours?: number;
  paymentMethods?: SpacePaymentMethod[];
  openingHours: SpaceOpeningSlot[];
  exceptionalClosures?: SpaceExceptionalClosure[];
  isAvailable: boolean;
}
