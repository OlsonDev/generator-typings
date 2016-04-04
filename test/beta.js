'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('beta', function() {
  describe('visionmedia/batch', function() {
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
});
