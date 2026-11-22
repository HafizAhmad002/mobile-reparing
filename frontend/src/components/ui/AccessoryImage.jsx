// Picture for an accessory. If the item has a real photo (`image` in data/accessories.js) it is shown,
// otherwise a drawn illustration of the item is used. All illustrations are generic: no brands or logos.

const STROKE = '#C9CED8'
const DARK = '#2A2F3C'

// Shared soft shadow under every item
const Shadow = () => <ellipse cx="120" cy="168" rx="58" ry="6" fill="#0E0F13" opacity="0.08" />

// A phone camera bump (used on cases)
const Camera = ({ x, y, size = 34 }) => (
  <g>
    <rect x={x} y={y} width={size} height={size} rx="10" fill="#0E0F13" />
    <circle cx={x + size * 0.32} cy={y + size * 0.32} r={size * 0.17} fill="#3F4452" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx={x + size * 0.68} cy={y + size * 0.32} r={size * 0.17} fill="#3F4452" stroke="#6B7280" strokeWidth="1.5" />
    <circle cx={x + size * 0.5} cy={y + size * 0.72} r={size * 0.17} fill="#3F4452" stroke="#6B7280" strokeWidth="1.5" />
  </g>
)

// A long cable coiling across the picture; `tip` is the connector drawn at the end
const Cable = ({ tip }) => (
  <g>
    <path d="M44 138 C 44 70, 112 70, 112 108 S 176 140, 190 78" fill="none" stroke={DARK} strokeWidth="6" strokeLinecap="round" />
    {/* USB-A plug at the start */}
    <rect x="32" y="130" width="24" height="16" rx="4" fill="#444B5A" />
    <rect x="30" y="144" width="28" height="22" rx="2" fill={STROKE} />
    <rect x="35" y="150" width="18" height="6" fill="#1E4FD8" />
    {tip}
  </g>
)

const ART = {
  glass: () => (
    <g>
      <defs>
        <linearGradient id="gl-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6D8BFF" /><stop offset="1" stopColor="#B26DFF" /></linearGradient>
      </defs>
      <rect x="82" y="14" width="76" height="152" rx="14" fill="#1B1F2A" />
      <rect x="87" y="21" width="66" height="138" rx="9" fill="url(#gl-s)" />
      <rect x="108" y="25" width="24" height="5" rx="2.5" fill="#0E0F13" />
      <g transform="rotate(-9 120 90) translate(18 -4)">
        <rect x="82" y="14" width="76" height="152" rx="14" fill="#fff" opacity="0.28" stroke="#fff" strokeWidth="2.5" />
        <polygon points="96,24 120,24 92,150 80,150" fill="#fff" opacity="0.35" />
      </g>
    </g>
  ),
  'case-clear': () => (
    <g>
      <defs>
        <linearGradient id="cc-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C9BFF" /><stop offset="1" stopColor="#C58BFF" /></linearGradient>
      </defs>
      <rect x="80" y="12" width="80" height="156" rx="18" fill="url(#cc-b)" />
      <Camera x={88} y={20} />
      <rect x="75" y="8" width="90" height="164" rx="23" fill="#fff" opacity="0.3" stroke="#fff" strokeWidth="3.5" />
      <rect x="82" y="15" width="76" height="150" rx="17" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8" />
      <path d="M92 150 L146 30" stroke="#fff" strokeWidth="6" opacity="0.25" strokeLinecap="round" />
    </g>
  ),
  'case-rugged': () => (
    <g>
      <rect x="74" y="8" width="92" height="164" rx="22" fill={DARK} />
      <rect x="84" y="18" width="72" height="144" rx="14" fill="#3A4152" />
      {[[84, 18], [156, 18], [84, 162], [156, 162]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="13" fill="#1E4FD8" />)}
      <rect x="74" y="8" width="92" height="164" rx="22" fill="none" stroke={DARK} strokeWidth="6" />
      <Camera x={90} y={26} />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="98" y={112 + i * 8} width="44" height="3" rx="1.5" fill="#566074" />)}
    </g>
  ),
  'case-wallet': () => (
    <g>
      <rect x="86" y="14" width="58" height="34" rx="5" fill="#fff" stroke={STROKE} strokeWidth="2" />
      <rect x="90" y="22" width="22" height="5" rx="2" fill={STROKE} />
      <rect x="62" y="30" width="116" height="132" rx="14" fill="#8A5A3C" />
      <rect x="70" y="38" width="100" height="116" rx="9" fill="none" stroke="#E8D2B8" strokeWidth="2" strokeDasharray="5 4" />
      <path d="M130 30 H164 a14 14 0 0 1 14 14 V148 a14 14 0 0 1 -14 14 H130 Z" fill="#7A4D31" />
      <rect x="152" y="84" width="38" height="24" rx="5" fill="#6A412A" />
      <circle cx="170" cy="96" r="4" fill="#E8D2B8" />
    </g>
  ),
  'cable-usbc': () => (
    <Cable tip={
      <g>
        <rect x="178" y="56" width="26" height="26" rx="7" fill="#C9CED8" />
        <rect x="182" y="36" width="18" height="24" rx="9" fill="#9AA1AF" />
        <rect x="186" y="42" width="10" height="12" rx="5" fill="#3F4452" />
      </g>
    } />
  ),
  'cable-lightning': () => (
    <Cable tip={
      <g>
        <rect x="178" y="58" width="26" height="24" rx="7" fill="#C9CED8" />
        <rect x="183" y="30" width="16" height="30" rx="3" fill="#E5E8EE" stroke="#9AA1AF" strokeWidth="1.5" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={185 + i * 3.4} y="34" width="2" height="10" fill="#D4A94B" />)}
      </g>
    } />
  ),
  'charger-wall': () => (
    <g>
      <rect x="114" y="22" width="12" height="42" rx="3" fill="#A9B0BD" />
      <rect x="90" y="40" width="12" height="24" rx="3" fill="#A9B0BD" />
      <rect x="138" y="40" width="12" height="24" rx="3" fill="#A9B0BD" />
      <rect x="82" y="60" width="76" height="100" rx="14" fill="#F4F6F9" stroke="#D5D8E0" strokeWidth="3" />
      <rect x="106" y="98" width="28" height="12" rx="2" fill={DARK} />
      <rect x="110" y="102" width="20" height="4" fill="#1E4FD8" />
      <circle cx="120" cy="130" r="4" fill="#12B76A" />
    </g>
  ),
  'charger-car': () => (
    <g>
      <rect x="98" y="22" width="44" height="30" rx="6" fill="#A9B0BD" />
      <rect x="104" y="14" width="32" height="12" rx="3" fill="#C9CED8" />
      <rect x="90" y="48" width="60" height="100" rx="12" fill={DARK} />
      <rect x="102" y="64" width="36" height="12" rx="2" fill="#0E0F13" /><rect x="106" y="68" width="28" height="4" fill="#1E4FD8" />
      <rect x="102" y="86" width="36" height="12" rx="2" fill="#0E0F13" /><rect x="106" y="90" width="28" height="4" fill="#1E4FD8" />
      <circle cx="120" cy="122" r="6" fill="none" stroke="#1E4FD8" strokeWidth="3" />
      <rect x="90" y="140" width="60" height="8" rx="4" fill="#3F4452" />
    </g>
  ),
  powerbank: () => (
    <g>
      <defs>
        <linearGradient id="pb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3F4452" /><stop offset="1" stopColor="#1B1F2A" /></linearGradient>
      </defs>
      <rect x="54" y="46" width="132" height="88" rx="18" fill="url(#pb-g)" />
      {[80, 96, 112, 128].map((x, i) => <circle key={x} cx={x} cy="72" r="5" fill={i < 3 ? '#12B76A' : '#566074'} />)}
      <rect x="146" y="62" width="26" height="11" rx="3" fill="#0E0F13" />
      <rect x="146" y="80" width="26" height="11" rx="3" fill="#0E0F13" />
      <rect x="150" y="66" width="18" height="3" fill="#1E4FD8" />
      <rect x="66" y="108" width="40" height="5" rx="2.5" fill="#566074" />
      <path d="M172 114 C 200 114, 196 150, 168 154" fill="none" stroke={DARK} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  earphones: () => (
    <g>
      <path d="M84 66 C 84 98, 120 88, 120 116" fill="none" stroke={DARK} strokeWidth="4" strokeLinecap="round" />
      <path d="M156 66 C 156 98, 120 88, 120 116" fill="none" stroke={DARK} strokeWidth="4" strokeLinecap="round" />
      <path d="M120 116 V146" stroke={DARK} strokeWidth="4" strokeLinecap="round" />
      <rect x="114" y="122" width="12" height="18" rx="4" fill="#566074" />
      <rect x="116" y="146" width="8" height="22" rx="2" fill={STROKE} />
      {[84, 156].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="50" r="16" fill="#F4F6F9" stroke={STROKE} strokeWidth="3" />
          <circle cx={cx} cy="50" r="7" fill="#D5D8E0" />
        </g>
      ))}
    </g>
  ),
  holder: () => (
    <g>
      <g transform="rotate(-12 120 100)">
        <rect x="84" y="18" width="62" height="116" rx="10" fill="#1B1F2A" />
        <rect x="88" y="23" width="54" height="106" rx="7" fill="#6D8BFF" />
        <rect x="104" y="26" width="22" height="4" rx="2" fill="#0E0F13" />
      </g>
      <path d="M156 140 L174 96" stroke="#9AA1AF" strokeWidth="9" strokeLinecap="round" />
      <rect x="68" y="146" width="104" height="14" rx="7" fill="#9AA1AF" />
      <rect x="82" y="132" width="62" height="10" rx="5" fill="#C9CED8" />
    </g>
  ),
  cleaning: () => (
    <g>
      <rect x="132" y="102" width="68" height="58" rx="8" fill="#6FD3C2" />
      <rect x="138" y="94" width="62" height="14" rx="6" fill="#8FE0D2" />
      <path d="M140 124 H196 M140 138 H196" stroke="#4FB9A8" strokeWidth="2" />
      <rect x="66" y="66" width="52" height="94" rx="12" fill="#DDEBFF" stroke="#9DB5FF" strokeWidth="2.5" />
      <rect x="69" y="104" width="46" height="53" rx="9" fill="#9DB5FF" opacity="0.6" />
      <rect x="82" y="48" width="24" height="20" fill={STROKE} />
      <rect x="72" y="30" width="46" height="20" rx="7" fill="#1E4FD8" />
      <rect x="114" y="34" width="18" height="9" rx="3" fill="#163BA6" />
      <path d="M150 52 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#9DB5FF" />
    </g>
  ),
}

export default function AccessoryImage({ item, className = '' }) {
  const Art = ART[item.id]
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-br from-tint to-white ${className}`}>
      {item.image ? (
        <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      ) : (
        <svg viewBox="0 0 240 180" role="img" aria-label={item.name} className="h-full w-full">
          <Shadow />
          {Art ? <Art /> : null}
        </svg>
      )}
    </div>
  )
}
