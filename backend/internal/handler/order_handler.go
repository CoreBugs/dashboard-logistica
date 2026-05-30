package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"dashboard-logistica/backend/internal/models"
	"dashboard-logistica/backend/internal/repository"

	"github.com/go-chi/chi/v5"
)

type OrderHandler struct {
	orderRepo   *repository.OrderRepository
	productRepo *repository.ProductRepository
}

func NewOrderHandler(orderRepo *repository.OrderRepository, productRepo *repository.ProductRepository) *OrderHandler {
	return &OrderHandler{orderRepo: orderRepo, productRepo: productRepo}
}

func (h *OrderHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	orders, err := h.orderRepo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if orders == nil {
		orders = []models.Order{}
	}
	respondJSON(w, http.StatusOK, orders)
}

func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	order, err := h.orderRepo.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}
	respondJSON(w, http.StatusOK, order)
}

func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	if req.ProductID == 0 || req.Quantity <= 0 {
		respondError(w, http.StatusBadRequest, "product_id y quantity son requeridos")
		return
	}

	product, err := h.productRepo.GetByID(r.Context(), req.ProductID)
	if err != nil {
		respondError(w, http.StatusNotFound, "producto no encontrado")
		return
	}
	if product.Stock < req.Quantity {
		respondError(w, http.StatusConflict, "stock insuficiente")
		return
	}

	totalPrice := product.Price * float64(req.Quantity)
	order, err := h.orderRepo.Create(r.Context(), req.ProductID, req.Quantity, totalPrice)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error al crear orden")
		return
	}
	respondJSON(w, http.StatusCreated, order)
}

func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	var req models.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	if req.Status != models.StatusPendiente && req.Status != models.StatusEnViaje && req.Status != models.StatusEntregado {
		respondError(w, http.StatusBadRequest, "status inválido: debe ser 'pendiente', 'en viaje' o 'entregado'")
		return
	}
	order, err := h.orderRepo.UpdateStatus(r.Context(), id, req.Status)
	if err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}
	respondJSON(w, http.StatusOK, order)
}

func (h *OrderHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	if err := h.orderRepo.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, "orden no encontrada")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "orden eliminada"})
}
