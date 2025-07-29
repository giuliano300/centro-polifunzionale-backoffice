import { Bookings } from "./bookings";
import { Payment } from "./payments";

export interface BookingWithPayments{
    booking: Bookings;
    payments: Payment[];
}