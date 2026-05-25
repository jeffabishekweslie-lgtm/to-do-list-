# PROJECT BLUEPRINT: MISSION LOG (TO-DO VARIANT)

## OVERVIEW

A stylized, high-stakes objective tracker ("Mission Log") that handles Creating, Reading, and Redacting tasks. Built using a strict feature-branch Git workflow to simulate a professional development environment.

## SYSTEM DESIGN

* **Tasks** are referred to as **Objectives**.
* **Completed tasks** are referred to as **Secured**.
* **Deleted tasks** are referred to as **Redacted** or **Aborted**.
* **Visual Aesthetic:** Dark theme with high-contrast text (terminal style, neon green/amber).

---

## TECHNOLOGY STACK

* **HTML5** — Structure
* **CSS3** — Dark cinematic styling with animations
* **Vanilla JavaScript** — Logic and DOM manipulation

---

## GIT WORKFLOW MILESTONES

### MILESTONE 1: ESTABLISHING SYSTEM BLUEPRINT
* Initialize local Git repository and create documentation core.
* Deliverable: `README.md` with project layout.

### MILESTONE 2: THE INTERFACE SHELL
* Branch: `feature/ui-layout`
* Build visual skeleton with dark, cinematic aesthetic.

### MILESTONE 3: OBJECTIVE INITIALIZATION
* Branch: `feature/create-task`
* Input + display logic for objectives (status: ACTIVE).

### MILESTONE 4: CODE REDACTION
* Branch: `feature/delete-task`
* Redact (delete) button for each objective.

---

## SYSTEM EXPANSION (OPTIONAL POST-MVP)

* **Collateral Counter:** Track objectives redacted vs. secured.
* **Threat Matrix:** Categorize objectives into Green (Low), Amber (Medium), Red (Critical) threat levels.
