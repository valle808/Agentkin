---
description: Autonomous Website Auditor and Self-Healer
---

This workflow defines the steps for the AgentKin Autonomous Agent to audit and repair the website.

### 1. Run Audit
// turbo
Execute the site auditor to identify issues:
`node scripts/site_auditor.js`

### 2. Analyze Report
Review the output for:
- Mismatched tags (requires manual intervention or specific regex fix)
- Misplaced JS code (likely needs encapsulation or move to script block)
- Broken links or missing assets

### 3. Self-Healing
For each issue found, apply the appropriate fix:
- **Redundant Script Tags**: Use `multi_replace_file_content` to remove duplicate closures.
- **Misplaced JS**: Wrap the code in `<script>` tags or move it to the unified core engine.
- **Mismatched Tags**: Locate the opening/closing pair and correct it.

### 4. Verification
After applying fixes, re-run the audit to ensure all issues are resolved.
`node scripts/site_auditor.js`
