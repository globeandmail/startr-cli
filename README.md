# startr-cli

A command-line scaffolder for the [**`startr`**](https://www.github.com/globeandmail/startr) R project template. This will pull down the latest version of `startr` from GitHub, rewrite some project variables to your specified project name and initialize a fresh git repository.

![startr-cli interface GIF](http://i.imgur.com/4qtiJar.gif)

### Installation instructions

Make sure you have Node.js >= v22 (consider using [NVM](https://github.com/creationix/nvm)), then just:

```bash
npm install -g startr-cli
```

### How to use

Just run `create-startr` in the directory you want your project in, then follow the prompts.

### Non-interactive use

`create-startr` can also be run non-interactively, e.g. from a script or an AI coding agent, by passing all required options as flags:

```bash
create-startr --project my-project --author "Jane Doe" --email jane@example.com --yes
```

| Flag | Description |
| --- | --- |
| `-p, --project <name>` | Project name (lower case letters, numbers, hyphens) |
| `-a, --author <name>` | Your name |
| `-e, --email <email>` | Your email address |
| `-r, --remote <url>` | Git remote to point the new project at (optional) |
| `-y, --yes` | Skip the confirmation prompt |
| `-h, --help` | Show usage |

If `--project`, `--author` and `--email` are all provided, the interactive prompts are skipped entirely. In a non-interactive shell (no TTY), all three flags plus `--yes` are required — `create-startr` will exit with an error instead of hanging if any are missing.

### License

startr-cli © 2019 The Globe and Mail. It is free software, and may be redistributed under the terms specified in our MIT license.

### Get in touch

If you've got any questions, feel free to send us an email, or give us a shout on Twitter:

[![Michael Pereira](https://avatars0.githubusercontent.com/u/212666?v=3&s=200)](https://github.com/monkeycycle) | [![Tom Cardoso](https://avatars0.githubusercontent.com/u/2408118?v=3&s=200)](https://github.com/tomcardoso)
---|---
[Michael Pereira](mailto:mpereira@globeandmail.com) <br> [@__m_pereira](https://www.twitter.com/__m_pereira) | [Tom Cardoso](mailto:tcardoso@globeandmail.com) <br> [@tom_cardoso](https://www.twitter.com/tom_cardoso)
