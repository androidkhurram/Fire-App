# Installation vs Inspection Flow — Gap Analysis

## Current Flows

### Installation (7 steps)
| Step | Name | Purpose |
|------|------|---------|
| 1 | Customer Information | Business details, contact person |
| 2 | System Information | Brand, models, cylinder details, fusible links, thermal detectors |
| 3 | Project Information | Project date, installation dates, technician name |
| 4 | Permit Status | Permit applied, status, dates, document upload |
| 5 | System Checks | 16-item Yes/No/N/A checklist |
| 6 | Inspection Setup | Inspection scheduled, date, result (pass/fail/needs_repair) |
| 7 | Comments | Free-text comments |

### Inspection (7 steps)
| Step | Name | Purpose |
|------|------|---------|
| 1 | Customer | Select or view customer |
| 2 | System Information | Pre-filled from last inspection; confirm/update |
| 3 | Inspection Work | Inspection tasks performed (nozzles, piping, fusible links, etc.) |
| 4 | Photos | Capture photos during inspection |
| 5 | System Checks | Same 16-item checklist |
| 6 | Inspection Result | Date, pass/fail/needs_repair |
| 7 | Comments | Free-text comments |

### Maintenance (7 steps)
| Step | Name | Purpose |
|------|------|---------|
| 1 | Customer | Select or view |
| 2 | System Information | Pre-filled from last inspection; confirm/update |
| 3 | Maintenance Work | Maintenance tasks (fusible links replaced, system recharged, etc.) |
| 4 | Photos | Capture photos during maintenance |
| 5 | System Checks | Same 16-item checklist |
| 6 | Inspection Result | Date, result |
| 7 | Comments | Free-text comments |

---

## Typical Industry Workflows (NFPA 96 / Best Practice)

### First-Time Installation
1. **Site survey / pre-installation** — Hood installed, equipment positioned, gas valve ready, electrical ready
2. **Permits** — Apply for permit before work
3. **Installation** — Piping, nozzles, control box, pull station, gas valve, fuse links
4. **Final acceptance test** — Fire marshal / AHJ tests system before restaurant opens
5. **Documentation** — As-built, certification tag, service tag
6. **Training** — Owner/staff trained on manual activation

### Semi-Annual Inspection
1. **Site visit** — Confirm location, system
2. **Visual inspection** — Check nozzles, piping, pressure gauge
3. **Component checks** — Fusible links, thermal detectors, gas valve, pull station
4. **Pass/fail** — Record result
5. **Service tag** — Update tag with date
6. **Photos** — Document condition (optional but common)
7. **Customer sign-off** — Optional acknowledgment

---

## Identified Gaps

### Installation Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| **Pre-installation / Site Survey** | No step for site readiness (hood installed, equipment on site, etc.) before work. | Medium |
| **Final Acceptance Test** | NFPA requires fire marshal acceptance test. "Inspection Setup" captures result but not specifically "acceptance test" or "passed by AHJ". | Low |
| **Training** | No step for owner/staff training on manual pull station. | Low |
| **As-built / Documentation** | No step for as-built drawings or installation certification docs. | Low |
| **Report for installation** | Design doc says installation does not generate report. Some companies want an installation completion report. | Low |

### Inspection Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| ~~**Link to existing system**~~ | ~~When inspecting existing customer, system info is blank.~~ **Implemented:** System info pre-loads from last inspection/installation. | Done |
| ~~**Photos in flow**~~ | ~~Photos are added from Report Preview after completion.~~ **Implemented:** Photos step added to inspection/maintenance wizard. | Done |
| **Inspection-specific checklist** | Same 16 checks apply to both installation and inspection. Some items are installation-only (e.g. "System installed per MFG"); some are inspection-only (e.g. "Cylinder hydrostatic test due"). | Medium |
| **Customer sign-off** | No customer acknowledgment/signature on inspection report. | Low |
| ~~**Next service date**~~ | ~~No field to set "next inspection due" date.~~ **Implemented:** Auto 6 months after installation/inspection; shown on report/invoice; admin filter (due next week/month/3 months/custom). | Done |

### Maintenance Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| **Parts replaced** | No field to record what was replaced (e.g. fusible links, cartridge). | Medium |
| **Recharge details** | If system was recharged, no fields for agent type, quantity, etc. | Low |

### Cross-Cutting Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| **Multiple systems per customer** | No way to select which system/location when a customer has multiple. | Medium |
| **Offline** | No offline support; requires connectivity. | Low |

---

## Recommendations (Summary)

### Priority 1 (High)

1. **Pre-load system for inspection** — When starting inspection from Existing Customer, auto-load system info from the customer's last inspection or installation.
2. **Photos in wizard** — Add photos step (or integrate into Report Preview) so technicians can capture during the flow, not only after.

### Priority 2 (Medium)

3. **Site survey step (installation)** — Optional pre-installation checklist for site readiness.
4. **Next service date** — Add field for "next inspection due" date for scheduling/reminders.
5. **Multiple systems** — Allow selecting which system when customer has multiple locations.
6. **Inspection vs installation checklist** — Separate or filter checklist items by service type.

### Priority 3 (Low)

7. **Training** — Add training step or checkbox for installation.
8. **Customer sign-off** — Optional signature on report.
9. **Installation report** — Option to generate installation completion report.

### Already Implemented

- Customer, Project, Permit, Work Progress (inspection & maintenance only), System Checks, Comments
- Pre-load system info for inspection/maintenance (from last inspection/installation)
- Photos step in inspection/maintenance flow
- Next service date: auto 6 months; report/invoice display; admin Inspections Due filter
- System Information with brands, models, sub-values
- Report generation for inspection and maintenance
