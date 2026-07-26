#!/usr/bin/env node

import fs from 'fs-extra';
import prompts from 'prompts';
import path from 'path';
import { replaceInFile } from 'replace-in-file';
import simpleGit from 'simple-git';
import kleur from 'kleur';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const { bold } = kleur;
const projRegex = /[^a-z0-9-]/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const upstreamRepo = 'https://github.com/globeandmail/startr.git';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const currDir = process.cwd();

function projectPath(project, ...subpaths) {
  return path.join(currDir, project, ...subpaths);
}

function validateProject(value) {
  return !value
    ? 'Please enter a project name.'
    : projRegex.test(value)
    ? 'Lower case letters, numbers and hyphens only, please.'
    : true;
}

function validateAuthor(value) {
  return !value || value === 'Firstname Lastname' ? 'Please enter a name.' : true;
}

function validateEmail(value) {
  return !value || !emailRegex.test(value) ? 'Please enter a valid email address.' : true;
}

const usage = `Usage: create-startr [options]

Options:
  -p, --project <name>   Project name (lower case letters, numbers, hyphens)
  -a, --author <name>    Your name
  -e, --email <email>    Your email address
  -r, --remote <url>     Git remote to point the new project at (optional)
  -y, --yes              Skip the confirmation prompt
  -h, --help             Show this help message

If --project, --author and --email are all provided, prompts are skipped
entirely. This is the supported way to run create-startr non-interactively
(e.g. from a script or an AI coding agent).`;

const { values: args } = parseArgs({
  options: {
    project: { type: 'string', short: 'p' },
    author: { type: 'string', short: 'a' },
    email: { type: 'string', short: 'e' },
    remote: { type: 'string', short: 'r' },
    yes: { type: 'boolean', short: 'y', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (args.help) {
  console.log(usage);
  process.exit(0);
}

const flagFields = {
  project: args.project,
  author: args.author,
  email: args.email,
  remote: args.remote,
};

const hasAllRequiredFlags = flagFields.project !== undefined && flagFields.author !== undefined && flagFields.email !== undefined;

try {
  let response;

  if (hasAllRequiredFlags) {
    for (const [validate, value, label] of [
      [validateProject, flagFields.project, 'project'],
      [validateAuthor, flagFields.author, 'author'],
      [validateEmail, flagFields.email, 'email'],
    ]) {
      const result = validate(value);
      if (result !== true) {
        console.error(`Invalid --${label}: ${result}`);
        process.exit(1);
      }
    }
    response = { ...flagFields, remote: flagFields.remote ?? '' };
  } else if (!process.stdin.isTTY) {
    const missing = ['project', 'author', 'email'].filter(field => flagFields[field] === undefined);
    console.error(
      `Missing required flag(s) for non-interactive use: ${missing.map(f => `--${f}`).join(', ')}\n\n${usage}`
    );
    process.exit(1);
  } else {
    console.log(`These prompts will help you scaffold a new startr project.\nPress CTRL + C at any point to quit.\n`);

    const questions = [
      {
        type: 'text',
        name: 'project',
        message: 'What is your project name?',
        validate: validateProject,
      },
      {
        type: 'text',
        name: 'author',
        message: 'What is your name?',
        initial: 'Firstname Lastname',
        validate: validateAuthor,
      },
      {
        type: 'text',
        name: 'email',
        message: 'What is your email address?',
        validate: validateEmail,
      },
      {
        type: 'text',
        name: 'remote',
        message: 'What git remote should this point to? (optional)',
      },
    ].filter(q => flagFields[q.name] === undefined);

    response = { ...flagFields, ...(await prompts(questions)) };
  }

  for (const key in response) {
    response[key] = (response[key] ?? '').trim();
  }

  console.log(`\nAbout to create a startr project with these settings:\n`);
  console.log(`${bold('Project:')} ${response.project}`);
  console.log(`${bold('Author:')} ${response.author}`);
  console.log(`${bold('Email:')} ${response.email}`);
  if (response.remote) console.log(`${bold('Remote:')} ${response.remote}`);
  console.log();

  if (!args.yes) {
    if (!process.stdin.isTTY) {
      console.error('Refusing to wait for confirmation in non-interactive mode. Pass --yes to proceed.');
      process.exit(1);
    }

    const confirm = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Does this look right?',
    });

    if (!confirm.value) process.exit(0);
  }

  console.log('\nCloning project…');
  const git = simpleGit();
  await git.clone(upstreamRepo, projectPath(response.project));

  await fs.remove(projectPath(response.project, '.git'));

  console.log('Initializing blank git repo…');
  await git.cwd(projectPath(response.project));
  await git.init();
  await git.addRemote('upstream', upstreamRepo);
  if (response.remote) {
    await git.addRemote('origin', response.remote);
  }

  console.log('Renaming files and cleaning up…');

  await fs.move(
    projectPath(response.project, 'startr.Rproj'),
    projectPath(response.project, `${response.project}.Rproj`)
  );

  await replaceInFile({
    files: projectPath(response.project, 'config.R'),
    from: [
      `title = 'startr'`,
      `author = 'Firstname Lastname <firstlast@example.com>'`,
    ],
    to: [
      `title = '${response.project}'`,
      `author = '${response.author} <${response.email}>'`,
    ],
  });

  await replaceInFile({
    files: projectPath(response.project, 'README.md'),
    from: `# startr`,
    to: `# ${response.project}`,
  });

  await fs.remove(projectPath(response.project, 'DESCRIPTION'));

  console.log(`\n✔ The startr project ${bold(response.project)} is ready! 💪`);
} catch (err) {
  console.error(`Uh oh, something went wrong:\n`, err);
  process.exit(1);
}
