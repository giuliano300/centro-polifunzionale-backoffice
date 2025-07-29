import { AuthUser } from "./auth-user";
import { Spaces } from "./spaces";

export interface Bookings {
  _id: string;
  user: AuthUser;
  space: Spaces;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}