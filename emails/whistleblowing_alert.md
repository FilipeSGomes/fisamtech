# Internal alert — whistleblowing report

**To:** contato@fisamtech.com  
**Template id:** `whistleblowing_alert`

## Subject

`[Canal de Denúncias] Novo protocolo {{protocol}}`

## Body vars

| Key | Description |
| --- | --- |
| `protocol` | Public protocol ID returned to the reporter |
| `category` | Report category |
| `relation` | Reporter relation to the company |
| `anonymous` | `true` / `false` |
| `approximate_date` | Optional approximate date of the fact |
| `locale` | Locale used when submitting |
| `description_excerpt` | Short excerpt of the description (no extra PII logging) |

Handle reports confidentially. Do not share reporter identity beyond the Compliance Officer / Sócio-Administrador unless legally required.
