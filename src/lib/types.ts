export type NumberStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD_PAID' | 'SOLD_PENDING';
export type AssignmentStatus = 'RESERVED' | 'PAID' | 'PENDING';
export type PaymentType = 'TOTAL' | 'ABONO';

export interface RaffleNumberData {
  number: string;
  status: NumberStatus;
  price: number;
  customerId?: string | null;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
  } | null;
  assignment?: {
    id: string;
    status: AssignmentStatus;
    assignedAt: string;
    notes?: string | null;
  } | null;
}

export interface CustomerData {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  numbers: {
    number: string;
    status: NumberStatus;
    price: number;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentType: PaymentType;
    paymentMethod: string;
    reference?: string | null;
    paidAt: string;
    notes?: string | null;
  }[];
  totalPurchased: number;
  totalPaid: number;
  pendingBalance: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface DashboardStats {
  totalNumbers: number;
  soldNumbers: number;
  reservedNumbers: number;
  availableNumbers: number;
  paidNumbers: number;
  pendingNumbers: number;
  totalCollected: number;
  totalPending: number;
  totalPotentialRevenue: number;
  totalCustomers: number;
  paidCustomersCount: number;
  pendingCustomersCount: number;
}

export interface RaffleDrawData {
  id: string;
  title: string;
  prize: string;
  drawDate: string;
  lottery: string;
  isMain: boolean;
  winningNumber?: string | null;
}

export interface AuditLogData {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  performedBy: string;
  details: string;
  createdAt: string;
}
