package models

import "time"

type Activity struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	ThumbnailURL string `json:"thumbnail_url"`
	Description  string `json:"description"`
}

type Group struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type WordGroup struct {
	WordID  int `json:"word_id"`
	GroupID int `json:"group_id"`
}

type Session struct {
	ID         int       `json:"id"`
	ActivityID int       `json:"activity_id"`
	GroupID    int       `json:"group_id"`
	CreatedAt  time.Time `json:"created_at"`
	EndedAt    time.Time `json:"ended_at"`
}

type Word struct {
	ID         int    `json:"id"`
	TargetWord string `json:"target_word"`
	English    string `json:"english"`
	Parts      string `json:"parts"`
}

type WordReview struct {
	WordID    int       `json:"word_id"`
	SessionID int       `json:"session_id"`
	Correct   bool      `json:"correct"`
	CreatedAt time.Time `json:"created_at"`
}
