package models

import "time"

type Product struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	SKU       string    `json:"sku"`
	Stock     int       `json:"stock"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name  string  `json:"name"`
	SKU   string  `json:"sku"`
	Stock int     `json:"stock"`
	Price float64 `json:"price"`
}

type UpdateProductRequest struct {
	Name  string  `json:"name"`
	SKU   string  `json:"sku"`
	Stock int     `json:"stock"`
	Price float64 `json:"price"`
}
