// Shown in the Library whenever the database has no books yet (or can't be reached).
// Links are plain Amazon searches, not affiliate links. Add real entries from Admin.
const search = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;

export const SAMPLE_BOOKS = [
  {
    id: 'sample-miracle', type: 'text', emoji: '🪷',
    title: 'The Miracle of Mindfulness', author: 'Thich Nhat Hanh',
    coverColor: 'linear-gradient(160deg, #3b4a7a, #1d2647)',
    review: 'Short, gentle chapters on bringing attention to everyday moments, like washing dishes or walking. A kind first book if meditation feels intimidating.',
    buyLink: search('The Miracle of Mindfulness Thich Nhat Hanh'), shopName: 'Amazon',
  },
  {
    id: 'sample-wherever', type: 'text', emoji: '🌅',
    title: 'Wherever You Go, There You Are', author: 'Jon Kabat-Zinn',
    coverColor: 'linear-gradient(160deg, #a8693a, #4a2c1a)',
    review: 'Bite-sized reflections on being present without needing a cushion or a retreat. Easy to open anywhere and read for five quiet minutes.',
    buyLink: search('Wherever You Go There You Are Jon Kabat-Zinn'), shopName: 'Amazon',
  },
  {
    id: 'sample-breath', type: 'text', emoji: '🌬️',
    title: 'Breath', author: 'James Nestor',
    coverColor: 'linear-gradient(160deg, #2f6f7a, #163a42)',
    review: 'An engaging, curious look at how we breathe and why slowing down matters. Pairs nicely with the Breathe tool here.',
    buyLink: search('Breath James Nestor'), shopName: 'Amazon',
  },
  {
    id: 'sample-untethered', type: 'text', emoji: '🕊️',
    title: 'The Untethered Soul', author: 'Michael A. Singer',
    coverColor: 'linear-gradient(160deg, #6a5a9a, #2e2650)',
    review: 'A thoughtful read about stepping back from the constant voice in your head, the monkey mind itself, and simply watching it.',
    buyLink: search('The Untethered Soul Michael Singer'), shopName: 'Amazon',
  },
  {
    id: 'sample-real-happiness', type: 'audio', emoji: '🎧',
    title: 'Real Happiness', author: 'Sharon Salzberg',
    coverColor: 'linear-gradient(160deg, #b0804a, #5a3a1c)',
    review: 'A friendly 28-day introduction with guided practices you can simply follow along to. Warm, patient and practical.',
    buyLink: search('Real Happiness Sharon Salzberg audiobook'), shopName: 'Amazon',
  },
  {
    id: 'sample-ten-percent', type: 'audio', emoji: '🎙️',
    title: '10% Happier', author: 'Dan Harris',
    coverColor: 'linear-gradient(160deg, #4a6a8a, #1f3045)',
    review: 'A sceptic’s honest and often funny story of learning to meditate. Good company for anyone who doubts it is for them.',
    buyLink: search('10% Happier Dan Harris audiobook'), shopName: 'Amazon',
  },
];
