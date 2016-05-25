'use strict';
const path = require('path');
const electron = require('electron');
const Config = require('./config');

class ElectronConfig extends Config {
	constructor(opts) {
		opts = Object.assign({
			name: 'config'
		}, opts);

		opts.path = path.join(electron.app.getPath('userData'), `${opts.name}.json`);

		super(opts);
	}
}

module.exports = ElectronConfig;
