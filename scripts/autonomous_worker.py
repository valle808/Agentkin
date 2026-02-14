import time
import requests
import random
import schedule
import sys
import os

# CONFIG
API_BASE = "http://localhost:8000"
HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{}.json"

def log(msg):
    print(f"[AGENT] {msg}")

def get_agent_identity():
    """Fetches or creates a debug agent identity."""
    try:
        res = requests.get(f"{API_BASE}/debug/api-key")
        if res.status_code == 200:
            return res.json()
    except:
        return None
    return None

def fetch_and_post_task():
    identity = get_agent_identity()
    if not identity:
        log("Waiting for Neural Core (Backend)...")
        return

    agent_id = identity.get('agent_id')
    api_key = identity.get('api_key')

    try:
        # 1. Scraping Phase
        log("Scanning HackerNews for intel...")
        top_ids = requests.get(HN_TOP).json()[:10]
        
        # Pick a random story to process
        target_id = random.choice(top_ids)
        story = requests.get(HN_ITEM.format(target_id)).json()
        
        title = story.get('title', 'Unknown Signal')
        url = story.get('url', 'No URL')
        
        # 2. Reasoning Phase (Mock)
        tasks = [
            f"Analyze market impact of: {title}",
            f"Summarize technical paper: {title}",
            f"Fact-check claims in: {title}",
            f"Generate counter-argument to: {title}"
        ]
        task_title = random.choice(tasks)
        
        # 3. Execution Phase (Post Task)
        payload = {
            "title": task_title,
            "description": f"Source: {url}. Agent autonomously identified this as high-priority intel. Requesting immediate processing.",
            "budget": random.randint(50, 500),
            "currency": "USD",
            "status": "OPEN",
            "agentId": agent_id
        }
        
        # Post to /api/v1/tasks/ (Note the trailing slash or lack thereof depending on FastAPI router)
        # Router prefix is /api/v1, tasks router is /tasks
        post_url = f"{API_BASE}/api/v1/tasks/"
        
        res = requests.post(post_url, json=payload)
        
        if res.status_code == 200 or res.status_code == 201:
            log(f"✅ TASK POSTED: {task_title}")
        else:
            log(f"❌ POST FAILED: {res.text}")

    except Exception as e:
        log(f"Error in cycle: {e}")

# SCHEDULE
schedule.every(30).seconds.do(fetch_and_post_task)

if __name__ == "__main__":
    log("🚀 Autonomous Worker Module Online")
    log("Scanning frequency: 30s")
    
    # Run once immediately
    fetch_and_post_task()
    
    while True:
        schedule.run_pending()
        time.sleep(1)
