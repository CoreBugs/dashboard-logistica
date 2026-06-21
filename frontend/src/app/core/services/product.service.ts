import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/products';

  getAll() {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getById(id: number) {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateProductRequest) {
    return this.http.post<Product>(this.apiUrl, data);
  }

  update(id: number, data: UpdateProductRequest) {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
