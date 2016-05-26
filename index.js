'use strict';
const path = require('path');
const electron = require('electron');
const Config = require('./config');

class ElectronConfig extends Config {
	constructor(opts) {
		opts = Object.assign({
			name: 'config'
		}, opts);

		const app = electron.app || electron.remote.app;
		opts.path = path.join(app.getPath('userData'), `${opts.name}.json`);

		super(opts);
	}
}

module.exports = ElectronConfig;
