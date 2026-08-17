import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useMessages } from '../design-system/useMessages';
import { markMessageRead, deleteMessage } from '../firebase/messages';
import { useAuth } from '../auth/AuthProvider';

const TOPBAR_HEIGHT = 52;

export function Inbox() {
  const { signOut } = useAuth();
  const { messages, loading, unreadCount } = useMessages();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 110,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: 'var(--surface-glass)',
          backdropFilter: 'var(--blur-glass)',
          WebkitBackdropFilter: 'var(--blur-glass)',
          borderBottom: '1px solid var(--border-default)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Link to="/edit" style={{ color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ← Builder
          </Link>
          <strong style={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>Messages</strong>
          {unreadCount > 0 && <span style={{ color: 'var(--accent-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{unreadCount} unread</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: `${TOPBAR_HEIGHT + 32}px 24px 80px` }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '60px 0' }}>
            No messages yet — they'll show up here when someone uses the contact form.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: m.read ? 'var(--surface-card)' : 'var(--surface-panel)',
                  boxShadow: m.read ? 'none' : 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                    {!m.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />}
                    <strong style={{ color: 'var(--text-heading)', fontSize: 14 }}>{m.name}</strong>
                    <a href={`mailto:${m.email}`} style={{ color: 'var(--accent-primary)', fontSize: 13, textDecoration: 'none' }}>
                      {m.email}
                    </a>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {m.createdAt?.toDate().toLocaleString() ?? 'just now'}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-body)', whiteSpace: 'pre-wrap', margin: '0 0 10px' }}>{m.message}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => markMessageRead(m.id, !m.read)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {m.read ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button
                    onClick={() => deleteMessage(m.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--red-500)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
