import {Except} from 'type-fest';
import Conf, {Schema as ConfSchema, Options as ConfOptions} from 'conf';

declare namespace ElectronStore {
	type Schema<T> = ConfSchema<T>;

	type Options<T> = Except<ConfOptions<T>, 'configName' | 'projectName' | 'projectVersion' | 'projectSuffix'> & {
		/**
		Name of the storage file (without extension).

		This is useful if you want multiple storage files for your app. Or if you're making a reusable Electron module that persists some data, in which case you should **not** use the name `config`.

		@default 'config'
		*/
		readonly name?: string;
	};
}

/**
Simple data persistence for your [Electron](https://electronjs.org) app or module - Save and load user preferences, app state, cache, etc.
*/
declare class ElectronStore<T extends Record<string, any> = Record<string, unknown>> extends Conf<T> {
	/**
	Changes are written to disk atomically, so if the process crashes during a write, it will not corrupt the existing store.

	@example
	```
	import Store = require('electron-store');

	type StoreType = {
		isRainbow: boolean,
		unicorn?: string
	}

	const store = new Store<StoreType>({
		defaults: {
			isRainbow: true
		}
	});

	store.get('isRainbow');
	//=> true

	store.set('unicorn', '🦄');
	console.log(store.get('unicorn'));
	//=> '🦄'

	store.delete('unicorn');
	console.log(store.get('unicorn'));
	//=> undefined
	```
	*/
	constructor(options?: ElectronStore.Options<T>);

	/**
	Initializer to set up the required `ipc` communication channels for the module when a `Store` instance is not created in the main process and you are creating a `Store` instance in the Electron renderer process only.
	*/
	static initRenderer(): void;

	/**
	Open the storage file in the user's editor.
	*/
	openInEditor(): void;
}

export = ElectronStore;
