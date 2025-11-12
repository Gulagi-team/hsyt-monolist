-- Migration to add points column to users table (PostgreSQL)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1;
