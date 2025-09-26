import { UserRole } from "./roles/roles";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
