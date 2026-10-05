# Archived features

Removed from the live site on 2026-10-05 (Journal/Blog, Community, Manifesto/About,
and the unused Home.jsx). Kept here so they can be restored. Nothing in `_archive/`
is imported or built. Supabase tables (posts, post_answers, comments, blog_posts)
were left untouched.

## Backend (removed 2026-10-06)

MonkeyMind now runs with no backend. The Supabase client, anonymous page analytics,
the Admin dashboard and the database schemas were moved here (`src/pages/Admin.jsx`,
`src/utils/analytics.js`, `src/utils/supabaseClient.js`, `backend/*.sql`).
The Library now reads its books from `src/utils/libraryBooks.js`.
