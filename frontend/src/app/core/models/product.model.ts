export interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  stock: number;
  price: number;
}

export interface UpdateProductRequest {
  name: string;
  sku: string;
  stock: number;
  price: number;
}
