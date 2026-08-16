import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { user, configured, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/edit" replace />;

  if (!configured) {
    return (
      <Centered>
        <h2 style={{ color: 'var(--text-heading)' }}>Firebase isn't configured yet</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 420, textAlign: 'center' }}>
          Add your Firebase project credentials to <code>.env.local</code> (see <code>.env.example</code>) and
          restart the dev server to enable the builder and login.
        </p>
      </Centered>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      setError('Could not sign in — check your email and password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Centered>
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--surface-glass)',
          backdropFilter: 'var(--blur-glass)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2 style={{ margin: 0, color: 'var(--text-heading)', fontSize: 22 }}>Sign in</h2>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <span style={{ color: 'var(--red-500)', fontSize: 13 }}>{error}</span>}
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        fontFamily: 'var(--font-body)',
      }}
    >
      {children}
    </div>
  );
}
