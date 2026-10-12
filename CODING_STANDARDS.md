# Coding standards

Read during review. Mechanical rules live in `eslint.config.mjs`, not here; this file holds judgement calls.

## Specs and docs

- When you change an access rule, a route, or a seam, update the lines in `docs/specs/starter-site.md` that describe it (the Contact Form bullet and the test seams section name access rules explicitly). Code and spec must not disagree.
- Use the `GLOSSARY.md` terms in comments, test names and commit messages: Visitor, Editor, Locale, Contact Submission.

## Access control

- Public queries pass `overrideAccess: false` or filter on published status. Never rely on Local API defaults.
- A write that bypasses access with `overrideAccess: true` must be the only writer of that collection, and must run its validation first. Say so in a comment at the call site and in the collection's doc comment.

## Tests

- A test name states what the test exercises. Do not name a Local API call after a server action it does not call.
- Repeated fixture setup goes in a small helper at the top of the file.
