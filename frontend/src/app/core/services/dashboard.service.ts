import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { forkJoin, map } from 'rxjs';

export interface DashboardSummary {
  totalOrders: number;
  pendiente: number;
  enViaje: number;
  entregado: number;
  totalProducts: number;
  lowStockProducts: number;
  recentOrders: Order[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  getSummary() {
    return forkJoin({
      orders: this.http.get<Order[]>(`${this.baseUrl}/orders`),
      products: this.http.get<Product[]>(`${this.baseUrl}/products`),
    }).pipe(
      map(({ orders, products }) => {
        const summary: DashboardSummary = {
          totalOrders: orders.length,
          pendiente: orders.filter(o => o.status === 'pendiente').length,
          enViaje: orders.filter(o => o.status === 'en viaje').length,
          entregado: orders.filter(o => o.status === 'entregado').length,
          totalProducts: products.length,
          lowStockProducts: products.filter(p => p.stock <= 5).length,
          recentOrders: [...orders]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5),
        };
        return summary;
      })
    );
  }
}
