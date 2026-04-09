import api from "@/lib/axios";

export type PrasadamOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface PrasadamOrderItem {
  prasadamId: string;
  title: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface PrasadamOrder {
  _id: string;
  orderId: string;
  user: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
  items: PrasadamOrderItem[];
  totalAmount: number;
  deliveryAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: PrasadamOrderStatus;
  paymentStatus: "pending" | "paid" | "failed";
  trackingId?: string;
  courierName?: string;
  courierWebsite?: string;
  createdAt: string;
}

export interface PrasadamOrdersResponse {
  orders: PrasadamOrder[];
  pagination: { total: number; page: number; limit: number; pages: number };
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    preparing: number;
    delivered: number;
    cancelled: number;
  };
}

export const prasadamOrdersApi = {
  getAll: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get<PrasadamOrdersResponse>("prasadam-orders", { params });
    return response.data;
  },
  updateStatus: async (id: string, data: { status?: PrasadamOrderStatus; trackingId?: string; courierName?: string; courierWebsite?: string }) => {
    const response = await api.patch<{ success: boolean; order: PrasadamOrder }>(`prasadam-orders/${id}/status`, data);
    return response.data;
  },
};

