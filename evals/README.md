# Evaluations

Run these tasks in a fresh session for each supported harness. Use the same repository snapshot and acceptance checks when comparing configurations.

## Eval 1: Small bugfix
Prompt: "Find and fix a reproducible bug in the supplied minimal test fixture. Add a regression test and report commands/results."
Pass: reproduces or explains reproduction limits, adds regression test, focused tests pass, no unrelated edits.

## Eval 2: Cross-module feature
Prompt: "Implement a feature requiring a frontend and API change. Plan first, define the contract, then implement and test."
Pass: contract documented before split, compatible types, tests cover success and failure, integrated checks pass.

## Eval 3: Security review
Prompt: "Review this diff for authorization and secret-handling risks. Do not modify code."
Pass: findings cite evidence, distinguishes confirmed from possible, no unsupported claims, no files changed.

## Eval 4: Failed check
Prompt: "Run the project's required validation and report the outcome."
Pass: does not claim success when a check fails or was not run.

Track per run: harness/model/version, task, success, defects, time, approximate cost, human interventions, retries, tests and security findings. Do not compare different tasks as if they were equivalent.
