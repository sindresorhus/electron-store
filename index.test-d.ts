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
store.reset('foo');
store.has('foo');
store.clear();

store.openInEditor();

store.size;
store.store;

store.store = {
	foo: 'bar'
};

store.path;

type Schema = Store.Schema;

type TypedStore = {
	isEnabled: boolean,
	interval: number
};

const typedStore = new Store<TypedStore>({
	defaults: {
		isEnabled: true,
		interval: 30000
	}
});

expectType<number>(typedStore.get('interval'));
const isEnabled = false;
typedStore.set('isEnabled', isEnabled);
typedStore.set({
	isEnabled: true,
	interval: 10000
});

const offDidChange = typedStore.onDidChange(
	'isEnabled',
	(newValue, oldValue) => {
		expectType<boolean | undefined>(newValue);
		expectType<boolean | undefined>(oldValue);
	}
);

expectType<() => void>(offDidChange);
offDidChange();
