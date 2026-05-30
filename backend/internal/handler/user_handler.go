package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"dashboard-logistica/backend/internal/models"
	"dashboard-logistica/backend/internal/repository"

	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

func (h *UserHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	users, err := h.repo.GetAll(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if users == nil {
		users = []models.User{}
	}
	respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	user, err := h.repo.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "usuario no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	if req.Name == "" || req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "name, email y password son requeridos")
		return
	}
	if req.Role == "" {
		req.Role = models.RoleRepartidor
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generando contraseña")
		return
	}

	user, err := h.repo.Create(r.Context(), req.Name, req.Email, string(hash), req.Role)
	if err != nil {
		respondError(w, http.StatusConflict, "el email ya existe o error al crear usuario")
		return
	}
	respondJSON(w, http.StatusCreated, user)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}
	user, err := h.repo.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusNotFound, "usuario no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "id inválido")
		return
	}
	if err := h.repo.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusNotFound, "usuario no encontrado")
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"message": "usuario eliminado"})
}
