export type ArtStatus = "PENDING" | "APPROVED" | "PRODUCTION" | "SHIPPED";

export interface Order {
  id: string;
  shopeeOrderId: string;
  customerUser: string;
  customerName: string;
  productName: string;
  variation: string;
  quantity: number;
  totalValue: number;
  customerNote: string | null;
  shippingDate: Date;
  orderDate: Date;
  artStatus: ArtStatus;
  artName: string | null;
  artGroupId: number;
  cupQuantity: number | null;
  realDescription: string | null;
  internalNote: string | null;
  sentToProductionAt: Date | null;
  artPngUrl: string | null;
  artCdrUrl: string | null;
  shippedAt: Date | null;
  isUrgent: boolean;
  urgentFromDate: Date | null;
  inDailyQueue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFromXLS {
  shopeeOrderId: string;
  customerUser: string;
  customerName: string;
  productName: string;
  variation: string;
  quantity: number;
  totalValue: number;
  customerNote: string | null;
  shippingDate: Date;
  orderDate: Date;
}

export interface GroupedOrders {
  customerUser: string;
  customerName: string;
  orders: Order[];
  totalItems: number;
  earliestShipping: Date;
  allApproved: boolean;
}
