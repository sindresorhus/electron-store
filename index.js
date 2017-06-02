'use strict';
const electron = require('electron');
const Conf = require('conf');

class ElectronStore extends Conf {
	constructor(opts) {
		opts = Object.assign({name: 'config'}, opts);
		opts.cwd = (electron.app || electron.remote.app).getPath('userData');
		opts.configName = opts.name;
		delete opts.name;
		super(opts);
	}
}

module.exports = ElectronStore;
