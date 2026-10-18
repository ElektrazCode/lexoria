//go:build mage
// +build mage

package main

import (
	"backend_go/models"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/magefile/mage/mg"
	_ "github.com/mattn/go-sqlite3"
)

// Default target to run when none is specified
var Default = Init

const (
	dbDir  = "database"
	dbName = "words.db"
)

// wordGroupSeed links a word to a group by name, so seeding does not depend
// on auto-generated IDs.
type wordGroupSeed struct {
	TargetWord string `json:"target_word"`
	Group      string `json:"group"`
}

// Initialize the database (creates the file and applies the schema)
func Init() error {
	fmt.Println("Initializing database...")
	return Migrate()
}

// Seed the database. Safe to run repeatedly: existing rows are skipped and
// the whole seed runs in a single transaction (all or nothing).
func Seed() error {
	fmt.Println("Seeding database...")

	// Ensure the schema exists
	mg.Deps(Init)

	db, err := openDB()
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		fmt.Printf("Error starting transaction: %v\n", err)
		return err
	}
	// No-op after a successful Commit
	defer tx.Rollback()

	steps := []func(*sql.Tx) error{
		seedWords,
		seedGroups,
		seedWordsGroups,
		seedActivities,
	}
	for _, step := range steps {
		if err := step(tx); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		fmt.Printf("Error committing seed data: %v\n", err)
		return err
	}

	fmt.Println("Database seeded successfully.")
	return nil
}

func seedWords(tx *sql.Tx) error {
	var words []models.Word
	if err := readSeed("words.json", &words); err != nil {
		return err
	}

	for _, word := range words {
		var exists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM words WHERE target_word = ? AND english = ?)", word.TargetWord, word.English).Scan(&exists)
		if err != nil {
			fmt.Printf("Error checking if word exists: %v\n", err)
			return err
		}
		if exists {
			continue
		}

		if _, err := tx.Exec("INSERT INTO words (target_word, english, parts) VALUES (?, ?, ?)", word.TargetWord, word.English, word.Parts); err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedGroups(tx *sql.Tx) error {
	var groups []models.Group
	if err := readSeed("groups.json", &groups); err != nil {
		return err
	}

	for _, group := range groups {
		var exists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM groups WHERE name = ?)", group.Name).Scan(&exists)
		if err != nil {
			fmt.Printf("Error checking if group exists: %v\n", err)
			return err
		}
		if exists {
			continue
		}

		if _, err := tx.Exec("INSERT INTO groups (name) VALUES (?)", group.Name); err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedWordsGroups(tx *sql.Tx) error {
	var links []wordGroupSeed
	if err := readSeed("words_groups.json", &links); err != nil {
		return err
	}

	for _, link := range links {
		var wordID, groupID int
		err := tx.QueryRow("SELECT id FROM words WHERE target_word = ? ORDER BY id LIMIT 1", link.TargetWord).Scan(&wordID)
		if err != nil {
			fmt.Printf("Error finding word '%s': %v\n", link.TargetWord, err)
			return err
		}
		err = tx.QueryRow("SELECT id FROM groups WHERE name = ?", link.Group).Scan(&groupID)
		if err != nil {
			fmt.Printf("Error finding group '%s': %v\n", link.Group, err)
			return err
		}

		var exists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM words_groups WHERE word_id = ? AND group_id = ?)", wordID, groupID).Scan(&exists)
		if err != nil {
			fmt.Printf("Error checking if word-group link exists: %v\n", err)
			return err
		}
		if exists {
			continue
		}

		if _, err := tx.Exec("INSERT INTO words_groups (word_id, group_id) VALUES (?, ?)", wordID, groupID); err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

func seedActivities(tx *sql.Tx) error {
	var activities []models.Activity
	if err := readSeed("activities.json", &activities); err != nil {
		return err
	}

	for _, activity := range activities {
		var exists bool
		err := tx.QueryRow("SELECT EXISTS(SELECT 1 FROM activities WHERE name = ?)", activity.Name).Scan(&exists)
		if err != nil {
			fmt.Printf("Error checking if activity exists: %v\n", err)
			return err
		}
		if exists {
			continue
		}

		if _, err := tx.Exec("INSERT INTO activities (name, thumbnail_url, description) VALUES (?, ?, ?)", activity.Name, activity.ThumbnailURL, activity.Description); err != nil {
			fmt.Printf("Error inserting data into database: %v\n", err)
			return err
		}
	}
	return nil
}

// Migrate the database: applies every migrations/*.sql file in name order.
// Migrations must be idempotent (CREATE ... IF NOT EXISTS) because applied
// versions are not tracked yet.
func Migrate() error {
	fmt.Println("Migrating database...")

	migrationFiles, err := filepath.Glob("migrations/*.sql")
	if err != nil {
		fmt.Printf("Error getting migration files: %v\n", err)
		return err
	}

	db, err := openDB()
	if err != nil {
		return err
	}
	defer db.Close()

	for _, file := range migrationFiles {
		fmt.Printf("Running migration: %s\n", file)
		content, err := os.ReadFile(file)
		if err != nil {
			fmt.Printf("Error reading migration file: %v\n", err)
			return err
		}

		if _, err = db.Exec(string(content)); err != nil {
			fmt.Printf("Error executing migration file: %v\n", err)
			return err
		}
	}

	fmt.Println("Database migrated successfully.")
	return nil
}

// ResetHistory deletes ALL study history (sessions and review results) but keeps the
// vocabulary. Destructive: back up database/words.db first, then run `mage resetHistory yes`.
func ResetHistory(confirm string) error {
	return deleteAll(confirm, "review_words", "sessions")
}

// Reset deletes ALL data (vocabulary, groups, activities and history), leaving the empty schema.
// Destructive: back up database/words.db first, then run `mage reset yes` and `mage seed`.
func Reset(confirm string) error {
	return deleteAll(confirm, "review_words", "sessions", "words_groups", "groups", "activities", "words")
}

// deleteAll empties the given tables in one transaction, but only when confirm is "yes".
// The table names are fixed lists from this file, never user input.
func deleteAll(confirm string, tables ...string) error {
	if confirm != "yes" {
		return fmt.Errorf("this permanently deletes data from %s; back it up, then pass the argument \"yes\"", filepath.Join(dbDir, dbName))
	}

	db, err := openDB()
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, table := range tables {
		result, err := tx.Exec("DELETE FROM " + table)
		if err != nil {
			fmt.Printf("Error clearing %s: %v\n", table, err)
			return err
		}
		rows, _ := result.RowsAffected()
		fmt.Printf("Deleted %d rows from %s\n", rows, table)
	}
	return tx.Commit()
}

// openDB opens database/words.db, creating the directory if needed.
func openDB() (*sql.DB, error) {
	if err := os.MkdirAll(dbDir, 0o755); err != nil {
		fmt.Printf("Error creating database directory: %v\n", err)
		return nil, err
	}

	db, err := sql.Open("sqlite3", filepath.Join(dbDir, dbName))
	if err != nil {
		fmt.Printf("Error opening database: %v\n", err)
		return nil, err
	}
	return db, nil
}

// readSeed loads seeds/<name> into v.
func readSeed(name string, v any) error {
	data, err := os.ReadFile(filepath.Join("seeds", name))
	if err != nil {
		fmt.Printf("Error reading seed file: %v\n", err)
		return err
	}
	if err := json.Unmarshal(data, v); err != nil {
		fmt.Printf("Error parsing JSON data: %v\n", err)
		return err
	}
	return nil
}
