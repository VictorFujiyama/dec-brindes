export type ArtStatus = "PENDING" | "APPROVED" | "PRODUCTION";

export interface Order {
  id: string;
  shopeeOrderId: string;
  customerUser: string;
  customerName: string;
  productName: string;
  variation: string | null;
  quantity: number;
  totalValue: number;
  customerNote: string | null;
  shippingDate: Date;
  orderDate: Date;
  artStatus: ArtStatus;
  artName: string | null;
  internalNote: string | null;
  sentToProductionAt: Date | null;
  artPngUrl: string | null;
  artCdrUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFromXLS {
  shopeeOrderId: string;
  customerUser: string;
  customerName: string;
  productName: string;
  variation: string | null;
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
