"use client";

import { useId } from "react";

export type ShiftCharacterArtProps = {
  className?: string;
};

function safeId(prefix: string) {
  const id = useId().replaceAll(":", "");
  return `${prefix}-${id}`;
}

/** Long horizontal alternate for the Sleeping Intern geometry slot. */
export function BurnedOutEngineer({ className }: ShiftCharacterArtProps) {
  const hoodie = safeId("engineer-hoodie");
  const skin = safeId("engineer-skin");
  const laptop = safeId("engineer-laptop");

  return (
    <svg
      aria-label="The Burned-Out Engineer sprawled horizontally across an office chair with a laptop"
      className={className}
      role="img"
      viewBox="0 0 360 205"
    >
      <defs>
        <linearGradient id={hoodie} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a164d8" />
          <stop offset=".52" stopColor="#623c9a" />
          <stop offset="1" stopColor="#2b2057" />
        </linearGradient>
        <linearGradient id={skin} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f4c491" />
          <stop offset="1" stopColor="#b96f4d" />
        </linearGradient>
        <linearGradient id={laptop} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#d9e4eb" />
          <stop offset=".55" stopColor="#83939e" />
          <stop offset="1" stopColor="#46545e" />
        </linearGradient>
        <filter id={`${hoodie}-shadow`} x="-25%" y="-40%" width="165%" height="205%">
          <feDropShadow dx="0" dy="9" floodColor="#020812" floodOpacity=".62" stdDeviation="5" />
        </filter>
      </defs>

      <g className="engineer-character" filter={`url(#${hoodie}-shadow)`}>
        <path
          d="M38 112q26-31 72-29l151 4q35 1 49 31l-10 45H83q-41 0-56-29Z"
          fill={`url(#${hoodie})`}
          stroke="#17142c"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path
          d="m66 109-47 14-12 22 17 13 61-16Z"
          fill="#27354a"
          stroke="#0b121e"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path d="m14 142 52-8 18 22-59 17Z" fill="#141b29" stroke="#080d15" strokeWidth="6" />
        <path d="M43 149h35" fill="none" stroke="#dce7ef" strokeLinecap="round" strokeOpacity=".55" strokeWidth="4" />

        <path
          d="M247 92q31-5 58 19l42 23-7 20-57-16-47-4Z"
          fill={`url(#${hoodie})`}
          stroke="#17142c"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path d="m337 133 20 5-2 18-22 1-10-11Z" fill={`url(#${skin})`} stroke="#6b3929" strokeWidth="5" />

        <path
          d="M103 82q12-63 66-58 48 5 52 55l-2 30q-4 40-48 43-48 3-57-37Z"
          fill={`url(#${skin})`}
          stroke="#633727"
          strokeWidth="7"
        />
        <path
          d="M104 79q9-64 66-58 40 4 51 43l-25-12-13 13-25-13-24 21Z"
          fill="#2b2023"
          stroke="#151116"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path d="M107 87q-13 3-9 22t18 16M218 82q13 3 8 22t-17 14" fill={`url(#${skin})`} stroke="#633727" strokeWidth="5" />
        <path d="M131 91q12-8 25 0M177 90q13-8 26 0" fill="none" stroke="#3a2523" strokeLinecap="round" strokeWidth="5" />
        <path d="M136 98q9 8 19 0M179 97q10 8 20 0" fill="none" stroke="#5a3a36" strokeLinecap="round" strokeWidth="4" />
        <path d="M153 124q20 8 39-3" fill="none" stroke="#723d3c" strokeLinecap="round" strokeWidth="6" />
        <path d="M167 99v15l-7 4" fill="none" stroke="#9c593f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <path d="M123 108q17 12 36 2M177 109q19 9 37-4" fill="none" stroke="#76504b" strokeLinecap="round" strokeOpacity=".45" strokeWidth="5" />

        <path d="M210 126q31-21 57-7l13 22-20 15-51-10Z" fill={`url(#${skin})`} stroke="#6b3929" strokeLinejoin="round" strokeWidth="6" />
        <path d="m260 122 10 20 21-8" fill="none" stroke="#603221" strokeLinecap="round" strokeWidth="4" />

        <path
          d="m244 64 83 7-13 64-84-8Z"
          fill={`url(#${laptop})`}
          stroke="#25313a"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path d="m253 77 61 5-8 39-62-6Z" fill="#071b27" stroke="#152932" strokeWidth="3" />
        <path d="m261 90 17 1M261 99l37 3M259 108l26 2" stroke="#74e6a5" strokeLinecap="round" strokeWidth="4" />
        <path d="m224 128 101 9 17 18-112-8Z" fill="#7c8a94" stroke="#25313a" strokeLinejoin="round" strokeWidth="6" />
        <rect fill="#fff0b7" height="25" rx="5" stroke="#2d2c29" strokeWidth="3" width="45" x="76" y="124" />
        <text fill="#1c2430" fontFamily="Arial Black, sans-serif" fontSize="10" textAnchor="middle" x="98.5" y="140">
          ENG
        </text>
        <path d="M103 153q91 18 188 3" fill="none" stroke="#c5a5ef" strokeOpacity=".45" strokeWidth="7" />
        <g fill="#d8f6ff" fontFamily="Arial Black, sans-serif" fontWeight="900">
          <text fontSize="20" x="75" y="63">404</text>
          <text fontSize="12" x="58" y="43">SLEEP</text>
        </g>
      </g>
    </svg>
  );
}

/** Wide T-shaped alternate for the Micro-Managing CEO geometry slot. */
export function ReplyAllDirector({ className }: ShiftCharacterArtProps) {
  const jacket = safeId("director-jacket");
  const skin = safeId("director-skin");
  const alert = safeId("director-alert");

  return (
    <svg
      aria-label="The Reply-All Director spreading an email chain across the entire elevator"
      className={className}
      role="img"
      viewBox="0 0 360 230"
    >
      <defs>
        <linearGradient id={jacket} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d84972" />
          <stop offset=".52" stopColor="#9d244e" />
          <stop offset="1" stopColor="#4f1735" />
        </linearGradient>
        <linearGradient id={skin} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f7ca9d" />
          <stop offset="1" stopColor="#bb704c" />
        </linearGradient>
        <radialGradient id={alert} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff18a" />
          <stop offset=".5" stopColor="#ff7059" />
          <stop offset="1" stopColor="#c51f3c" />
        </radialGradient>
        <filter id={`${jacket}-shadow`} x="-30%" y="-35%" width="165%" height="190%">
          <feDropShadow dx="0" dy="8" floodColor="#020812" floodOpacity=".62" stdDeviation="5" />
        </filter>
      </defs>

      <g className="director-character" filter={`url(#${jacket}-shadow)`}>
        <path
          d="M101 82 63 71 16 62 5 76l10 17 51 22 45-4Z"
          fill={`url(#${jacket})`}
          stroke="#251020"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path
          d="m259 82 38-11 47-9 11 14-10 17-51 22-45-4Z"
          fill={`url(#${jacket})`}
          stroke="#251020"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <g fill={`url(#${skin})`} stroke="#6e3828" strokeLinejoin="round" strokeWidth="4">
          <path d="m20 59-12-10-7 6 8 9-8 4 5 9 9-3-2 10 11 3 8-19Z" />
          <path d="m340 59 12-10 7 6-8 9 8 4-5 9-9-3 2 10-11 3-8-19Z" />
        </g>

        <path d="m26 88 44-3-4 34-43-12Z" fill="#f7f2e6" stroke="#5c6670" strokeWidth="4" />
        <path d="m29 92 18 13 18-15" fill="none" stroke="#d13b55" strokeLinejoin="round" strokeWidth="4" />
        <path d="m290 83 45 5-4 32-44-11Z" fill="#f7f2e6" stroke="#5c6670" strokeWidth="4" />
        <path d="m293 88 18 14 20-10" fill="none" stroke="#d13b55" strokeLinejoin="round" strokeWidth="4" />

        <path
          d="M114 73q66-35 132 0l18 111-42 30h-84l-42-30Z"
          fill={`url(#${jacket})`}
          stroke="#251020"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path d="m180 94-29 84 29 28 29-28Z" fill="#f6f0e6" stroke="#6e263e" strokeWidth="3" />
        <path d="m180 103-14 46 14 18 14-18Z" fill="#f5bd37" stroke="#7d421d" strokeWidth="3" />
        <path d="m116 82 45 26-20 42-34-34Z" fill="#e45a82" stroke="#421629" strokeWidth="4" />
        <path d="m244 82-45 26 20 42 34-34Z" fill="#e45a82" stroke="#421629" strokeWidth="4" />
        <path d="M146 181v32l-36 8 5-40ZM214 181v32l36 8-5-40Z" fill="#571a38" stroke="#251020" strokeWidth="6" />

        <path
          d="M139 57q3-48 41-48t41 48v31q0 43-41 43t-41-43Z"
          fill={`url(#${skin})`}
          stroke="#603322"
          strokeWidth="6"
        />
        <path d="M138 60q1-51 42-51 34 0 43 35l-19-9-10 10-22-10-15 13Z" fill="#5b233d" />
        <path d="M138 65q-12 3-9 21t16 16M222 65q12 3 9 21t-16 16" fill={`url(#${skin})`} stroke="#603322" strokeWidth="5" />
        <ellipse cx="162" cy="77" fill="#fffaf0" rx="14" ry="12" stroke="#5f3527" strokeWidth="3" />
        <ellipse cx="199" cy="77" fill="#fffaf0" rx="14" ry="12" stroke="#5f3527" strokeWidth="3" />
        <circle cx="166" cy="76" fill="#0a1119" r="5" />
        <circle cx="203" cy="76" fill="#0a1119" r="5" />
        <path d="m148 59 27 5M212 59l-25 5" fill="none" stroke="#4b1d32" strokeLinecap="round" strokeWidth="6" />
        <path d="M159 104q21 20 43-1" fill="#fff8e9" stroke="#742e35" strokeLinejoin="round" strokeWidth="5" />
        <path d="M167 111h27" stroke="#d9b4a2" strokeWidth="3" />
        <path d="M180 82v14l-7 4" fill="none" stroke="#a65f40" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />

        <rect fill="#f6e2a8" height="24" rx="5" stroke="#252018" strokeWidth="3" width="41" x="215" y="143" />
        <text fill="#1c2430" fontFamily="Arial Black, sans-serif" fontSize="10" textAnchor="middle" x="235.5" y="159">
          DIR
        </text>
        <g transform="translate(272 17)">
          <circle cx="28" cy="25" fill={`url(#${alert})`} r="24" stroke="#57101c" strokeWidth="5" />
          <text fill="#fff" fontFamily="Arial Black, sans-serif" fontSize="15" textAnchor="middle" x="28" y="30">
            99+
          </text>
        </g>
        <path d="m79 35 33 3-3 24-34-6Z" fill="#fffaf0" stroke="#6a737b" strokeWidth="3" />
        <path d="m82 40 13 10 14-8" fill="none" stroke="#d13b55" strokeLinejoin="round" strokeWidth="3" />
      </g>
    </svg>
  );
}

/** Compact square alternate for the Broken Copy Machine geometry slot. */
export function CoffeeMachine({ className }: ShiftCharacterArtProps) {
  const body = safeId("coffee-body");
  const coffee = safeId("coffee-liquid");
  const metal = safeId("coffee-metal");

  return (
    <svg
      aria-label="The Overworked Coffee Machine dispensing one last dangerous cup"
      className={className}
      role="img"
      viewBox="0 0 300 250"
    >
      <defs>
        <linearGradient id={body} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3d5564" />
          <stop offset=".5" stopColor="#1b2d38" />
          <stop offset="1" stopColor="#0a141c" />
        </linearGradient>
        <linearGradient id={metal} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#edf4f5" />
          <stop offset=".45" stopColor="#9eafb8" />
          <stop offset="1" stopColor="#55636b" />
        </linearGradient>
        <linearGradient id={coffee} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e19642" />
          <stop offset=".45" stopColor="#873f21" />
          <stop offset="1" stopColor="#3c180f" />
        </linearGradient>
        <filter id={`${body}-shadow`} x="-35%" y="-40%" width="180%" height="215%">
          <feDropShadow dx="0" dy="10" floodColor="#020812" floodOpacity=".66" stdDeviation="6" />
        </filter>
      </defs>

      <g className="coffee-machine-character" filter={`url(#${body}-shadow)`}>
        <path
          d="M52 39h196l17 36-10 157H45L35 75Z"
          fill={`url(#${body})`}
          stroke="#071017"
          strokeLinejoin="round"
          strokeWidth="8"
        />
        <path d="M65 16h169l15 31H50Z" fill={`url(#${metal})`} stroke="#26343d" strokeLinejoin="round" strokeWidth="7" />
        <path d="M84 26h88" stroke="#f6fbfc" strokeLinecap="round" strokeOpacity=".58" strokeWidth="5" />
        <path d="M63 72h174v59H63Z" fill="#07151d" stroke="#61727b" strokeWidth="6" />
        <rect fill="#152a35" height="34" rx="5" stroke="#798a91" strokeWidth="4" width="80" x="76" y="83" />
        <text fill="#ffcb4a" fontFamily="ui-monospace, SFMono-Regular, Consolas, monospace" fontSize="16" fontWeight="900" textAnchor="middle" x="116" y="105">
          BREWING
        </text>
        <circle className="coffee-machine-led" cx="208" cy="89" fill="#75e04c" r="8" stroke="#17331c" strokeWidth="3" />
        <circle cx="208" cy="113" fill="#ff4a50" r="8" stroke="#4b1418" strokeWidth="3" />
        <path d="M88 132h124v72H88Z" fill="#081218" stroke="#4f626c" strokeWidth="6" />
        <path d="M111 132v19M189 132v19" stroke={`url(#${metal})`} strokeLinecap="round" strokeWidth="12" />
        <path d="M145 146h10v36h-10Z" fill={`url(#${coffee})`} />

        <path
          d="M111 165h71v44q0 18-18 18h-36q-17 0-17-18Z"
          fill="#f3eee1"
          stroke="#34383b"
          strokeLinejoin="round"
          strokeWidth="6"
        />
        <path d="M181 177q28-1 28 18t-28 18" fill="none" stroke="#34383b" strokeWidth="7" />
        <path d="M120 180q27 9 53 0v18q-25 9-53 0Z" fill={`url(#${coffee})`} />
        <path d="M126 207q18 8 35 0" fill="none" stroke="#a8522a" strokeLinecap="round" strokeWidth="4" />
        <path d="M90 218q61 18 129 2" fill="none" stroke="#6e351f" strokeLinecap="round" strokeOpacity=".82" strokeWidth="7" />

        <path d="M75 145q-22 5-28 23l8 12 31-10Z" fill={`url(#${metal})`} stroke="#26343d" strokeWidth="6" />
        <path d="M225 145q22 5 28 23l-8 12-31-10Z" fill={`url(#${metal})`} stroke="#26343d" strokeWidth="6" />
        <path d="m50 164-20 4 1 14 23 4 9-12Z" fill="#d3dde1" stroke="#26343d" strokeWidth="5" />
        <path d="m250 164 20 4-1 14-23 4-9-12Z" fill="#d3dde1" stroke="#26343d" strokeWidth="5" />

        <path d="M114 59q12-8 25 0M164 59q13-8 25 0" fill="none" stroke="#071017" strokeLinecap="round" strokeWidth="6" />
        <circle cx="128" cy="72" fill="#fff6da" r="8" />
        <circle cx="176" cy="72" fill="#fff6da" r="8" />
        <circle cx="130" cy="73" fill="#111820" r="4" />
        <circle cx="174" cy="73" fill="#111820" r="4" />

        <path d="M121 153q-13-13-3-28M149 151q-13-16-2-31M176 153q-11-13 0-28" fill="none" stroke="#edf7f5" strokeLinecap="round" strokeOpacity=".72" strokeWidth="5" />
        <path d="m208 28 47-11 10 41-45 9Z" fill="#fff1a8" stroke="#6f5420" strokeLinejoin="round" strokeWidth="4" />
        <text fill="#3e301b" fontFamily="Arial Black, sans-serif" fontSize="11" textAnchor="middle" transform="rotate(-13 236 44)" x="236" y="41">
          DECAF?
        </text>
        <text fill="#b3242f" fontFamily="Arial Black, sans-serif" fontSize="13" textAnchor="middle" transform="rotate(-13 236 44)" x="236" y="55">
          NEVER.
        </text>
      </g>
    </svg>
  );
}
