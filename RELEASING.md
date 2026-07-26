# Releasing

1. Make sure `master` is up to date and `npm test` / `npm audit` are clean.
2. Bump the version and create the release commit + tag:
   ```bash
   npm version patch   # or minor / major, per semver
   ```
3. Push the commit and the tag:
   ```bash
   git push && git push --tags
   ```
4. Publish to npm (requires being logged in as an account with publish access — `npm login`, then `npm whoami` to confirm):
   ```bash
   npm publish
   ```

Only `index.js`, `package.json`, `README.md`, and `LICENSE` are shipped to npm (see the `files` field in `package.json`).

