# Doctrine

Every `.md` file in this folder (except this README) is loaded into the system prompt of every Claude call,
after the STRYN core. This is the V2 hook: drop in The Operator's Edge chapters, the STRYN Bible,
worksheets, frameworks and video scripts as Markdown, and the Session Engine, Content Mine, Ask and
Pattern Intelligence all start from your methodology instead of from scratch.

- Files are concatenated in alphabetical order; prefix with numbers to control order (`01-spine.md`).
- The doctrine is a stable prefix, so it is prompt-cached: large files cost little after the first call.
- Changes are picked up within a minute, no restart needed.
- This folder is committed to git. Keep anything you don't want in the repo out of it, or point
  `STRYN_DOCTRINE_DIR` somewhere else.
