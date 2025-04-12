#!/usr/bin/env node

import fs from 'fs-extra';
import prompts from 'prompts';
import path from 'path';
import { replaceInFile } from 'replace-in-file';
import simpleGit from 'simple-git';
import kleur from 'kleur';
import { fileURLToPath } from 'url';

const { bold } = kleur;
const projRegex = /[^a-z0-9-]/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const upstreamRepo = 'https://github.com/globeandmail/startr.git';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const currDir = process.cwd();

function projectPath(project, ...subpaths) {
  return path.join(currDir, project, ...subpaths);
}

const questions = [
  {
    type: 'text',
    name: 'project',
    message: 'What is your project name?',
    validate: value =>
      !value
        ? 'Please enter a project name.'
        : projRegex.test(value)
        ? 'Lower case letters, numbers and hyphens only, please.'
        : true,
  },
  {
    type: 'text',
    name: 'author',
    message: 'What is your name?',
    initial: 'Firstname Lastname',
    validate: value =>
      !value || value === 'Firstname Lastname' ? 'Please enter a name.' : true,
  },
  {
    type: 'text',
    name: 'email',
    message: 'What is your email address?',
    validate: value =>
      !value || !emailRegex.test(value) ? 'Please enter a valid email address.' : true,
  },
  {
    type: 'text',
    name: 'remote',
    message: 'What git remote should this point to? (optional)',
  },
];

console.log(`These prompts will help you scaffold a new startr project.\nPress CTRL + C at any point to quit.\n`);

try {
  const response = await prompts(questions);
  for (const key in response) {
    response[key] = response[key].trim();
  }

  console.log(`\nAbout to create a startr project with these settings:\n`);
  console.log(`${bold('Project:')} ${response.project}`);
  console.log(`${bold('Author:')} ${response.author}`);
  console.log(`${bold('Email:')} ${response.email}`);
  if (response.remote) console.log(`${bold('Remote:')} ${response.remote}`);
  console.log();

  const confirm = await prompts({
    type: 'confirm',
    name: 'value',
    message: 'Does this look right?',
  });

  if (!confirm.value) process.exit(0);

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
}
