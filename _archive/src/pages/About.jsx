import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WiWindy } from 'react-icons/wi';
import { TbFocus2 } from 'react-icons/tb';
import { GiMeditation } from 'react-icons/gi';
import { ImBooks } from 'react-icons/im';

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is MonkeyMind?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MonkeyMind is a free, premium digital sanctuary for meditation, mindfulness, and heartfulness. It is designed as a mindful journey — you begin with the 'Follow the Light' patience game, then access guided breathing exercises, Pomodoro focus timers, a curated mindfulness library, and a community forum. The name comes from the Buddhist term 'monkey mind,' which describes a restless, distracted mental state."
      }
    },
    {
      "@type": "Question",
      "name": "What is the 'Follow the Light' game on MonkeyMind?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The 'Follow the Light' game is MonkeyMind's intentional onboarding experience. A single spark of light moves across a dark screen, and users must click it 5 times. With each click, the light grows larger and a calming affirmation appears. The game trains patience and attention, transitioning the user from a reactive, distracted state to a calm, present one — before revealing the core mindfulness tools."
      }
    },
    {
      "@type": "Question",
      "name": "What breathing exercises does MonkeyMind offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MonkeyMind offers three guided breathing patterns: (1) Box Breathing (4-4-4-4) — a simple, steady pattern many people use to unwind; (2) 4-7-8 Breathing — inhale 4 seconds, hold 7, exhale 8 seconds — a popular wind-down pattern; and (3) Coherent Resonance Breathing — 5.5-second inhale / 5.5-second exhale, about 6 slow breaths per minute. These are relaxation exercises, not medical treatment."
      }
    },
    {
      "@type": "Question",
      "name": "What is heartfulness and how is it different from mindfulness?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Mindfulness is the practice of bringing non-judgmental awareness to the present moment — observing thoughts, feelings, and sensations without reacting. Heartfulness adds a heart-centered dimension: it cultivates warmth, compassion, empathy, and loving-kindness alongside present-moment awareness. Where mindfulness trains the 'observer,' heartfulness opens the 'feeler.' MonkeyMind integrates both through its tools and journal articles."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Pomodoro technique and how does the MonkeyMind Focus Timer use it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Pomodoro Technique is a time management method that breaks work into 25-minute focused sessions (called 'Pomodoros') separated by 5-minute breaks. MonkeyMind's Zen Focus Timer implements this with customizable work/break intervals and ambient soundscapes — including deep forest rain, babbling brooks, singing bowl drones, and zen chimes — to maintain a calm, distraction-free focus state."
      }
    },
    {
      "@type": "Question",
      "name": "Is MonkeyMind free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. MonkeyMind is completely free to use. All core tools — the breathing exercises, focus timer, guided meditation, sanctuary library, and community forum — require no account and no payment. Our philosophy is that mindfulness is not a premium feature."
      }
    },
    {
      "@type": "Question",
      "name": "What books does MonkeyMind recommend for mindfulness and meditation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The MonkeyMind Sanctuary Library contains curated recommendations across mindfulness, meditation, heartfulness, and mental resilience. Both text books and audio guides are included. Each entry features a description and a direct purchase link. Explore the full library at monkeymind.app/books."
      }
    },
    {
      "@type": "Question",
      "name": "What is the MonkeyMind Community Reflections forum?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Community Reflections is MonkeyMind's anonymous Q&A forum for sharing insights on meditation, heartfulness, and mindful living. Users can post questions, share reflections about their practice, and support others on their journey. It is designed to be a peaceful, supportive space free from social media noise."
      }
    }
  ]
};

const pillars = [
  {
    num: '01',
    title: 'Attention is Generated',
    tagline: 'Presence is a muscle, not a product.',
    desc: 'We do not capture your attention; we help you generate it. Focus is a active state of being that you build by returning your awareness to the present moment, over and over.',
    color: '#00ff9d'
  },
  {
    num: '02',
    title: 'Minimalism is Functional',
    tagline: 'Visual quietness breeds mental quietness.',
    desc: 'Our interface contains no clutter, no push notifications, and no arbitrary numbers to chase. Minimalist layout is not a design option — it is the core utility.',
    color: '#00b8ff'
  },
  {
    num: '03',
    title: 'The Anti-Engagement Principle',
    tagline: 'Leave the sanctuary when you are ready.',
    desc: 'Most platforms are engineered to maximize your time-on-site. We measure success by how quickly you find presence, put down the screen, and return to your physical life.',
    color: '#a855f7'
  }
];

const values = [
  { label: 'No Distraction', desc: 'No infinite scroll feeds, no gamification badges, and no dopamine triggers. The reward is focus itself.', color: '#00ff9d' },
  { label: 'No Data Selling', desc: 'Your progress is local. We use analytics to improve tool reliability, never to track, monetize, or sell your behavior.', color: '#00b8ff' },
  { label: 'No Gamification', desc: 'No leaderboards or arbitrary streaks. We believe tying mindfulness to competitive pressure defeats its entire purpose.', color: '#a855f7' },
  { label: 'Open Access', desc: 'All tools are completely free to use. Mindfulness is a baseline human necessity, not a subscription upgrade.', color: '#f43f5e' }
];

export default function About() {
  useEffect(() => {
    // Inject FAQ Schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify(FAQ_SCHEMA);
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById('faq-schema');
      if (el) el.remove();
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '120px 20px 80px',
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: 'inherit',
      color: '#fff',
      position: 'relative'
    }}>
      <style>{`
        .manifesto-hero {
          text-align: center;
          margin-bottom: 5rem;
        }
        .manifesto-title {
          font-size: clamp(2.4rem, 6vw, 4.5rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2px;
          margin: 1rem 0;
          text-transform: uppercase;
          background: linear-gradient(to bottom, #ffffff 30%, #777777 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .manifesto-section {
          margin-bottom: 6rem;
        }
        .attention-crisis-card {
          background: linear-gradient(135deg, rgba(255, 0, 85, 0.04) 0%, rgba(0, 0, 0, 0) 100%);
          border: 1px solid rgba(255, 0, 85, 0.15);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .attention-crisis-card::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 0, 85, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .pillar-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .pillar-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 2.2rem;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
        }
        .pillar-card:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateY(-4px);
        }
        .value-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 1.2rem;
          margin-top: 2rem;
        }
        @media (max-width: 500px) {
          .value-grid {
            grid-template-columns: 1fr;
          }
        }
        .value-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.6rem;
          display: flex;
          gap: 1.2rem;
          align-items: flex-start;
          transition: all 0.3s ease;
        }
        .value-card:hover {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
        }
        .manifesto-cta {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 28px;
          padding: 3.5rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .manifesto-cta-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(0, 255, 157, 0.05) 0%, transparent 60%);
          pointer-events: none;
        }
      `}</style>

      {/* HERO SECTION */}
      <motion.div
        className="manifesto-hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <span style={{ fontSize: '0.8rem', color: '#00ff9d', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>
          Manifesto of Presence
        </span>
        <h1 className="manifesto-title">
          We Build Tools For<br />The Restless Mind.
        </h1>
        <p style={{ margin: '1.5rem auto 0', fontSize: '1.15rem', color: '#888', lineHeight: 1.8, maxWidth: '640px' }}>
          MonkeyMind is a digital sanctuary engineered not to capture your attention, but to help you reclaim it.
        </p>
      </motion.div>

      {/* THE CRISIS SECTION */}
      <motion.div
        className="manifesto-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7 }}
      >
        <div className="attention-crisis-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '4.5rem', fontWeight: 900, color: '#ff0055', lineHeight: 1, letterSpacing: '-2px', fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 30px rgba(255,0,85,0.2)' }}>
                8.2s
              </span>
              <h3 style={{ margin: '0.8rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                The Attention Window
              </h3>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#888', lineHeight: 1.5 }}>
                The average attention span is now shorter than that of a goldfish, fragmented by constant notification loops.
              </p>
            </div>
            <div>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
                The Crisis of the Attention Economy
              </h2>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                Modern software is designed to colonize your mind. Infinite scroll, targeted notifications, and aggressive streak loops keep your brain in a state of hyper-reactive anxiety. MonkeyMind is the antidote. We represent a conscious step back toward stillness, pacing, and intentional screen boundaries.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* THREE PILLARS */}
      <div className="manifesto-section">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            The Three Principles
          </span>
          <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            How We Structure Sanctuary
          </h2>
        </div>

        <div className="pillar-grid">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              className="pillar-card"
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: pillar.color,
                  opacity: 0.8,
                  lineHeight: 1
                }}>
                  {pillar.num}
                </span>
                <div>
                  <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {pillar.title}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: pillar.color, display: 'block', marginBottom: '0.8rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {pillar.tagline}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#888', lineHeight: 1.6 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CORE VALUES */}
      <div className="manifesto-section">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#00b8ff', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Sanctuary Standards
          </span>
          <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            Values & Commitments
          </h2>
        </div>

        <div className="value-grid">
          {values.map((v, idx) => (
            <motion.div
              key={v.label}
              className="value-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: v.color,
                boxShadow: `0 0 10px ${v.color}`,
                flexShrink: 0,
                marginTop: '6px'
              }} />
              <div>
                <h4 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                  {v.label}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>
                  {v.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA SECTION */}
      <motion.div
        className="manifesto-cta"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="manifesto-cta-glow"></div>
        <h2 style={{ margin: '0 0 0.8rem', fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
          Silence The Noise.
        </h2>
        <p style={{ margin: '0 auto 2.5rem', fontSize: '0.95rem', color: '#666', lineHeight: 1.7, maxWidth: '480px' }}>
          Enter the quiet zone of your mind. We recommend starting with a short breathing cycle or a timed focus sprint.
        </p>

        {/* Quick entry links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <Link to="/resonance" style={{
            background: 'rgba(0, 255, 157, 0.08)',
            border: '1px solid rgba(0, 255, 157, 0.22)',
            color: '#00ff9d',
            padding: '0.8rem 1.8rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00ff9d';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 157, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 157, 0.08)';
              e.currentTarget.style.color = '#00ff9d';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <WiWindy size={20} />
            <span>Calibrate Breath</span>
          </Link>
          <Link to="/timer" style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '0.8rem 1.8rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00b8ff';
              e.currentTarget.style.background = 'rgba(0, 184, 255, 0.08)';
              e.currentTarget.style.color = '#00b8ff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 184, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <TbFocus2 size={16} />
            <span>Start Focus</span>
          </Link>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
          <p style={{ margin: '0 0 0.6rem', color: '#555', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            CONNECT WITH THE FOUNDERS
          </p>
          <a href="mailto:hello@monkeymind.app" style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#00ff9d',
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            hello@monkeymind.app
          </a>
          <p style={{ margin: '1.2rem 0 0', fontSize: '0.8rem' }}>
            <Link to="/privacy" style={{ color: '#666', textDecoration: 'underline' }}>Privacy Policy</Link>
            {' · '}
            <Link to="/terms" style={{ color: '#666', textDecoration: 'underline' }}>Terms &amp; Wellness Disclaimer</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
