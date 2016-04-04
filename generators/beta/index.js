'use strict';
const path = require('path');
const yeoman = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const changeCase = require('change-case');
// const GitHubApi = require('github');
// const NodeGit = require('nodegit');

// const github = new GitHubApi({
//   version: "3.0.0",
//   protocol: "https",
//   host: "api.github.com",
//   timeout: 5000,
//   header: {
//     "user-agent": "generator-typings"
//   }
// });

const collectingInfo = [];

module.exports = yeoman.Base.extend({
  initializing: {
    initProps() {
      this.props = {
        source: {}
      };
    },
    loadRepo() {
      //     const done = this.async();
      //     NodeGit.Repository.open(path.resolve('.')).then((repo) => {
      //       this.repo = repo;
      //       console.log('found repo');
      //       done();
      //     }, () => {
      //       console.log('repo not found');
      //       done();
      //     });
    }
  },
  prompting: {
    betaGreeting() {
      this.log('Welcome to the beta! Let me know if my questions make sense to you.');
      this.log('Now, let\'s get started...');
      this.log('');
    },
    greeting() {
      this.log(yosay(`Welcome to the sensational ${chalk.yellow('typings')} generator!`));
      this.log('');
      this.log(`To begin, I need to know a little bit about the ${chalk.green('source')} you are typings for.`);
    },
    askDelivery() {
      const questions = [
        {
          type: 'list',
          name: 'type',
          message: `Where can I get it ${chalk.green('from')}?`,
          choices: [
            { name: 'Bower', value: 'bower' },
            { name: 'CDN or http(s)', value: 'http' },
            // { name: 'Duo', value: 'duo', disabled: 'coming not so soon...' },
            // { name: 'Jam', value: 'jam', disabled: 'coming not so soon...' },
            // { name: 'JSPM', value: 'jspm', disabled: 'coming not so soon...' },
            { name: 'NPM', value: 'npm' },
            // { name: 'volo', value: 'volo', disabled: 'coming not so soon...' },
            { name: 'cannot be downloaded', value: 'none' },
          ],
          default: 'npm'
        },
        {
          type: 'input',
          name: 'name',
          message: (props) => {
            switch (props.type) {
              case 'http':
              case 'none':
                return `What is the ${chalk.green('name')} of the package?`;
              default:
                return `${chalk.cyan(props.type)} install ${chalk.green('<package name>')}?`;
            }
          },
          validate: (value) => value.length > 0,
        },
        {
          type: 'input',
          name: 'url',
          message: `What is the ${chalk.green('url')} of the package?`,
          validate: (value) => value.length > 0,
          when: (props) => props.type === 'http',
        },
      ];

      const done = this.async();
      this.prompt(questions, (props) => {
        this.props.source.delivery = props;
        done();
      });
    },
    getInfoFromDelivery() {
      const delivery = this.props.source.delivery;
      if (delivery.type !== 'none') {
        this.log(`gathering info from ${chalk.cyan(delivery.type)}...`);
      }

      switch (delivery.type) {
        case 'http':
        case 'none':
          this.props.source.delivery.main = 'index';

          const done = this.sync();
          this.prompts([
            {
              type: 'input',
              name: 'version',
              message: `What is the ${chalk.green('version')} of the package?`,
              validate: (value) => value.length > 0,
              when: (props) => ['http', 'none'].indexOf(props.type) !== -1,
            },
            {
              type: 'input',
              name: 'homepage',
              message: `Enter the ${chalk.green('homepage')} of the package (if any)`,
            },
          ], (props) => {
            this.props.source.version = props.version;
            this.props.source.homepage = props.homepage;
            done();
          });
          break;
        case 'bower':
          collectingInfo.push(new Promise((resolve, reject) => {
            const child = this.spawnCommand('bower', ['info', delivery.name, '--json'], { stdio: [0, 'pipe'] });
            child.on('close', (code) => {
              if (code !== 0) {
                reject(`${chalk.red('Oops')}, could not find ${chalk.cyan(delivery.name)}.`);
              }
            });

            child.stderr.on('data', (data) => {
              try {
                const result = JSON.parse(data.toString());
                if (result.id === 'validate') {
                  this.props.source.repository = result.data.pkgMeta._source;
                }
              }
              catch (err) { }
            });
            child.stdout.on('data', (data) => {
              const result = JSON.parse(data.toString());
              this.props.source.delivery.main = path.parse(result.latest.main).name || 'index';
              this.props.source.version = result.latest.version;
              this.props.source.homepage = result.latest.homepage;
              resolve();
            });
          }));
          break;
        case 'npm':
          collectingInfo.push(new Promise((resolve, reject) => {
            const child = this.spawnCommand('npm', ['info', delivery.name, '--json'], { stdio: [0, 'pipe'] });
            child.on('close', (code) => {
              if (code !== 0) {
                reject(`${chalk.red('Oops')}, could not find ${chalk.cyan(delivery.name)}.`);
              }
            });

            child.stdout.on('data', (data) => {
              console.log('stdout', data);
              const pjson = JSON.parse(data.toString());
              this.props.source.delivery.main = path.parse(pjson.main).name;
              this.props.source.version = pjson.version;
              this.props.source.homepage = pjson.homepage;
              this.props.source.repository = pjson.repository && pjson.repository.url ?
                pjson.repository.url : pjson.repository;
              resolve();
            });
          }));
          break;
      }
    },
    askUsage() {

    },
    askSource() {
      const other = [
        {
          type: 'checkbox',
          name: 'kinds',
          message: `What ${chalk.green('kind(s)')} of package is it?`,
          choices: (props) => {
            return [
              { name: 'NPM', value: 'npm', checked: props.delivery === 'npm' },
              {
                name: 'github (Duo, JSPM, volo, etc)',
                value: 'github',
                checked: props.delivery === 'duo' || props.delivery === 'jspm' || props.delivery === 'volo'
              },
              { name: 'Bower', value: 'bower', checked: props.delivery === 'bower' },
              { name: 'Jam', value: 'jam', checked: props.delivery === 'jam' },
              { name: 'Script (load in script tag)', value: 'global' },
              { name: 'Platform (e.g. atom)', value: 'env' },
            ]
          }
        },
        {
          type: 'input',
          name: 'bowerName',
          message: `What is the ${chalk.green('package name')} in  ${chalk.cyan('Bower')}?`,
          default: (props) => props.npmName || props.repository,
          validate: (value) => value.length > 0,
          when: (props) => props.packageManagers.indexOf('bower') !== -1,
        }];

      const hostQuestions = [
        {
          type: 'list',
          name: 'host',
          message: `Where is the package ${chalk.green(`hosted`)}?`,
          choices: [
            // { name: 'BitBucket', value: 'bitbucket' },
            // { name: 'CodePlex', value: 'codeplex' },
            { name: 'GitHub', value: 'github' },
            // { name: 'GitLab', value: 'gitlab' },
            // { name: 'SourceForge', value: 'sourceforge' },
            { name: 'hosted privately', value: 'private' },
          ],
          default: 'github'
        },
        {
          type: 'input',
          name: 'author',
          message: (props) => {
            switch (props.host) {
              case 'github':
                return `http://github.com/${chalk.green('<author>')}/repository?`;
              case 'private':
                return `Who is the ${chalk.green('author')}?`;
            }
          },
          validate: (value) => value.length > 0,
        },
        {
          type: 'input',
          name: 'repository',
          message: (props) => {
            switch (props.host) {
              case 'github':
                return `http://github.com/${props.author}/${chalk.green('<repository>')}?`;
            }
          },
          validate: (value) => value.length > 0,
          when: (props) => props.host !== 'private',
        },
        {
          type: 'checkbox',
          name: 'platforms',
          message: `Which ${chalk.green('platform')} does the package run on?`,
          choices: [
            { name: 'Node', value: 'node' },
            { name: 'Browser', value: 'browser' },
            { name: 'Others (e.g. atom)', value: 'others' }
          ],
          validate: (answers) => answers.length > 0,
        },
        {
          type: 'list',
          name: 'format',
          message: `What is the ${chalk.green('format')} of the package?`,
          choices: (props) => {
            const moduleId = props.npmName || props.bowerName || prop.repository;
            const moduleName = changeCase.camelCase(moduleId);
            return [
              { name: 'AMD (RequireJS)', value: 'amd' },
              { name: 'CommonJS (NodeJS)', value: 'commonjs' },
              { name: 'global', value: 'global' },
              { name: 'ES2015 Module', value: 'esm' },
              { name: 'System (SystemJS)', value: 'system' },
              { name: 'TypeScript', value: 'typescript' },
              { name: 'UMD (global + AMD + CommonJS)', value: 'umd' },
              { name: 'UMD (global + CommonJS)', value: 'umd2' },
            ];
          }
        },
      ];

      // this.prompt(questions, (props) => {
      //   this.source = props;
      //   console.log(props);
      //   done();
      // });
    },
  },
  install: {
    waitForCollectingInfo() {
      const done = this.async();
      Promise.all(collectingInfo).then(() => {
        done();
      }, (err) => {
        this.log(err);
        process.exit(1);
      });
    },
    printProps() {
      this.log(this.props);
    }
  },
  end: {
    sayGoodbye() {
      this.log('');
      this.log('That\'s it for the Beta right now. Thanks for trying it out!');
      this.log('');
      this.log('If you have any suggestion, please create an issue at:');
      this.log('  https://github.com/typings/generator-typings/issues');
      this.log('');
      this.log(`Hope you like the current version ${chalk.green('(until 1.0 is out)!')} :)`);
    }
  }
});
