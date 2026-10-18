//go:build mage
// +build mage

package main

import (
	"backend_go/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/magefile/mage/mg"
	_ "github.com/mattn/go-sqlite3"
)

// Default target to run when none is specified
var Default = Init

// Initialize the database
func Init() error {
	fmt.Println("Initializing database...")

	cmd := exec.Command("sh", "-c", "sqlite3 database/words.db < migrations/0001_init.sql")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		return err
	}
	fmt.Println("Database initialized successfully.")
	return nil
}

// Seed the database
func Seed() error {
	fmt.Println("Seeding database...")

	// Open the database
	dbFile := filepath.Join("database", "words.db")
	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		fmt.Printf("Error opening database: %v\n", err)
		return err
	}
	defer db.Close()

	// Seed Words
	if err := seedWords(db); err != nil {
		return err
	}

	// Seed Groups
	if err := seedGroups(db); err != nil {
		return err
	}

	// Seed Words Groups
	if err := seedWordsGroups(db); err != nil {
		return err
	}

	// Seed Activities
	if err := seedActivities(db); err != nil {
		return err
	}

	// Seed Sessions
	if err := seedSessions(db); err != nil {
		return err
	}

	// Seed WordReview
	if err := wordReview(db); err != nil {
		return err
	}

	fmt.Println("Database seeded successfully.")
	return nil
}

func seedWords(db *sql.DB) error {
	wordSeedFile := filepath.Join("seeds", "words.json")
	data, err := os.ReadFile(wordSeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var words []models.Word

	if err := json.Unmarshal(data, &words); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, word := range words {
		_, err := db.Exec("INSERT INTO words (target_word, english, parts) VALUES (?, ?, ?)", word.TargetWord, word.English, word.Parts)
		if err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedGroups(db *sql.DB) error {
	groupSeedFile := filepath.Join("seeds", "groups.json")
	data, err := os.ReadFile(groupSeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var groups []models.Group

	if err := json.Unmarshal(data, &groups); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, group := range groups {
		// Check if the group already exists
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM groups WHERE name = ?)", group.Name).Scan(&exists)
		if err != nil {
			fmt.Printf("Error checking if group exists: %v\n", err)
			return err
		}

		if !exists {
			_, err := db.Exec("INSERT INTO groups (name) VALUES (?)", group.Name)
			if err != nil {
				fmt.Printf("Error inserting data into database: %v\n", err)
				return err
			}
		} else {
			fmt.Printf("Group '%s' already exists, skipping insert.\n", group.Name)
		}
	}
	return nil
}

func seedWordsGroups(db *sql.DB) error {
	wordGroupSeedFile := filepath.Join("seeds", "words_groups.json")
	data, err := os.ReadFile(wordGroupSeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var wordsGroups []models.WordGroup

	if err := json.Unmarshal(data, &wordsGroups); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, wordGroup := range wordsGroups {
		_, err := db.Exec("INSERT INTO words_groups (word_id, group_id) VALUES (?, ?)", wordGroup.WordID, wordGroup.GroupID)
		if err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedActivities(db *sql.DB) error {
	activitySeedFile := filepath.Join("seeds", "activities.json")
	data, err := os.ReadFile(activitySeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var activities []models.Activity

	if err := json.Unmarshal(data, &activities); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, activity := range activities {
		_, err := db.Exec("INSERT INTO activities (name, thumbnail_url, description) VALUES (?, ?, ?)", activity.Name, activity.ThumbnailURL, activity.Description)
		if err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedSessions(db *sql.DB) error {
	sessionSeedFile := filepath.Join("seeds", "sessions.json")
	data, err := os.ReadFile(sessionSeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var sessions []models.Session

	if err := json.Unmarshal(data, &sessions); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, session := range sessions {
		_, err := db.Exec("INSERT INTO sessions (activity_id, group_id, created_at, ended_at) VALUES (?, ?, ?, ?)", session.ActivityID, session.GroupID, session.CreatedAt, session.EndedAt)
		if err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func wordReview(db *sql.DB) error {
	wordReviewSeedFile := filepath.Join("seeds", "word_review.json")
	data, err := os.ReadFile(wordReviewSeedFile)
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}

	var wordReviews []models.WordReview

	if err := json.Unmarshal(data, &wordReviews); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}

	for _, wordReview := range wordReviews {
		_, err := db.Exec("INSERT INTO review_words (word_id, session_id, correct, created_at) VALUES (?, ?, ?, ?)", wordReview.WordID, wordReview.SessionID, wordReview.Correct, wordReview.CreatedAt)
		if err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

// Migrate the database
func Migrate() error {
	fmt.Println("Migrating database...")

	// Ensure the database is initialized
	mg.Deps(Init)

	// Get the list of migration files
	migrationFiles, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		fmt.Printf("Error getting migration files: %v\n", err)
		return err
	}

	// Open the database
	dbFile := filepath.Join("database", "words.db")
	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		fmt.Printf("Error opening database: %v\n", err)
		return err
	}
	defer db.Close()

	// Execute each migration file
	for _, file := range migrationFiles {
		fmt.Printf("Running migration: %s\n", file)
		content, err := os.ReadFile(file)
		if err != nil {
			fmt.Printf("Error reading migration file: %v\n", err)
			return err
		}

		_, err = db.Exec(string(content))
		if err != nil {
			fmt.Printf("Error executing migration file: %v\n", err)
			return err
		}
	}

	fmt.Println("Database migrated successfully.")
	return nil
}
