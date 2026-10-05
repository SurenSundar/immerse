-- ==========================================
-- PHASE 3 SCHEMA — Run this in Supabase SQL Editor
-- ==========================================

-- ── 1. PAGE EVENTS (analytics: which pages were visited, time spent) ──────────
CREATE TABLE IF NOT EXISTS public.page_events (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    page        text NOT NULL,                          -- e.g. 'home','resonance','timer','community'
    session_id  text NOT NULL,                          -- UUID stored in sessionStorage per visit
    duration_s  integer DEFAULT 0,                      -- seconds spent on the page
    created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert page events"  ON public.page_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update page events"  ON public.page_events FOR UPDATE USING (true);
CREATE POLICY "Authenticated can read events"  ON public.page_events FOR SELECT USING (auth.role() = 'authenticated');


-- ── 2. TOOL EVENTS (which tool, how long) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tool_events (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tool        text NOT NULL,                          -- 'breathing','focus_timer','meditation','books_text','books_audio'
    session_id  text NOT NULL,
    duration_s  integer DEFAULT 0,
    created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tool_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert tool events"  ON public.tool_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tool events"  ON public.tool_events FOR UPDATE USING (true);
CREATE POLICY "Authenticated can read tool events" ON public.tool_events FOR SELECT USING (auth.role() = 'authenticated');


-- ── 3. POSTS (community Q&A) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
    id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    author_name  text NOT NULL,
    author_email text NOT NULL,
    title        text NOT NULL,
    body         text NOT NULL,
    category     text NOT NULL DEFAULT 'General',      -- 'Meditation','Focus','Breathing','Books','General'
    upvotes      integer DEFAULT 0 NOT NULL,
    answer_count integer DEFAULT 0 NOT NULL,
    is_pinned    boolean DEFAULT false NOT NULL,
    created_at   timestamp with time zone DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts"              ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post"       ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors can update their posts"     ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can upvote"           ON public.posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authors/admin can delete posts"     ON public.posts FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'authenticated');


-- ── 4. POST ANSWERS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_answers (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id     uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    author_name text NOT NULL,
    body        text NOT NULL,
    upvotes     integer DEFAULT 0 NOT NULL,
    is_accepted boolean DEFAULT false NOT NULL,
    created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.post_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read answers"             ON public.post_answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can answer"      ON public.post_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can upvote answers"    ON public.post_answers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authors/admin can delete answers"    ON public.post_answers FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'authenticated');


-- ── 5. BLOG POSTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug        text UNIQUE NOT NULL,
    title       text NOT NULL,
    excerpt     text NOT NULL,
    body        text NOT NULL,                         -- plain text / basic markdown
    cover_color text DEFAULT 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    emoji       text DEFAULT '📝',
    author      text DEFAULT 'MonkeyMind Team',
    tags        text[] DEFAULT '{}',
    published   boolean DEFAULT false NOT NULL,
    created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts"     ON public.blog_posts FOR SELECT USING (published = true OR auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage blog"       ON public.blog_posts FOR INSERT  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update blog"       ON public.blog_posts FOR UPDATE  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete blog"       ON public.blog_posts FOR DELETE  USING (auth.role() = 'authenticated');


-- ── 6. SEED: 2 example blog posts ────────────────────────────────────────────
INSERT INTO public.blog_posts (slug, title, excerpt, body, cover_color, emoji, author, tags, published)
VALUES
(
  'why-we-built-monkeymind',
  'Why We Built MonkeyMind',
  'Every app fights for your attention. We built the opposite — a tool to help you reclaim it.',
  '## The Problem With Attention\n\nWe live in an age of endless notifications, infinite scroll, and engineered dopamine loops. Every app, every platform, every ping is designed to pull you away from the present moment.\n\nWe noticed something: the tools that help us focus — meditation apps, breathing guides, focus timers — were themselves becoming yet another source of distraction. Gamification. Streaks. Social pressure.\n\n## A Different Approach\n\nMonkeyMind is built on a single principle: **less is more**. We stripped away everything that does not serve your focus. No streaks. No leaderboards. No push notifications.\n\nWhat remains is a set of quiet, intentional tools:\n\n- **Breathing** — a simple resonance breathing guide to calm your nervous system\n- **Focus Timer** — a distraction-free Pomodoro-style timer\n- **Meditation** — guided audio sessions with zero gamification\n- **Mindful Reading** — curated book recommendations, nothing more\n\n## The Philosophy\n\nThe monkey mind is the restless, chattering part of your brain that jumps from thought to thought. We cannot silence it by force. We can only learn to observe it — and gently return our attention to the present.\n\nThat is what MonkeyMind is for.',
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  '🧘',
  'MonkeyMind Team',
  ARRAY['mindfulness', 'philosophy', 'focus'],
  true
),
(
  'science-of-breathing',
  'The Science Behind Resonance Breathing',
  'Why 5.5 breaths per minute is the magic number — and what it does to your nervous system.',
  '## What Is Resonance Breathing?\n\nResonance breathing (also called coherent breathing) is a technique where you breathe at approximately **5.5 breaths per minute** — roughly 5.5 seconds in, 5.5 seconds out.\n\nThis specific rhythm synchronises your breathing with your heart rate variability (HRV) in a way that maximises the efficiency of your cardiovascular system.\n\n## The Science\n\nWhen you breathe at this rate, several things happen simultaneously:\n\n1. **Vagal tone increases** — the vagus nerve, which controls the parasympathetic (rest and digest) system, becomes more active\n2. **HRV increases** — higher HRV is strongly associated with better emotional regulation, reduced anxiety, and improved cognitive performance\n3. **Blood pressure drops** — the baroreflex (blood pressure feedback loop) resonates at this frequency, amplifying its regulatory effect\n4. **The DMN quiets** — the Default Mode Network (your "wandering mind") becomes less active\n\n## How To Practice\n\nThe MonkeyMind breathing tool guides you through this exact rhythm. Start with 5 minutes a day. Research suggests consistent practice over 8 weeks produces measurable changes in baseline anxiety and HRV.\n\nYou do not need to think about it. Just follow the visual guide and let your body do the rest.',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  '🌬️',
  'MonkeyMind Team',
  ARRAY['breathing', 'science', 'HRV', 'anxiety'],
  true
)
ON CONFLICT (slug) DO NOTHING;


-- ── 7. SEED: 2 example community posts ───────────────────────────────────────
-- NOTE: These require a real auth user ID. Skip if you want to seed manually from the community UI.
-- INSERT INTO public.posts ... (omitted — seed from the UI after signup)


-- ── 8. MIGRATION: ALTER BOOKS TABLE FOR DYNAMIC E-COMMERCE PLATFORMS ──────────
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS "shopName" text DEFAULT 'Amazon' NOT NULL;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS "buyLink" text;

-- Auto-migrate old Amazon/Flipkart links into the single buyLink column
UPDATE public.books 
SET "buyLink" = COALESCE("amazonLink", "flipkartLink") 
WHERE "buyLink" IS NULL;

UPDATE public.books 
SET "shopName" = CASE 
    WHEN "amazonLink" IS NOT NULL AND "amazonLink" <> 'https://www.amazon.com' THEN 'Amazon' 
    WHEN "flipkartLink" IS NOT NULL AND "flipkartLink" <> 'https://www.flipkart.com' THEN 'Flipkart' 
    ELSE 'Amazon' 
END
WHERE "shopName" = 'Amazon' AND "buyLink" IS NOT NULL;

