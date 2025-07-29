export interface Payment {
  _id: string;
  bookingId: string;
  amount: number;
  status: string;
  method: string;
  transactionId?: string;
}