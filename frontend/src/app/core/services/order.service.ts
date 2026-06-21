import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, CreateOrderRequest, UpdateOrderStatusRequest } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/orders';

  getAll() {
    return this.http.get<Order[]>(this.apiUrl);
  }

  getById(id: number) {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateOrderRequest) {
    return this.http.post<Order>(this.apiUrl, data);
  }

  updateStatus(id: number, data: UpdateOrderStatusRequest) {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, data);
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
