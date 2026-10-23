# Known bugs

The tests that fail on a bug confirmed by hand and filed. The run marks each one itself — no change
in the test's code:

- while it fails at its step, it is grey in the report: "Known bug — waiting for the fix";
- when it passes, it is red: "Known bug looks fixed — retest the ticket";
- when it fails anywhere else (the stand, its data, another step), it is red with that cause.

A row is added once the ticket exists, and removed once the ticket is retested and closed (the verify skill (Heal) keeps this file — "A bug confirmed by hand"). `Test` is the test's full title,
or the case id its title starts with; `Fails at step` is the step's title as the test names it.

- ticket link: https://tracker.example/issue/{id}

| Test | Layer | Ticket | Fails at step | Since |
|---|---|---|---|---|
