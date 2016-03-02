# generator-typings [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Build Status][travis-image]][travis-url] [![License][license-image]][license-url]

> Yeoman generator for typings (next-gen of tsd/DefinitelyTyped) project

## Installation

First, install [Yeoman](http://yeoman.io) and generator-typings using [npm](https://www.npmjs.com/).

```bash
npm install -g yo
npm install -g generator-typings
```

Then generate your new project:

```bash
mkdir typed-abc
cd typed-abc
yo typings
```

## License

MIT © [unional](https://github.com/unional)


[npm-image]: https://badge.fury.io/js/generator-typings.svg
[npm-url]: https://npmjs.org/package/generator-typings
[travis-image]: https://travis-ci.org/typings/generator-typings.svg?branch=master
[travis-url]: https://travis-ci.org/typings/generator-typings
[daviddm-image]: https://david-dm.org/typings/generator-typings.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/typings/generator-typings
[license-image]: http://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: http://unional.mit-license.org

## TODO List
* [x] Basic scaffolding
* [ ] Support multiple source hostings providers
  * [x] github
* [ ] Support multiple source distribution channels
  * [x] npm
  * [ ] bower
  * [ ] github
  * [ ] gitlab
* [x] install target source automatically
* [ ] Add supporting utilities and settings
  * [x] Add `tslint.json`
* [x] Add validation to check if the d.ts file created correctly.
* [ ] Automate PR creation on `typings/registry`
