import { useState } from 'react';
import { getFirebaseAuth } from '../../lib/firebase-client';

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await Promise.all([fetch('/api/session', { method: 'DELETE' }), getFirebaseAuth().signOut()]);
    window.location.href = '/admin/login';
  }

  return (
    <button onClick={handleSignOut} disabled={signingOut}>
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
