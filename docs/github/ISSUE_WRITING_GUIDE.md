# Issue Writing Guide

Every issue should explain **What**, **Why**, **How**, and **Definition of Done**. This keeps work clear for designers, engineers, producers, and AI coding agents.

## Good issue format

```markdown
## What
State the specific work to complete.

## Why
Explain why the work matters to Motocross: Chasing the Dream.

## How
Describe the recommended approach, constraints, references, and links.

## Definition of Done
List the exact evidence that proves the issue is complete.
```


## Required epic cleanup standard

Use `docs/github/ISSUE_ORGANIZATION_STANDARD.md` when performing a full issue cleanup pass. It defines the current epic system, label set, normal issue format, epic issue format, and topic-specific rules for Season Event Planner, Road to Loretta’s, nonlinear career progression, marketplace, dealer websites, and Phone / Internet UI issues.

## Writing for AI coding agents

- Link the relevant epic, design spec, and source files.
- State whether the task is research, design, implementation, bug fixing, or documentation.
- Keep implementation issues small enough to complete in one focused change.
- Include acceptance criteria and testing instructions.
- Do not ask agents to invent major game design unless the issue is explicitly a design task.
- Include constraints such as “documentation only” when relevant.

## Keeping issues small

Split broad requests into separate research, design, implementation, bug, or polish issues. A focused issue should usually change one system, one document, one UI flow, or one behavior.

## Linking issues to epics

- Put the epic name or issue number in the issue’s related-epic field when available.
- Add child issues to the epic body as a task list.
- Apply consistent `area:*`, `type:*`, `priority:*`, and `status:*` labels.
- Use milestones for delivery windows, not necessarily complete epic scope.

## Closing issues

Close issues only when the Definition of Done is met. If direction changes, update the Definition of Done or close the issue as intentionally out of scope with a clear comment.
