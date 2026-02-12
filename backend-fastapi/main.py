from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prisma_db import connect_db, disconnect_db
from routers import tasks, payments, solana

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect DB on startup
    await connect_db()
    yield
    # Disconnect DB on shutdown
    await disconnect_db()

# Create FastAPI instance
fastapi_app = FastAPI(title="AgentKin Engine", version="1.0.0", lifespan=lifespan)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
fastapi_app.include_router(tasks.router, prefix="/api/v1")
fastapi_app.include_router(payments.router, prefix="/api/v1")
fastapi_app.include_router(solana.router, prefix="/api/v1")

@fastapi_app.get("/")
async def root():
    return {"message": "AgentKin Engine Running"}

@fastapi_app.get("/debug/api-key")
async def debug_api_key():
    from prisma_db import db
    agent = await db.agentprofile.find_first()
    if agent:
        return {"api_key": agent.API_Key, "agent_id": agent.id}
    # Create one if missing
    try:
        user = await db.user.create(
            data={
                'email': 'debug_agent@example.com',
                'role': 'ADMIN'
            }
        )
        agent = await db.agentprofile.create(
            data={
                'userId': user.id,
                'API_Key': 'debug-key-456',
                'agentName': 'Debug Agent'
            }
        )
        return {"api_key": agent.API_Key, "agent_id": agent.id}
    except Exception as e:
        return {"error": str(e), "note": "likely already exists or specific error"}

@fastapi_app.get("/debug/kin-profile")
async def debug_kin_profile():
    from prisma_db import db
    # specific ID for auto worker
    worker_email = "auto_worker@example.com"
    
    user = await db.user.find_unique(where={'email': worker_email})
    if not user:
        user = await db.user.create(
            data={
                'email': worker_email,
                'role': 'KIN'
            }
        )
    
    kin = await db.kinprofile.find_unique(where={'userId': user.id})
    if not kin:
        kin = await db.kinprofile.create(
            data={
                'userId': user.id,
                'skills': ['Automation', 'Python'],
                'rating': 5.0
            }
        )
    return {"kin_id": kin.id}

# Mount Socket.IO
import socketio
from socket_manager import sio

# Wrap the FastAPI app with Socket.IO ASGI app
# This intercepts /socket.io requests and passes others to FastAPI
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
