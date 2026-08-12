from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from bs4 import BeautifulSoup
import pandas as pd
import re
from datetime import datetime, timedelta

def huskylink_scraper_with_instagram():
    """
    Scrapes HuskyLink organizations and visits each one to find Instagram links.
    """
    
    # Start timer
    start_time = datetime.now()
    
    browser = webdriver.Chrome()

    # Remove webdriver property to avoid detection
    browser.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
        'source': '''
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            })
        '''
    })

    link = "https://huskylink.washington.edu/organizations"
    print(f"Loading {link}...")
    browser.get(link)

    print("Initial page load...")
    time.sleep(3)

    # Load More clicks
    load_more_clicks = 0
    max_clicks = 3  # Changed to 2 for ~30 organizations

    print("\nLoading organizations...")
    
    while load_more_clicks < max_clicks:
        try:
            # Find and click the "Load More" button
            load_more_button = browser.find_element(By.XPATH, "//span[contains(text(), 'Load More')]/ancestor::button")
            
            # Scroll the button into view
            browser.execute_script("arguments[0].scrollIntoView(true);", load_more_button)
            time.sleep(0.5)
            
            # Click the button
            load_more_button.click()
            load_more_clicks += 1
            
            # Wait for new content to load
            time.sleep(1)
            
            # Count current organizations
            soup = BeautifulSoup(browser.page_source, 'html.parser')
            org_links = soup.find_all("a", href=re.compile(r"^/organization/"))
            current_count = len(org_links)
            
            print(f"Click {load_more_clicks}: Loaded {current_count} organizations")
                
        except Exception as e:
            # "Load More" button not found, likely at the end
            print(f"\nLoad More button not found. Continuing with available organizations...")
            break

    # Parse initial page to get organization links
    print("\nExtracting organization links...")
    page_source = browser.page_source
    soup = BeautifulSoup(page_source, 'html.parser')

    # Find all organization links
    org_links = soup.find_all("a", href=re.compile(r"^/organization/"))
    print(f"Total organizations found: {len(org_links)}\n")

    if len(org_links) == 0:
        print("No organizations found!")
        browser.quit()
        return pd.DataFrame()

    all_org_data = []
    base_url = "https://huskylink.washington.edu"
    target_count = 20  # Only extract 20 organizations with Instagram

    for i, org_link in enumerate(org_links, 1):
        # Stop if we've found 20 organizations with Instagram
        if len(all_org_data) >= target_count:
            print(f"\n✓ Found {target_count} organizations with Instagram links. Stopping search.")
            break
        try:
            # Get the card container
            card = org_link.find("div", class_="MuiCard-root")
            if not card:
                continue

            # Extract organization name from list page
            name = None
            for div in card.find_all("div", style=True):
                style = div.get("style", "")
                text = div.get_text(strip=True)
                
                if "font-weight: 600" in style and "font-size: 1.125rem" in style:
                    if text and 3 < len(text) < 300:
                        name = text.strip()
                        break
            
            if not name:
                for div in card.find_all("div", style=True):
                    style = div.get("style", "")
                    text = div.get_text(strip=True)
                    if "font-weight: 600" in style and text and len(text) < 300:
                        name = text.strip()
                        break
            
            if not name:
                continue
            
            # Clean up the name
            name = ' '.join(name.split())
            
            # Get the organization URL
            org_url = org_link.get("href", "")
            if not org_url:
                continue
            
            # Build full URL
            full_org_url = base_url + org_url if org_url.startswith("/") else org_url
            
            print(f"[{len(all_org_data)+1}/20] Processing: {name}")
            
            # Visit the organization page to find Instagram link
            instagram = find_instagram_on_org_page(browser, full_org_url)
            
            # Only add to data if Instagram link exists
            if instagram != "N/A":
                print(f"       ✓ Found Instagram: {instagram}")
                all_org_data.append({
                    "Organization Name": name,
                    "Instagram": instagram
                })
            else:
                print(f"       ✗ No Instagram link found")
            
            # Small delay between requests
            time.sleep(0.5)

        except Exception as e:
            print(f"  Error processing organization: {e}")
            continue

    # Close browser
    browser.quit()
    
    # Calculate elapsed time
    end_time = datetime.now()
    elapsed_time = end_time - start_time
    
    print(f"\n✓ Successfully extracted {len(all_org_data)} organizations with Instagram info\n")
    print(f"⏱️  Total execution time: {str(elapsed_time).split('.')[0]} (hh:mm:ss)")
    
    return pd.DataFrame(all_org_data)


def find_instagram_on_org_page(browser, org_url):
    """
    Visits an organization's detail page and looks for Instagram link.
    Returns the Instagram URL if found, otherwise returns "N/A".
    """
    try:
        # Navigate to the organization page
        browser.get(org_url)
        time.sleep(1)
        
        # Get page source
        page_source = browser.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # Look for all links on the page
        all_links = soup.find_all("a")
        
        for link in all_links:
            href = link.get("href", "")
            if href and "instagram.com" in href.lower():
                return href
        
        return "N/A"
        
    except Exception as e:
        print(f"    Error visiting page: {e}")
        return "N/A"


def save_results(df, filename="huskylink_organizations_with_instagram.csv"):
    """Save results to CSV and display summary"""
    if df.empty:
        print("No data to save.")
        return
    
    df.to_csv(filename, index=False, encoding='utf-8')
    print(f"Data saved to {filename}\n")
    
    # Display summary
    print("="*140)
    print(f"{'#':<4} {'Organization Name':<70} {'Instagram':<60}")
    print("="*140)
    
    for idx, (_, row) in enumerate(df.iterrows(), 1):
        name = row['Organization Name'][:70]
        ig = row['Instagram'] if row['Instagram'] != 'N/A' else 'N/A'
        ig = ig[:60] if ig != 'N/A' else 'N/A'
        print(f"{idx:<4} {name:<70} {ig:<60}")
    
    print("="*140)
    print(f"\nTotal organizations: {len(df)}")
    print(f"Organizations with Instagram links: {(df['Instagram'] != 'N/A').sum()}")
    print(f"Organizations without Instagram: {(df['Instagram'] == 'N/A').sum()}")


if __name__ == "__main__":
    print("="*140)
    print("HuskyLink Organizations Scraper with Instagram Links")
    print("Visits each organization page to find Instagram profiles")
    print("="*140 + "\n")
    
    results_df = huskylink_scraper_with_instagram()
    
    if not results_df.empty:
        save_results(results_df)
    else:
        print("No organizations found.")
