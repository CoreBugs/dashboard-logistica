package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"dashboard-logistica/backend/internal/models"
	"dashboard-logistica/backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	accessTokenTTL    = 15 * time.Minute
	refreshTokenTTL   = 7 * 24 * time.Hour
	refreshCookieName = "refresh_token"
)

type AuthHandler struct {
	repo          *repository.UserRepository
	jwtSecret     string
	refreshSecret string
	env           string
}

func NewAuthHandler(repo *repository.UserRepository, jwtSecret string, refreshSecret string, env string) *AuthHandler {
	return &AuthHandler{repo: repo, jwtSecret: jwtSecret, refreshSecret: refreshSecret, env: env}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "body inválido")
		return
	}

	user, err := h.repo.GetByEmail(r.Context(), req.Email)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "credenciales inválidas")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		respondError(w, http.StatusUnauthorized, "credenciales inválidas")
		return
	}

	accessToken, err := h.generateAccessToken(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generando token")
		return
	}

	refreshToken, err := h.generateRefreshToken(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generando refresh token")
		return
	}

	h.setRefreshCookie(w, refreshToken, time.Now().Add(refreshTokenTTL))

	respondJSON(w, http.StatusOK, models.LoginResponse{Token: accessToken, User: user})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "refresh token requerido")
		return
	}

	token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (any, error) {
		return []byte(h.refreshSecret), nil
	})
	if err != nil || !token.Valid {
		respondError(w, http.StatusUnauthorized, "refresh token inválido")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "refresh token inválido")
		return
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		respondError(w, http.StatusUnauthorized, "refresh token inválido")
		return
	}

	user, err := h.repo.GetByID(r.Context(), int(userIDFloat))
	if err != nil {
		respondError(w, http.StatusUnauthorized, "usuario no encontrado")
		return
	}

	accessToken, err := h.generateAccessToken(user)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "error generando token")
		return
	}

	respondJSON(w, http.StatusOK, models.LoginResponse{Token: accessToken, User: user})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.setRefreshCookie(w, "", time.Unix(0, 0))
	respondJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *AuthHandler) generateAccessToken(user *models.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(accessTokenTTL).Unix(),
	})
	return token.SignedString([]byte(h.jwtSecret))
}

func (h *AuthHandler) generateRefreshToken(user *models.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(refreshTokenTTL).Unix(),
	})
	return token.SignedString([]byte(h.refreshSecret))
}

func (h *AuthHandler) setRefreshCookie(w http.ResponseWriter, value string, expires time.Time) {
	maxAge := int(refreshTokenTTL.Seconds())
	if value == "" {
		maxAge = -1
	}

	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.env == "production",
		Expires:  expires,
		MaxAge:   maxAge,
	})
}
