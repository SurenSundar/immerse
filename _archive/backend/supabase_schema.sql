-- ==========================================
-- SUPABASE DATABASE SETUP & SCHEMA
-- Copy and paste this script directly into your Supabase SQL Editor
-- ==========================================

-- 1. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id text NOT NULL PRIMARY KEY,
    type text NOT NULL, -- 'text' or 'audio'
    title text NOT NULL,
    author text NOT NULL,
    "coverColor" text NOT NULL,
    emoji text NOT NULL,
    review text NOT NULL,
    "shopName" text DEFAULT 'Amazon' NOT NULL,
    "buyLink" text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create Policies for Books
CREATE POLICY "Allow public read access to books" 
ON public.books FOR SELECT USING (true);

CREATE POLICY "Allow authenticated write access to books" 
ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access to books" 
ON public.books FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access to books" 
ON public.books FOR DELETE USING (auth.role() = 'authenticated');


-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    text text NOT NULL,
    tags text[] NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    timestamp text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create Policies for Comments
CREATE POLICY "Allow public read access to comments" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to comments" 
ON public.comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to comments" 
ON public.comments FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete to moderate comments" 
ON public.comments FOR DELETE USING (auth.role() = 'authenticated');


-- 3. Seed Initial Curated Books Data
INSERT INTO public.books (id, type, title, author, "coverColor", emoji, review, "shopName", "buyLink")
VALUES
('power-of-now', 'text', 'The Power of Now', 'Eckhart Tolle', 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', '⏳', 'A masterpiece on presence. It teaches how to detach from the ego-mind and live in the immediate moment. Essential reading for calming the "monkey mind".', 'Amazon', 'https://www.amazon.com/dp/0578603463?tag=monkeymind-21'),
('mindfulness-plain-english', 'text', 'Mindfulness in Plain English', 'Bhante Henepola Gunaratana', 'linear-gradient(135deg, #10b981 0%, #059669 100%)', '🍃', 'One of the most practical step-by-step guides to Vipassana meditation. Clear, jargon-free, and profoundly practical.', 'Amazon', 'https://www.amazon.com/dp/0861719039?tag=monkeymind-21'),
('wherever-you-go', 'text', 'Wherever You Go, There You Are', 'Jon Kabat-Zinn', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', '🌊', 'The book that brought mindfulness to mainstream medicine. Explains how to integrate meditation into daily routines seamlessly.', 'Amazon', 'https://www.amazon.com/dp/1401307787?tag=monkeymind-21'),
('miracle-of-mindfulness-txt', 'text', 'The Miracle of Mindfulness', 'Thich Nhat Hanh', 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', '🌸', 'A classic that teaches active mindfulness. Simple meditations on eating, walking, and washing dishes to reveal the joy of the present.', 'Amazon', 'https://www.amazon.com/dp/0807012394?tag=monkeymind-21'),
('ten-percent-happier', 'text', '10% Happier', 'Dan Harris', 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', '📈', 'A highly relatable journey of a news anchor who used meditation to recover from panic attacks. A great book for skeptics.', 'Amazon', 'https://www.amazon.com/dp/2290161472?tag=monkeymind-21'),
('zen-mind-beginners', 'text', 'Zen Mind, Beginner''s Mind', 'Shunryu Suzuki', 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', '🌙', 'A deep spiritual Zen text. It describes how to maintain a fresh, open, and unbiased mind that is receptive to reality.', 'Amazon', 'https://www.amazon.com/dp/1590308492?tag=monkeymind-21'),
('radical-acceptance', 'text', 'Radical Acceptance', 'Tara Brach', 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', '🤝', 'Combines Buddhist teachings with psychotherapy. Guides us through releasing toxic self-judgment and accepting our inner experience with love.', 'Amazon', 'https://www.amazon.com/dp/0553380990?tag=monkeymind-21'),
('start-where-you-are', 'text', 'Start Where You Are', 'Pema Chödrön', 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', '🎨', 'A warm guidebook for developing fearlessness and self-compassion. Excellent advice on sitting with pain and transforming negative emotions.', 'Amazon', 'https://www.amazon.com/dp/1570628394?tag=monkeymind-21'),
('headspace-guide-med', 'text', 'The Headspace Guide to Meditation', 'Andy Puddicombe', 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', '💡', 'Written by a former Buddhist monk and Headspace app founder. Delivers highly accessible, bite-sized daily visual and mental exercises.', 'Amazon', 'https://www.amazon.com/dp/1444722026?tag=monkeymind-21'),
('altered-traits', 'text', 'Altered Traits', 'Daniel Goleman', 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', '🔬', 'A rigorous scientific review of the actual neuroscience behind meditation. Separates the mindfulness myths from scientifically proven biological facts.', 'Amazon', 'https://www.amazon.com/dp/0399184384?tag=monkeymind-21'),
('waking-up', 'audio', 'Waking Up', 'Sam Harris', 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', '👁️', 'A rational, scientific approach to spirituality and mindfulness. Perfect for skeptics looking to understand the nature of consciousness through guided audio.', 'Amazon', 'https://www.amazon.com/dp/1451636024?tag=monkeymind-21'),
('miracle-of-mindfulness', 'audio', 'The Miracle of Mindfulness (Audio)', 'Thich Nhat Hanh', 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', '🌸', 'A gentle, poetic guide read with deep calmness. Teaches how to turn everyday activities—like washing dishes or drinking tea—into audio-guided meditations.', 'Amazon', 'https://www.amazon.com/dp/0807012394?tag=monkeymind-21'),
('meditation-fidgety-skeptics', 'audio', 'Meditation for Fidgety Skeptics', 'Dan Harris', 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', '🧘‍♂️', 'A highly entertaining and down-to-earth audio guide. Offers practical, bite-sized audio meditation insights for busy minds.', 'Amazon', 'https://www.amazon.com/dp/0399588949?tag=monkeymind-21'),
('practicing-power-of-now', 'audio', 'Practicing the Power of Now (Audio)', 'Eckhart Tolle', 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', '🔔', 'The author reads his own classic, offering slow-paced vocal guidelines that function as immediate meditative cues during listening.', 'Amazon', 'https://www.amazon.com/dp/1577311957?tag=monkeymind-21'),
('power-of-mindfulness-audio', 'audio', 'Power of Mindfulness', 'Jack Kornfield', 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', '🌾', 'A collection of deep audio talks on cultivating emotional freedom. His warm storytelling style makes it feel like an intimate fireside teaching.', 'Amazon', 'https://www.amazon.com/dp/159179370X?tag=monkeymind-21'),
('science-of-mindfulness', 'audio', 'The Science of Mindfulness', 'Prof. Ronald Siegel', 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', '🧠', 'A fascinating 24-lecture audio course detailing the psychological and physical benefits of practice, backed by clinical research.', 'Amazon', 'https://www.amazon.com/dp/1598039709?tag=monkeymind-21'),
('self-compassion-audio', 'audio', 'Self-Compassion Step-by-Step', 'Kristin Neff', 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', '❤️', 'Audio exercises specifically focused on rebuilding self-kindness. Highly supportive tools for calming the self-critical voice.', 'Amazon', 'https://www.amazon.com/dp/1622030999?tag=monkeymind-21'),
('mindfulness-for-beginners-aud', 'audio', 'Mindfulness for Beginners (Audio)', 'Jon Kabat-Zinn', 'linear-gradient(135deg, #10b981 0%, #059669 100%)', '⛵', 'Guided audio meditations led by the pioneer of MBSR. An ideal starting point for anyone looking to build a structured daily habit.', 'Amazon', 'https://www.amazon.com/dp/1591794269?tag=monkeymind-21'),
('getting-unstuck-chodron', 'audio', 'Getting Unstuck', 'Pema Chödrön', 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', '🕸️', 'Explains the concept of "Shenpa" (the urge to hook into negative habits) and guides us on how to rest in the discomfort to break the cycle.', 'Amazon', 'https://www.amazon.com/dp/159179238X?tag=monkeymind-21'),
('real-happiness-salzberg', 'audio', 'Real Happiness (Audio)', 'Sharon Salzberg', 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', '🕊️', 'Excellent audio program centered around loving-kindness (Metta) meditation, helping us cultivate connection, empathy, and joy.', 'Amazon', 'https://www.amazon.com/dp/0761159251?tag=monkeymind-21')
ON CONFLICT (id) DO UPDATE SET
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    author = EXCLUDED.author,
    "coverColor" = EXCLUDED."coverColor",
    emoji = EXCLUDED.emoji,
    review = EXCLUDED.review,
    "shopName" = EXCLUDED."shopName",
    "buyLink" = EXCLUDED."buyLink";

-- 4. Seed Initial Comments/Reflections Data
INSERT INTO public.comments (id, name, text, tags, likes, timestamp, created_at)
VALUES
('ref-1', 'Aria • Present', 'Just finished a 10m breathing session. The sweep filter really helps block out the chatter.', ARRAY['#resonance', '#calm'], 12, '5m ago', now() - interval '5 minutes'),
('ref-2', 'Kaelen • Grounded', 'Letting go of thoughts is not about stopping them, but watching them float like clouds. Grateful for this space.', ARRAY['#mindfulness', '#zen'], 24, '22m ago', now() - interval '22 minutes'),
('ref-3', 'Master Rin • Mindful', 'In the midst of movement, keep stillness inside you. Pause before your next click.', ARRAY['#focus', '#innerpeace'], 41, '1h ago', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;
