import pandas as pd
from apify_client import ApifyClient
from pathlib import Path
import pytz
import os
from dotenv import load_dotenv

load_dotenv()

apify_token = os.getenv("APIFY_API_TOKEN")

# API Key Check: Consider moving this to an environment variable later for security!
client = ApifyClient(apify_token)

def scrape_uw_club_posts_optimized(csv_input):
    df = pd.read_csv(csv_input)
    
    # Extract handles and filter out any NaNs
    handles = df['Instagram'].str.extract(r'instagram\.com/([^/?#&]+)')[0].dropna().unique().tolist()
    
    if not handles:
        print("⚠️ No valid Instagram handles found in the CSV.")
        return pd.DataFrame()

    # The 'apify/instagram-scraper' specifically looks for these keys:
    run_input = {
        "directUrls": [f"https://www.instagram.com/{h}/" for h in handles], # Smaller batches
        "resultsLimit": 5,              # ONLY get the latest post
        "addParentData": False,         # IMPORTANT: Saves ~30-50% of cost
        "resultsType": "posts",
        "searchLimit": 1,
        "skipEmptyCaptions": True,      # Don't pay for posts that have no text for the AI
    }

    print(f"🚀 Scraping {len(handles[:10])} handles from {csv_input}...")
    
    # Using the actor name from your error log
    run = client.actor("apify/instagram-scraper").call(run_input=run_input)

    results = []
    for item in client.dataset(run["defaultDatasetId"]).iterate_items():
        results.append({
            "club": item.get("ownerUsername"),
            "caption": item.get("caption"),
            "image_url": item.get("displayUrl"),
            "timestamp": item.get("timestamp")
        })
    
    return pd.DataFrame(results)

def convert_to_seattle_time(df):
    if df.empty:
        return df

    # 1. Ensure the timestamp is a datetime object in UTC
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
    
    # 2. Define the Seattle Timezone
    seattle_tz = 'America/Los_Angeles'
    
    # 3. Use tz_convert to move from UTC to Seattle
    df['timestamp_seattle'] = df['timestamp'].dt.tz_convert(seattle_tz)
    
    # 4. Format it for your AI agent to read easily
    df['readable_time'] = df['timestamp_seattle'].dt.strftime('%Y-%m-%d %I:%M %p')
    
    # 5. Filter to ONLY the requested columns before returning
    cols_to_keep = ['club', 'caption', 'image_url', 'readable_time']
    # intersection() ensures we don't crash if a column is missing
    df = df[df.columns.intersection(cols_to_keep)]
    
    return df

# --- THIS PART ACTUALLY RUNS THE CODE ---
if __name__ == "__main__":
    BASE_DIR = Path(__file__).parent
    INPUT_FILE = BASE_DIR / "orgs_instagrams.csv"
    
    if INPUT_FILE.exists():
        event_df = scrape_uw_club_posts_optimized(INPUT_FILE)
        event_df = convert_to_seattle_time(event_df)
        
        # Preview the results in your terminal
        print("\n--- Scrape Results ---")
        print(event_df.head())
        
        # Save to a new file
        output_file = BASE_DIR / "raw_instagram_events.csv"
        event_df.to_csv(output_file, index=False)
        print(f"\n✅ Success! Results saved to {output_file}")
    else:
        print(f"❌ Error: Could not find {INPUT_FILE}")