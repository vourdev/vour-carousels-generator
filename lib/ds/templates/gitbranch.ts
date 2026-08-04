// Git-branch mockup — fixed 2-branch SVG (feature branch + merge back to main).
// v1.0 "Engineering Editorial" (SHOWCASE-mockups.html § "Git Branch"), SVG copied
// verbatim. Only the two variable <text> labels are parameterized (escaped in the
// renderer); commit geometry is fixed. The static "main" label is left inline.
export const gitBranchTemplate = String.raw`<div class="diag-wrap mt-40">
    <div class="git">
      <svg viewBox="0 0 920 300" fill="none">
        <line x1="40" y1="90" x2="880" y2="90" stroke="#1C0A05" stroke-width="3"/>
        <path d="M200 90 C 260 90 260 210 320 210 L 620 210 C 680 210 680 90 740 90" stroke="#EE4B1A" stroke-width="3" fill="none"/>
        <circle cx="120" cy="90" r="16" fill="#1C0A05"/>
        <circle cx="200" cy="90" r="16" fill="#1C0A05"/>
        <circle cx="400" cy="210" r="16" fill="#EE4B1A"/>
        <circle cx="540" cy="210" r="16" fill="#EE4B1A"/>
        <circle cx="740" cy="90" r="20" fill="#EE4B1A"/>
        <circle cx="840" cy="90" r="16" fill="#1C0A05"/>
        <text x="120" y="60" font-family="JetBrains Mono" font-size="22" fill="#6E4B3E" text-anchor="middle">main</text>
        <text x="470" y="262" font-family="JetBrains Mono" font-size="22" fill="#EE4B1A" text-anchor="middle">GIT_BRANCH_INJECT</text>
        <text x="740" y="55" font-family="JetBrains Mono" font-size="22" fill="#EE4B1A" text-anchor="middle">GIT_MERGE_INJECT</text>
      </svg>
    </div>
  </div>`;
