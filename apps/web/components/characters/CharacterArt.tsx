"use client";

import { useId } from "react";

type CharacterArtProps = {
  className?: string;
};

function safeId(prefix: string) {
  const id = useId().replaceAll(":", "");
  return `${prefix}-${id}`;
}

export function MicroManagingCeo({ className }: CharacterArtProps) {
  const suit = safeId("ceo-suit");
  const skin = safeId("ceo-skin");

  return (
    <svg
      aria-label="The Micro-Managing CEO, arms spread across the elevator"
      className={className}
      role="img"
      viewBox="0 0 360 230"
    >
      <defs>
        <linearGradient id={suit} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#274d7c" />
          <stop offset="0.52" stopColor="#173456" />
          <stop offset="1" stopColor="#0a1d33" />
        </linearGradient>
        <linearGradient id={skin} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd6a0" />
          <stop offset="1" stopColor="#d98b58" />
        </linearGradient>
        <filter id={`${suit}-shadow`} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" floodColor="#020812" floodOpacity=".58" stdDeviation="5" />
        </filter>
      </defs>

      <g className="ceo-character" filter={`url(#${suit}-shadow)`}>
        <path
          d="M71 77C48 69 31 67 18 72L9 83l11 12 49 17 34-3-1-27Z"
          fill={`url(#${suit})`}
          stroke="#07101b"
          strokeLinejoin="round"
          strokeWidth="6"
        />
        <path
          d="M289 77c23-8 40-10 53-5l9 11-11 12-49 17-34-3 1-27Z"
          fill={`url(#${suit})`}
          stroke="#07101b"
          strokeLinejoin="round"
          strokeWidth="6"
        />
        <g fill={`url(#${skin})`} stroke="#6e3826" strokeLinejoin="round" strokeWidth="4">
          <path d="m22 70-12-9-8 5 7 10-8 2 3 10 10-2-4 9 10 5 10-18Z" />
          <path d="m338 70 12-9 8 5-7 10 8 2-3 10-10-2 4 9-10 5-10-18Z" />
        </g>
        <path
          d="M116 76q64-38 128 0l19 106-40 29h-86l-40-29Z"
          fill={`url(#${suit})`}
          stroke="#07101b"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path d="m180 91-27 84 27 29 27-29Z" fill="#f2f0e9" opacity=".96" />
        <path d="m180 102-14 48 14 20 14-20Z" fill="#e94242" stroke="#741b21" strokeWidth="3" />
        <path d="m119 83 42 25-20 40-31-33Z" fill="#315b8c" stroke="#091827" strokeWidth="4" />
        <path d="m241 83-42 25 20 40 31-33Z" fill="#315b8c" stroke="#091827" strokeWidth="4" />
        <rect fill="#f6e2a8" height="24" rx="5" stroke="#252018" strokeWidth="3" width="39" x="216" y="143" />
        <text fill="#1c2430" fontFamily="Arial Black, sans-serif" fontSize="12" textAnchor="middle" x="235.5" y="159">
          CEO
        </text>
        <path d="M145 179v34l-34 8 2-42Z" fill="#132b48" stroke="#07101b" strokeWidth="6" />
        <path d="M215 179v34l34 8-2-42Z" fill="#132b48" stroke="#07101b" strokeWidth="6" />
        <path d="M140 57q3-48 40-48t40 48v32q0 42-40 42t-40-42Z" fill={`url(#${skin})`} stroke="#603322" strokeWidth="6" />
        <path d="M139 60q1-51 41-51 36 0 42 40l-17-11-8 10-21-11-17 12Z" fill="#20242a" />
        <path d="M137 63q-12 3-9 22t16 17M223 63q12 3 9 22t-16 17" fill={`url(#${skin})`} stroke="#603322" strokeWidth="5" />
        <g className="character-pupils">
          <ellipse cx="162" cy="76" fill="#faf7ec" rx="13" ry="11" stroke="#5f3527" strokeWidth="3" />
          <ellipse cx="199" cy="76" fill="#faf7ec" rx="13" ry="11" stroke="#5f3527" strokeWidth="3" />
          <circle cx="164" cy="78" fill="#0a1119" r="5" />
          <circle cx="197" cy="78" fill="#0a1119" r="5" />
        </g>
        <path d="m148 61 25 5M212 61l-25 5" fill="none" stroke="#28211f" strokeLinecap="round" strokeWidth="7" />
        <path d="M164 105q17-11 34 0" fill="none" stroke="#682c2d" strokeLinecap="round" strokeWidth="6" />
        <path d="M180 81v15l-7 4" fill="none" stroke="#a65f40" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M141 71h-9M219 71h9M175 73h11" fill="none" stroke="#172230" strokeWidth="5" />
        <rect fill="none" height="26" rx="8" stroke="#172230" strokeWidth="5" width="36" x="139" y="66" />
        <rect fill="none" height="26" rx="8" stroke="#172230" strokeWidth="5" width="36" x="186" y="66" />
      </g>
    </svg>
  );
}

export function SleepingIntern({ className }: CharacterArtProps) {
  const shirt = safeId("intern-shirt");
  const skin = safeId("intern-skin");

  return (
    <svg
      aria-label="The Sleeping Intern lying sideways and snoring"
      className={className}
      role="img"
      viewBox="0 0 360 205"
    >
      <defs>
        <linearGradient id={shirt} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8fdcff" />
          <stop offset=".52" stopColor="#42a6dc" />
          <stop offset="1" stopColor="#17699b" />
        </linearGradient>
        <linearGradient id={skin} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd0a0" />
          <stop offset="1" stopColor="#c9784c" />
        </linearGradient>
        <filter id={`${shirt}-shadow`} x="-25%" y="-35%" width="160%" height="190%">
          <feDropShadow dx="0" dy="9" floodColor="#020812" floodOpacity=".6" stdDeviation="5" />
        </filter>
      </defs>
      <g className="intern-character" filter={`url(#${shirt}-shadow)`}>
        <path d="M97 76q-44 7-55 39l20 18 58-14Z" fill={`url(#${shirt})`} stroke="#08243a" strokeWidth="6" />
        <path d="m45 111-32 18 4 15 48-5Z" fill="#233046" stroke="#08111f" strokeWidth="6" />
        <path d="M112 78h151q31 0 40 26l-9 57H106q-26 0-32-25l8-31q7-27 30-27Z" fill={`url(#${shirt})`} stroke="#08243a" strokeLinejoin="round" strokeWidth="7" />
        <path d="M250 84q45-2 71 19l20 34-16 15-43-31Z" fill="#d5aa68" stroke="#342719" strokeLinejoin="round" strokeWidth="6" />
        <path d="m321 102 28-3 7 15-24 16Z" fill="#f4f1ea" stroke="#23272c" strokeWidth="5" />
        <path d="m271 90 16 68" fill="none" stroke="#16597f" strokeWidth="5" />
        <path d="M148 84q8-68 58-60 44 8 38 58l-6 27q-7 35-48 34-44-1-48-39Z" fill={`url(#${skin})`} stroke="#633623" strokeWidth="6" />
        <path d="M145 78q11-70 65-52 27 9 36 39l-27-12-10 12-20-13-18 16Z" fill="#5b3327" />
        <path d="M149 83q-12 5-7 21t18 11M241 78q12 5 5 22t-17 10" fill={`url(#${skin})`} stroke="#633623" strokeWidth="5" />
        <path d="M169 87q13 8 26 0M207 88q12 8 23 0" fill="none" stroke="#35251f" strokeLinecap="round" strokeWidth="5" />
        <path d="M191 116q14 7 29-1" fill="none" stroke="#733e39" strokeLinecap="round" strokeWidth="6" />
        <path d="M213 118q-1 17 9 23" fill="none" stroke="#b8ecff" strokeLinecap="round" strokeWidth="6" />
        <path d="M127 123q75 15 151 4" fill="none" stroke="#caefff" strokeOpacity=".45" strokeWidth="7" />
        <rect fill="#fff0b7" height="28" rx="5" stroke="#2d2c29" strokeWidth="3" width="48" x="102" y="112" />
        <path d="M109 121h33M109 129h23" stroke="#65707c" strokeWidth="3" />
        <g className="sleep-marks" fill="#d9f2ff" fontFamily="Arial Black, sans-serif" fontWeight="900">
          <text fontSize="25" x="113" y="55">Z</text>
          <text fontSize="18" x="91" y="38">Z</text>
          <text fontSize="13" x="77" y="24">Z</text>
        </g>
      </g>
    </svg>
  );
}

export function BrokenCopyMachine({ className }: CharacterArtProps) {
  const body = safeId("printer-body");

  return (
    <svg
      aria-label="The Broken Copy Machine rattling and ejecting paperwork"
      className={className}
      role="img"
      viewBox="0 0 300 250"
    >
      <defs>
        <linearGradient id={body} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#eef4f7" />
          <stop offset=".5" stopColor="#b5c2cc" />
          <stop offset="1" stopColor="#6e7c88" />
        </linearGradient>
        <filter id={`${body}-shadow`} x="-35%" y="-40%" width="180%" height="210%">
          <feDropShadow dx="0" dy="9" floodColor="#020812" floodOpacity=".62" stdDeviation="6" />
        </filter>
      </defs>
      <g className="printer-character" filter={`url(#${body}-shadow)`}>
        <path d="M56 58h183l23 42-13 45H46L35 98Z" fill={`url(#${body})`} stroke="#27333d" strokeLinejoin="round" strokeWidth="7" />
        <path d="M78 21h126l19 48H57Z" fill="#dce5eb" stroke="#27333d" strokeLinejoin="round" strokeWidth="7" />
        <path d="m82 17 96 2-4 34-90-4Z" fill="#f5f2e9" stroke="#66717a" strokeWidth="4" />
        <path d="M92 29h69M92 38h58" stroke="#9fa8ae" strokeWidth="3" />
        <rect fill="#151f27" height="18" rx="4" width="112" x="72" y="86" />
        <path d="M48 139h202l-9 96H58Z" fill={`url(#${body})`} stroke="#27333d" strokeLinejoin="round" strokeWidth="7" />
        <path d="M75 157h139v48H75Z" fill="#8996a2" stroke="#33404a" strokeWidth="5" />
        <path d="M88 169h113M88 181h86" stroke="#53616d" strokeWidth="5" />
        <rect fill="#173b4d" height="31" rx="5" stroke="#263039" strokeWidth="4" width="57" x="183" y="75" />
        <circle className="printer-led" cx="225" cy="90" fill="#ff394f" r="7" />
        <path d="M56 219h27v21H56ZM216 219h27v21h-27Z" fill="#252e35" />
        <path className="paper paper-one" d="m195 15 45-8 10 53-43 4Z" fill="#fffaf0" stroke="#7e8890" strokeWidth="3" />
        <path className="paper paper-two" d="m241 43 38 8-13 47-35-13Z" fill="#fffaf0" stroke="#7e8890" strokeWidth="3" />
        <path className="paper paper-three" d="m28 35 38-17 16 45-41 11Z" fill="#fffaf0" stroke="#7e8890" strokeWidth="3" />
        <path d="m51 117 24-14 17 20 18-12 19 16 20-13 20 17 17-13 21 18" fill="none" stroke="#ff5b65" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      </g>
    </svg>
  );
}
