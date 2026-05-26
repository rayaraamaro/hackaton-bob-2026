"""
Database module initialization.

This module provides a unified database client interface.
Uses SQLite for local storage.
"""

# Use SQLite for all database operations
from database.sqlite_db import sqlite_client as db_client, init_sqlite as init_db, close_sqlite as close_db

print("Database: Using SQLite")

__all__ = ['db_client', 'init_db', 'close_db']

# Made with Bob
