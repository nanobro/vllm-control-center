# v23.4 — Settings & Advanced Tools Simplification

## Goal

After simplifying Run Model, Models, and Remote, the remaining source of visual complexity was the sidebar and Settings page.

v23.4 keeps every advanced surface available, but removes the long list of operator pages from the default sidebar.

## UX changes

- Sidebar Advanced tools now shows only:
  - Setup Doctor
  - Beta Release Kit
  - Logs
  - More tools
- Added a new **More tools** hub that groups hidden advanced pages by intent:
  - Daily support
  - Model troubleshooting
  - Operator tools
- Simplified Settings into a local-controller connection page:
  - one API key card
  - one security status summary
  - advanced secret-storage details hidden behind a disclosure
- Updated sidebar badge to `v23.4 beta RC`.

## Product decision

The app should feel like LM Studio first, not like an admin console.

The daily path is now:

1. Run Model
2. Models
3. Remote
4. Settings only when needed

Advanced tools are still one click away, but they no longer compete with the primary workflow.

## QA checklist

- Sidebar no longer shows a long wall of advanced pages.
- More tools links to every previously visible advanced page.
- Settings page shows the API key task without making secret storage feel mandatory.
- Secret backend details remain visible under Advanced security details.
- Existing deep pages still render when reached from More tools.
