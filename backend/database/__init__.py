"""
Database module initialization.

This module provides a unified database client interface.
"""

import os

# Determine which database to use
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")):
    # Use real Firestore
    from database.firestore import db_client, init_firestore as init_db, close_firestore as close_db
    print("Database: Using Firestore")
else:
    # Use SQLite for local testing
    from database.sqlite_db import sqlite_client as db_client, init_sqlite as init_db, close_sqlite as close_db
    print("Database: Using SQLite")

__all__ = ['db_client', 'init_db', 'close_db']

# Made with Bob
