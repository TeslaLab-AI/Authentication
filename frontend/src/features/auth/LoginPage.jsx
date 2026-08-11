import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register, saveToken, forgotPassword, resetPassword, sendOtp, verifyOtp, startGithubAuth } from '../../services/authService.js';
import { Btn, Input } from '../../ui/primitives.jsx';
import { TOKENS as T } from '../../theme/tokens.js';

function SplitOtpInput({ value, onChange, error }) {
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleChange = (e, idx) => {
    const val = e.target.value;
    const lastChar = val.substring(val.length - 1);
    
    if (lastChar && !/^\d$/.test(lastChar)) {
      return;
    }

    const currentDigits = value.split('');
    currentDigits[idx] = lastChar;
    const newOtp = currentDigits.join('');
    
    onChange(newOtp);

    if (lastChar && idx < 5) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      const currentDigits = value.split('');
      if (currentDigits[idx]) {
        currentDigits[idx] = '';
        onChange(currentDigits.join(''));
      } else if (idx > 0) {
        currentDigits[idx - 1] = '';
        onChange(currentDigits.join(''));
        inputRefs[idx - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs[idx - 1].current.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digitsOnly = pasteData.replace(/\D/g, '').substring(0, 6);
    if (digitsOnly) {
      onChange(digitsOnly);
      const nextFocusIdx = Math.min(digitsOnly.length, 5);
      inputRefs[nextFocusIdx].current.focus();
    }
  };

  const handleFocus = (idx) => {
    const firstEmptyIdx = value.length;
    if (idx > firstEmptyIdx) {
      const targetIdx = Math.min(firstEmptyIdx, 5);
      inputRefs[targetIdx].current?.focus();
    } else {
      setFocusedIndex(idx);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: T.tx2, marginBottom: 8, letterSpacing: '0.02em' }}>
        6-digit verification code
      </label>
      <div className="flex gap-1.5 sm:gap-2.5 justify-between">
        {Array.from({ length: 6 }).map((_, idx) => {
          const val = value[idx] || '';
          const isFocused = focusedIndex === idx;
          return (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(idx)}
              onBlur={() => setFocusedIndex(-1)}
              className="w-full max-w-[50px] aspect-square sm:aspect-auto sm:h-[52px]"
              style={{
                background: T.bg2,
                border: `1px solid ${error ? T.r : isFocused ? T.p : T.brd}`,
                borderRadius: 10,
                fontSize: 20,
                fontWeight: 700,
                color: T.tx1,
                textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'border-color .15s, box-shadow .15s',
                boxShadow: isFocused ? `0 0 0 3px ${T.pl}` : 'none',
              }}
            />
          );
        })}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: T.r, marginTop: 6, marginBottom: 0 }}>{error}</p>
      )}
    </div>
  );
}

export default function LoginPage({ setUser, setGlobalError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'signup-otp' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSetMode = (m) => {
    setMode(m);
    setErrors({});
    setGlobalError('');
    setSuccessMsg('');
    setOtp('');
  };

  const validate = () => {
    const e = {};
    if (mode === 'forgot') {
      if (!email) e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
      return e;
    }
    if (mode === 'reset') {
      if (!otp) e.otp = 'OTP is required';
      else if (otp.length !== 6) e.otp = 'Enter a 6-digit OTP';
      if (!password) e.password = 'New password is required';
      else if (password.length < 6) e.password = 'At least 6 characters';
      return e;
    }
    if (mode === 'signup-otp') {
      if (!otp) e.otp = 'OTP is required';
      else if (otp.length !== 6) e.otp = 'Enter a 6-digit OTP';
      return e;
    }

    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    else if (mode === 'signup' && !/@gmail\.com$/i.test(email)) e.email = 'Please register with a Gmail address';
    
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    
    if (mode === 'signup' && !name.trim()) e.name = 'Name is required';
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setGlobalError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        try {
          const response = await login({ email, password });
          saveToken(response.token);
          setUser(response.user);
          navigate('/connect', { replace: true });
        } catch (loginErr) {
          // Unverified account: send a fresh code and route to the OTP screen
          // instead of dead-ending on "Please verify your email first".
          if ((loginErr.message || '').toLowerCase().includes('verify')) {
            await sendOtp(email);
            handleSetMode('signup-otp');
            setSuccessMsg('Your email isn\'t verified yet. A verification code has been sent to your email.');
          } else {
            throw loginErr;
          }
        }
      } else if (mode === 'signup') {
        try {
          const registerclicked = await register({ name, email, password });

          console.log("",registerclicked);
          
          handleSetMode('signup-otp');
          setSuccessMsg('Account registered! An OTP code has been sent to your email.');
        } catch (regErr) {
          if (regErr.message === 'User already exists') {
            try {
              const loginResponse = await login({ email, password });
              const userObj = loginResponse.user || loginResponse;
              if (!userObj.isVerified) {
                await sendOtp(email);
                handleSetMode('signup-otp');
                setSuccessMsg('Your account is registered but not verified. A new verification code has been sent to your email.');
              } else {
                saveToken(loginResponse.token);
                setUser(userObj);
                navigate('/connect', { replace: true });
              }
            } catch (loginErr) {
              throw new Error('User already exists. If this is your account, please sign in with your correct password.');
            }
          } else {
            throw regErr;
          }
        }
      } else if (mode === 'signup-otp') {
        await verifyOtp(email, otp);
        const response = await login({ email, password });
        saveToken(response.token);
        setUser(response.user);
        navigate('/connect', { replace: true });
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setSuccessMsg('Password reset code sent to your email.');
        setMode('reset');
      } else if (mode === 'reset') {
        await resetPassword(email, otp, password);
        setSuccessMsg('Password reset successful! Please sign in with your new password.');
        setMode('login');
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setGlobalError('');
    setSuccessMsg('');
    try {
      if (mode === 'signup-otp') {
        await sendOtp(email);
        setSuccessMsg('Verification code resent successfully.');
      } else if (mode === 'reset') {
        await forgotPassword(email);
        setSuccessMsg('Reset code resent successfully.');
      }
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Autonomous bug detection & auto-fix pull requests',
    'Dependency upgrade PRs raised automatically',
    'Autonomous Security vulnerability scanning and Fixing',
    'Repo health score (0–100), tracked over time',
    'Human approval layer — nothing merges without you',
    'JWT-secured authentication with your backend',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden" style={{ background: `radial-gradient(ellipse at 20% 80%, ${T.pl} 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, ${T.pl} 0%, transparent 60%), ${T.bg1}`, padding: '4rem 3.5rem', borderRight: `1px solid ${T.brd}` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${T.brd} 1px, transparent 1px)`, backgroundSize: '32px 32px', opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill={T.p} />
              <path d="M7 14L11.5 18.5L21 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: T.tx1 }}>TeslaLab AI</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, color: T.tx1, lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Your AI<br />
            <span style={{ color: T.pm }}>Senior Software</span>
            <br />
            Engineer.
          </h1>
          <p style={{ color: T.tx2, fontSize: 14, lineHeight: 1.7, marginBottom: '2rem', maxWidth: 340 }}>
            TeslaLab maintains your GitHub repo 24/7 — fixing bugs, upgrading dependencies, scanning vulnerabilities, and raising PRs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 6, background: T.pl, border: '1px solid #4C1D95', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke={T.pm} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: T.tx2, lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 16, marginTop: '2rem' }}>
            {[['', 'Developers'], ['', 'Paying customers'], ['', 'PRs raised']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, color: T.tx1 }}>{v}</div>
                <div style={{ fontSize: 11, color: T.tx3, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: T.bg0 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create account'}
                {mode === 'signup-otp' && 'Verify your email'}
                {mode === 'forgot' && 'Reset your password'}
                {mode === 'reset' && 'Enter reset code'}
              </h2>
              <p style={{ color: T.tx3, fontSize: 14, marginBottom: 28 }}>
                {mode === 'login' && 'Sign in to your TeslaLab dashboard'}
                {mode === 'signup' && 'Create an account to connect your auth API'}
                {mode === 'signup-otp' && `Enter the 6-digit OTP code sent to ${email}`}
                {mode === 'forgot' && 'We will send a 6-digit code to your email'}
                {mode === 'reset' && `Enter the OTP sent to ${email} and choose a new password`}
              </p>

              {successMsg && (
                <div style={{ background: T.gl, border: `1px solid ${T.g}`, borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#34D399', marginBottom: 20 }}>
                  {successMsg}
                </div>
              )}

              {mode === 'signup-otp' && (
                <div style={{ background: T.pl, border: `1px solid ${T.brd}`, borderRadius: 12, padding: '12px 14px', fontSize: 12, color: T.pm, lineHeight: 1.5, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                  <span>
                    <strong>Local Testing:</strong> Check the backend server terminal console logs for the simulated OTP code!
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <Input label="Full name" placeholder="Rahul Gupta" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                )}
                
                {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                  <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>} />
                )}

                {(mode === 'signup-otp' || mode === 'reset') && (
                  <SplitOtpInput value={otp} onChange={setOtp} error={errors.otp} />
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                  <Input label={mode === 'reset' ? 'New Password' : 'Password'} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>} />
                )}

                {mode === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 20 }}>
                    <button type="button" onClick={() => handleSetMode('forgot')} style={{ background: 'none', border: 'none', color: T.pm, fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                <Btn type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 18px', fontSize: 14 }}>
                  {!loading && (
                    mode === 'login' ? 'Sign in to dashboard' :
                    mode === 'signup' ? 'Create account' :
                    mode === 'signup-otp' ? 'Verify email & continue' :
                    mode === 'forgot' ? 'Send reset code' :
                    'Save new password'
                  )}
                </Btn>
              </form>

              {(mode === 'signup-otp' || mode === 'reset') && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                  <button type="button" onClick={handleResendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: T.pm, fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500, opacity: loading ? 0.5 : 1 }}>
                    Resend code
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
                  <div style={{ flex: 1, height: 1, background: T.brd }} />
                  <span style={{ fontSize: 11, color: T.tx3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: T.brd }} />
                </div>
              )}

              {mode === 'login' && (
                <Btn type="button" onClick={startGithubAuth} variant="secondary" style={{ width: '100%', padding: '11px 18px', fontSize: 14, gap: 10 }}>
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Continue with GitHub
                </Btn>
              )}

              <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: T.tx3 }}>
                {mode === 'login' && (
                  <>Don&apos;t have an account?{' '}<button type="button" onClick={() => handleSetMode('signup')} style={{ color: T.pm, cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontSize: 13 }}>Sign up free</button></>
                )}
                {mode === 'signup' && (
                  <>Already have an account?{' '}<button type="button" onClick={() => handleSetMode('login')} style={{ color: T.pm, cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontSize: 13 }}>Sign in</button></>
                )}
                {(mode === 'forgot' || mode === 'reset' || mode === 'signup-otp') && (
                  <button type="button" onClick={() => handleSetMode('login')} style={{ color: T.pm, cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontSize: 13 }}>Back to sign in</button>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
