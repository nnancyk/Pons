import pandas as pd
import json
import anthropic
import re
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def parse_with_claude():
    input_path = BASE_DIR / "raw_instagram_events.csv"
    try:
        df = pd.read_csv(input_path)
    except FileNotFoundError:
        print(f"❌ Error: csv not found at {input_path}")
        return

    final_json_output = []

    for _, row in df.iterrows():
        if pd.isna(row['caption']): continue

        system_msg = f"""
        Analyze the provided Instagram captions for upcoming events.
        REFERENCE POSTING TIME: {row['readable_time']}

        If the event date has already passed relative to today(2026-02-28), OR if the post is a "recap" of a past event, do NOT extract event details.
        If the event is in the past, return EXACTLY this JSON: {{"status": "skip"}}

        ### EXTRACTION RULES:
        If the event is UPCOMING (on or after 2026-02-28):
        Return ONLY valid JSON matching this exact structure:
        {{
            "eventName": "String",
            "org": {{"orgName": "{row['club']}", "orgType": "RSO", "orgDesc": "University of Washington Club"}},
            "eventType": "Social/Meeting/Workshop/etc",
            "status": "confirmed/tentative",
            "entryReq": "Free/RSVP Required/Members Only",
            "eventDesc": "Summary",
            "eventStart": "ISO 8601 string",
            "eventEnd": "ISO 8601 string or null",
            "isVirtual": false,
            "virtualLink": null,
            "location": {{"locationName": "Building Name", "locationRoom": "Room #", "locationMap": ""}},
            "tags": ["food", "clay", "etc"],
            "sources": [
                {{"sourceType": "instagram", "sourceLink": "{row['image_url']}", "externalID": "{row['club']}", "rawPayload": "{row['caption'][:100]}..."}}
            ]
        }}
        """

        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1000,
                system=system_msg,
                messages=[
                    {"role": "user", "content": f"Analyze this caption: {row['caption']}"},
                    {"role": "assistant", "content": "{"} # Pre-fill to force JSON
                ]
            )

            # Reconstruct the JSON string
            raw_text = "{" + message.content[0].text

            # Use Regex to extract the JSON block (handles 'Extra Data' errors)
            json_match = re.search(r'(\{.*\})', raw_text, re.DOTALL)

            if json_match:
                clean_json = json_match.group(1)
                parsed_data = json.loads(clean_json)

                if parsed_data.get("status") == "skip":
                    print(f"⏭️  Skipping {row['club']}: Event has already passed.")
                    continue

                final_json_output.append(parsed_data)
                print(f"✅ Successfully parsed: {row['club']}")
            else:
                print(f"⚠️ No JSON block found for {row['club']}")

        except Exception as e:
            print(f"❌ Error processing {row['club']}: {e}")
            # Optional: print(f"Raw snippet: {message.content[0].text[:50]}")

    # Save to final file
    output_path = DATA_DIR / "uw_events_database.json"
    with open(output_path, "w") as f:
        json.dump(final_json_output, f, indent=4)

    print(f"\n🚀 Done! Saved {len(final_json_output)} events to '{output_path}'")

if __name__ == "__main__":
    parse_with_claude()