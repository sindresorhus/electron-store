'use strict';
const assert = require('assert');
const electron = require('electron');
const Config = require('./');

const conf = new Config({name: 'electron-config'});

conf.set('unicorn', '🦄');
assert.equal(conf.get('unicorn'), '🦄');

conf.delete('unicorn');
assert.equal(conf.get('unicorn'), undefined);

// to be checked in AVA
conf.set('ava', '🚀');

console.log(conf.path);

electron.app.quit();
