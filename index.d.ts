/// <reference types="node"/>
import EventEmitter = require('events');
import {Omit} from 'type-fest';
import Conf = require('conf');

declare namespace ElectronStore {
	type Options<T> = Omit<
		Conf.Options<T>,
		'configName' | 'projectName' | 'projectSuffix'
	> & {
		/**
		Name of the storage file (without extension).

		This is useful if you want multiple storage files for your app. Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.

		@default 'config'
		*/
		readonly name?: string;
	};
}

declare class ElectronStore<T> extends Conf<T> {
	/**
	Simple data persistence for your [Electron](https://electronjs.org) app or module - Save and load user preferences, app state, cache, etc.

	Changes are written to disk atomically, so if the process crashes during a write, it will not corrupt the existing config.

	@example
	```
	import Store = require('electron-store');
	const store = new Store();

	store.set('unicorn', '🦄');
	console.log(store.get('unicorn'));
	//=> '🦄'

	// Use dot-notation to access nested properties
	store.set('foo.bar', true);
	console.log(store.get('foo'));
	//=> {bar: true}

	store.delete('unicorn');
	console.log(store.get('unicorn'));
	//=> undefined
	```
	*/
	constructor(options?: ElectronStore.Options<T>);

	/**
	Open the storage file in the user's editor.
	*/
	openInEditor(): void;
}

export = ElectronStore;
