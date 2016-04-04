'use strict';
const path = require('path');
const yeoman = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const changeCase = require('change-case');
// const GitHubApi = require('github');
const NodeGit = require('nodegit');

// const github = new GitHubApi({
//   version: "3.0.0",
//   protocol: "https",
//   host: "api.github.com",
//   timeout: 5000,
//   header: {
//     "user-agent": "generator-typings"
//   }
// });

const collectingSourceInfo = [];
const collectingLocalInfo = [];

module.exports = yeoman.Base.extend({
  constructor: function() {
    yeoman.Base.apply(this, arguments);
    this.option('dryrun');
    this.option('skipPrompt');
  },
  initializing: {
    initProps() {
      this.props = {
        source: {}
      };
    },
    loadRepo() {
      const repository = { init: true };
      collectingLocalInfo.push(NodeGit.Repository.open(path.resolve('.')).then((repo) => {
        const done = this.async();
        Promise.all([repo.getRemote('origin').then((remote) => {
          repository.url = remote.url();
        })]).then(() => {
          this.props.repository = repository;
          this.repository = repo;
          done();
        });
      }, () => {
        repository.init = false;
        this.props.repository = repository;
      }));
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
      if (this.options.skipPrompt) return;

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
      if (this.options.skipPrompt) return;

      const delivery = this.props.source.delivery;
      if (delivery.type !== 'none') {
        this.log(`gathering info from ${chalk.cyan(delivery.type)}...`);
      }

      switch (delivery.type) {
        case 'http':
        case 'none':
          this.props.source.delivery.main = 'index';

          const done = this.async();
          this.prompt([
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
          collectingSourceInfo.push(new Promise((resolve, reject) => {
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
              this.props.source.delivery.main = result.latest.main ? path.parse(result.latest.main).name : 'index';
              this.props.source.version = result.latest.version;
              this.props.source.homepage = result.latest.homepage;
              resolve();
            });
          }));
          break;
        case 'npm':
          collectingSourceInfo.push(new Promise((resolve, reject) => {
            const child = this.spawnCommand('npm', ['info', delivery.name, '--json'], { stdio: [0, 'pipe'] });
            child.on('close', (code) => {
              if (code !== 0) {
                reject(`${chalk.red('Oops')}, could not find ${chalk.cyan(delivery.name)}.`);
              }
            });

            child.stdout.on('data', (data) => {
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
      if (this.options.skipPrompt) return;

      const done = this.async();
      this.prompt(
        {
          type: 'checkbox',
          name: 'usages',
          message: `${chalk.green('How')} can the package be used?`,
          choices: [
            { name: 'AMD Module', value: 'amd' },
            { name: 'CommonJS Module', value: 'commonjs', checked: true },
            { name: 'ES2015 Module', value: 'esm' },
            { name: 'Script Tag', value: 'script' },
            { name: 'part of environment', value: 'env' }
          ],
          validate: (values) => values.length > 0,
        },
        (props) => {
          this.props.source.usages = props.usages;
          done();
        });
    },
    askPlatform() {
      if (this.options.skipPrompt) return;

      const done = this.async();
      this.prompt(
        {
          type: 'checkbox',
          name: 'platforms',
          message: `${chalk.green('Where')} can the package be used?`,
          choices: [
            { name: 'Browser', value: 'browser' },
            { name: 'Native NodeJS', value: 'node', checked: true },
            { name: 'others (e.g. atom)', value: 'others' },
          ],
          validate: (values) => values.length > 0,
        },
        (props) => {
          this.props.source.platforms = props.platforms;
          done();
        });
    },
    askTestHarness() {
      // Source-test is still in early stage. No automation.
    },
    enterTypingsSection() {
      this.log('');
      this.log(`Good, now about the ${chalk.yellow('typings')} itself...`);
    },
    waitForLocalInfo() {
      const done = this.async();
      Promise.all(collectingLocalInfo).then(() => {
        done();
      }, (err) => {
        this.log(err);
        process.exit(1);
      });
    },
    askTypingsHost() {
      if (this.repository) {
        const done = this.async();
        console.log('path', this.repository.path());
        console.log('isEmpty()', this.repository.isEmpty() == true);
        Promise.all([this.repository.getRemote('origin').then((remote) => {
          console.log('getRemote()', remote.url());
        })]).then(() => done());
      }
      else {
        console.log('no repository');
      }
    },
    askSource() {
      const hostQuestions = [
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
      ];

      // this.prompt(questions, (props) => {
      //   this.source = props;
      //   console.log(props);
      //   done();
      // });
    },
  },
  install: {
    waitForSourceInfo() {
      const done = this.async();
      Promise.all(collectingSourceInfo).then(() => {
        done();
      }, (err) => {
        this.log(err);
        process.exit(1);
      });
    },
    printProps() {
      this.log('');
      this.log('');
      this.log('');
      if (this.options.dryrun) {
        this.log('dryrun testing');
      }

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