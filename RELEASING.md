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

### Netskope TLS interception

If `npm login` / `npm publish` fail with `SELF_SIGNED_CERT_IN_CHAIN`, it's Netskope's TLS interception on the local network. Export the OS-trusted CA bundle and point npm at it:

```bash
security find-certificate -a -p /Library/Keychains/System.keychain > /tmp/system-keychain.pem
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/system-roots.pem
cat /private/etc/ssl/cert.pem /tmp/system-roots.pem /tmp/system-keychain.pem > /tmp/combined-ca.pem
NODE_EXTRA_CA_CERTS=/tmp/combined-ca.pem npm login
NODE_EXTRA_CA_CERTS=/tmp/combined-ca.pem npm publish
```
