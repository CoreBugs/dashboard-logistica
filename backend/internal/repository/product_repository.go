package repository

import (
	"context"
	"dashboard-logistica/backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) GetAll(ctx context.Context) ([]models.Product, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, sku, stock, price, created_at, updated_at
		FROM products ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(&p.ID, &p.Name, &p.SKU, &p.Stock, &p.Price, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *ProductRepository) GetByID(ctx context.Context, id int) (*models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		SELECT id, name, sku, stock, price, created_at, updated_at
		FROM products WHERE id = $1`, id).
		Scan(&p.ID, &p.Name, &p.SKU, &p.Stock, &p.Price, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProductRepository) Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		INSERT INTO products (name, sku, stock, price)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, sku, stock, price, created_at, updated_at`,
		req.Name, req.SKU, req.Stock, req.Price).
		Scan(&p.ID, &p.Name, &p.SKU, &p.Stock, &p.Price, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProductRepository) Update(ctx context.Context, id int, req models.UpdateProductRequest) (*models.Product, error) {
	var p models.Product
	err := r.db.QueryRow(ctx, `
		UPDATE products SET name=$1, sku=$2, stock=$3, price=$4, updated_at=NOW()
		WHERE id=$5
		RETURNING id, name, sku, stock, price, created_at, updated_at`,
		req.Name, req.SKU, req.Stock, req.Price, id).
		Scan(&p.ID, &p.Name, &p.SKU, &p.Stock, &p.Price, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProductRepository) Delete(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	return err
}
