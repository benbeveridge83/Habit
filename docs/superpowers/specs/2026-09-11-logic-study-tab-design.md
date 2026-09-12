# Logic Study Tab Design

Date: 2026-09-11
Repository: benbeveridge83/Habit
Status: Approved design, pending implementation plan

## Goal

Add a new top-level **Logic** tab to the existing Habit app. The tab should help the user actively learn two related areas:

1. The traditional Square of Opposition and categorical proposition relationships.
2. Common formal reasoning patterns and fallacies such as affirming the consequent.

The feature should function as an interactive study and quiz tool, not merely as a reference page.

## User Experience

The Logic tab will use two sub-tabs:

- **Square of Opposition**
- **Reasoning Errors**

The feature should reuse the app's current visual language: cards, pills, buttons, tabs, and compact responsive layouts. It must work well on desktop and mobile.

The first version should be self-contained and deterministic. It should not depend on an AI API or external service to generate questions.

## Square of Opposition Section

### Study Categories

The user can independently enable or disable the following categories:

- A / E / I / O identification
- Contradictories
- Contraries
- Subcontraries
- Subalternation and superalternation
- Truth-value inference
- Translation of ordinary-language statements into A / E / I / O form
- Mixed drills

At least one category must remain selected before a study session can begin.

### Question Formats

The user can choose:

- Symbolic / abstract
- Real sentences
- Mixed

Symbolic examples should use generic terms such as A and B or S and P, for example:

- All A are B.
- No S are P.
- Some A are B.
- Some S are not P.

Real-sentence examples should use ordinary concrete subjects and predicates, for example:

- All surgeons are professionals.
- No reptiles are mammals.
- Some attorneys are mediators.
- Some birds are not predators.

Questions may ask in either direction. Examples:

- Identify the proposition type.
- Identify the contradictory proposition.
- Identify the relationship between two proposition forms.
- Given one proposition's truth value, determine what follows about another proposition.
- Translate a sentence into A / E / I / O form.

### Square Reference Visualization

The Square section should include a compact visual reference showing A, E, I, and O and their relationships:

- A-E: contraries
- I-O: subcontraries
- A-O: contradictories
- E-I: contradictories
- A-I: subalternation
- E-O: subalternation

When a user answers a relationship question, the relevant relationship should be highlighted or clearly identified in the explanation.

### Truth-Value Logic

The app should teach the traditional Aristotelian square rules used in the study material. Explanations should explicitly state the applicable rule rather than only displaying the correct answer.

Examples:

- If A is true, O is false because they are contradictories.
- If E is true, I is false because they are contradictories.
- If A is true, E is false because A and E are contraries.
- If I is false, E is true because I and E are contradictories.

Question generation should avoid ambiguous truth-value questions where the selected premise does not determine a unique answer unless the question explicitly allows an answer such as "cannot be determined."

## Reasoning Errors Section

### Initial Categories

The first version should include:

#### Valid forms

- Modus ponens
- Modus tollens

#### Invalid conditional forms

- Affirming the consequent
- Denying the antecedent

#### Categorical syllogism errors

- Undistributed middle
- Illicit major
- Illicit minor
- Four-term fallacy

The data model should make it easy to add more fallacies later without redesigning the UI.

### Question Types

Questions should vary among:

- **Valid or invalid?**
- **Identify the argument form or error.**
- **Choose which argument illustrates the named error.**
- **Complete or classify a symbolic pattern.**

The section should use both symbolic and ordinary-language arguments.

Examples:

Symbolic:

> If P, then Q. Q. Therefore P.

The answer is **affirming the consequent**.

Ordinary language:

> If a person is a federal judge, then that person is a lawyer. Maria is a lawyer. Therefore Maria is a federal judge.

The answer is **affirming the consequent**.

The explanation should identify the structure:

- If P then Q.
- Q.
- Therefore P.
- The conclusion improperly infers the antecedent from the consequent.

## Study Controls

Both sections should provide a consistent study interface with:

- Category selection
- Question-format selection where applicable
- New Question
- Check Answer
- Explain
- Review Missed

A question should not be replaced merely because the user checks an answer. The result and explanation should remain visible until the user chooses the next question.

## Scoring and Session State

Maintain local in-memory session statistics for the active page session:

- Correct answers
- Incorrect answers
- Percentage correct
- Current streak
- Missed-question queue

The first version does not require permanent historical mastery statistics or database persistence.

### Review Missed

Incorrectly answered questions should enter a missed-question queue. Review Missed mode should preferentially serve those questions again.

A missed question may be removed from the review queue after the user later answers it correctly.

## Question Generation Architecture

Use a data-driven approach rather than hard-coding every full question into the UI.

Recommended structure:

- A proposition-definition map for A / E / I / O.
- A relationship map for the Square of Opposition.
- Sentence banks containing subject and predicate pairs suitable for categorical propositions.
- A set of question-generator functions by category.
- A reasoning-pattern data set describing valid and invalid argument forms.
- Ordinary-language templates for each reasoning pattern.

Each generated question object should contain enough information to render and grade independently, for example:

- id
- section
- category
- format
- prompt
- answer choices
- correct answer
- explanation
- optional square relationship metadata

This keeps question generation isolated from rendering and scoring.

## Component Boundaries

### Logic Navigation

Responsible only for displaying the Logic tab and switching between the Square and Reasoning Errors sub-tabs.

### Square Study Controller

Responsible for:

- category selection
- format selection
- generating Square questions
- validating answers
- explanations
- review queue interaction

### Reasoning Errors Study Controller

Responsible for:

- category selection
- generating reasoning questions
- validating answers
- explanations
- review queue interaction

### Shared Session Scoring

Responsible for:

- correct count
- incorrect count
- percentage
- streak
- missed-question tracking

The two study sections may share the same scoring helper but should maintain separate question-generation logic.

## Data Persistence

Version 1 should not add Supabase tables or browser localStorage for Logic progress.

Rationale:

- The primary goal is to make the study experience useful and reliable first.
- The app has previously encountered browser storage quota problems, so this feature should not introduce another localStorage dependency.
- Permanent mastery tracking can be added later using Supabase if the user finds the study feature valuable.

## Error Handling and Edge Cases

- Prevent starting a study session with zero selected categories.
- If all categories are deselected, show a concise message asking the user to select at least one.
- Ensure answer choices do not contain duplicate labels.
- Avoid immediately repeating the same generated question where practical.
- Do not generate a truth-value question with no uniquely correct answer unless "cannot be determined" is intentionally one of the answers.
- Mobile layouts must not require page-level horizontal scrolling.
- All buttons and answer options must work by tap; no functionality should depend on hover.

## Testing Requirements

Before considering the feature complete, verify:

1. The Logic tab appears and existing tabs still work.
2. Both Logic sub-tabs switch correctly.
3. Every Square category can independently generate and grade questions.
4. Symbolic, real-sentence, and mixed modes work.
5. A/E/I/O grading is correct.
6. Contradictory, contrary, subcontrary, and subalternation relationships are correct.
7. Truth-value questions are logically determinate and correctly graded.
8. Modus ponens and modus tollens are never labeled fallacies.
9. Affirming the consequent and denying the antecedent are correctly distinguished.
10. The categorical fallacy questions correctly distinguish undistributed middle, illicit major, illicit minor, and four-term fallacy.
11. Correct/incorrect counts, percentage, and streak update properly.
12. Incorrect questions enter Review Missed and can later be cleared by a correct answer.
13. Checking an answer does not automatically replace the question.
14. The feature remains usable on a narrow phone-sized viewport.
15. No new localStorage dependency is introduced.
16. Existing Habit App functions remain intact after the change.

## Out of Scope for Version 1

- AI-generated questions
- External APIs
- Permanent mastery analytics
- Supabase schema changes
- Spaced-repetition scheduling across days
- User-created question banks
- Formal proof construction
- LSAT-specific question importing

These can be added later without changing the basic Logic tab architecture.

## Success Criteria

The feature is successful when the user can open the Habit app, enter the Logic tab, select exactly which logical relationships or errors to study, practice with both abstract and real-language questions, receive immediate explanatory feedback, and deliberately review missed concepts without leaving the page.
