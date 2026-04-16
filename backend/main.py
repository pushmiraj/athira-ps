from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, sessions, diagnostic, snapshots, study_pack
from app.websocket.handler import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Athira API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(sessions.router, prefix="/sessions")
app.include_router(diagnostic.router, prefix="/diagnostic")
app.include_router(snapshots.router)   # routes already have /snapshots and /parked-questions prefixes
app.include_router(study_pack.router, prefix="/study-pack")
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Athira API"}
