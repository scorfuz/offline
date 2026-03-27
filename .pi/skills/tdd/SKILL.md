---
name: tdd
description: Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
---

# Test-Driven Development

## Philosophy

**Core principle**: Tests should prefer verifying behavior through stable public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Modes

### Standard Mode (features, new code)

Use the full workflow below. Appropriate when designing new interfaces or building non-trivial features.

### Lightweight Mode (bug fixes, small changes)

Skip planning when invoked for a bug fix with a known diagnosis, a single-behavior change, or when the calling workflow already defined what to build. Go straight to the RED/GREEN loop.

## Workflow

### 0. Preflight

Identify and record three commands before writing any tests:

- **single-test**: run one test in isolation
- **module-scope**: run the suite covering the file under change
- **standard verification**: the repo-wide or area-specific check (lint, type-check, full test suite)

Run `module-scope` and `standard verification` before writing any tests. Run `single-test` as soon as the first test exists. If any baseline fails for reasons unrelated to this task, stop and surface that blocker before proceeding.

### 1. Planning (standard mode only)

Before writing any code:

- [ ] Identify the first behavior to test (your tracer bullet)
- [ ] Identify the minimal public entrypoint needed to test it — infer from codebase and task context

Ask the user only when there's material ambiguity — don't block on confirmation for routine work. If the calling workflow (maintenance, new-project) already specified what to build, use that as the plan.

**You can't test everything.** Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

One behavior, one test, one implementation:

```
RED:   Write test for first behavior
       → Run the test. Observe it FAILS for the expected reason.
       → GATE: If the test passes: verify the test can fail for the intended reason —
         tighten the assertion or choose a different unmet behavior. Only invoke
         `systematic-debugging` if you cannot produce a valid failing reproducer after
         correcting the test.
         If the test fails for an unrelated reason, or the baseline suite was already
         failing: if the issue is environmental or unrelated to this task, stop and
         report a blocker. Otherwise, invoke `systematic-debugging` with: command run,
         expected result, actual result, and baseline status. Do not change
         implementation until a diagnosis exists. Resume TDD only once the reproducer
         fails for the expected reason and the baseline is stable.
GREEN: Write minimal code to make the test pass
       → Run the test. Observe it PASSES.
       → Run the new test, then the smallest stable suite covering the changed module,
         then the project's standard verification for that area.
```

This is your tracer bullet — proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test
       → Run it. Confirm it FAILS for the expected reason.
       → GATE: If the test passes: verify the test can fail for the intended reason —
         tighten the assertion or choose a different unmet behavior. Only invoke
         `systematic-debugging` if you cannot produce a valid failing reproducer after
         correcting the test.
         If it fails for an unrelated reason, or the baseline is red: if the issue is
         environmental or unrelated to this task, stop and report a blocker. Otherwise,
         invoke `systematic-debugging` with: command run, expected result, actual result,
         and baseline status. Do not change implementation until a diagnosis exists.
         Resume TDD only once the reproducer fails for the expected reason and the
         baseline is stable.
GREEN: Write minimal code to pass
       → Run it. Confirm it PASSES.
       → Run the new test, then the smallest stable suite covering the changed module,
         then the project's standard verification for that area.
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior
- **Actually run the tests** — don't assume pass/fail

### 4. Refactor

After all tests pass, look for [refactor candidates](refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Design interfaces for [testability](interface-design.md) where beneficial
- [ ] Identify opportunities for [deep modules](deep-modules.md)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

Done when `single-test`, `module-scope`, and `standard verification` all pass after the final refactor.

## Legacy Code & Bug Fixes

When working with code that's hostile to testing:

### Bug fixes

1. **Reproduce first** — write a test that demonstrates the bug (RED)
2. **Diagnose** — if the failure mechanism is still unclear after reproduction, invoke `systematic-debugging`; resume TDD only once the reproducer fails for the expected reason and the baseline is stable
3. **Fix minimally** — smallest change that makes the test pass (GREEN)
4. **Verify** — run the new test, then the smallest stable suite covering the changed module, then the project's standard verification for that area

### Characterization tests

When behavior is unclear and there's no spec, write tests that capture what the code _currently does_, not what you think it _should_ do. These protect against unintended changes during refactoring.

For bug fixes, characterization tests are for understanding and safety only — they do not replace the failing test for intended behavior. Before implementing the fix, add or convert to a test that expresses the desired post-fix behavior.

### Creating seams

When existing code is hard to test (hardcoded dependencies, global state, deep coupling):

1. Identify the narrowest point where you can inject a test boundary
2. Extract the dependency behind a parameter or interface
3. Keep the refactor minimal — just enough to make the code testable
4. Write your tests against the new seam, then make your change

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses a public interface, or a minimal seam when public-interface testing is not yet practical
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
```
