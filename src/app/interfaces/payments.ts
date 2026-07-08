import { Bookings } from "./bookings";

export interface Payment {
  _id: string;
  bookingId: string | Bookings;
  amount: number;
  status: string;
  method: string;
  transactionId?: string;
}
