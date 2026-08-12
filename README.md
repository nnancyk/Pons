# Pons

A UW event platform that consolidates hundreds of club events from HuskyLink and Instagram into one searchable, AI-powered place.

# Demo
Click below to watch the demo!
[![Watch the demo](https://img.youtube.com/vi/_atBalhvi04/maxresdefault.jpg)](https://www.youtube.com/watch?v=_atBalhvi04)

## Problem / Motivation
- UW student org events are scattered across dozens of platforms — HuskyLink listings, individual club Instagram accounts, Discord servers, club websites — with no consistent format or single place to look
- As a result, students miss out on events that actually match their social, academic, or professional interests simply because they never saw them
- Pons consolidates that scattered event data into one searchable site, and helps strengthen the sense of community across UW clubs in the process

## Features
- **HuskyLink scraping** — pulls the full list of UW student organizations and their linked Instagram accounts using Selenium
- **Instagram scraping** — collects each club's posts (captions + images) via the Apify Instagram Scraper API
- **AI-powered event extraction** — Claude analyzes post images and captions together to pull out structured event data: name, date/time, category, location, virtual/in-person, entry requirements
- **AI-powered natural language search** — Claude is prompted with the event database and a user's query, using a ranking system that accounts for relevant synonyms (e.g. "hiking" also matches "outdoor") and relative time (e.g. "this weekend")
- **Filterable frontend** — category and event-type filters, advanced search dialog, built with React + shadcn/ui
- **SQLite storage** — extracted event data is loaded into a local database for fast querying

## Tech Stack
- **Frontend:** React, TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query, presented with Lovable
- **Backend:** Python, Flask, SQLite
- **Scraping:** Selenium + BeautifulSoup (HuskyLink), Apify Instagram Scraper API (Instagram)
- **AI:** Anthropic API / Claude (multimodal event extraction from images + captions)

## Setup

### 1. Clone and install the frontend
```bash
git clone https://github.com/nnancyk/Pons.git
cd Pons
npm install
npm run dev
```

### 2. Configure environment variables
Create a `.env` file in the project root with your own Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

### 3. Set up the backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd backend
python3 create_db.py   # builds the local SQLite database from data/uw_events_database.json
python3 app.py          # starts the Flask API on http://127.0.0.1:5001
```

### 4. (Optional) Re-run the scrapers
The scripts in `scrapers/` were used to originally build the dataset in `data/uw_events_database.json`. They require additional setup (an Apify API token, Chrome for Selenium) and aren't needed just to run the app — the pre-scraped dataset is already included.

## My Role
I built the data collection pipeline:
- Scraped HuskyLink for the full list of UW student organizations and their linked Instagram accounts, using Selenium
- Scraped each club's Instagram posts (captions + images) via the Apify Instagram Scraper API
- Used Claude to analyze post images and captions together, extracting structured event data (name, date, time, category, location, entry requirements) — including handling edge cases like skipping posts about events that had already passed, or that were recaps rather than announcements
- Loaded the extracted event data into a SQLite database

## Challenges & What I Learned
- Got much more hands-on with how Selenium controls a browser for scraping, and with working the Apify platform for the Instagram side
- Ran into the practical limits of scraping at scale firsthand — both the time cost of scraping and the constraints of API tokens
- Was impressed by how well Claude could parse messy, unstructured Instagram captions and images into clean, structured event data
- Working on an interdisciplinary team taught me how much scalability matters from the start, and how the story behind a project matters just as much as the technical side

## What's Next
- Discord and club website scraping, to widen event coverage beyond Instagram and HuskyLink
- Add-to-calendar and RSVP/application flows
- AI-powered recommendations based on a user's past attendance and feedback
- A feedback loop for event planners to collect attendee input
- Consolidated ratings for events and RSOs
- Careful handling of the ethics of using publicly available social data — being thoughtful about what's scraped and how it's used, even when the source is public

## Team
Pons was created in collaboration with Esther Carl, Ahmed Mrad, and Nelly Vasquez at the AI Student Collective's Hack to the Future 2026.
