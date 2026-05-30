package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"dashboard-logistica/backend/internal/models"
	"dashboard-logistica/backend/internal/repository"

	"github.com/go-chi/chi/v5"
)

type ProductHandler struct {
	repo *repository.ProductRepository
}

func NewProductHandler(repo *repository.ProductRepository) *ProductHandler {
	return &ProductHandler{repo: repo}
}

func (h *ProductHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	products, err := h.repo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if products == nil {
		products = []models.Product{}
	}
	respondJSON(w, http.StatusOK, products)
}

func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	product, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "producto no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, product)
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	if req.Name == "" || req.SKU == "" {
		respondError(w, http.StatusBadRequest, "name y sku son requeridos")
		return
	}
	product, err := h.repo.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusConflict, "el SKU ya existe o error al crear producto")
		return
	}
	respondJSON(w, http.StatusCreated, product)
}

func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	var req models.UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	product, err := h.repo.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusNotFound, "producto no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, product)
}

func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	if err := h.repo.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, "producto no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "producto eliminado"})
}
