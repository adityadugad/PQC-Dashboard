import sqlite3
import os
from datetime import datetime

DB_PATH = "data/metrics.db"

os.makedirs("data", exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        algorithm TEXT,
        keygen REAL,
        encrypt REAL,
        decrypt REAL,
        total REAL
    )
    """)

    conn.commit()
    conn.close()


def save_metric(algorithm, keygen, encrypt, decrypt):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    total = keygen + encrypt + decrypt

    c.execute(
        "INSERT INTO metrics (timestamp, algorithm, keygen, encrypt, decrypt, total) VALUES (?, ?, ?, ?, ?, ?)",
        (datetime.now().isoformat(), algorithm, keygen, encrypt, decrypt, total)
    )

    conn.commit()
    conn.close()


def get_history(algorithm):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT timestamp, total FROM metrics WHERE algorithm=?", (algorithm,))
    rows = c.fetchall()

    conn.close()
    return rows
