export default function About() {
    return (
        <div style={{ padding: '6rem 2rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="section-title">ABOUT <span className="text-gradient">ZONE.3D</span></h1>

            <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: '#ccc', marginBottom: '2rem' }}>
                Zone.3D is an experimental <strong style={{ color: "var(--accent-cyan)" }}>Focused Productivity Environment</strong> created to redefine how we interact with time.
            </p>

            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#aaa', marginBottom: '2rem' }}>
                Traditional timers are boring, static, and disconnected from the mental state of "Flow".
                Zone.3D uses generative WebGL particles to <strong style={{ color: '#fff' }}>visualize</strong> your attention.
                When you focus, the system organizes itself. When you break, it breathes.
            </p>

            <h2 style={{ marginTop: '3rem', marginBottom: '1rem' }}>THE PHILOSOPHY</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--accent-cyan)' }}>
                    <strong>Visual Feedback Loop:</strong> Seeing your focus take shape reinforces the behavior.
                </li>
                <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--accent-blue)' }}>
                    <strong>Micro-Interactions:</strong> Subtle movements prevent screen fatigue without distraction.
                </li>
                <li style={{ marginBottom: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--accent-red)' }}>
                    <strong>Deep Work First:</strong> No gamification badges, no social feeds. Just you and the task.
                </li>
            </ul>

            <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <h3>Ready to dive in?</h3>
                <p style={{ marginBottom: '1.5rem' }}>Set your intention. Start the timer. Watch the chaos turn to order.</p>
                <a href="/timer" className="btn btn-cta">Launch Focus Timer</a>
            </div>
        </div>
    );
}
