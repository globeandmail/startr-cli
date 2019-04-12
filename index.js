#!/usr/bin/env node

const fs = require('fs-extra'),
  prompts = require('prompts'),
  path = require('path'),
  replaceInFile = require('replace-in-file'),
  { Clone, Repository, RepositoryInitOptions } = require('nodegit'),
  { bold } = require('kleur');

const projRegex = /[^a-z0-9-]/,
  emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const repo = 'https://github.com/globeandmail/startr.git';

const currDir = process.cwd();

const questions = [
  {
    type: 'text',
    name: 'project',
    message: 'What is your project name?',
    validate: value => {
      if (value) {
        if (projRegex.test(value)) {
          return 'Lower case letters, numbers and hyphens only, please.';
        } else {
          return true;
        }
      } else {
        return 'Please enter a project name.';
      }
    }
  },
  {
    type: 'text',
    name: 'author',
    message: 'What is your name?',
    initial: 'Firstname Lastname',
    validate: value => !value || value == 'Firstname Lastname' ? 'Please enter a name.' : true
  },
  {
    type: 'text',
    name: 'email',
    message: 'What is your email address?',
    validate: value => !value || !emailRegex.test(value) ? 'Please enter a valid email address.' : true
  },
  {
    type: 'text',
    name: 'remote',
    message: 'What git remote should this point to? (optional)'
  }
];

async function run() {

  console.log(`These prompts will help you scaffold a new startr project.\nPress CTRL + C at any point to quit.\n`)

  try {

    const response = await prompts(questions);

    Object.keys(response).map(d => {
      response[d] = response[d].trim();
    });

    console.log(); // spacer
    console.log('About to create a startr project with these settings:');
    console.log(); // spacer
    console.log(`${bold('Project:')} ${response.project}`);
    console.log(`${bold('Author:')} ${response.author}`);
    console.log(`${bold('Email:')} ${response.email}`);
    if (response.remote) console.log(`${bold('Remote:')} ${response.remote}`);
    console.log(); // spacer

    let confirm = await prompts({
      type: 'confirm',
      name: 'value',
      message: 'Does this look right?'
    });

    if (!confirm.value) return;

    console.log(); // spacer
    console.log('Cloning project…');

    await Clone(repo, path.join(currDir, response.project));

    await fs.remove(path.join(currDir, response.project, '.git'));

    const repoOpts = new RepositoryInitOptions();

    if (response.remote) repoOpts.originUrl = response.remote;

    await Repository.initExt(response.project, repoOpts);

    console.log('Initializing blank git repo…');

    await fs.move(
      path.join(currDir, response.project, 'startr.Rproj'),
      path.join(currDir, response.project, `${response.project}.Rproj`)
    );

    await replaceInFile({
      files: path.join(currDir, response.project, 'config.R'),
      from: [
        `config_title <- 'startr'`,
        `config_author <- 'Firstname Lastname <firstlast@globeandmail.com>'`
      ],
      to: [
        `config_title <- '${response.project}'`,
        `config_author <- '${response.author} <${response.email}>'`
      ]
    });

    await replaceInFile({
      files: path.join(currDir, response.project, 'README.md'),
      from: `# startR`,
      to: `# ${response.project}`
    });

    await fs.remove(path.join(currDir, response.project, 'DESCRIPTION'));

    console.log('Renaming files and cleaning up…');
    console.log(); // spacer
    console.log(`✔ The startr project ${bold(response.project)} is ready! 💪`);

  } catch (err) {
    console.error(`Uh oh, something went wrong. ${err}`);
  }

}

run();
