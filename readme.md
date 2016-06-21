# electron-config [![Build Status: Linux and macOS](https://travis-ci.org/sindresorhus/electron-config.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-config) [![Build status: Windows](https://ci.appveyor.com/api/projects/status/m2m9o6gq77xxi2eg/branch/master?svg=true)](https://ci.appveyor.com/project/sindresorhus/electron-config/branch/master)

> Simple config handling for your [Electron](http://electron.atom.io) app or module

Electron doesn't have a built-in way to persist user settings and other data. This module handles that for you, so you can focus on building your app. Config is saved in a JSON file in [`app.getPath('userData')`](http://electron.atom.io/docs/api/app/#appgetpathname).

You can use this module directly in both the main and renderer process.


## Install

```
$ npm install --save electron-config
```


## Usage

```js
const Config = require('electron-config');
const config = new Config();

config.set('unicorn', '🦄');
console.log(config.get('unicorn'));
//=> '🦄'

// use dot-notation to access nested properties
config.set('foo.bar', true);
console.log(config.get('foo'));
//=> {bar: true}

config.delete('unicorn');
console.log(config.get('unicorn'));
//=> undefined
```


## API

### Config([options])

Returns a new instance.

### options

#### defaults

Type: `Object`

Default config.

#### name

Type: `string`<br>
Default: `config`

Name of the config file (without extension).

This is useful if you want multiple config files for your app. Or if you're making a reusable Electron module that persists some config, in which case you should **not** use the name `config`.

### Instance

You can use [dot-notation](https://github.com/sindresorhus/dot-prop) in a `key` to access nested properties.

The instance is [`iterable`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Iteration_protocols) so you can use it directly in a [`for…of`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/for...of) loop.

#### .set(key, value)

Set an item.

#### .set(object)

Set multiple items at once.

#### .get(key)

Get an item.

#### .has(key)

Check if an item exists.

#### .delete(key)

Delete an item.

#### .clear()

Delete all items.

#### .size

Get the item count.

#### .store

Get all the config as an object or replace the current config with an object:

```js
conf.store = {
	hello: 'world'
};
```

#### .path

Get the path to the config file.


## Related

- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-context-menu](https://github.com/sindresorhus/electron-context-menu) - Context menu for your Electron app
- [electron-dl](https://github.com/sindresorhus/electron-dl) - Simplified file downloads for your Electron app
- [conf](https://github.com/sindresorhus/conf) - Simple config handling for your app or module


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
