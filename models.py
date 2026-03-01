import sqlite3
from datetime import datetime, timezone

DB_NAME = "database.db"

def create_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def create_tables():
    conn = create_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS org (
            orgID INTEGER PRIMARY KEY AUTOINCREMENT,
            orgName TEXT UNIQUE NOT NULL,
            orgType TEXT,
            orgDesc TEXT
        );

        CREATE TABLE IF NOT EXISTS location (
            locationID INTEGER PRIMARY KEY AUTOINCREMENT,
            locationName TEXT,
            locationRoom TEXT,
            locationMap TEXT
        );

        CREATE TABLE IF NOT EXISTS events (
            eventID INTEGER PRIMARY KEY AUTOINCREMENT,
            eventName TEXT NOT NULL,
            orgID INTEGER REFERENCES org(orgID),
            eventType TEXT,
            status TEXT,
            entryReq TEXT,
            eventDesc TEXT,
            dateCreated DATETIME DEFAULT CURRENT_TIMESTAMP,
            lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
            eventStart DATETIME,
            eventEnd DATETIME,
            lastSeenAt DATETIME,
            isVirtual INTEGER DEFAULT 0,
            virtualLink TEXT,
            locationID INTEGER REFERENCES location(locationID)
        );

        CREATE TABLE IF NOT EXISTS tags (
            tagID INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS eventTags (
            eventID INTEGER REFERENCES events(eventID),
            tagID INTEGER REFERENCES tags(tagID),
            UNIQUE(eventID, tagID)
        );

        CREATE TABLE IF NOT EXISTS eventSources (
            sourceID INTEGER PRIMARY KEY AUTOINCREMENT,
            eventID INTEGER REFERENCES events(eventID),
            sourceType TEXT,
            sourceLink TEXT,
            externalID TEXT,
            scrapedAt DATETIME,
            lastSeenAt DATETIME,
            rawPayload TEXT
        );
    """)
    conn.close()

def insert_event(event):
    """
    event dict shape:
    {
        "eventName": str,
        "org": {"orgName": str, "orgType": str, "orgDesc": str},
        "eventType": str,
        "status": str,
        "eventDesc": str,
        "eventStart": str,  # ISO datetime e.g. "2026-03-05T18:00:00"
        "eventEnd": str,
        "location": {"locationName": str, "locationRoom": str, "locationMap": str},
        "tags": [str, ...],
        "source": {"sourceType": str, "sourceLink": str, "externalID": str, "rawPayload": str}
    }
    """
    conn = create_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    # 1. Upsert org
    org = event["org"]
    cursor.execute(
        "INSERT OR IGNORE INTO org (orgName, orgType, orgDesc) VALUES (?, ?, ?)",
        (org["orgName"], org.get("orgType"), org.get("orgDesc"))
    )
    cursor.execute("SELECT orgID FROM org WHERE orgName = ?", (org["orgName"],))
    org_id = cursor.fetchone()["orgID"]

    # 2. Insert location (optional — virtual-only events have no location)
    loc = event.get("location")
    location_id = None
    if loc:
        cursor.execute(
            "INSERT INTO location (locationName, locationRoom, locationMap) VALUES (?, ?, ?)",
            (loc.get("locationName"), loc.get("locationRoom"), loc.get("locationMap"))
        )
        location_id = cursor.lastrowid

    # 3. Insert event
    cursor.execute("""
        INSERT INTO events (eventName, orgID, eventType, status, entryReq, eventDesc,
                            dateCreated, lastUpdated, eventStart, eventEnd,
                            isVirtual, virtualLink, locationID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event["eventName"], org_id, event.get("eventType"), event.get("status"),
        event.get("entryReq"), event.get("eventDesc"), now, now,
        event.get("eventStart"), event.get("eventEnd"),
        1 if event.get("isVirtual") else 0, event.get("virtualLink"), location_id
    ))
    event_id = cursor.lastrowid

    # 4. Upsert tags and link to event
    for tag_name in event.get("tags", []):
        cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
        cursor.execute("SELECT tagID FROM tags WHERE name = ?", (tag_name,))
        tag_id = cursor.fetchone()["tagID"]
        cursor.execute("INSERT OR IGNORE INTO eventTags (eventID, tagID) VALUES (?, ?)", (event_id, tag_id))

    # 5. Insert sources (supports multiple sources per event)
    for source in event.get("sources", []):
        cursor.execute("""
            INSERT INTO eventSources (eventID, sourceType, sourceLink, externalID, scrapedAt, lastSeenAt, rawPayload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id, source.get("sourceType"), source.get("sourceLink"),
            source.get("externalID"), now, now, source.get("rawPayload")
        ))

    conn.commit()
    conn.close()

def insert_events(event_list):
    for e in event_list:
        insert_event(e)

def _row_to_event(row, tags):
    return {
        "eventID": row["eventID"],
        "eventName": row["eventName"],
        "org": {
            "orgName": row["orgName"],
            "orgType": row["orgType"],
            "orgDesc": row["orgDesc"]
        },
        "eventType": row["eventType"],
        "status": row["status"],
        "entryReq": row["entryReq"],
        "eventDesc": row["eventDesc"],
        "dateCreated": row["dateCreated"],
        "lastUpdated": row["lastUpdated"],
        "eventStart": row["eventStart"],
        "eventEnd": row["eventEnd"],
        "isVirtual": bool(row["isVirtual"]),
        "virtualLink": row["virtualLink"],
        "location": {
            "locationName": row["locationName"],
            "locationRoom": row["locationRoom"],
            "locationMap": row["locationMap"]
        } if row["locationName"] else None,
        "tags": tags
    }

def _fetch_events_for_ids(cursor, event_ids):
    if not event_ids:
        return []
    placeholders = ",".join("?" * len(event_ids))
    cursor.execute(f"""
        SELECT e.*, o.orgName, o.orgType, o.orgDesc,
               l.locationName, l.locationRoom, l.locationMap
        FROM events e
        LEFT JOIN org o ON e.orgID = o.orgID
        LEFT JOIN location l ON e.locationID = l.locationID
        WHERE e.eventID IN ({placeholders})
    """, event_ids)
    rows = cursor.fetchall()

    events = []
    for row in rows:
        cursor.execute("""
            SELECT t.name FROM tags t
            JOIN eventTags et ON t.tagID = et.tagID
            WHERE et.eventID = ?
        """, (row["eventID"],))
        tags = [r["name"] for r in cursor.fetchall()]
        events.append(_row_to_event(row, tags))
    return events

def get_all_events():
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT eventID FROM events")
    event_ids = [row["eventID"] for row in cursor.fetchall()]
    events = _fetch_events_for_ids(cursor, event_ids)
    conn.close()
    return events

def search_events(keyword, after=None, before=None, time_after=None, time_before=None):
    """Search events and return results sorted by relevance score.

    Scoring (per keyword match):
      3 pts — title match
      2 pts — tag match
      1 pt  — description or org name match

    Optional after/before are ISO datetime strings to filter by eventStart.
    """
    conn = create_connection()
    cursor = conn.cursor()

    date_filters = ""
    date_params = []
    if after:
        date_filters += " AND e.eventStart >= ?"
        date_params.append(after)
    if before:
        date_filters += " AND e.eventStart <= ?"
        date_params.append(before)
    if time_after:
        date_filters += " AND strftime('%H:%M', e.eventStart) >= ?"
        date_params.append(time_after)
    if time_before:
        date_filters += " AND strftime('%H:%M', e.eventStart) <= ?"
        date_params.append(time_before)

    if keyword:
        pattern = f"%{keyword}%"
        keyword_filter = """(e.eventName LIKE ?
           OR e.eventDesc LIKE ?
           OR o.orgName LIKE ?
           OR t.name LIKE ?)"""
        score_expr = """SUM(
                   CASE WHEN e.eventName LIKE ? THEN 3 ELSE 0 END +
                   CASE WHEN t.name LIKE ? THEN 2 ELSE 0 END +
                   CASE WHEN e.eventDesc LIKE ? THEN 1 ELSE 0 END +
                   CASE WHEN o.orgName LIKE ? THEN 1 ELSE 0 END
               )"""
        query_params = (pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, *date_params)
    else:
        keyword_filter = "1=1"
        score_expr = "0"
        query_params = tuple(date_params)

    # Get matching event IDs with a score for each match type
    cursor.execute(f"""
        SELECT e.eventID,
               {score_expr} AS score
        FROM events e
        LEFT JOIN org o ON e.orgID = o.orgID
        LEFT JOIN eventTags et ON e.eventID = et.eventID
        LEFT JOIN tags t ON et.tagID = t.tagID
        WHERE {keyword_filter}
        {date_filters}
        GROUP BY e.eventID
        ORDER BY score DESC
    """, query_params)

    rows = cursor.fetchall()
    event_ids = [row["eventID"] for row in rows]
    score_map = {row["eventID"]: row["score"] for row in rows}

    events = _fetch_events_for_ids(cursor, event_ids)
    conn.close()

    # Re-sort by score (fetch may reorder) and attach score
    events.sort(key=lambda e: score_map.get(e["eventID"], 0), reverse=True)
    for e in events:
        e["relevanceScore"] = score_map.get(e["eventID"], 0)
    return events
