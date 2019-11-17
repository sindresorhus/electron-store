'use strict';
const assert = require('assert');
const electron = require('electron');
const Store = require('.');

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', error => {
	console.error('Exception:', error);
	process.exit(1);
});

const store = new Store({name: 'electron-store'});

const storeWithSchema = new Store({
	name: 'electron-store-with-schema',
	schema: {
		foo: {
			default: 42
		}
	}
});

store.set('unicorn', '🦄');
assert.strictEqual(store.get('unicorn'), '🦄');

store.delete('unicorn');
assert.strictEqual(store.get('unicorn'), undefined);

storeWithSchema.set('foo', 77);
assert.strictEqual(storeWithSchema.get('foo'), 77);

storeWithSchema.reset('foo');
assert.strictEqual(storeWithSchema.get('foo'), 42);

// To be checked in AVA
store.set('ava', '🚀');

console.log(store.path);

electron.app.quit();
