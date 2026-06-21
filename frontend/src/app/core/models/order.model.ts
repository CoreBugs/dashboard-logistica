export type OrderStatus = 'pendiente' | 'en viaje' | 'entregado';

export interface Order {
  id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
