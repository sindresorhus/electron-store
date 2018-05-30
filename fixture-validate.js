'use strict';
const electron = require('electron');
const fs = require('fs');
const Store = require('.');

// Prevent Electron from never exiting when an exception happens
process.on('uncaughtException', err => {
	console.error('Exception:', err);
	process.exit(1); // eslint-disable-line
});

const store = new Store({name: 'electron-store'});
store.set('unicorn', '🦄');

fs.writeFileSync(store.path, 'electron-store');
try {
	new Store({
		name: 'electron-store',
		validate: true
	});
} catch (ex) {
	console.log('Validation error');
}

electron.app.quit();
