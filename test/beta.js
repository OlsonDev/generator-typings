'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('beta', function() {
  describe('npm dryrun', function() {
    before(function(done) {
      this.timeout(60000);
      helpers.run(path.join(__dirname, '../generators/beta'))
        .withPrompts({
          type: 'npm',
          name: 'batch',
          usages: ['commonjs'],
          platforms: ['node']
        })
        .on('end', done);
    });

    it('creates files', function() {
    });
  });
  describe('http dryrun', function() {
    before(function(done) {
      this.timeout(60000);
      helpers.run(path.join(__dirname, '../generators/beta'))
        .withPrompts({
          type: 'http',
          name: '6px',
          url: 'https://cdnjs.cloudflare.com/ajax/libs/6px/1.0.3/6px.min.js',
          version: '1.0.3',
          usages: ['script'],
          platforms: ['browser']
        })
        .on('end', done);
    });

    it('creates files', function() {
    });
  });
  describe('bower dryrun', function() {
    before(function(done) {
      this.timeout(60000);
      helpers.run(path.join(__dirname, '../generators/beta'))
        .withPrompts({
          type: 'bower',
          name: 'domready',
          usages: ['commonjs'],
          platforms: ['node']
        })
        .on('end', done);
    });

    it('creates files', function() {
    });
  });
});
