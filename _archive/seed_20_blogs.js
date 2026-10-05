import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const posts = [
  {
    slug: 'demystifying-meditation-beginners-guide',
    title: 'Demystifying Meditation: A Beginner’s Guide to Mental Clarity',
    excerpt: 'Starting meditation can feel overwhelming. Learn how to sit with your thoughts, quiet the chatter, and build a simple daily practice.',
    body: '## Demystifying Meditation\n\nMany people think that meditation requires stopping all thoughts. This is a common misconception. The human brain is designed to think, and trying to force it to be silent only creates more tension.\n\nMeditation is simply the practice of observing your thoughts without judgment. By learning to step back and watch the flow of your mind, you generate a space of awareness.\n\n### Simple Steps to Begin\n\n1. **Find a comfortable posture**: Sit on a chair or the floor. Keep your back straight but relaxed.\n2. **Focus on your breath**: Feel the air entering and leaving your nostrils. The breath is your anchor.\n3. **Acknowledge distractions**: When your mind wanders (and it will), gently note the distraction and return to the breath.\n4. **Start small**: Start with just 3 to 5 minutes a day using a quiet timer.\n\nBy practicing daily, you train your brain to return to the present moment, building baseline mental clarity and lowering anxiety.',
    cover_color: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    emoji: '🧘',
    author: 'MonkeyMind Team',
    tags: ['meditation', 'mindfulness', 'clarity', 'beginners'],
    published: true
  },
  {
    slug: 'power-of-heartfulness-inner-core',
    title: 'The Power of Heartfulness: Living From the Inner Core',
    excerpt: 'Discover the shift from mindful awareness to heart-centered living. Learn how heartfulness meditation cultivates emotional resilience.',
    body: '## What is Heartfulness?\n\nWhile mindfulness focuses on training attention and cognitive awareness, heartfulness is the practice of feeling and connecting with the heart region. It shifts our center of gravity from the intellect (brain) to feeling (heart).\n\nHeartfulness meditation teaches us to listen to our inner core, fostering empathy, self-compassion, and deep emotional balance.\n\n### The Heartfulness Technique\n\n- **Center your awareness**: Sit quietly and gently draw your attention to your chest region.\n- **Suggest a source of light**: Gently suggest that a divine light is present in your heart, drawing you inward.\n- **Feel, don’t analyze**: If thoughts arise, ignore them and gently return to the feeling of warmth in your heart.\n- **Rest in silence**: Stay in this receptive state for 10 to 15 minutes.\n\nClinical trials suggest that heart-centered meditation increases feelings of social connection, lowers heart rates, and boosts emotional resilience.',
    cover_color: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    emoji: '💖',
    author: 'MonkeyMind Team',
    tags: ['heartfulness', 'meditation', 'empathy', 'resilience'],
    published: true
  },
  {
    slug: 'mindfulness-ultimate-attention-generator',
    title: 'Why Mindfulness is the Ultimate Attention Generator',
    excerpt: 'In an attention economy, mindfulness is your secret weapon. Discover how training your awareness helps you reclaim your focus.',
    body: '## Reclaiming Your Attention\n\nWe live in a world designed to steal our attention. Social feeds, notifications, and pings pull us in infinite directions, leaving our minds fragmented. We call this the "restless monkey mind."\n\nMindfulness is the antidote. It is not just about relaxation; it is the ultimate attention generator.\n\n### How Mindfulness Trains Focus\n\nWhen you practice mindfulness, you actively practice two cognitive skills:\n\n1. **Focused Attention**: Concentrating on a single target (like your breath or a timer).\n2. **Open Monitoring**: Recognizing when your mind has drifted and consciously bringing it back.\n\nEvery time you catch your mind wandering and return it to your focus target, you perform a "mental rep." Over time, this strengthens the neural pathways associated with deep focus, helping you reject distraction at work.',
    cover_color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    emoji: '🌿',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'focus', 'attention', 'productivity'],
    published: true
  },
  {
    slug: 'box-breathing-stress-relief-navy-seals',
    title: 'Box Breathing: The Stress Relief Tool Used by Navy Seals',
    excerpt: 'Learn how a simple four-step breathing technique can reset your nervous system and bring instant calm under high pressure.',
    body: '## What is Box Breathing?\n\nBox breathing, also known as four-square breathing, is a powerful technique used by high-stress professionals, including Navy Seals, athletes, and first responders, to clear their minds and handle extreme stress.\n\nIt is called box breathing because it consists of four equal phases, like the four sides of a square.\n\n### How to Practice Box Breathing\n\n- **Inhale** for 4 seconds.\n- **Hold** your breath at the top for 4 seconds.\n- **Exhale** fully for 4 seconds.\n- **Hold** your empty lungs for 4 seconds.\n\nRepeat this cycle for 4 to 5 rounds. This practice stimulates the vagus nerve, signaling the brain to shift from the sympathetic "fight-or-flight" mode to the parasympathetic "rest-and-digest" state. It lowers blood pressure and brings instant mental calm.',
    cover_color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    emoji: '🌬️',
    author: 'MonkeyMind Team',
    tags: ['breathing', 'stress-relief', 'calm', 'box-breathing'],
    published: true
  },
  {
    slug: 'quieting-default-mode-network',
    title: 'Quieting the Default Mode Network: The Science of Stillness',
    excerpt: 'Why does the mind wander, and how does meditation help? A deep look into brain mechanics, anxiety, and neuroplasticity.',
    body: '## Inside the Wandering Mind\n\nHave you ever wondered why your brain defaults to daydreaming, worrying, or replaying past events whenever you stop working? Neuroscientists attribute this to the **Default Mode Network (DMN)**.\n\nThe DMN is a network of interacting brain regions that activates when we are not focused on the outside world. It is highly active during rumination, anxiety, and self-referential thought.\n\n### Quieting the DMN With Meditation\n\nBrain scans show that mindfulness and heartfulness meditation dramatically quiet the DMN. By focusing your attention on the present moment, you shift brain activity to the **Task Positive Network (TPN)**.\n\nWith consistent meditation practice, the connections within the DMN weaken, resulting in less daily worry, reduced anxiety, and a calmer, more grounded baseline state.',
    cover_color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    emoji: '🧠',
    author: 'MonkeyMind Team',
    tags: ['science', 'meditation', 'anxiety', 'neurology'],
    published: true
  },
  {
    slug: '4-7-8-breathing-sleep-anxiety-relief',
    title: 'The 4-7-8 Breathing Method for Sleep and Anxiety Relief',
    excerpt: 'Struggling to fall asleep or quiet your racing thoughts? Try the 4-7-8 breathing method, a natural nervous system tranquilizer.',
    body: '## The 4-7-8 Relaxation Method\n\nDeveloped by Dr. Andrew Weil, the 4-7-8 breathing technique is described as a "natural tranquilizer for the nervous system." It is highly effective for reducing acute anxiety and helping you drift off to sleep.\n\n### The 4-7-8 Breathing Sequence\n\n1. **Inhale** quietly through your nose for 4 seconds.\n2. **Hold** your breath at the top for a count of 7 seconds.\n3. **Exhale** completely through your mouth, making a whoosh sound, for 8 seconds.\n\nRepeat this cycle 4 times. The long hold allows oxygen to fully saturate your organs, while the long exhalation triggers immediate vagus nerve activation, clearing adrenaline and lowering your heart rate.',
    cover_color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    emoji: '💤',
    author: 'MonkeyMind Team',
    tags: ['breathing', 'sleep', 'anxiety', 'relaxation'],
    published: true
  },
  {
    slug: 'mindfulness-vs-meditation-differences',
    title: 'Mindfulness vs Meditation: Understanding the Key Differences',
    excerpt: 'Are mindfulness and meditation the same thing? We break down the differences and explain how they complement each other.',
    body: '## Mindfulness vs. Meditation\n\nAlthough the terms are often used interchangeably, mindfulness and meditation are distinct practices. Understanding their differences can help you design a more balanced wellness routine.\n\n### What is Meditation?\n\nMeditation is the structured practice of setting aside dedicated time to train your mind. It is like going to the gym. Sit on a cushion, use a timer, and focus on a target (breath, heart, or sound) for 10 to 20 minutes.\n\n### What is Mindfulness?\n\nMindfulness is a state of being. It is the practice of being fully present and engaged in whatever you are doing *right now*, without judgment. You can practice mindfulness while washing dishes, walking, or eating.\n\nMeditation builds the neural capacity for mindfulness, allowing you to carry presence into your everyday life.',
    cover_color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    emoji: '⚖️',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'meditation', 'philosophy', 'guides'],
    published: true
  },
  {
    slug: 'build-zen-focus-environment',
    title: 'How to Build a Zen Focus Environment at Work',
    excerpt: 'Distractions cost time and energy. Discover simple strategies to construct a quiet work environment that supports deep focus.',
    body: '## The Cost of Distraction\n\nResearch shows that after being distracted, it takes an average of **23 minutes** to regain deep focus on a task. In a busy office or a home setup with constant alerts, true productivity becomes nearly impossible.\n\nCreating a Zen workspace is essential for reclaiming your day.\n\n### Strategies for a Zen Workspace\n\n- **Minimize physical clutter**: A clean desk leads to a clean mind. Keep only essentials within view.\n- **Manage digital alerts**: Turn off all non-human notifications. Use "Do Not Disturb" mode during focused work.\n- **Optimize lighting**: Natural light reduces eye strain. Avoid harsh overhead fluorescents when possible.\n- **Mask auditory distractions**: Use focus timers and block ambient noise with soothing, lyric-free soundscapes.',
    cover_color: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    emoji: '🏢',
    author: 'MonkeyMind Team',
    tags: ['focus', 'productivity', 'workspace', 'declutter'],
    published: true
  },
  {
    slug: 'soundscapes-improving-pomodoro-focus',
    title: 'The Role of Soundscapes in Improving Pomodoro Focus',
    excerpt: 'Can ambient music or nature sounds actually help you focus? The science of audio masking, focus timers, and singing bowls.',
    body: '## Auditory Masking and Focus\n\nComplete silence is rare, and sudden noises — a door closing, a car horn, or conversation — break our focus. Ambient soundscapes help by providing **auditory masking**, smoothing out volume spikes to protect your concentration.\n\n### The Best Sounds for Deep Work\n\n1. **Natural sounds**: Rainfall, flowing rivers, and forest wind mimic baseline biological rhythms, lowering stress levels.\n2. **Singing bowls & Zen chimes**: High-frequency metallic chimes clear cognitive clutter and reset mental attention.\n3. **Pink & Brown noise**: Unlike white noise, pink and brown noise contain deeper frequencies that soothe the brain and support sustained focus.\n\nUse our focus timer soundscapes to block background noise and stay in your productive zone.',
    cover_color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    emoji: '🎧',
    author: 'MonkeyMind Team',
    tags: ['focus', 'soundscapes', 'science', 'productivity'],
    published: true
  },
  {
    slug: 'heartfulness-techniques-cultivating-empathy',
    title: 'Heartfulness Meditation Techniques for Cultivating Empathy',
    excerpt: 'Learn how focusing on the heart region can deepen your compassion, improve relationships, and ease social stress.',
    body: '## Cultivating Compassion\n\nIn a highly individualistic culture, we often live in our heads, constantly evaluating and judging. Heartfulness meditation shifts this focus, inviting us to view ourselves and others through a heart-centered lens.\n\nThis practice is highly effective for reducing social stress and building empathy.\n\n### Empathy Seeding Practice\n\n- Connect with your heart: Close your eyes and feel the center of your chest.\n- Radiate peace: Silently wish that all beings be peaceful, happy, and free from suffering.\n- Focus on a specific person: Send feelings of love and acceptance to someone you appreciate, then to someone you find difficult.\n\nRegular heart-centered meditation increases gray matter in brain regions responsible for compassion and emotional regulation.',
    cover_color: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
    emoji: '❤️',
    author: 'MonkeyMind Team',
    tags: ['heartfulness', 'empathy', 'compassion', 'relationships'],
    published: true
  },
  {
    slug: 'digital-detox-reclaim-attention',
    title: 'Digital Detox: How to Quiet the Constant Pings',
    excerpt: 'Reclaim your life from the screen. Simple, actionable boundary-setting techniques for digital detox and mindful app usage.',
    body: '## The Notification Crisis\n\nThe average smartphone user receives over **80 notifications a day**. Each alert triggers a micro-dose of cortisol, keeping the nervous system in a chronic state of low-level alarm.\n\nA digital detox helps break this loop.\n\n### Simple Digital Boundaries\n\n- **Declare screen-free zones**: Keep phones out of the bedroom and dining area.\n- **Audit your apps**: Delete apps that do not serve your long-term goals or trigger mindless scrolling.\n- **Use grayscale mode**: Removing color makes the screen significantly less stimulating to your brain.\n- **Single-task**: When using a digital tool, close unrelated tabs and focus on a single objective.\n\nReclaim your attention and give your nervous system time to rest and reset.',
    cover_color: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    emoji: '📱',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'digital-detox', 'attention', 'health'],
    published: true
  },
  {
    slug: 'art-of-slow-reading-attention',
    title: 'The Art of Slow Reading: Restoring Attention Span',
    excerpt: 'In the era of microblogging, deep reading is a dying art. Discover the cognitive benefits of slow reading and book library immersion.',
    body: '## The Fragmentation of Reading\n\nWe consume thousands of words daily through headlines, tweets, and captions. However, this scanning behavior trains the brain to process information shallowly. Over time, we lose the cognitive capacity to read long-form text.\n\nSlow reading is the exercise that restores your deep attention span.\n\n### Benefits of Deep Reading\n\n- **Cognitive expansion**: Reading long-form narratives engages the prefrontal cortex, enhancing critical thinking.\n- **Stress reduction**: Studies show that just 6 minutes of reading can reduce stress levels by 68%, making it faster than walking or listening to music.\n- **Empathy building**: Immersing yourself in characters\' perspectives trains the brain\'s empathy networks.\n\nExplore our curated bookstore library to find your next slow reading companion.',
    cover_color: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    emoji: '📚',
    author: 'MonkeyMind Team',
    tags: ['reading', 'focus', 'cognition', 'books'],
    published: true
  },
  {
    slug: 'vagus-nerve-stimulation-deep-breathing',
    title: 'Vagus Nerve Stimulation: How Deep Breathing Triggers Rest',
    excerpt: 'Unlock your parasympathetic nervous system. Learn how deep, slow exhalations activate the vagus nerve and reduce cortisol.',
    body: '## What is the Vagus Nerve?\n\nThe vagus nerve is the longest cranial nerve in your body, running from your brainstem down to your heart, lungs, and gut. It acts as the primary highway for the parasympathetic nervous system, which controls resting and digesting.\n\nBy breathing slowly, you can actively stimulate the vagus nerve to reduce stress.\n\n### The Breathing Mechanism\n\nWhen you inhale, your heart rate increases slightly. When you exhale, your diaphragm moves upward, stimulating the vagus nerve and slowing your heart rate.\n\nBy ensuring your exhalations are long and slow (such as during resonance breathing or 4-7-8 breathing), you send immediate biological signals to your brain that it is safe to rest, clearing cortisol and restoring calm.',
    cover_color: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    emoji: '🫁',
    author: 'MonkeyMind Team',
    tags: ['breathing', 'science', 'vagus-nerve', 'stress'],
    published: true
  },
  {
    slug: 'overcoming-restlessness-monkey-mind',
    title: 'Overcoming Restlessness: Dealing with the Monkey Mind',
    excerpt: 'The brain is built to think. Learn how to observe your thoughts objectively rather than fighting them during meditation.',
    body: '## What is the Monkey Mind?\n\nBuddha described the human mind as being filled with drunken monkeys, jumping from branch to branch, chattering constantly. Today, we call this the restless mind, characterized by racing thoughts and worry.\n\nTrying to force the mind to stop thinking only makes the chatter louder.\n\n### How to Work With the Chatter\n\n- **Observe without attachment**: Imagine your thoughts are clouds drifting across the sky. Let them pass without clinging to them.\n- **Label your thoughts**: When a thought distracts you, silently label it ("worrying", "planning", "remembering") and let it go.\n- **Return to your anchor**: Gently guide your awareness back to your focus target, like your breath or the timer.\n\nBe patient. Overcoming restlessness is a gradual process of building gentle awareness.',
    cover_color: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    emoji: '🐒',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'meditation', 'restlessness', 'anxiety'],
    published: true
  },
  {
    slug: 'zen-mind-beginners-mind-fresh-eyes',
    title: 'Zen Mind, Beginner’s Mind: Approaching Life with Fresh Eyes',
    excerpt: 'Explore the core Zen philosophy of Shoshin. Learn how letting go of expectations unlocks creativity and mental ease.',
    body: '## What is Shoshin?\n\nIn Zen Buddhism, **Shoshin** refers to having a "beginner\'s mind." It is the practice of approaching tasks, relationships, and life events with an attitude of openness and eagerness, free from preconceptions.\n\nAs the Zen master Shunryu Suzuki wrote: "In the beginner\'s mind there are many possibilities, but in the expert\'s mind there are few."\n\n### Cultivating a Beginner\'s Mind\n\n- **Release expectations**: Set aside your past knowledge and approach situations with fresh interest.\n- **Listen actively**: Focus fully on what others are saying, rather than planning your response.\n- **Embrace curiosity**: Ask questions and remain open to learning, even in familiar situations.\n\nApproaching life with a beginner\'s mind reduces pressure, stimulates creativity, and brings a sense of ease to daily work.',
    cover_color: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    emoji: '🎋',
    author: 'MonkeyMind Team',
    tags: ['philosophy', 'zen', 'mindfulness', 'learning'],
    published: true
  },
  {
    slug: 'mindful-eating-nourishment-taste',
    title: 'Mindful Eating: Reconnecting with Nourishment and Taste',
    excerpt: 'We eat while scrolling and typing. Discover how slowing down your meals improves digestion, satiety, and enjoyment.',
    body: '## The Distracted Meal\n\nMany of us eat meals while checking emails, watching videos, or scrolling through feeds. When we eat mindlessly, our brains fail to register fullness, which can lead to overeating and poor digestion.\n\nMindful eating invites us to slow down and connect with our meals.\n\n### Mindful Eating Practices\n\n- **Eliminate screens**: Put away your phone and turn off the television during meals.\n- **Engage your senses**: Appreciate the colors, textures, aromas, and flavors of your food.\n- **Chew slowly**: Pay attention to the physical acts of chewing and swallowing.\n- **Express gratitude**: Take a moment to appreciate the journey your food took to reach your plate.\n\nEating mindfully improves digestion, enhances your relationship with food, and turns a routine act into a centering practice.',
    cover_color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    emoji: '🍎',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'health', 'eating', 'habits'],
    published: true
  },
  {
    slug: 'heartfulness-daily-routines-empathy',
    title: 'Heartfulness in Action: Integrating Love into Daily Routines',
    excerpt: 'Heartfulness is not just for the cushion. Learn how to bring empathy, presence, and heart-centered listening into your work.',
    body: '## Heart-Centered Living\n\nMeditation is not just about quiet sessions on a cushion; it is meant to transform how we interact with the world. Heartfulness in action means bringing empathy, warmth, and heart-centered presence into your daily work and relationships.\n\n### Heartfulness at Work\n\n- **Listen deeply**: When speaking with colleagues, listen with your heart, seeking to understand their feelings and perspectives.\n- **Respond with empathy**: Pause before responding to difficult messages. Craft responses that are constructive and compassionate.\n- **Support others**: Look for small opportunities to help, encourage, or acknowledge your team members.\n\nLiving from the heart helps build supportive relationships, reduces workplace conflict, and brings meaning to your daily tasks.',
    cover_color: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
    emoji: '🤝',
    author: 'MonkeyMind Team',
    tags: ['heartfulness', 'empathy', 'workplace', 'habits'],
    published: true
  },
  {
    slug: 'benefits-of-pomodoro-for-adhd',
    title: 'The Benefits of Pomodoro for ADHD and Distractibility',
    excerpt: 'ADHD and distraction can make task completion difficult. Discover how short, timed sprints help you break through paralysis.',
    body: '## Understanding ADHD Paralysis\n\nFor individuals with ADHD or high distractibility, starting a task can feel overwhelming. The brain struggles to estimate how long a project will take, leading to procrastination or mental paralysis.\n\nThe Pomodoro technique offers a structured, low-pressure solution.\n\n### Why Pomodoro Works for ADHD\n\n- **Defeats overwhelm**: Focus on a short sprint (e.g., 25 minutes) instead of a massive, open-ended project.\n- **Creates clear boundaries**: Work with the reassurance that a structured break is always ahead.\n- **Maintains momentum**: Short intervals build an achievable rhythm, helping you stay in flow.\n- **Reduces cognitive fatigue**: Regular breaks give the brain time to rest and recharge.\n\nUse our focus timer soundscapes to set up short sprints and break through mental paralysis.',
    cover_color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    emoji: '⏱️',
    author: 'MonkeyMind Team',
    tags: ['focus', 'ADHD', 'pomodoro', 'productivity'],
    published: true
  },
  {
    slug: 'creating-mindful-morning-routine',
    title: 'Creating a Mindful Morning Routine for Balanced Days',
    excerpt: 'How you start your day sets the tone. Swap phone scrolling for a structured morning flow of breathing, focus, and hydration.',
    body: '## The Morning Alert Loop\n\nMany of us reach for our phones immediately upon waking, triggering an instant flood of emails, headlines, and notifications. This starts the day in a reactive state, driving cortisol up.\n\nEstablishing a mindful morning routine helps ground you for a balanced day.\n\n### A Simple Morning Flow\n\n1. **Hydrate**: Drink a glass of water to refresh your body.\n2. **Breathe**: Practice 5 minutes of resonance or box breathing to calm your nervous system.\n3. **Move**: Do light stretching to wake up your muscles.\n4. **Set an intention**: Think of a single positive focus for your day before opening your inbox.\n\nBy starting your day with intention, you build mental resilience that helps you navigate daily tasks with ease.',
    cover_color: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    emoji: '🌅',
    author: 'MonkeyMind Team',
    tags: ['mindfulness', 'habits', 'morning', 'routines'],
    published: true
  },
  {
    slug: 'meditation-stress-management-research',
    title: 'Meditation for Stress Management: What the Research Shows',
    excerpt: 'Is meditation just a trend? A review of clinical research on mindfulness-based stress reduction (MBSR) and mental resilience.',
    body: '## The Science of Stress Management\n\nMeditation is often seen as a general relaxation exercise, but clinical research shows it causes physical changes in brain structure and function, particularly in regions that manage stress.\n\n### Key Research Findings\n\n- **Shrinks the amygdala**: Studies show that mindfulness meditation reduces the size of the amygdala, the brain\'s fear center, lowering reactiveness to stress.\n- **Lowers cortisol**: Consistent meditation practice decreases baseline levels of cortisol, the body\'s primary stress hormone.\n- **Enhances neuroplasticity**: Meditation increases gray matter density in the prefrontal cortex, which manages decision-making and emotional regulation.\n\nThese findings suggest that meditation is a scientifically supported tool for building mental resilience and managing stress.',
    cover_color: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
    emoji: '🔬',
    author: 'MonkeyMind Team',
    tags: ['science', 'meditation', 'stress', 'research'],
    published: true
  }
];

async function seed() {
  console.log(`Starting to seed ${posts.length} blog posts into public.blog_posts table...`);
  
  let successCount = 0;
  let failureCount = 0;

  for (const post of posts) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .upsert(post, { onConflict: 'slug' });

      if (error) {
        console.error(`Failed to seed post: "${post.slug}". Error:`, error.message);
        failureCount++;
      } else {
        console.log(`Successfully seeded/updated post: "${post.slug}"`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception seeding post: "${post.slug}". Error:`, err);
      failureCount++;
    }
  }

  console.log(`\nSeeding completed: ${successCount} succeeded, ${failureCount} failed.`);
  process.exit(failureCount > 0 ? 1 : 0);
}

seed();
