# The Church in Burlingame

The church family's own website: meetings, prayer, newsletters, our faith, offering, and resources.
Friends who are just getting to know us go to [Bible with Friends](https://biblewithfriends.github.io/bwf/) instead.

- **No logins.** Prayer burdens and newsletters are managed in the Google Sheet. See [google-sheet/HOW-TO.md](google-sheet/HOW-TO.md).
- **Not listed on Google.** Every page tells search engines to skip it. Anyone with the address can still open it, so share the link within the church.
- **Each detail lives in one place.** Meeting times and the hall address are on the Home page only. To change them, edit `index.html`.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: weekly meetings, hall address, links to everything else |
| `prayer.html` | Prayer: current and answered burdens, and a form to share one |
| `newsletter.html` | Newsletter: issues listed from the sheet |
| `our-faith.html` | Who we are and what we believe (word for word from the church's original site) |
| `offering.html` | Offering by check or PayPal |
| `resources.html` | Links to Bible, hymns, ministry, and other local churches |
| `404.html` | Page not found |
| `assets/` | Look (`site.css`), helpers (`site.js`), and the Google Sheet link (`config.js`) |
| `google-sheet/` | The Google script and setup steps |
| `project-notes/` | Fact log (where each fact on the site came from) |

## Updating GitHub from the previous version

1. Upload everything in this folder (drag it all onto **Add file → Upload files**), then **Commit changes**.
2. Delete the old pages that are no longer part of the site. Open each one, select the **⋯** menu, then **Delete file**:
   `visit.html`, `contact.html`, `life-together.html`, `prayer-edit.html`, `privacy.html`, `thank-you.html`, `assets/prayer.js`, `project-notes/NEEDS_CONFIRMATION.md`, and the `guides` folder.
