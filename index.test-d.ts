import {expectType} from 'tsd';
import Store = require('.');

new Store({defaults: {}});
new Store({name: 'myConfiguration'});

const store = new Store();

store.set('foo', 'bar');
store.set({
	foo: 'bar',
	foo2: 'bar2'
});
store.delete('foo');
store.get('foo');
store.get('foo', 42);
store.has('foo');
store.clear();

store.openInEditor();

store.size;
store.store;

store.store = {
	foo: 'bar'
};

store.path;

const typedStore = new Store<number | boolean>({
	defaults: {
		enabled: true,
		interval: 30000
	}
});

expectType<number | boolean>(typedStore.get('interval'));
const enabled = false;
typedStore.set('enabled', enabled);
typedStore.set({
	enabled: true,
	interval: 10000
});

const offDidChange = typedStore.onDidChange(
	'enabled',
	(oldValue, newValue) => {
		expectType<number | boolean | undefined>(oldValue);
		expectType<number | boolean | undefined>(newValue);
	}
);

expectType<() => void>(offDidChange);
offDidChange();
