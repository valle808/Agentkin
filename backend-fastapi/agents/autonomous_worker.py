import asyncio
import sys
import os

# Ensure backend-fastapi is in path to import prisma_db and utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from prisma_db import connect_db, disconnect_db, db
from utils.motor_switcher import MotorSwitcher
from core.config import settings

async def run_worker():
    print("🤖 AgentKin Autonomous Worker Starting...")
    await connect_db()
    
    try:
        while True:
            print("Scanning for OPEN tasks...")
            
            # Find tasks that are OPEN and have a targetMotor set
            tasks = await db.kintask.find_many(
                where={
                    'status': 'OPEN',
                    'targetMotor': {'not': None}
                },
                take=1
            )
            
            if not tasks:
                print("No tasks found. Sleeping 10s...")
                await asyncio.sleep(10)
                continue
                
            task = tasks[0]
            print(f"Executing Task [{task.id}]: {task.title} (Motor: {task.targetMotor})")
            
            # Update to CLAIMED -> IN_PROGRESS
            await db.kintask.update(
                where={'id': task.id},
                data={'status': 'IN_PROGRESS'}
            )
            
            # Simulate "Thinking" time
            print(f"Agent is thinking about task {task.id}...")
            await asyncio.sleep(2)
            
            # Execute Work
            try:
                result = await MotorSwitcher.generate_response(
                    target_motor=task.targetMotor,
                    prompt=f"Task: {task.title}\nDetails: {task.description}"
                )
                
                print(f"Task Execution Finished. Result length: {len(result)}")
                
                # Update Task to IN_REVIEW (Submit Proof)
                # Note: API might expect a separate /submit endpoint, but here we update DB directly for simulation speed
                await db.kintask.update(
                    where={'id': task.id},
                    data={
                        'status': 'IN_REVIEW',
                        'proofOfWork': result
                    }
                )
                print(f"Task {task.id} Submitted for Review.")
                print(f"Task {task.id} Finalized.")
                
            except Exception as e:
                print(f"Error executing task: {e}")
                # Mark as OPEN again or FAILED?
                await db.kintask.update(
                    where={'id': task.id},
                    data={'status': 'OPEN'} # Retry later
                )
            
            await asyncio.sleep(2)
            
    except KeyboardInterrupt:
        print("Stopping Worker...")
    finally:
        await disconnect_db()

if __name__ == "__main__":
    asyncio.run(run_worker())

# Developed By Sergio Valle Bastidas | valle808@hawaii.edu | @Gi0metrics
