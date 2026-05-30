package models

import "time"

type OrderStatus string

const (
	StatusPendiente OrderStatus = "pendiente"
	StatusEnViaje   OrderStatus = "en viaje"
	StatusEntregado OrderStatus = "entregado"
)

type Order struct {
	ID         int         `json:"id"`
	ProductID  int         `json:"product_id"`
	Quantity   int         `json:"quantity"`
	TotalPrice float64     `json:"total_price"`
	Status     OrderStatus `json:"status"`
	CreatedAt  time.Time   `json:"created_at"`
	UpdatedAt  time.Time   `json:"updated_at"`
}

type CreateOrderRequest struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status"`
}
