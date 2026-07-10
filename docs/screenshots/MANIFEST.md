# Screenshot Manifest

These files are wired into the README public beta gallery. v24.5 includes placeholder cards; replace them with real captures before the public beta tag.

| File | README position | Caption source | Manual release review |
| --- | --- | --- | --- |
| `01-run-model.png` | 1 | `docs/screenshots/CAPTIONS.md` | Confirm Daily mode and selected/run controls are visible. |
| `02-models.png` | 2 | `docs/screenshots/CAPTIONS.md` | Confirm model rows do not show private local paths. |
| `03-endpoint-success.png` | 3 | `docs/screenshots/CAPTIONS.md` | Confirm endpoint is local/demo-safe and no tokens appear. |
| `04-remote.png` | 4 | `docs/screenshots/CAPTIONS.md` | Confirm remote hostnames are demo-safe or empty. |
| `05-setup-check.png` | 5 | `docs/screenshots/CAPTIONS.md` | Confirm setup details do not reveal usernames or private paths. |

Run:

```bash
./scripts/check-screenshots.sh
```

The script checks for required PNG files. Humans must still review content safety before publication.
