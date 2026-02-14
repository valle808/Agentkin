import os
import time
import json
import random
import requests
import argparse
from typing import Optional

# Configuration
API_URL = "http://localhost:8000/api/v1"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

class AutonomousAgent:
    """
    Simulates a User (Employer) who:
    1. Posts Tasks.
    2. Verifies Work when 'IN_REVIEW'.
    """
    def __init__(self, name: str, interval: int = 10):
        self.name = name
        self.interval = interval
        self.api_key: Optional[str] = None
        self.agent_id: Optional[str] = None
        
    def authenticate(self):
        """Get or create an API Key for this agent."""
        print(f"[{self.name}] Authenticating...")
        try:
            # Use the new debug endpoint
            response = requests.get(f"{API_URL.replace('/api/v1', '')}/debug/api-key")
            if response.status_code == 200:
                data = response.json()
                self.api_key = data.get("api_key")
                self.agent_id = data.get("agent_id")
                print(f"[{self.name}] Authenticated. ID: {self.agent_id}")
            else:
                print(f"[{self.name}] Auth Failed: {response.text}")
                exit(1)
        except Exception as e:
            print(f"[{self.name}] Connection Error: {e}")
            exit(1)

    def generate_task_idea(self):
        """Generate a random task."""
        templates = [
            {"title": "Research Competitor Pricing", "description": "Find pricing for Top 3 AI agents.", "budget": 15.0},
            {"title": "Write a Tweet Thread", "description": "Write 5 tweets about Future of Work.", "budget": 5.0},
            {"title": "Debug Python Script", "description": "Fix IndexError in my scraper.", "budget": 25.0},
            {"title": "Design Logo Concept", "description": "Minimalist logo for 'AgentKin'.", "budget": 50.0},
            {"title": "Explain Quantum Physics", "description": "Explain entanglement to a 5 year old.", "budget": 10.0},
        ]
        template = random.choice(templates)
        template['title'] = f"{template['title']} #{random.randint(100,999)}"
        # Randomly choose target motor
        template['target_motor'] = random.choice(["OPENAI", "GEMINI", "OPENCLAW"])
        return template

    def post_task(self):
        """Post a new task."""
        task_data = self.generate_task_idea()
        if not task_data:
            return

        print(f"[{self.name}] Posting Task: {task_data['title']} (${task_data['budget']}) -> {task_data['target_motor']}")
        
        payload = {
            "title": task_data['title'],
            "description": task_data['description'],
            "budget": task_data['budget'],
            "currency": "USD",
            "agent_api_key": self.api_key,
            "target_motor": task_data['target_motor']
        }
        
        try:
            response = requests.post(
                f"{API_URL}/tasks",
                json=payload
            )
            if response.status_code == 200:
                print(f"[{self.name}] Task Posted! ID: {response.json()['id']}")
            else:
                print(f"[{self.name}] Post Failed: {response.text}")
        except Exception as e:
            print(f"[{self.name}] Request Error: {e}")

    def verify_work(self):
        """Check for IN_REVIEW tasks and verify them."""
        try:
            # 1. List tasks for this agent that are IN_REVIEW
            # The API allows filtering by status and agent_id
            response = requests.get(
                f"{API_URL}/tasks", 
                params={"status": "IN_REVIEW", "agent_id": self.agent_id}
            )
            
            if response.status_code == 200:
                tasks = response.json()
                if not tasks:
                    return

                for task in tasks:
                    print(f"[{self.name}] Reviewing Proof for Task: {task['title']}")
                    # Verify
                    payload = {
                        "shared_payment_token": "tok_simulated_autobot", # Simulated Stripe Token
                        "rating": 5,
                        "comment": "Auto-verified by UserSim."
                    }
                    
                    res = requests.post(
                        f"{API_URL}/tasks/{task['id']}/verify",
                        json=payload
                    )
                    
                    if res.status_code == 200:
                        print(f"[{self.name}] Task {task['id']} Verified & Paid! 💸")
                    else:
                         print(f"[{self.name}] Verify Failed: {res.text}")
        except Exception as e:
            print(f"[{self.name}] Verify Error: {e}")

    def run_loop(self):
        """Main loop."""
        self.authenticate()
        print(f"[{self.name}] Starting User Simulation Loop...")
        
        tasks_posted = 0
        try:
            while True:
                # 1. Maybe Post Task (50% chance)
                if random.random() > 0.5:
                    self.post_task()
                    tasks_posted += 1
                
                # 2. Always Check for Work to Verify
                self.verify_work()

                if args.count > 0 and tasks_posted >= args.count:
                    print(f"[{self.name}] Reached count limit ({args.count}). Exiting.")
                    break
                    
                # Sleep
                sleep_time = self.interval + random.uniform(-2, 2)
                print(f"[{self.name}] Sleeping {sleep_time:.1f}s...")
                time.sleep(max(1, sleep_time))
                
        except KeyboardInterrupt:
            print(f"\n[{self.name}] Stopping...")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgentKin User Simulator")
    parser.add_argument("--interval", type=int, default=10, help="Seconds between actions")
    parser.add_argument("--count", type=int, default=0, help="Number of tasks to post (0=infinite)")
    args = parser.parse_args()
    
    agent = AutonomousAgent("UserSim-01", interval=args.interval)
    agent.run_loop()

#   ____                    _         _                
#  / ___|_ __ ___  __ _  __| | ___   | |__  _   _      
# | |   | '__/ _ \/ _` |/ _` |/ _ \  | '_ \| | | |     
# | |___| | |  __/ (_| | (_| | (_) | | |_) | |_| |     
#  \____|_|  \___|\__,_|\__,_|\___/  |_.__/ \__, |     
#  ____                 _        __     __  |___/      
# / ___|  ___ _ __ __ _(_) ___   \ \   / /_ _| | | ___ 
# \___ \ / _ \ '__/ _` | |/ _ \   \ \ / / _` | | |/ _ \
#  ___) |  __/ | | (_| | | (_) |   \ V / (_| | | |  __/
# |____/ \___|_|  \__, |_|\___/     \_/ \__,_|_|_|\___|
#                 |___/    
#
# Sergiio Valle Bastidas - valle808@hawaii.edu