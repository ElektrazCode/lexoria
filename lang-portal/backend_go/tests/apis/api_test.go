package apis

import (
	"backend_go/database"
	"backend_go/handlers"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

var router *gin.Engine

func TestMain(m *testing.M) {
	// Start each test run with a fresh test database.
	dbPath := filepath.Join("..", "..", "database", "test_words.db")

	if err := os.Remove(dbPath); err != nil && !os.IsNotExist(err) {
		panic(fmt.Sprintf("Error removing old test database: %v", err))
	}

	database.InitDB(dbPath)

	// Create the necessary tables and insert sample data
	createTestTables()
	insertTestData()

	// Create a new Gin router
	router = setupRouter()

	// Run the tests
	os.Exit(m.Run())
}

func createTestTables() {
	db := database.GetDB()
	migrationPath := filepath.Join("..", "..", "migrations", "0001_init.sql")
	migration, err := os.ReadFile(migrationPath)
	if err != nil {
		panic(fmt.Sprintf("Error reading migration file: %v", err))
	}
	_, err = db.Exec(string(migration))
	if err != nil {
		panic(fmt.Sprintf("Error executing migration: %v", err))
	}
}

func insertTestData() {
	db := database.GetDB()
	_, err := db.Exec(`INSERT INTO activities (name, thumbnail_url, description) VALUES ('Sample Activity', 'URL', 'This is an activity description')`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into activities table: %v", err))
	}
	_, err = db.Exec(`INSERT INTO words (target_word, english, parts) VALUES ('Sample Word', 'Sample Meaning', 'Sample Part')`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into words table: %v", err))
	}
	_, err = db.Exec(`INSERT INTO groups (name) VALUES ('Sample Group')`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into groups table: %v", err))
	}
	_, err = db.Exec(`INSERT INTO sessions (group_id, activity_id) VALUES (1, 1)`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into sessions table: %v", err))
	}
	_, err = db.Exec(`INSERT INTO words_groups (group_id, word_id) VALUES (1, 1)`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into words_groups table: %v", err))
	}
	_, err = db.Exec(`INSERT INTO review_words (session_id, word_id, correct) VALUES (1, 1, 1)`)
	if err != nil {
		panic(fmt.Sprintf("Error inserting into review_words table: %v", err))
	}
	// Add more data insertion statements as needed
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Define routes
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
	r.POST("/api/reset_history", handlers.ResetHistory)
	r.POST("/api/full_reset", handlers.FullReset)
	r.POST("/api/sessions/:id/words/:word_id/review", handlers.ReviewWord)

	return r
}

// func TestGetLastStudySession(t *testing.T) {
// 	req, _ := http.NewRequest("GET", "/api/dashboard/last_study_session", nil)
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	assert.Equal(t, http.StatusOK, w.Code)
// 	// Add more assertions based on the expected response
// }

// func TestGetStudyProgress(t *testing.T) {
// 	req, _ := http.NewRequest("GET", "/api/dashboard/study_progress", nil)
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	assert.Equal(t, http.StatusOK, w.Code)
// 	// Add more assertions based on the expected response
// }

// func TestGetQuickStats(t *testing.T) {
// 	req, _ := http.NewRequest("GET", "/api/dashboard/quick-stats", nil)
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	assert.Equal(t, http.StatusOK, w.Code)
// 	// Add more assertions based on the expected response
// }

func TestGetActivities(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/activities", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetActivityByID(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/activities/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetActivitySessions(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/activities/1/sessions", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

// func TestCreateActivity(t *testing.T) {
// 	req, _ := http.NewRequest("POST", "/api/activities", nil)
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	assert.Equal(t, http.StatusCreated, w.Code)
// 	// Add more assertions based on the expected response
// }

func TestGetWords(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/words", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetWordByID(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/words/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetGroups(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/groups", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetGroupByID(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/groups/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetGroupSessions(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/groups/1/sessions", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetSessions(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/sessions", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetSessionByID(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/sessions/1", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestGetSessionWords(t *testing.T) {
	req, _ := http.NewRequest("GET", "/api/sessions/1/words", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	fmt.Printf("Response: %s\n", w.Body.String())
	fmt.Printf("HTTP Status: %d\n", w.Code)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestResetHistory(t *testing.T) {
	req, _ := http.NewRequest("POST", "/api/reset_history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

func TestFullReset(t *testing.T) {
	req, _ := http.NewRequest("POST", "/api/full_reset", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	// Add more assertions based on the expected response
}

// func TestReviewWord(t *testing.T) {
// 	req, _ := http.NewRequest("POST", "/api/sessions/1/words/1/review", nil)
// 	w := httptest.NewRecorder()
// 	router.ServeHTTP(w, req)

// 	fmt.Printf("Response: %s\n", w.Body.String())
// 	fmt.Printf("HTTP Status: %d\n", w.Code)

// 	assert.Equal(t, http.StatusOK, w.Code)
// 	// Add more assertions based on the expected response
// }
