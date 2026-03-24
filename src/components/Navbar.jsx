import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav>
            <div className="container nav-inner">
                <Link to="/" className="logo">
                    <span>ZONE</span>.3D
                </Link>
                <div className="nav-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/timer" className="nav-link">Focus Timer</Link>
                    <Link to="/about" className="nav-link">About</Link>
                </div>
                <Link to="/timer" className="btn btn-cta">
                    Enter The Zone
                </Link>
            </div>
        </nav>
    );
}
