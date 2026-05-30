package repository

import (
	"context"
	"dashboard-logistica/backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderRepository struct {
	db *pgxpool.Pool
}

func NewOrderRepository(db *pgxpool.Pool) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) GetAll(ctx context.Context) ([]models.Order, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, product_id, quantity, total_price, status, created_at, updated_at
		FROM orders ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) GetByID(ctx context.Context, id int) (*models.Order, error) {
	var o models.Order
	err := r.db.QueryRow(ctx, `
		SELECT id, product_id, quantity, total_price, status, created_at, updated_at
		FROM orders WHERE id = $1`, id).
		Scan(&o.ID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// Create crea una orden y descuenta stock del producto en una sola transacción
func (r *OrderRepository) Create(ctx context.Context, productID, quantity int, totalPrice float64) (*models.Order, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND stock >= $1`,
		quantity, productID)
	if err != nil {
		return nil, err
	}

	var o models.Order
	err = tx.QueryRow(ctx, `
		INSERT INTO orders (product_id, quantity, total_price)
		VALUES ($1, $2, $3)
		RETURNING id, product_id, quantity, total_price, status, created_at, updated_at`,
		productID, quantity, totalPrice).
		Scan(&o.ID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, id int, status models.OrderStatus) (*models.Order, error) {
	var o models.Order
	err := r.db.QueryRow(ctx, `
		UPDATE orders SET status=$1, updated_at=NOW()
		WHERE id=$2
		RETURNING id, product_id, quantity, total_price, status, created_at, updated_at`,
		status, id).
		Scan(&o.ID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OrderRepository) Delete(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM orders WHERE id = $1`, id)
	return err
}
