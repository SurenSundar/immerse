import { WiWindy } from 'react-icons/wi';
import { TbFocus2 } from 'react-icons/tb';
import { GiMeditation, GiSparkles, GiFeather, GiSoundWaves } from 'react-icons/gi';
import { ImBooks } from 'react-icons/im';

/**
 * The seven home cards (desktop grid, tablet slider, phone carousel), calmest first.
 * `action` cards open something in place instead of navigating.
 */
export const HOME_TOOLS = [
  { id: '01', title: 'Sanctuary', short: 'Follow the light', tag: 'Quiet Moments', desc: 'Follow the light through quiet moments that slowly settle a restless mind.', Icon: GiSparkles, action: 'sanctuary', color: '#7dd3fc', cta: 'Enter Sanctuary' },
  { id: '02', title: 'Breathing', short: 'Find your rhythm', tag: 'Guided Breathing', desc: 'Slow down with box breathing, 4-7-8 and resonance patterns.', Icon: WiWindy, path: '/resonance', color: '#00ff9d', cta: 'Start Breathing' },
  { id: '03', title: 'Let It Go', short: 'Release the noise', tag: 'Release', desc: 'Write down what is weighing on you and watch it leave, one letter at a time.', Icon: GiFeather, path: '/let-it-go', color: '#c4b5fd', cta: 'Let It Go' },
  { id: '04', title: 'Meditation', short: 'Clear the mind', tag: 'Guided Stillness', desc: 'Unwind with a gentle voice-guided session and your choice of calming sounds.', Icon: GiMeditation, path: '/meditate', color: '#ec4899', cta: 'Start Meditation' },
  { id: '05', title: 'Soundscapes', short: 'Rain, waves & more', tag: 'Ambient Sound', desc: 'Blend rain, ocean, wind and singing bowls, with a gentle fade-out timer.', Icon: GiSoundWaves, path: '/soundscapes', color: '#2dd4bf', cta: 'Listen' },
  { id: '06', title: 'Focus', short: 'Deep work, calmly', tag: 'Zen Productivity', desc: 'Work in calm, focused intervals with ambient soundscapes.', Icon: TbFocus2, path: '/timer', color: '#00b8ff', cta: 'Start Focus' },
  { id: '07', title: 'Library', short: 'Books & audio', tag: 'Books & Audio', desc: 'Hand-picked books and audiobooks on meditation and mindfulness.', Icon: ImBooks, path: '/books', color: '#a855f7', cta: 'Browse Library' },
];
