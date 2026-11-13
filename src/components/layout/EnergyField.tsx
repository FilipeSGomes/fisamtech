/** Edge circuits in the same right-angle language as the FISAM mark. They stay off the type. */
export function EnergyField() {
  return (
    <>
      <svg
        className="energy-field energy-field--edge energy-field--left"
        viewBox="0 0 72 820"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="none"
          stroke="#dabb76"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="energy-trace energy-trace--a" d="M18 36 H54 V120 H28 V220" />
          <path className="energy-trace energy-trace--c" d="M16 760 H52 V640 H24 V520" />
          <circle className="energy-node" cx="54" cy="120" r="3" />
          <circle className="energy-node energy-node--pulse" cx="28" cy="220" r="3.5" />
          <circle className="energy-node" cx="52" cy="640" r="3" />
        </g>
      </svg>
      <svg
        className="energy-field energy-field--edge energy-field--right"
        viewBox="0 0 72 820"
        preserveAspectRatio="xMaxYMin meet"
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="none"
          stroke="#dabb76"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="energy-trace energy-trace--b" d="M54 28 V150 H22 V78" />
          <path className="energy-trace energy-trace--d" d="M56 780 H20 V620 H48 V500" />
          <circle className="energy-node" cx="22" cy="150" r="3" />
          <circle className="energy-node energy-node--pulse" cx="22" cy="78" r="3.5" />
          <circle className="energy-node" cx="20" cy="620" r="3" />
        </g>
      </svg>
    </>
  );
}
