# Editing the site data

The website reads everything from this folder. No build step is needed: edit, commit, push.

## Add an audit

Add one line to the top of `audits.json`, and keep a comma at the end of the line:

```json
{"name": "Acme", "type": "AMM", "ecosystem": "EVM", "year": 2026, "source": "Private audits", "firm": "Hashlock", "findings": {"high": 2, "medium": 3}, "report": "Acme-Report.pdf"},
```

| Field       | Notes                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | Required.                                                                                                                                                                     |
| `source`    | Required. Audit type: `Private audits` or `Contests`.                                                                                                                          |
| `type`      | Optional. What the protocol is.                                                                                                                                               |
| `ecosystem` | Optional. Use `Solana / EVM` for more than one.                                                                                                                               |
| `year`      | Optional. Audits are listed newest year first.                                                                                                                                |
| `firm`      | Optional. The firm or contest platform.                                                                                                                                       |
| `rank`      | Optional. Contest placing, such as `"7"` or `"🥇"`.                                                                                                                           |
| `findings`  | Optional. Any of `critical`, `high`, `medium`, `low`, `informational`. Leave it out if the count is unknown.                                                                  |
| `report`    | Optional. A PDF file name from `audit-reports/pdf/` in the `namx05/audits` repo, exactly as in its README, or a full URL. **Leave it out and the report shows as 🔒 Locked.** |

## Other files

- `summary.json`: your stats, such as `privateAudits`. Change a number once here and it updates everywhere on the page, including Audit stats and About.
- `blogs.json`: the blog list.
- `icons.json`: which icon goes with each firm and ecosystem. Put new images in `../icons/firms/` or `../icons/ecosystems/`, then add a line here.

Interesting audits and the filters are worked out from `audits.json`. The stats in `summary.json` are updated by hand.

The summary and experience text is in `../index.html`.

## Test locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. If the audits don't load, there is probably a typo in the JSON, such as a missing comma.
