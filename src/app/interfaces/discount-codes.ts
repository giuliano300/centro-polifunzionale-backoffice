export interface DiscountCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  target: 'all' | 'booking' | 'course';
  spaces?: Array<string | { _id: string; name: string }>;
  spaceIds?: string[];
  userRoles?: string[];
  rule?: 'manual' | 'new_user' | 'monthly_purchases';
  newUserDays?: number;
  monthlyPurchaseMin?: number;
  isActive: boolean;
  validFrom?: string | Date;
  validTo?: string | Date;
  maxUses?: number;
  usedCount: number;
}
