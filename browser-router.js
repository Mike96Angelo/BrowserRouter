var Generator = require('generate-js');
var queryString = require('query-string');

function fixPath(path) {
    path = '/' + path;
    path = path.replace(/[\/]+/g, '/');
    path = path.replace(/[\/]$/g, '');

    return path;
}

function isParamPath(path) {
    return /[{][^{}\/]+[}]/.test(path);
}

var PARAM = /^[{]([^{}\/?*]+)(?:([?])|([*]([0-9]*)))?[}]$/;

function parsePathParams(path) {
    for (var i = 0; i < path.length; i++) {
        var match = path[i].match(PARAM);

        if (match) {
            path[i] = {
                name: match[1],
                optional: !!match[2],
                any: !!match[3],
                anyAmount: match[4] ? Number(match[4]) : null
            };
        }
    }

    return path;
}

var Route = Generator.generate(
    function Route(options, router, is404) {
        var _ = this;

        _.router = router;

        _.pathString = fixPath(is404 ? '' : options.path);
        _.path = parsePathParams(_.pathString.split('/'));
        _.hasParams = isParamPath(_.pathString);
        _.title = options.title;
        _.handler = options.handler;
    }
);

Route.definePrototype({
    handleRoute: function handleRoute(path, search, hash, fullPath, noGo) {
        var _ = this;

        var req = {
            title: _.title,
            fullPath: fullPath,
            path: path,
            params: _.parseParams(path),
            search: queryString.parse(search),
            searchString: search,
            hash: queryString.parse(hash),
            hashString: hash
        };

        if (_.router) {
            _.router.req = req;
        }

        if (noGo) {
            return false;
        }

        return _.handler(req);
    },
    shouldTrigger: function shouldTrigger(path) {
        var _ = this,
            i;

        path = fixPath(path)
            .split('/');

        if (!_.hasParams) {
            if (path.length !== _.path.length) {
                return false;
            }

            for (i = 0; i < path.length; i++) {
                if (path[i] !== _.path[i]) {
                    return false;
                }
            }
        } else {
            for (i = 0; i < _.path.length; i++) {
                if (i === _.path.length - 1) {
                    if (
                        ((_.path[i].any || !_.path[i].optional) && !path[i]) ||
                        (_.path[i].anyAmount &&
                            i !== path.length - _.path[i].anyAmount - 1
                        ) || (!_.path[i].any && path[i + 1])
                    ) {
                        return false;
                    }
                } else if (!_.path[i].name) {
                    if (path[i] !== _.path[i]) {
                        return false;
                    }
                }
            }
        }

        return true;
    },
    parseParams: function parseParams(path) {
        var _ = this;

        path = fixPath(path)
            .split('/');

        var params = {};

        for (var i = 0; i < _.path.length; i++) {
            if (_.path[i].any) {
                params[_.path[i].name] = path.slice(i, _.path[i].anyAmount)
                    .join('/');
                break;
            } else if (_.path[i].name) {
                params[_.path[i].name] = path[i];

                if (_.path[i].optional) {
                    break;
                }
            }
        }

        return params;
    }
});

module.exports = Route;

var BrowserRouter = Generator.generate(
    function BrowserRouter(options) {
        var _ = this;

        _.routes = [];

        _.root = options && options.root ? fixPath(options.root) : null;

        _.mode = window.history ? ((options && options.mode) || 'path') : 'hash';

        _._routeChangeHandler = function (e) {
            _.go(null, true);
        };

        if (_.mode === 'path') {
            window.addEventListener('popstate', _._routeChangeHandler, false);
        } else {
            _.bindHash();
        }

        window.addEventListener('beforeunload', _._beforeRouteChange.bind(_), false);
    }
);

BrowserRouter.definePrototype({
    bindHash: function bindHash() {
        var _ = this;

        window.addEventListener('hashchange', _._routeChangeHandler, false);
    },
    unbindHash: function unbindHash() {
        var _ = this;

        window.removeEventListener('hashchange', _._routeChangeHandler, false);
    }
});

function noop() {}

BrowserRouter.definePrototype({
    writable: true
}, {
    beforeRouteChange: noop
});

BrowserRouter.definePrototype({
    _beforeRouteChange: function _beforeRouteChange(evt) {
        var _ = this;
        var event = evt || {};

        var result = _.beforeRouteChange(event);

        if (result) {
            event.returnValue = result;
        }

        if (!evt && event.returnValue) {
            var con = confirm(event.returnValue);

            return con ? void(0) : event.returnValue;
        }

        return result ? result : void(0);
    },
    start: function start(noGo) {
        var _ = this;

        _.go(null, true, noGo);
    },

    reload: function reload() {
        var _ = this;

        _.go(null, true);
    },

    addRoute: function addRoute(route) {
        var _ = this;
        _.routes.push(new Route(route, _));

        _.routes.sort(function (a, b) {
            if (!a.hasParams && b.hasParams) return -1;
            if (a.hasParams && !b.hasParams) return 1;
            if (a.pathString < b.pathString) return -1;
            if (a.pathString > b.pathString) return 1;
            return 0;
        });
    },
    set404: function set404(route) {
        var _ = this;

        _.page404 = new Route(route, _, true);
    },
    go404: function go404() {
        var _ = this;

        if (_.page404) {
            _._go(
                _.page404,
                window.location.pathname,
                window.location.search,
                window.location.hash,
                true
            );
        } else {
            console.warn('Page Not Found: ' + path + ' - no 404 route set.');
        }
    },

    _go: function _go(route, path, search, hash, fromPopstate, noGo) {
        var _ = this;

        var isRedirect = false;
        if (_._routeInProgress) {
            _._routeRedirect = route;
            isRedirect = true;
        }

        _._routeInProgress = route;

        if (typeof route.title !== 'undefined') {
            document.title = route.title;
        }

        path = _.resolve(path);
        var fullPath = path;

        if (search) {
            fullPath += search;
        }

        if (hash) {
            fullPath += hash;
        }

        var proceed = _._beforeRouteChange() ? false : true;

        if (proceed) {
            proceed = route.handleRoute(path, search, hash, fullPath, noGo);
        }

        if (proceed === false || (_._routeRedirect && _._routeRedirect !== route)) {
            return;
        }

        if (_.mode === 'path') {
            if (!fromPopstate) {
                history.pushState({
                    path: fullPath
                }, route.title, fullPath);
            }
        } else {
            if (!fromPopstate) {
                _.unbindHash();
                window.location.hash = fullPath;
                setTimeout(function () {

                    _.bindHash();
                }, 0);
            }
        }

        _._path = path;
        _._search = search;
        _._hash = hash;

        if (!isRedirect) {
            delete _._routeInProgress;
            delete _._routeRedirect;
        }
    },
    go: function go(path, fromPopstate, noGo) {
        var _ = this;

        var hash;
        var search;

        if (path === null) {
            if (_.mode === 'path') {
                path = window.location.pathname;
                search = window.location.search;
                hash = window.location.hash;
            } else {
                path = _.unresolve(window.location.hash.slice(1));
            }
        }

        if (!search && !hash) {
            var hashIndex = path.indexOf('#');
            var searchIndex = path.indexOf('?');

            if (hashIndex !== -1) {
                hash = path.slice(hashIndex);
                path = path.slice(0, hashIndex);
            }

            if (searchIndex !== -1) {
                search = path.slice(searchIndex);
                path = path.slice(0, searchIndex);
            }
        }

        path = _.unresolve(_.resolve(path));

        if ( // if route is same current don't proceed.
            _._path === path &&
            _._search === search &&
            _._hash === hash
        ) return;

        var route = _.page404 || null;

        for (var i = 0; i < _.routes.length; i++) {
            if (_.routes[i].shouldTrigger(path)) {
                route = _.routes[i];
                break;
            }
        }

        if (route) {
            _._go(route, path, search, hash, fromPopstate, noGo);
        } else {
            console.warn('Page Not Found: ' + path + ' - no 404 route set.');
        }
    },
    resolve: function resolve(path) {
        var _ = this;

        if (_.root && _.mode !== 'hash') {
            path = _.root + '/' + path;
        }

        path = '/' + path;

        return path.replace(/[\/]+/g, '/');
    },
    unresolve: function unresolve(path) {
        var _ = this;

        if (_.root && _.mode !== 'hash' && path.indexOf(_.root) === 0) {
            path = path.slice(_.root.length);
        }

        return path.replace(/[\/]+/g, '/');
    }
});

module.exports = BrowserRouter;
