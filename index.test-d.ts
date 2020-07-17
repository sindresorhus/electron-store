import {expectType, expectAssignable} from 'tsd';
import Store = require('.');

new Store({defaults: {}}); // eslint-disable-line no-new
new Store({name: 'myConfiguration'}); // eslint-disable-line no-new

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

store.size; // eslint-disable-line @typescript-eslint/no-unused-expressions
store.store; // eslint-disable-line @typescript-eslint/no-unused-expressions

store.store = {
	foo: 'bar'
};

store.path; // eslint-disable-line @typescript-eslint/no-unused-expressions

type Schema<T> = Store.Schema<T>;

type TypedStore = {
	isEnabled: boolean;
	interval: number;
};

const typedStore = new Store<TypedStore>({
	defaults: {
		isEnabled: true,
		interval: 30000
	}
});

// TODO: This should not be `| undefined`.
expectType<number | undefined>(typedStore.get('interval'));

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

expectAssignable<() => void>(offDidChange);
offDidChange();
