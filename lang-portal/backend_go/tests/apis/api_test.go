package apis

import (
	"backend_go/database"
	"backend_go/handlers"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)
	os.Exit(m.Run())
}

// newTestRouter gives the calling test its own freshly migrated SQLite
// database (in t.TempDir, removed automatically) populated with one row per
// table, and returns a router wired to it. It never touches database/*.db.
//
// The handlers read the package-level database.DB, so each call re-points that
// global at the new database. This keeps tests isolated as long as they run
// serially, so tests in this package must not call t.Parallel().
func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()

	database.InitDB(filepath.Join(t.TempDir(), "test_words.db"))
	db := database.GetDB()
	t.Cleanup(func() { db.Close() })

	migration, err := os.ReadFile(filepath.Join("..", "..", "migrations", "0001_init.sql"))
	require.NoError(t, err, "reading migration file")
	_, err = db.Exec(string(migration))
	require.NoError(t, err, "executing migration")

	fixtures := []string{
		`INSERT INTO activities (name, thumbnail_url, description) VALUES ('Sample Activity', 'URL', 'This is an activity description')`,
		`INSERT INTO words (target_word, english, parts) VALUES ('Sample Word', 'Sample Meaning', 'Sample Part')`,
		`INSERT INTO groups (name) VALUES ('Sample Group')`,
		`INSERT INTO sessions (group_id, activity_id) VALUES (1, 1)`,
		`INSERT INTO words_groups (group_id, word_id) VALUES (1, 1)`,
		`INSERT INTO review_words (session_id, word_id, correct) VALUES (1, 1, 1)`,
	}
	for _, stmt := range fixtures {
		_, err := db.Exec(stmt)
		require.NoError(t, err, "inserting fixture: %s", stmt)
	}

	return setupRouter()
}

func setupRouter() *gin.Engine {
	r := gin.New()

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

// request performs a request against the router and returns the recorded response.
func request(r *gin.Engine, method, path string) *httptest.ResponseRecorder {
	req, _ := http.NewRequest(method, path, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

// countRows returns the number of rows in a table of the current test database.
func countRows(t *testing.T, table string) int {
	t.Helper()
	var n int
	require.NoError(t, database.GetDB().QueryRow("SELECT COUNT(*) FROM "+table).Scan(&n))
	return n
}

func TestGetLastStudySession(t *testing.T) {
	router := newTestRouter(t)

	w := request(router, "GET", "/api/dashboard/last_study_session")

	assert.Equal(t, http.StatusOK, w.Code)

	var body map[string]map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	assert.EqualValues(t, 1, body["session"]["id"])
	assert.EqualValues(t, 1, body["session"]["group_id"])
}

func TestGetLastStudySessionEmpty(t *testing.T) {
	router := newTestRouter(t)

	// A learner with no study sessions yet is a normal state, not an error.
	_, err := database.GetDB().Exec("DELETE FROM review_words")
	require.NoError(t, err)
	_, err = database.GetDB().Exec("DELETE FROM sessions")
	require.NoError(t, err)

	w := request(router, "GET", "/api/dashboard/last_study_session")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.JSONEq(t, `{"session": null}`, w.Body.String())
}

func TestGetActivities(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/activities")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetActivityByID(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/activities/1")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetActivitySessions(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/activities/1/sessions")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetWords(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/words")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetWordByID(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/words/1")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetGroups(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/groups")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetGroupByID(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/groups/1")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetGroupSessions(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/groups/1/sessions")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetSessions(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/sessions")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetSessionByID(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/sessions/1")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetSessionWords(t *testing.T) {
	w := request(newTestRouter(t), "GET", "/api/sessions/1/words")
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestResetHistory(t *testing.T) {
	router := newTestRouter(t)

	w := request(router, "POST", "/api/reset_history")

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, 0, countRows(t, "sessions"))
	assert.Equal(t, 0, countRows(t, "review_words"))
	// Vocabulary is kept
	assert.Equal(t, 1, countRows(t, "words"))
	assert.Equal(t, 1, countRows(t, "groups"))
}

func TestFullReset(t *testing.T) {
	router := newTestRouter(t)

	w := request(router, "POST", "/api/full_reset")

	assert.Equal(t, http.StatusOK, w.Code)
	for _, table := range []string{"sessions", "review_words", "activities", "words_groups", "groups", "words"} {
		assert.Equal(t, 0, countRows(t, table), table)
	}
}

// Not enabled yet (they were already commented out before the test refactor):
//
// func TestGetStudyProgress(t *testing.T)   // GET  /api/dashboard/study_progress
// func TestGetQuickStats(t *testing.T)      // GET  /api/dashboard/quick-stats
// func TestCreateActivity(t *testing.T)     // POST /api/activities
// func TestReviewWord(t *testing.T)         // POST /api/sessions/1/words/1/review
