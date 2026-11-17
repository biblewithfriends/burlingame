# The Church in Burlingame

The church family's own site. Friends who are getting to know us go to [Bible with Friends](https://biblewithfriends.github.io/bwf/).

## Put this version on GitHub

Every file keeps its old name, so this is one step:

1. In your repository, select **Add file → Upload files**.
2. Drag in everything from this folder and select **Commit changes**. The new files replace the old ones.

Nothing changes on the Google side. The Google script and your form link are the same as before.

## What's where

| File | Page |
|---|---|
| `index.html` | Home: the next meeting, the weekly schedule, the hall address |
| `prayer.html` | Prayer: post a burden, this week and last week, answered prayers |
| `newsletter.html` | Newsletter issues, newest on top |
| `our-faith.html` | Who we are and what we believe, word for word from the church |
| `resources.html` | 43 links, with search and topics |
| `offering.html` | Offerings by check or PayPal |
| `assets/` | `site.css` (the look), `site.js` (the behavior), `config.js` (the Google link) |
| `google-sheet/` | The Google script and how to use the sheet |
| `project-notes/` | Where each fact on the site came from |

## Changing a meeting time

Open `index.html` and find the meeting. Change the time you see, and also the two numbers beside it:
`data-start` and `data-end` are minutes after midnight (7:30 PM = 19 × 60 + 30 = 1170).
The big "Next up" line at the top works from those numbers.

## Good to know

- The site follows each person's light or dark setting.
- Search engines are told to skip the site. Anyone with the address can open it, post a burden, or delete one. Deleted burdens go to the sheet's **Deleted** tab and can be restored.
