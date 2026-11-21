/**
 * The mascot: a baby one-horned rhino (original, flat).
 * Ported from rhino(mood) in design-reference/index.html.
 * Its mood follows the alert level; the Danger takeover screen does not use it.
 */
export type RhinoMood = 'safe' | 'watch' | 'scared' | 'danger';

const BODY = { safe: '#6CC4A1', watch: '#F6B54A', scared: '#FB923C', danger: '#F47272' };
const DARK = { safe: '#3E9C78', watch: '#C9861C', scared: '#C2410C', danger: '#C94B4B' };
const SNOUT = { safe: '#9BDCC1', watch: '#FAD08A', scared: '#FDC08F', danger: '#F9A3A3' };

export default function Rhino({ mood = 'safe', className }: { mood?: RhinoMood; className?: string }) {
  const body = BODY[mood];
  const dark = DARK[mood];
  const scared = mood === 'scared';
  const eyeR = scared ? 9.5 : 8;
  const pupilR = scared ? 3.4 : 4.6;
  const sweat = 'q4 7 0 10 q-4 -3 0 -10z';

  return (
    <svg viewBox="0 0 120 112" className={className} aria-hidden>
      <ellipse cx="33" cy="24" rx="9" ry="13" fill={body} transform="rotate(-18 33 24)" />
      <ellipse cx="87" cy="24" rx="9" ry="13" fill={body} transform="rotate(18 87 24)" />
      <ellipse cx="33" cy="26" rx="4" ry="7" fill={dark} opacity=".35" transform="rotate(-18 33 26)" />
      <ellipse cx="87" cy="26" rx="4" ry="7" fill={dark} opacity=".35" transform="rotate(18 87 26)" />
      <ellipse cx="60" cy="62" rx="46" ry="42" fill={body} />
      <ellipse cx="60" cy="86" rx="29" ry="19" fill={SNOUT[mood]} />
      <path
        d="M52 72 C54 60 57 52 63 44 C64 54 66 63 68 72 Z"
        fill="#FFF6E8"
        stroke={dark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="48" r={eyeR} fill="#fff" />
      <circle cx="78" cy="48" r={eyeR} fill="#fff" />
      <circle cx="43" cy="49" r={pupilR} fill="#1E293B" />
      <circle cx="77" cy="49" r={pupilR} fill="#1E293B" />
      <circle cx="44.6" cy="47.2" r="1.6" fill="#fff" />
      <circle cx="78.6" cy="47.2" r="1.6" fill="#fff" />
      {mood !== 'safe' && (
        <>
          <path d="M33 37 L45 41" stroke={dark} strokeWidth="3.2" strokeLinecap="round" />
          <path d="M87 37 L75 41" stroke={dark} strokeWidth="3.2" strokeLinecap="round" />
        </>
      )}
      <circle cx="28" cy="66" r="6" fill="#FF8FA3" opacity=".45" />
      <circle cx="92" cy="66" r="6" fill="#FF8FA3" opacity=".45" />
      <ellipse cx="52" cy="84" rx="3" ry="2.2" fill={dark} />
      <ellipse cx="68" cy="84" rx="3" ry="2.2" fill={dark} />
      {scared ? (
        <>
          <ellipse cx="60" cy="96" rx="5" ry="6" fill={dark} />
          <path d={`M20 34 ${sweat}`} fill="#7CC4F2" />
        </>
      ) : (
        <path
          d={mood === 'safe' ? 'M52 93 Q60 100 68 93' : 'M53 97 Q60 91 67 97'}
          fill="none"
          stroke={dark}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {(mood === 'watch' || scared) && <path d={`M96 30 ${sweat}`} fill="#7CC4F2" />}
    </svg>
  );
}
