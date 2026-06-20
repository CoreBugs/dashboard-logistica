package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"dashboard-logistica/backend/config"
	"dashboard-logistica/backend/internal/handler"
	"dashboard-logistica/backend/internal/middleware"
	"dashboard-logistica/backend/internal/repository"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Archivo .env no encontrado, usando variables de entorno del sistema")
	}

	cfg := config.Load()

	db, err := pgxpool.New(context.Background(), cfg.DSN())
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatalf("No se pudo hacer ping a la base de datos: %v", err)
	}
	log.Println("Conexión a PostgreSQL establecida")

	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)
	orderRepo := repository.NewOrderRepository(db)

	authHandler := handler.NewAuthHandler(userRepo, cfg.JWTSecret)
	userHandler := handler.NewUserHandler(userRepo)
	productHandler := handler.NewProductHandler(productRepo)
	orderHandler := handler.NewOrderHandler(orderRepo, productRepo)

	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	r.Use(chiMiddleware.SetHeader("Content-Type", "application/json"))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/login", authHandler.Login)
	})

	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		r.Route("/users", func(r chi.Router) {
			r.Get("/", userHandler.GetAll)
			r.Post("/", userHandler.Create)
			r.Get("/{id}", userHandler.GetByID)
			r.Put("/{id}", userHandler.Update)
			r.Delete("/{id}", userHandler.Delete)
		})

		r.Route("/products", func(r chi.Router) {
			r.Get("/", productHandler.GetAll)
			r.Post("/", productHandler.Create)
			r.Get("/{id}", productHandler.GetByID)
			r.Put("/{id}", productHandler.Update)
			r.Delete("/{id}", productHandler.Delete)
		})

		r.Route("/orders", func(r chi.Router) {
			r.Get("/", orderHandler.GetAll)
			r.Post("/", orderHandler.Create)
			r.Get("/{id}", orderHandler.GetByID)
			r.Patch("/{id}/status", orderHandler.UpdateStatus)
			r.Delete("/{id}", orderHandler.Delete)
		})
	})

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Servidor iniciado en http://localhost%s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}
