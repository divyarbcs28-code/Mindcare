import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

// Split screen for login/register: photo + quote on one side, the form on the other.
export default function AuthShell({ image, quote, quoteBy, maxWidth = 420, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-visual">
        <div className="auth-visual__img" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
        <Link to="/" className="lp-brand auth-visual__brand">
          <span className="lp-brand__mark"><Brain size={20} /></span>
          MindCare
        </Link>
        <blockquote>
          {quote}
          {quoteBy && <span>{quoteBy}</span>}
        </blockquote>
      </aside>
      <div className="auth-panel">
        <div style={{ maxWidth }}>{children}</div>
      </div>
    </div>
  );
}
