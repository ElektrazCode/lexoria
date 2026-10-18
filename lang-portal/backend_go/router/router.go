// Package router builds the HTTP router. It is shared by main and the API tests so
// that the tests exercise the same routes and CORS rules as the real server.
package router

import (
	"backend_go/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// DefaultAllowedOrigins are the local Vite dev and preview servers.
var DefaultAllowedOrigins = []string{
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
	"http://127.0.0.1:4173",
}

// New returns the API router. `extra` middleware (e.g. gin.Logger()) runs first.
//
// There are deliberately no routes that delete data: resetting a database is a local
// Mage task (see MageFile.go), not something a web page or the network can trigger.
//
// CORS only tells browsers which origins may READ responses; it does not stop a request from
// being sent and is not an access control. The server is therefore also bound to localhost
// by default (see main.go).
func New(allowedOrigins []string, extra ...gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.Use(extra...)
	r.Use(gin.Recovery())

	r.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{"Content-Type"},
	}))

	r.GET("/api/dashboard/last_study_session", handlers.GetLastStudySession)
	r.GET("/api/dashboard/study_progress", handlers.GetStudyProgress)
	r.GET("/api/dashboard/quick-stats", handlers.GetQuickStats)
	r.GET("/api/activities", handlers.GetActivities)
	r.GET("/api/activities/:id", handlers.GetActivityByID)
	r.GET("/api/activities/:id/sessions", handlers.GetActivitySessions)
	r.POST("/api/activities", handlers.CreateActivity)
	r.GET("/api/words", handlers.GetWords)
	r.GET("/api/words/:id", handlers.GetWordByID)
	r.GET("/api/groups", handlers.GetGroups)
	r.GET("/api/groups/:id", handlers.GetGroupByID)
	r.GET("/api/groups/:id/words", handlers.GetGroupWords)
	r.GET("/api/groups/:id/sessions", handlers.GetGroupSessions)
	r.GET("/api/sessions", handlers.GetSessions)
	r.GET("/api/sessions/:id", handlers.GetSessionByID)
	r.GET("/api/sessions/:id/words", handlers.GetSessionWords)
	r.POST("/api/sessions/:id/words/:word_id/review", handlers.ReviewWord)

	return r
}
