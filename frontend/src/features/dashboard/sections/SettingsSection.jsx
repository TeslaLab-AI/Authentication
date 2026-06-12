import { useState } from 'react';
import { Card, Btn, Badge } from '../../../ui/primitives.jsx';
import { TOKENS as T } from '../../../theme/tokens.js';
import { sendOtp, verifyOtp } from '../../../services/authService.js';

export default function SettingsSection({ showToast, profile }) {
  const [scanSchedule, setScanSchedule] = useState('daily');
  const [autoPR, setAutoPR] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [threshold, setThreshold] = useState('high');

  const [verified, setVerified] = useState(profile?.isVerified);
  const [verifying, setVerifying] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const handleStartVerification = async () => {
    setOtpLoading(true);
    setVerificationError('');
    try {
      await sendOtp(profile.email);
      setVerifying(true);
      showToast('Verification code sent to email.');
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verificationOtp || verificationOtp.length !== 6) {
      setVerificationError('Enter a 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    setVerificationError('');
    try {
      await verifyOtp(profile.email, verificationOtp);
      setVerified(true);
      setVerifying(false);
      setVerificationOtp('');
      showToast('Email verified successfully!');
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: T.tx1, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: T.tx3, fontSize: 14 }}>Configure your AI engineer&apos;s behavior, notifications, and account.</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        {profile && (
          <Card style={{ marginBottom: 10 }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.tx1, marginBottom: 4 }}>Account Info</div>
                <div style={{ fontSize: 13, color: T.tx2 }}>{profile.name}</div>
                <div style={{ fontSize: 12, color: T.tx3, marginTop: 2 }}>{profile.email}</div>
              </div>
              <Badge variant={verified ? 'green' : 'amber'}>
                {verified ? '✓ Verified' : '⚠️ Unverified'}
              </Badge>
            </div>

            {!verified && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${T.brd}`, paddingTop: 12 }}>
                {!verifying ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span style={{ fontSize: 12, color: T.tx3 }}>Verify email to secure your account.</span>
                    <Btn size="sm" onClick={handleStartVerification} loading={otpLoading}>
                      Verify now
                    </Btn>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, color: T.tx2 }}>Enter the 6-digit code sent to your email:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={verificationOtp}
                        onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, ''))}
                        style={{ padding: '6px 10px', background: T.bg3, border: `1px solid ${T.brd}`, borderRadius: 8, color: T.tx1, fontSize: 13, width: 120, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', textAlign: 'center' }}
                      />
                      <Btn size="sm" onClick={handleConfirmVerification} loading={otpLoading}>
                        Verify
                      </Btn>
                      <Btn size="sm" variant="ghost" onClick={() => { setVerifying(false); setVerificationOtp(''); setVerificationError(''); }}>
                        Cancel
                      </Btn>
                    </div>
                    {verificationError && (
                      <div style={{ fontSize: 12, color: T.r, marginTop: 2 }}>{verificationError}</div>
                    )}
                    <div style={{ fontSize: 11, color: T.tx3 }}>
                      Didn&apos;t get the code? <button type="button" onClick={handleStartVerification} style={{ background: 'none', border: 'none', color: T.pm, cursor: 'pointer', padding: 0, fontSize: 11 }}>Resend code</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        <Card style={{ marginBottom: 10 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tx1 }}>Scan schedule</div>
              <div style={{ fontSize: 12, color: T.tx3, marginTop: 3 }}>How often your AI engineer scans each repo for issues</div>
            </div>
            <select value={scanSchedule} onChange={(e) => setScanSchedule(e.target.value)} className="w-full sm:w-auto" style={{ padding: '7px 12px', background: T.bg3, border: `1px solid ${T.brd}`, borderRadius: 8, fontSize: 13, color: T.tx1, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <option value="daily">Daily (recommended)</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual only</option>
            </select>
          </div>
        </Card>

        {[
          { label: 'Auto-raise PRs', desc: 'Automatically raise PRs for high-confidence fixes (>85% confidence)', val: autoPR, set: setAutoPR },
          { label: 'Email notifications', desc: 'Get notified when PRs are raised or health score changes significantly', val: emailNotifs, set: setEmailNotifs },
        ].map((s) => (
          <Card key={s.label} style={{ marginBottom: 10 }}>
            <div className="flex justify-between items-center gap-4">
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 14, fontWeight: 600, color: T.tx1 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: T.tx3, marginTop: 3, wordBreak: 'break-word' }}>{s.desc}</div>
              </div>
              <div onClick={() => s.set(!s.val)} style={{ width: 44, height: 24, background: s.val ? T.p : T.bg3, border: `1px solid ${s.val ? T.p2 : T.brd}`, borderRadius: 12, cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: s.val ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
              </div>
            </div>
          </Card>
        ))}

        <Card style={{ marginBottom: 10 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.tx1 }}>Alert threshold</div>
              <div style={{ fontSize: 12, color: T.tx3, marginTop: 3 }}>Only notify for issues above this severity level</div>
            </div>
            <select value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full sm:w-auto" style={{ padding: '7px 12px', background: T.bg3, border: `1px solid ${T.brd}`, borderRadius: 8, fontSize: 13, color: T.tx1, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <option value="all">All issues</option>
              <option value="high">High + Critical</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
        </Card>

        <Card style={{ background: T.pl, borderColor: T.p, marginTop: 24 }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.pm }}>Solo plan — Rs.999/month</div>
              <div style={{ fontSize: 12, color: T.tx3, marginTop: 4 }}>2/3 repos used · Next billing June 1, 2026</div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <Btn size="sm" onClick={() => showToast('Opening upgrade page…')}>Upgrade to Startup</Btn>
                <Btn variant="ghost" size="sm" onClick={() => showToast('Managing billing…')}>Manage billing</Btn>
              </div>
            </div>
            <Badge variant="purple">Active</Badge>
          </div>
        </Card>

        <Btn onClick={() => showToast('Settings saved successfully')} style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}>
          Save settings
        </Btn>
      </div>
    </div>
  );
}
