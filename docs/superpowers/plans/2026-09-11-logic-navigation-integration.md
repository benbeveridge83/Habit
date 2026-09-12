# Logic Navigation Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class `Logic` destination to the Habit app's navigation architecture and load the approved Square of Opposition and Reasoning Errors study experience inside the existing app shell.

**Architecture:** Follow the repo's existing enhancement pattern instead of editing the 274 KB base app directly. Add `logic-study.css` and `logic-study.js`, then inject both from `index.html` alongside the other enhancement files. The JavaScript will append a `Logic` button to both navigation surfaces, create `#tab-logic`, and integrate with the existing `data-tab` navigation behavior without introducing localStorage, Supabase, or remote dependencies.

**Tech Stack:** HTML, CSS, vanilla JavaScript, GitHub Pages static hosting.

**Spec:** `docs/superpowers/specs/2026-09-11-logic-study-tab-design.md`

## Global Constraints

- Add one top-level navigation destination named `Logic`.
- The Logic page contains two internal modes: `Square of Opposition` and `Reasoning Errors`.
- Square drills support category selection, symbolic questions, actual-sentence questions, mixed drills, immediate grading, explanations, score, streak, and missed-question review.
- Reasoning-error drills include Modus Ponens, Modus Tollens, Affirming the Consequent, Denying the Antecedent, Undistributed Middle, Illicit Major, Illicit Minor, and Four-Term Fallacy.
- Version 1 stores session state in memory only; do not add localStorage, Supabase tables, or external APIs.
- Preserve the current mobile navigation layout and existing tabs.

---

### Task 1: Add Logic study assets

**Files:**
- Create: `logic-study.css`
- Create: `logic-study.js`
- Test: `logic-study.test.js`

**Interfaces:**
- Consumes: existing DOM navigation buttons using `.globalNavBtn[data-tab]`, current content container containing `#tab-habits` through `#tab-settings`, and existing CSS variables such as `--line`, `--text`, `--muted`, `--accent`, `--soft`.
- Produces: `window.HabitLogicStudy` with `init()`, `showLogic()`, and pure helpers `relationshipBetween()`, `truthInference()`, and `classifyConditionalForm()`; DOM section `#tab-logic`; navigation buttons with `data-tab="logic"`.

- [ ] **Step 1: Write the failing pure-logic tests**

Create `logic-study.test.js` using Node's built-in `assert` module. Test that:

```js
assert.equal(relationshipBetween('A','O'), 'Contradictories');
assert.equal(relationshipBetween('A','E'), 'Contraries');
assert.equal(relationshipBetween('I','O'), 'Subcontraries');
assert.equal(relationshipBetween('A','I'), 'Subalternation');
assert.equal(truthInference('A','True','O'), 'False');
assert.equal(truthInference('A','False','O'), 'True');
assert.equal(truthInference('A','True','I'), 'True');
assert.equal(truthInference('A','False','I'), 'Undetermined');
assert.equal(classifyConditionalForm('P','Q','P','Q'), 'Modus Ponens');
assert.equal(classifyConditionalForm('P','Q','Q','P'), 'Affirming the Consequent');
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node logic-study.test.js
```

Expected: FAIL because `logic-study.js` and its exported helpers do not yet exist.

- [ ] **Step 3: Implement the Logic study module**

Create `logic-study.js` as a self-contained IIFE. It must:

```js
window.HabitLogicStudy = {
  init,
  showLogic,
  relationshipBetween,
  truthInference,
  classifyConditionalForm
};
```

The module must:

1. Insert a `Logic` button after `Great Books` in every navigation surface that contains `.globalNavBtn[data-tab="greatbooks"]`.
2. Insert a `Logic` tab in any compact `.tab[data-tab]` tab strip after Great Books when present.
3. Create `#tab-logic` next to the other `tab-*` content sections.
4. Render internal buttons for `Square of Opposition` and `Reasoning Errors`.
5. Implement the approved category selectors and question generators.
6. Keep all score, streak, answer, and missed-question state in JavaScript memory only.
7. On a Logic navigation click, hide every existing `[id^="tab-"]` section and show `#tab-logic`.
8. On any non-Logic `.globalNavBtn[data-tab]` or `.tab[data-tab]` click, hide `#tab-logic` so the existing navigation can resume normally.
9. Close `#globalMenuPanel` after selecting Logic when that menu is open.
10. Make `init()` idempotent so duplicate script execution does not duplicate buttons or the Logic section.

- [ ] **Step 4: Add responsive styling**

Create `logic-study.css` with all selectors scoped under `#tab-logic`. Use the app's existing CSS variables and patterns. Requirements:

```css
#tab-logic .logicLayout { display:grid; grid-template-columns:minmax(250px,330px) minmax(0,1fr) minmax(240px,300px); gap:14px; }
@media (max-width:1050px){ #tab-logic .logicLayout{grid-template-columns:1fr;} }
#tab-logic .logicChoiceGrid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:620px){ #tab-logic .logicChoiceGrid{grid-template-columns:1fr;} }
```

Buttons must remain at least 44px high on mobile. Do not create page-level horizontal scrolling.

- [ ] **Step 5: Run pure-logic tests**

Run:

```bash
node logic-study.test.js
```

Expected: PASS.

- [ ] **Step 6: Run JavaScript syntax validation**

Run:

```bash
node --check logic-study.js
```

Expected: no output and exit code 0.

- [ ] **Step 7: Commit the study assets**

```bash
git add logic-study.js logic-study.css logic-study.test.js
git commit -m "feat: add Logic study module"
```

---

### Task 2: Load the Logic module from the Habit app entrypoint

**Files:**
- Modify: `index.html`
- Test: `logic-study.test.js`

**Interfaces:**
- Consumes: `logic-study.css`, `logic-study.js` created in Task 1.
- Produces: deployed GitHub Pages app that loads the Logic module after `app-v22-base.html` and existing enhancement scripts.

- [ ] **Step 1: Write a failing entrypoint assertion**

Extend `logic-study.test.js` to read `index.html` and assert:

```js
assert(indexHtml.includes('logic-study.css'));
assert(indexHtml.includes('logic-study.js'));
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
node logic-study.test.js
```

Expected: FAIL because `index.html` does not yet load the new assets.

- [ ] **Step 3: Inject the stylesheet and script**

Update the existing `html.replace('</head>', ...)` string in `index.html` to append:

```html
<link rel="stylesheet" href="./logic-study.css?v=20260911-logic1">
```

Update the existing `html.replace('</body>', ...)` string to append:

```html
<script src="./logic-study.js?v=20260911-logic1"><\/script>
```

Place the Logic script after the existing enhancement scripts so it can discover the fully rendered base navigation and content DOM.

- [ ] **Step 4: Run tests**

Run:

```bash
node logic-study.test.js
node --check logic-study.js
```

Expected: PASS.

- [ ] **Step 5: Commit the entrypoint integration**

```bash
git add index.html logic-study.test.js
git commit -m "feat: wire Logic into Habit navigation"
```

---

### Task 3: Verify mobile and navigation behavior

**Files:**
- Verify: `index.html`
- Verify: `logic-study.js`
- Verify: `logic-study.css`

**Interfaces:**
- Consumes: deployed GitHub Pages build.
- Produces: confirmed first-class Logic navigation item and usable mobile study page.

- [ ] **Step 1: Verify static integration markers**

Run:

```bash
node logic-study.test.js
node --check logic-study.js
```

Expected: all tests pass and syntax check exits 0.

- [ ] **Step 2: Browser smoke test on desktop width**

Open the GitHub Pages app and confirm:

1. `Logic` appears in the navigation drawer and sidebar after `Great Books`.
2. Clicking `Logic` closes the drawer and displays the Logic study page.
3. Clicking `Habits`, `Meds`, `Great Books`, or `Settings` hides Logic and opens the chosen existing section.
4. Square of Opposition questions can be answered and graded.
5. Reasoning Errors questions can be answered and graded.
6. `Review Missed` produces a stored missed question after at least one incorrect response.

- [ ] **Step 3: Browser smoke test at phone width**

At approximately 390px CSS width, confirm:

1. The navigation drawer still has two columns and includes `Logic` without clipping.
2. Logic controls reflow to one column.
3. Question text, answers, score cards, and the square diagram remain inside the viewport.
4. All primary buttons are finger-tappable without horizontal page scrolling.

- [ ] **Step 4: Final commit if smoke testing required any fixes**

```bash
git add logic-study.js logic-study.css index.html logic-study.test.js
git commit -m "fix: polish Logic navigation on mobile"
```
