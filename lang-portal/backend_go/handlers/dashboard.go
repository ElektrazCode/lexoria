// filepath: backend_go/handlers/dashboard.go
package handlers

import (
	"backend_go/database"
	"backend_go/models"
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetLastStudySession(c *gin.Context) {
	var session models.Session

	err := database.DB.QueryRow("SELECT id, group_id, created_at FROM sessions ORDER BY created_at DESC LIMIT 1").Scan(&session.ID, &session.GroupID, &session.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		// No study sessions yet is a normal state, not an error
		c.JSON(http.StatusOK, gin.H{"session": nil})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": session})
}

func GetStudyProgress(c *gin.Context) {
	var progress struct {
		TotalSessions int `json:"total_sessions"`
		TotalWords    int `json:"total_words"`
	}

	err := database.DB.QueryRow("SELECT COUNT(*) FROM sessions").Scan(&progress.TotalSessions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	err = database.DB.QueryRow("SELECT COUNT(*) FROM words").Scan(&progress.TotalWords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func GetQuickStats(c *gin.Context) {
	var stats struct {
		TotalWords  int `json:"total_words"`
		TotalGroups int `json:"total_groups"`
	}

	err := database.DB.QueryRow("SELECT COUNT(*) FROM words").Scan(&stats.TotalWords)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	err = database.DB.QueryRow("SELECT COUNT(*) FROM groups").Scan(&stats.TotalGroups)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
