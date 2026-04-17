from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, DATABASE_URL
from routers import hcps, interactions, chat
from dotenv import load_dotenv
import re
import aiomysql
import os

load_dotenv()


async def _ensure_database_exists():
    # Parse host, port, user, password, db from DATABASE_URL
    m = re.match(
        r"mysql\+aiomysql://([^:]+):([^@]*)@([^:/]+):?(\d+)?/(.+)", DATABASE_URL
    )
    if not m:
        return
    user, password, host, port, db_name = (
        m.group(1), m.group(2), m.group(3),
        int(m.group(4) or 3306), m.group(5),
    )
    conn = await aiomysql.connect(host=host, port=port, user=user, password=password)
    async with conn.cursor() as cur:
        await cur.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _ensure_database_exists()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="HCP CRM API", version="1.0.0", lifespan=lifespan)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hcps.router, prefix="/api/hcps", tags=["HCPs"])
app.include_router(interactions.router, prefix="/api/interactions", tags=["Interactions"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/")
async def root():
    return {"status": "ok", "message": "HCP CRM API is running"}
