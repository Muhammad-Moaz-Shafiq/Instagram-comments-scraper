// content.js

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

async function clickNextPostButton() {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return false;

    const buttons = dialog.querySelectorAll("button");
    for (let btn of buttons) {
        const svg = btn.querySelector("svg");
        if (svg && svg.getAttribute("aria-label") === "Next") {
            btn.click();
            console.log("Clicked Next Post Button");
            await wait(4000); // Wait for new post to load
            return true;
        }
    }

    return false;
}

async function extractPostDetailsAndComments() {
    console.log("Extracting post details...");

    const url = window.location.href;
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const shortCode = (pathParts[0] === "p" && pathParts[1]) ? pathParts[1] : "";

    const postEl = document.querySelector('article');
    const captionEl = postEl?.querySelector('h1') || postEl?.querySelector('span[dir="auto"]');
    const caption = captionEl?.textContent.trim() || "";
    const hashtags = [...new Set(caption.match(/#\w+/g) || [])];
    const mentions = [...new Set(caption.match(/@\w+/g) || [])];

    const timeEl = postEl?.querySelector("time");
    const timestamp = timeEl?.getAttribute("datetime") || "";

    let likesCount = 0;
    let commentsCount = 0;

    // Likes Count - Best selector combination
    const likesSelector = 'a[href$="/liked_by/"] + span span, section button span';
    const likesEls = [...document.querySelectorAll(likesSelector)]
        .filter(el => el.textContent.includes("like") || parseInt(el.textContent.replace(/[^0-9]/g, "")) > 0);

    if (likesEls.length > 0) {
        const text = likesEls[0].textContent;
        likesCount = parseInt(text.replace(/[^0-9]/g, "")) || 0;
    }

    // Comments Count - More robust search
    const commentsCountEl = [...document.querySelectorAll("ul li span span")]
        .find(span => span.textContent.toLowerCase().includes("comment") || span.textContent.includes("comments"));

    if (commentsCountEl) {
        commentsCount = parseInt(commentsCountEl.textContent.replace(/[^0-9]/g, "")) || 0;
    }

    const description = caption;
    const locationEl = document.querySelector('a[href*="/explore/locations/"] span');
    const location = locationEl?.textContent.trim() || "";

    const isReel = !!document.querySelector('video[loop]');
    const carouselItems = document.querySelectorAll('div._aagw');
    const isCarousel = carouselItems.length > 1;

    let videoDuration = null;
    if (isReel) {
        const videoEl = document.querySelector('video');
        if (videoEl) {
            videoDuration = videoEl.duration.toFixed(2);
        }
    }

    const type = isReel ? "reel" : isCarousel ? "carousel" : "single";

    // Scroll comment section
    await scrollCommentSectionUntilDone();

    // Get comments
    const commentElements = document.querySelectorAll("ul ul");
    const comments = [];

    commentElements.forEach(el => {
        let username = "unknown";
        let text = "";
        let commentTimestamp = "";
        let likescount = 0;

        const aTags = el.querySelectorAll('a[href^="/"]');
        for (let a of aTags) {
            const href = a.getAttribute("href");
            const uname = a.innerText?.trim();
            if (
                href &&
                !href.includes("/tags/") &&
                !href.includes("/explore/") &&
                a.getAttribute("role") === "link" &&
                uname &&
                uname.length < 50
            ) {
                username = uname;
                break;
            }
        }

        const textContainer = el.querySelector('span[dir="auto"]');
        if (textContainer) {
            text = [...textContainer.childNodes]
                .map(node => node.textContent?.trim())
                .filter(Boolean)
                .join(" ");
        }

        const timeEl = el.querySelector("time");
        if (timeEl) {
            commentTimestamp = timeEl.getAttribute("datetime");
        }

        const likeEl = el.querySelector("button span");
        if (likeEl && !isNaN(parseInt(likeEl.textContent))) {
            likescount = parseInt(likeEl.textContent);
        }

        if (username !== "unknown" && text.length > 0) {
            comments.push({
                username,
                text,
                timestamp: commentTimestamp,
                likescount
            });
        }
    });

    return {
        inputUrl: url,
        timestamp,
        caption,
        id: simpleHash(shortCode),
        type,
        shortCode,
        hashtags,
        mentions,
        url,
        commentsCount,
        description,
        location,
        likesCount,
        isCarousel,
        isReel,
        videoDuration,
        comments
    };
}

async function scrollCommentSectionUntilDone(delay = 2500, maxAttempts = 500) {
    const loadMoreButton = () => {
        const btn = document.querySelector('button > div > svg[aria-label="Load more comments"]');
        if (btn) btn.closest('button').click();
        return !!btn;
    };

    let attempts = 0;
    let prevCount = 0;
    let stableCount = 0;

    while (attempts < maxAttempts) {
        const commentEls = document.querySelectorAll("ul ul");
        const currentCount = commentEls.length;

        if (currentCount === prevCount) {
            stableCount++;
            if (stableCount > 6) break;
        } else {
            stableCount = 0;
        }

        if (loadMoreButton()) {
            console.log("Clicked Load More Comments");
        }

        const container = document.querySelector('section._a9zs') ||
                          document.querySelector('div._a9zr') ||
                          document.querySelector('div.x7Xxg73');

        if (container) {
            container.scrollBy(0, 1000);
        }

        await wait(delay);

        prevCount = currentCount;
        attempts++;
    }
}

async function processMultiplePosts(maxPosts = 3) {
    const results = [];

    for (let i = 0; i < maxPosts; i++) {
        console.log(`Processing post #${i + 1}`);
        const postData = await extractPostDetailsAndComments();
        results.push(postData);

        // Save partial result after each post
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `instagram_posts_data.json`; // Same file name every time
        link.click();
        URL.revokeObjectURL(downloadUrl);

        if (i < maxPosts - 1) {
            const hasNext = await clickNextPostButton();
            if (!hasNext) {
                console.log("No more posts to navigate.");
                break;
            }
        }

        await wait(3000);
    }

    console.log("✅ Extraction completed for", results.length, "posts.");
}

processMultiplePosts(3);