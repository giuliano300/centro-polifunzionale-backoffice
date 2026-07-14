import { AuthUser } from "./auth-user";
import { Spaces } from "./spaces";

export interface Bookings {
  _id: string;
  user: AuthUser;
  space: Spaces;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  rentalUnit: 'whole_room' | 'workstation';
  rentalMode: 'time' | 'full_day';
  workstationQuantity: number;
  status: string;
}
