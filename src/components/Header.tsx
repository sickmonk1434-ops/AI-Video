import Link from 'next/link';

export default function Header() {
  return (
    <header className="header glass-panel">
      <div className="container header-content">
        <Link href="/" className="logo">
          Video<span className="text-secondary">Creator</span>
        </Link>
        <nav className="nav">
          <Link href="#features" className="nav-link">Features</Link>
          <Link href="#pricing" className="nav-link">Pricing</Link>
          <Link href="#about" className="nav-link">About</Link>
        </nav>
        <div className="cta-group">
          <Link href="/login" className="btn-text">Sign In</Link>
          <Link href="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </div>

    </header>
  );
}
