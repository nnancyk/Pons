import os
import json
import anthropic
from dotenv import load_dotenv
from models import search_events, get_all_events
from datetime import datetime
import pytz

# datetime
tz = pytz.timezone("America/Los_Angeles")
now = datetime.now(tz)

current_datetime = now.isoformat()

# API key
load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found. Check your .env file contains: ANTHROPIC_API_KEY=sk-ant-...")

client = anthropic.Anthropic(api_key=api_key)

TOOLS = [
    {
        "name": "search_events",
        "description": "Search for campus events. Omit 'keyword' for time-only queries (e.g. 'events tomorrow'). Use 'after' and 'before' (ISO datetime strings, no timezone, e.g. '2026-03-01T00:00:00') to filter by time. For keyword queries, also call multiple times with related terms to improve recall.",
        "input_schema": {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "The keyword to search for (e.g. 'workshop', 'virtual', 'networking', 'free food', 'outdoor'). Omit for time-only queries."
                },
                "after": {
                    "type": "string",
                    "description": "Only return events starting at or after this datetime, format YYYY-MM-DDTHH:MM:SS (no timezone)"
                },
                "before": {
                    "type": "string",
                    "description": "Only return events starting at or before this datetime, format YYYY-MM-DDTHH:MM:SS (no timezone)"
                },
                "time_after": {
                    "type": "string",
                    "description": "Only return events whose start time (regardless of date) is at or after this time, format HH:MM. Use for time-of-day filters without a specific date (e.g. morning=06:00, afternoon=12:00, evening=17:00)."
                },
                "time_before": {
                    "type": "string",
                    "description": "Only return events whose start time (regardless of date) is at or before this time, format HH:MM. Use for time-of-day filters without a specific date (e.g. morning=11:59, afternoon=16:59, evening=23:59)."
                }
            },
            "required": []
        }
    }
]

def handle_tool_call(tool_name, tool_input):
    if tool_name == "search_events":
        return search_events(
            tool_input.get("keyword"),
            after=tool_input.get("after"),
            before=tool_input.get("before"),
            time_after=tool_input.get("time_after"),
            time_before=tool_input.get("time_before")
        )
    return []

def ai_search(user_query: str) -> list[dict]:
    """Takes a natural language query and returns relevant events using Claude."""
    messages = [{"role": "user", "content": user_query}]

    system_prompt = (
        f"The current date and time is {current_datetime}. "
        "Use this as the reference when interpreting relative time expressions like 'today', 'tomorrow', or 'this weekend'. "
        "You are a campus event search assistant. Use the search_events tool to find relevant events based on the user's query. "
        "For time-based queries (e.g. 'events tomorrow'), omit keyword and use only after/before with format YYYY-MM-DDTHH:MM:SS and NO timezone offset. "
        "Time of day definitions: morning = 06:00–11:59, afternoon = 12:00–16:59, evening = 17:00–23:59. "
        "If the user mentions a time of day WITH a specific date, use after/before. "
        "If the user mentions a time of day WITHOUT a specific date, use time_after/time_before (HH:MM format) to filter across all dates. "
        "For topic queries, call the tool multiple times with different related keywords to improve recall — for example, for 'hike' also search 'outdoor' and 'hiking'; for 'coding' also search 'programming' and 'STEM'. "
        "Combine results and return the most relevant ones. "
        "Events have fields: eventName, org, eventType, status, entryReq, isVirtual, virtualLink, location (null for virtual-only), tags, eventStart, eventEnd, and relevanceScore."
    )

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system_prompt,
        tools=TOOLS,
        messages=messages
    )

    # Agentic loop: keep going until Claude stops calling tools
    while response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = handle_tool_call(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result)
                })

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=system_prompt,
            tools=TOOLS,
            messages=messages
        )

    # Merge unique events from all tool calls, keeping highest score per event
    seen_ids = {}
    for message in messages:
        if isinstance(message["content"], list):
            for block in message["content"]:
                if isinstance(block, dict) and block.get("type") == "tool_result":
                    for event in json.loads(block["content"]):
                        eid = event["eventID"]
                        if eid not in seen_ids or event.get("relevanceScore", 0) > seen_ids[eid].get("relevanceScore", 0):
                            seen_ids[eid] = event

    return sorted(seen_ids.values(), key=lambda e: e.get("relevanceScore", 0), reverse=True)


if __name__ == "__main__":
    query = input("Search events: ")
    results = ai_search(query)
    if results:
        for e in results:
            print(f"\n{e['eventName']} — {e['org']['orgName']}")
            if e["location"]:
                print(f"  {e['eventStart']} @ {e['location']['locationName']} {e['location']['locationRoom'] or ''}")
            else:
                print(f"  {e['eventStart']} — Virtual ({e['virtualLink']})")
            print(f"  Entry: {e['entryReq']}  |  Tags: {', '.join(e['tags'])}")
    else:
        print("No events found.")
