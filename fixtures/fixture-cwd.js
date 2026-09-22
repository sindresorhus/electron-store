import process from 'node:process';
import path from 'node:path';
import electron from 'electron';
import Store from '../index.js';

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', error => {
	console.error('Exception:', error);
	process.exit(1);
});

const userDataDirectory = electron.app.getPath('userData');
console.log(userDataDirectory);

const store = new Store({cwd: 'foo'});
store.set('unicorn', '🦄');
console.log(store.path);

const store2 = new Store({cwd: path.join(userDataDirectory, 'bar')});
store2.set('ava', '🚀');
console.log(store2.path);

electron.app.quit();
