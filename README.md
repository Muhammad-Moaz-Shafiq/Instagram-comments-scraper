# Instagram Post Data Scraper Extension

This Chrome Extension automatically extracts comments from Instagram posts, one by one, directly from any profile. It scrolls through all comments, extracts relevant data, and saves the results to a file on your device.

## 🚀 Features

- ✅ Automatically loads and scrolls through all comments on a post
- ✅ Extracts: 
  - Username
  - Shortcode
  - Comment text
  - Timestamp
  - Likes count
  - Replies count
- ✅ Automatically moves to the next post
- ✅ Extracted data is saved as a file on your device
- ✅ You can control how many posts to scrape

---

## ⚙️ How to Use

1. Go to any public Instagram **profile**.
2. Open the **first post**.
3. Click on the extension to **start scraping**.
4. The extension will:
   - Scroll and extract all comments from the current post
   - Then automatically move to the next post
   - Repeat the process until the max number of posts is reached
5. A file will automatically be downloaded with the collected data.

---

## 🛠 Configuration

To change how many posts the extension scrapes:

- Open the `content.js` file
- Edit **line 145**:

```js
(async function scrapeMultiplePosts(maxPosts = 500) {
Also update the last line of the same file:

js
Copy
Edit
scrapeMultiplePosts(500);
📁 Files in This Extension
manifest.json — Extension metadata and permissions

content.js — Core scraping logic

background.js — Extension background script

icon.png — Extension icon

🧪 Notes
Works only on public Instagram profiles.

Do not refresh the page while it's scraping.
