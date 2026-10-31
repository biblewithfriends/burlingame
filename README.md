# The Church in Burlingame — Website

*A community for all God's children.*

A simple website for The Church in Burlingame, 859 Cowan Rd, Burlingame, CA 94010.
It's built from plain web pages, like the Bible with Friends site, so GitHub Pages can host it for free.

## Put it online (one time)

1. On GitHub, create a new repository named **church-in-burlingame**.
2. Select **uploading an existing file**.
3. Open the unzipped folder, select **everything inside it**, and drag it onto the GitHub page.
4. Select **Commit changes**.
5. Go to **Settings**, then **Pages**. Under "Branch," choose **main**, then **Save**.
6. After a minute or two, your site is at `https://YOUR-NAME.github.io/church-in-burlingame/`.

## Turn on the forms

The Visit and Contact forms send messages to a Google Sheet.
Follow **[google-sheet/HOW-TO.md](google-sheet/HOW-TO.md)**. It takes about 10 minutes.

## Before you tell people about the site

Read **[project-notes/NEEDS_CONFIRMATION.md](project-notes/NEEDS_CONFIRMATION.md)**. The most important items:

- Check every link on the Resources page.
- Have someone review the "In plain English" explanations on Our Faith.
- Confirm where each meeting is held.

## Changing something

- **A small text change:** open the page on GitHub (for example `visit.html`), select the pencil icon, change the words, and select **Commit changes**.
- **Meeting times** appear on several pages: `index.html`, `visit.html`, `life-together.html`, and the footer of every page. Search for the old time and change each one.
- **Never change the statement of faith or its Bible verses.** They must match the church's wording exactly.

## What's in this folder

| File or folder | What it is |
|---|---|
| `index.html` | Home |
| `visit.html` | Visit Us: address, map, times, access, questions, visit form |
| `our-faith.html` | Our Faith: the statement of faith with Bible verses |
| `life-together.html` | Life Together: the meetings and church life |
| `resources.html` | Resources: links to other websites, with topics and search |
| `contact.html` | Contact: message form, address, map |
| `offering.html` | Giving (Offering), linked in the footer |
| `newsletter.html` | Church Newsletter, linked in the footer |
| `privacy.html`, `thank-you.html`, `404.html` | Privacy notice, form confirmation, and "page not found" |
| `assets/` | The look of the site (`site.css`), small helpers (`site.js`), and the form link (`config.js`) |
| `google-sheet/` | The form script and setup steps |
| `project-notes/` | Fact log, open questions, and the original project brief |
