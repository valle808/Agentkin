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
    def __init__(self, name: str, interval: int = 10):
        self.name = name
        self.interval = interval
        self.api_key: Optional[str] = None
        self.headers = {}
        
    def authenticate(self):
        """Get or create an API Key for this agent."""
        print(f"[{self.name}] Authenticating...")
        try:
            # For demo, we use the debug endpoint to get a key
            # In production, this would use a real Developer Dashboard key
            response = requests.get("http://localhost:8000/debug/api-key")
            if response.status_code == 200:
                self.api_key = response.json().get("api_key")
                self.agent_id = response.json().get("agent_id")
                self.headers = {"X-API-Key": self.api_key}
                print(f"[{self.name}] Authenticated with Key: {self.api_key[:8]}... Agent ID: {self.agent_id}")
            else:
                print(f"[{self.name}] Auth Failed: {response.text}")
                exit(1)
        except Exception as e:
            print(f"[{self.name}] Connection Error: {e}")
            exit(1)

    def generate_task_idea(self):
        """Use LLM to generate a task idea."""
        if not OPENAI_API_KEY or "placeholder" in OPENAI_API_KEY:
            # Fallback to templates if no key
            templates = [
                {"title": "Research Competitor Pricing", "description": "Find pricing for Top 3 AI agents.", "budget": 15.0},
                {"title": "Write a Tweet Thread", "description": "Write 5 tweets about Future of Work.", "budget": 5.0},
                {"title": "Debug Python Script", "description": "Fix IndexError in my scraper.", "budget": 25.0},
                {"title": "Design Logo Concept", "description": "Minimalist logo for 'AgentKin'.", "budget": 50.0},
            ]
            template = random.choice(templates)
            # Add some randomness to titles
            template['title'] = f"{template['title']} #{random.randint(100,999)}"
            return template
        
        try:
            import openai
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
            
            prompt = """
            Generate a unique task for a human freelancer. 
            Return JSON with keys: title, description, budget (float 5-100).
            Make it sound like an AI needing human help.
            """
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"[{self.name}] LLM Error: {e}")
            return None

    def post_task(self):
        """Post a new task to the platform."""
        task_data = self.generate_task_idea()
        if not task_data:
            return

        print(f"[{self.name}] Posting Task: {task_data['title']} (${task_data['budget']})")
        
        try:
            response = requests.post(
                f"{API_URL}/kintasks",
                headers=self.headers,
                json=task_data
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
            # List tasks for this agent that are IN_REVIEW
            # We assume list_tasks endpoint supports filtering
            response = requests.get(
                f"{API_URL}/tasks", 
                params={"status": "IN_REVIEW", "agent_id": self.agent_id}
            )
            
            if response.status_code == 200:
                tasks = response.json()
                for task in tasks:
                    print(f"[{self.name}] Verifying Work for Task: {task['title']}")
                    # Verify
                    res = requests.post(
                        f"{API_URL}/tasks/{task['id']}/verify",
                        headers=self.headers,
                        json={"rating": 5, "comment": "Excellent work, auto-approved."}
                    )
                    if res.status_code == 200:
                        print(f"[{self.name}] Task {task['id']} Verified & Paid!")
                    else:
                         print(f"[{self.name}] Verify Failed: {res.text}")
        except Exception as e:
            print(f"[{self.name}] Verify Error: {e}")

    def run_loop(self):
        """Main loop."""
        self.authenticate()
        print(f"[{self.name}] Starting Autonomous Loop...")
        
        tasks_posted = 0
        try:
            while True:
                # 1. Post Task
                self.post_task()
                tasks_posted += 1
                
                # 2. Verify Work (Check every cycle)
                self.verify_work()

                if args.count > 0 and tasks_posted >= args.count:
                    print(f"[{self.name}] Reached count limit ({args.count}). Exiting.")
                    break
                    
                sleep_time = self.interval + random.uniform(-2, 2)
                time.sleep(max(1, sleep_time))
                
        except KeyboardInterrupt:
            print(f"\n[{self.name}] Stopping...")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgentKin Autonomous Bot")
    parser.add_argument("--interval", type=int, default=10, help="Seconds between tasks")
    parser.add_argument("--count", type=int, default=0, help="Number of tasks to post (0=infinite)")
    args = parser.parse_args()
    
    # Load env vars if run directly
    from dotenv import load_dotenv
    load_dotenv()
    
    agent = AutonomousAgent("AutoBot-01", interval=args.interval)
    
    # Run loop logic manually to support count
    agent.authenticate()
    print(f"[{agent.name}] Starting Autonomous Loop...")
    
    tasks_posted = 0
    try:
        while True:
            agent.post_task()
            tasks_posted += 1
            
            if args.count > 0 and tasks_posted >= args.count:
                print(f"[{agent.name}] Reached count limit ({args.count}). Exiting.")
                break
                
            sleep_time = agent.interval + random.uniform(-2, 2)
            time.sleep(max(1, sleep_time))
            
    except KeyboardInterrupt:
        print(f"\n[{agent.name}] Stopping...")
