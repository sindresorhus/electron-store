import process from 'node:process';
import assert from 'node:assert';
import electron from 'electron';
import Store from '../index.js';

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
			default: 42,
		},
	},
});

store.set('unicorn', '🦄');
assert.strictEqual(store.get('unicorn'), '🦄');

store.delete('unicorn');
assert.strictEqual(store.get('unicorn'), undefined);

storeWithSchema.set('foo', 77);
assert.strictEqual(storeWithSchema.get('foo'), 77);

storeWithSchema.reset('foo');
assert.strictEqual(storeWithSchema.get('foo'), 42);

const storeWithNestedSchema = new Store({
	name: 'electron-store-with-nested-schema',
	schema: {
		bar: {
			type: 'object',
			default: {},
			properties: {
				a: {
					type: 'number',
					default: 5,
				},
			},
		},
	},
});

// A nested `default` only applies when the parent object exists.
storeWithNestedSchema.clear();
assert.strictEqual(storeWithNestedSchema.get('bar.a'), 5);

// To be checked in the test suite
store.set('ava', '🚀');

console.log(store.path);

electron.app.quit();
