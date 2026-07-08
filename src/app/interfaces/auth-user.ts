import { UserRole } from "./roles/roles";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  taxCode?: string;
  password: string;
  role: UserRole;
}
