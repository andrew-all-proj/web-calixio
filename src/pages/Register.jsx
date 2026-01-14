import React from 'react'

export default function Register({
  name,
  email,
  password,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onRegister
}) {
  return (
    <main className="auth-wrap">
      <section className="card auth-card">
        <h2>Register</h2>
        <form onSubmit={onRegister}>
          <label>
            Name
            <input value={name} onChange={(e) => onNameChange(e.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(e) => onEmailChange(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} />
          </label>
          <button type="submit">Create account</button>
        </form>
      </section>
    </main>
  )
}
