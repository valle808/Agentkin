import socketio

# Create a Socket.IO server within FastAPI
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000', 'http://127.0.0.1:3000', '*'] 
)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

# Helper to emit events easily from other modules
async def emit_new_task(task_data):
    await sio.emit('new_task', task_data)

async def emit_task_updated(task_data):
    """
    Emits 'task_updated' event. 
    Frontend should listen to this to update state of specific task.
    """
    await sio.emit('task_updated', task_data)
