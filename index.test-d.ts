import {expectType} from 'tsd';
import ElectronStore = require('.');

new ElectronStore({defaults: {}});
new ElectronStore({name: 'myConfiguration'});

const electronStore = new ElectronStore();

electronStore.set('foo', 'bar');
electronStore.set({
	foo: 'bar',
	foo2: 'bar2'
});
electronStore.delete('foo');
electronStore.get('foo');
electronStore.get('foo', 42);
electronStore.has('foo');
electronStore.clear();

electronStore.openInEditor();

electronStore.size;
electronStore.store;

electronStore.store = {
	foo: 'bar'
};

electronStore.path;

const typedElectronStore = new ElectronStore<number | boolean>({
	defaults: {
		enabled: true,
		interval: 30000
	}
});

expectType<number | boolean>(typedElectronStore.get('interval'));
const enabled = false;
typedElectronStore.set('enabled', enabled);
typedElectronStore.set({
	enabled: true,
	interval: 10000
});

const offDidChange = typedElectronStore.onDidChange(
	'enabled',
	(oldValue, newValue) => {
		expectType<number | boolean | undefined>(oldValue);
		expectType<number | boolean | undefined>(newValue);
	}
);

expectType<() => void>(offDidChange);
offDidChange();
