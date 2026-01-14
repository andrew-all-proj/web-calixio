import React from 'react'

export default function Login({
  email,
  password,
  accessToken,
  refreshToken,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onClearTokens
}) {
  return (
    <main className="auth-wrap">
      <section className="card auth-card">
        <h2>Login</h2>
        <form onSubmit={onLogin}>
          <label>
            Email
            <input value={email} onChange={(e) => onEmailChange(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} />
          </label>
          <div className="actions">
            <button type="submit">Sign in</button>
            <button type="button" className="ghost" onClick={onClearTokens}>Clear tokens</button>
          </div>
        </form>
        <div className="mono">Access: {accessToken ? accessToken.slice(0, 24) + '...' : '—'}</div>
        <div className="mono">Refresh: {refreshToken ? refreshToken.slice(0, 24) + '...' : '—'}</div>
      </section>
    </main>
  )
}
