import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'index.js');
const { version } = createRequire(import.meta.url)('../package.json');

function run(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    input: '',
  });
}

test('--help prints usage and exits 0', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: create-startr/);
});

test('--version prints the package version and exits 0', () => {
  const result = run(['--version']);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), version);
});

test('non-interactive with no flags fails fast instead of hanging', () => {
  const result = run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required flag\(s\).*--project.*--author.*--email/s);
});

test('non-interactive with a partial flag set reports only what is missing', () => {
  const result = run(['--project', 'my-project']);
  assert.equal(result.status, 1);
  const [firstLine] = result.stderr.split('\n');
  assert.equal(firstLine, 'Missing required flag(s) for non-interactive use: --author, --email');
});

test('rejects an invalid --project value', () => {
  const result = run(['--project', 'Bad Name', '--author', 'Jane Doe', '--email', 'jane@example.com', '--yes']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid --project/);
});

test('rejects an invalid --author value', () => {
  const result = run(['--project', 'my-project', '--author', 'Firstname Lastname', '--email', 'jane@example.com', '--yes']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid --author/);
});

test('rejects an invalid --email value', () => {
  const result = run(['--project', 'my-project', '--author', 'Jane Doe', '--email', 'not-an-email', '--yes']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid --email/);
});

test('valid flags without --yes refuse to hang waiting for confirmation', () => {
  const result = run(['--project', 'my-project', '--author', 'Jane Doe', '--email', 'jane@example.com']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to wait for confirmation/);
});
