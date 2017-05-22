'use strict';
const assert = require('assert');
const electron = require('electron');
const Config = require('.');

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', err => {
	console.error('Exception:', err);
	process.exit(1); // eslint-disable-line
});

const config = new Config({name: 'electron-config'});

config.set('unicorn', '🦄');
assert.equal(config.get('unicorn'), '🦄');

config.delete('unicorn');
assert.equal(config.get('unicorn'), undefined);

// To be checked in AVA
config.set('ava', '🚀');

console.log(config.path);

electron.app.quit();
