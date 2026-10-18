package apis

import (
	"backend_go/database"
	"backend_go/router"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
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

	return router.New(router.DefaultAllowedOrigins)
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

// The reset endpoints used to be callable over HTTP by anything that could reach the server
// (including any web page open in the user's browser). They must stay gone.
func TestResetEndpointsAreNotExposed(t *testing.T) {
	r := newTestRouter(t)
	tables := []string{"words", "groups", "words_groups", "activities", "sessions", "review_words"}

	attempts := []struct {
		name    string
		method  string
		path    string
		headers map[string]string
		want    int
	}{
		{"reset_history", "POST", "/api/reset_history", nil, http.StatusNotFound},
		{"full_reset", "POST", "/api/full_reset", nil, http.StatusNotFound},
		{"full_reset from the allowed dev origin", "POST", "/api/full_reset", map[string]string{"Origin": "http://localhost:5173"}, http.StatusNotFound},
		{"full_reset via GET", "GET", "/api/full_reset", nil, http.StatusNotFound},
		{"full_reset via DELETE", "DELETE", "/api/full_reset", nil, http.StatusNotFound},
		{"full_reset via PUT", "PUT", "/api/full_reset", nil, http.StatusNotFound},
		// A foreign origin is turned away by the CORS middleware before routing even happens
		{"reset_history from a foreign origin", "POST", "/api/reset_history", map[string]string{"Origin": "http://evil.example"}, http.StatusForbidden},
		{"full_reset from a foreign origin as text/plain (a CORS-simple request)", "POST", "/api/full_reset", map[string]string{"Origin": "http://evil.example", "Content-Type": "text/plain"}, http.StatusForbidden},
	}
	for _, attempt := range attempts {
		req, _ := http.NewRequest(attempt.method, attempt.path, nil)
		for key, value := range attempt.headers {
			req.Header.Set(key, value)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		assert.Equal(t, attempt.want, w.Code, attempt.name)
	}

	for _, table := range tables {
		assert.Equal(t, 1, countRows(t, table), "%s must be untouched", table)
	}
}

// Guards the invariant behind the test above: nothing in the router can delete or replace data.
func TestRouterHasNoDestructiveRoutes(t *testing.T) {
	for _, route := range newTestRouter(t).Routes() {
		assert.Contains(t, []string{"GET", "POST"}, route.Method, "%s %s", route.Method, route.Path)
		assert.NotContains(t, strings.ToLower(route.Path), "reset", "%s %s", route.Method, route.Path)
	}
}

func TestCORSOnlyAllowsConfiguredOrigins(t *testing.T) {
	r := newTestRouter(t)
	get := func(origin string) *httptest.ResponseRecorder {
		req, _ := http.NewRequest("GET", "/api/words", nil)
		if origin != "" {
			req.Header.Set("Origin", origin)
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}

	allowed := get("http://localhost:5173")
	assert.Equal(t, http.StatusOK, allowed.Code)
	assert.Equal(t, "http://localhost:5173", allowed.Header().Get("Access-Control-Allow-Origin"))

	foreign := get("http://evil.example")
	assert.Empty(t, foreign.Header().Get("Access-Control-Allow-Origin"), "a foreign origin must not be allowed to read responses")
	assert.NotEqual(t, "*", foreign.Header().Get("Access-Control-Allow-Origin"))
	assert.Empty(t, foreign.Header().Get("Access-Control-Allow-Credentials"))

	// Same-origin requests (the Vite proxy) carry no Origin header and keep working
	assert.Equal(t, http.StatusOK, get("").Code)
}

// The remaining write routes only insert rows, but a foreign web page must not be able to
// trigger them either. (This is a browser-side defence, not authentication: the server is
// also bound to localhost by default.)
func TestWriteRoutesRejectForeignOrigins(t *testing.T) {
	r := newTestRouter(t)
	post := func(origin string) int {
		req, _ := http.NewRequest("POST", "/api/activities", strings.NewReader(`{"name":"Injected","thumbnail_url":"","description":""}`))
		req.Header.Set("Content-Type", "text/plain") // a CORS-simple request: no preflight
		req.Header.Set("Origin", origin)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w.Code
	}

	assert.Equal(t, http.StatusForbidden, post("http://evil.example"))
	assert.Equal(t, 1, countRows(t, "activities"), "a foreign origin must not insert anything")

	assert.Equal(t, http.StatusOK, post("http://localhost:5173"))
	assert.Equal(t, 2, countRows(t, "activities"), "the allowed dev origin can still write")
}

func TestCORSPreflightFromForeignOriginIsRejected(t *testing.T) {
	req, _ := http.NewRequest("OPTIONS", "/api/activities", nil)
	req.Header.Set("Origin", "http://evil.example")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "content-type")
	w := httptest.NewRecorder()
	newTestRouter(t).ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
}

// Not enabled yet (they were already commented out before the test refactor):
//
// func TestGetStudyProgress(t *testing.T)   // GET  /api/dashboard/study_progress
// func TestGetQuickStats(t *testing.T)      // GET  /api/dashboard/quick-stats
// func TestCreateActivity(t *testing.T)     // POST /api/activities
// func TestReviewWord(t *testing.T)         // POST /api/sessions/1/words/1/review
