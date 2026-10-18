package main

import (
	"backend_go/database"
	"backend_go/router"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	// Localhost only by default; set SERVER_ADDR (e.g. ":8080") to listen on other interfaces.
	defaultAddr = "127.0.0.1:8080"
)

func main() {
	// Initialize the database
	dbPath := filepath.Join("database", "words.db")
	database.InitDB(dbPath)

	r := router.New(allowedOrigins(), gin.Logger())

	// Start the server
	r.Run(envOr("SERVER_ADDR", defaultAddr))
}

// allowedOrigins returns the browser origins allowed by CORS: CORS_ORIGINS
// (comma-separated) if set, otherwise the local Vite dev/preview servers.
func allowedOrigins() []string {
	value := os.Getenv("CORS_ORIGINS")
	if value == "" {
		return router.DefaultAllowedOrigins
	}
	var origins []string
	for _, origin := range strings.Split(value, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			origins = append(origins, origin)
		}
	}
	if len(origins) == 0 {
		return router.DefaultAllowedOrigins
	}
	return origins
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
