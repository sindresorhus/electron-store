import process from 'node:process';
import assert from 'node:assert';
import fs from 'node:fs';
import electron from 'electron';
import Store from './index.js';

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', error => {
	console.error('Exception:', error);
	process.exit(1);
});

const name = 'electron-store-date';
const writtenAt = new Date('2026-05-11T12:34:56.789Z');
const store = new Store({name});

store.clear();
store.set('writtenAt', writtenAt);
store.set('nested.createdAt', writtenAt);
store.set('dateString', writtenAt.toISOString());
store.set('overwrittenAt', writtenAt);
store.set('overwrittenAt', writtenAt.toISOString());

const persistedStore = new Store({name});

assert.ok(persistedStore.get('writtenAt') instanceof Date);
assert.strictEqual(persistedStore.get('writtenAt').toISOString(), writtenAt.toISOString());
assert.ok(persistedStore.get('nested.createdAt') instanceof Date);
assert.strictEqual(persistedStore.get('nested.createdAt').toISOString(), writtenAt.toISOString());
assert.strictEqual(persistedStore.get('dateString'), writtenAt.toISOString());
assert.strictEqual(persistedStore.get('overwrittenAt'), writtenAt.toISOString());

console.log(store.path);

fs.unlinkSync(store.path);

electron.app.quit();
