import aiosqlite
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "./hermesaudit.db")


async def init_db():
    """Initialize database with users table"""
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.commit()


async def create_user(email: str, hashed_password: str) -> dict:
    """Create a new user in the database"""
    async with aiosqlite.connect(DATABASE_URL) as db:
        try:
            await db.execute(
                "INSERT INTO users (email, hashed_password) VALUES (?, ?)",
                (email, hashed_password)
            )
            await db.commit()
            return {"email": email, "created": True}
        except aiosqlite.IntegrityError:
            return {"error": "User already exists"}


async def get_user_by_email(email: str) -> dict:
    """Get user by email"""
    async with aiosqlite.connect(DATABASE_URL) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, email, hashed_password, created_at FROM users WHERE email = ?",
            (email,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None
