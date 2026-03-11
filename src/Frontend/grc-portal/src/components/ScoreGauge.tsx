interface ScoreGaugeProps {
  score: number;
  label: string;
  icon: string;
  color: string;
  size?: number;
}

function getScoreColor(score: number) {
  if (score >= 71) return '#10b981';
  if (score >= 41) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score >= 71) return 'Good';
  if (score >= 41) return 'Fair';
  return 'At Risk';
}

export function ScoreGauge({ score, label, icon, size = 120 }: ScoreGaugeProps) {
  const scoreColor = getScoreColor(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={8}
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.3s ease' }}
          />
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{ fontSize: size * 0.18, color: 'var(--text-muted)' }}>{icon}</span>
          <span style={{
            fontSize: size * 0.22,
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            color: scoreColor,
            lineHeight: 1,
          }}>{score}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: scoreColor,
        }}>{getScoreLabel(score)}</div>
      </div>
    </div>
  );
}

interface OverallGaugeProps {
  score: number;
  size?: number;
}

export function OverallGauge({ score, size = 180 }: OverallGaugeProps) {
  const scoreColor = getScoreColor(score);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Outer glow track */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth={12} />
          {/* Score arc */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.2s ease, stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${scoreColor}80)`,
            }}
          />
          {/* Inner ring */}
          <circle cx={center} cy={center} r={radius - 18} fill="none" stroke={`${scoreColor}15`} strokeWidth={1} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            GRC Score
          </div>
          <div style={{
            fontSize: size * 0.24,
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            color: scoreColor,
            lineHeight: 1,
            filter: `drop-shadow(0 0 12px ${scoreColor}60)`,
          }}>{score}</div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: scoreColor, marginTop: 4,
          }}>{getScoreLabel(score)}</div>
        </div>
      </div>
    </div>
  );
}

