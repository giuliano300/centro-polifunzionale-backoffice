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
  status: string;
}