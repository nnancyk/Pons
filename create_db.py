from models import create_tables, insert_events
import json

if __name__ == "__main__":
    create_tables()
    with open("uw_events_database.json", "r") as f:
        events = json.load(f)
        
    insert_events(events)
    print("Database created with 6 mock events!")
