# BrowserRouter

[![GitHub release](https://img.shields.io/github/release/Mike96angelo/BrowserRouter.svg?maxAge=21600)](https://github.com/Mike96Angelo/BrowserRouter/releases)
[![npm version](https://img.shields.io/npm/v/browser-app-router.svg?maxAge=21600)](https://www.npmjs.com/package/browser-app-router)
[![npm downloads](https://img.shields.io/npm/dm/browser-app-router.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=browser-app-router&from=2017-01-28)
[![npm downloads](https://img.shields.io/npm/dt/browser-app-router.svg?maxAge=604800)](https://npm-stat.com/charts.html?package=browser-app-router&from=2017-01-28)

A simple URL router for the browser, uses the browser history API falls back to hash-urls.

### Install:
```
$ npm install browser-app-router
```
# What BrowserRouter Looks Like

<!-- * [Docs](docs/browser-app-router.md)
* [JSFiddle](https://jsfiddle.net/fypyk2jp/4/) -->

### app.js:

```JavaScript
var BrowserRouter = require('browser-app-router');

var router = new BrowserRouter({
    mode: 'hash', // 'hash'|'path' defaults to 'path'
    root: '/path/to/app' // only applies if mode is set to 'path'
});

router.addRoute({
    title: 'App - Home', // document.title is set to this value when this route is loaded.
    path: '/',
    handler: function (req) {
        // handle route here
        // req => {
        //   title: 'title of route',
        //   fullPath: '/path/of/route?foo=bar#bar=baz'
        //   path: '/path/of/route'
        //   params: {key => value},
        //   searchString: '?foo=bar',
        //   search: {foo: 'bar'},
        //   hashString: '#bar=baz',
        //   hash: {bar: 'baz'},
        // }

        // to redirect a route simply call router.go('/redirect/path')

        // return false to cancel url change
    }
});

router.addRoute({
    title: 'App - User',
    path: '/{username}', // req.params => {username => value}
    // path: '/user/{username*}', // matches paths /user/*
    // path: '/user/{username*2}', // matches paths /user/{foo}/{bar}
    // path: '/user/{username?}', // matches paths /user|/user/{foo}
    handler: function (req) {
        // handle route here
    }
});

router.set404({
    title: 'App - 404',
    handler: function (req) {
        // handle 404 here
    }
});

router.start();
// this inits the router and load the route at the current url.

router.go('/path/to/route?search=search#hash=hash');
// loads the route with the given url string.

router.go404();
// loads the 404 route with the current url.

```
