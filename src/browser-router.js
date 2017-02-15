var BrowserRouter =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Generator = __webpack_require__(1);
	var queryString = __webpack_require__(2);

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
	    handleRoute: function handleRoute(path, search, hash, fullPath) {
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

	BrowserRouter.definePrototype({
	    start: function start() {
	        var _ = this;

	        _.go(null, true);
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

	    _go: function _go(route, path, search, hash, fromPopstate) {
	        var _ = this;

	        var isRedirect = false;
	        if (_._routeInProgress) {
	            _._routeRedirect = route;
	            isRedirect = true;
	        }

	        _._routeInProgress = route;

	        document.title = route.title;

	        path = _.resolve(path);
	        var fullPath = path;

	        if (search) {
	            fullPath += search;
	        }

	        if (hash) {
	            fullPath += hash;
	        }

	        var proceed = route.handleRoute(path, search, hash, fullPath);

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
	    go: function go(path, fromPopstate) {
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
	            _._go(route, path, search, hash, fromPopstate);
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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * @name generate.js
	 * @author Michaelangelo Jong
	 */

	(function GeneratorScope() {
	    /**
	     * Assert Error function.
	     * @param  {Boolean} condition Whether or not to throw error.
	     * @param  {String} message    Error message.
	     */
	    function assertError(condition, message) {
	        if (!condition) {
	            throw new Error(message);
	        }
	    }

	    /**
	     * Assert TypeError function.
	     * @param  {Boolean} condition Whether or not to throw error.
	     * @param  {String} message    Error message.
	     */
	    function assertTypeError(test, type) {
	        if (typeof test !== type) {
	            throw new TypeError('Expected \'' + type +
	                '\' but instead found \'' +
	                typeof test + '\'');
	        }
	    }

	    /**
	     * Returns the name of function 'func'.
	     * @param  {Function} func Any function.
	     * @return {String}        Name of 'func'.
	     */
	    function getFunctionName(func) {
	        if (func.name !== void(0)) {
	            return func.name;
	        }
	        // Else use IE Shim
	        var funcNameMatch = func.toString()
	            .match(/function\s*([^\s]*)\s*\(/);
	        func.name = (funcNameMatch && funcNameMatch[1]) || '';
	        return func.name;
	    }

	    /**
	     * Returns true if 'obj' is an object containing only get and set functions, false otherwise.
	     * @param  {Any} obj Value to be tested.
	     * @return {Boolean} true or false.
	     */
	    function isGetSet(obj) {
	        var keys, length;
	        if (obj && typeof obj === 'object') {
	            keys = Object.getOwnPropertyNames(obj)
	                .sort();
	            length = keys.length;

	            if ((length === 1 && (keys[0] === 'get' && typeof obj.get ===
	                    'function' ||
	                    keys[0] === 'set' && typeof obj.set === 'function'
	                )) ||
	                (length === 2 && (keys[0] === 'get' && typeof obj.get ===
	                    'function' &&
	                    keys[1] === 'set' && typeof obj.set === 'function'
	                ))) {
	                return true;
	            }
	        }
	        return false;
	    }

	    /**
	     * Defines properties on 'obj'.
	     * @param  {Object} obj        An object that 'properties' will be attached to.
	     * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties on 'properties'.
	     * @param  {Object} properties An object who's properties will be attached to 'obj'.
	     * @return {Generator}         'obj'.
	     */
	    function defineObjectProperties(obj, descriptor, properties) {
	        var setProperties = {},
	            i,
	            keys,
	            length,

	            p = properties || descriptor,
	            d = properties && descriptor;

	        properties = (p && typeof p === 'object') ? p : {};
	        descriptor = (d && typeof d === 'object') ? d : {};

	        keys = Object.getOwnPropertyNames(properties);
	        length = keys.length;

	        for (i = 0; i < length; i++) {
	            if (isGetSet(properties[keys[i]])) {
	                setProperties[keys[i]] = {
	                    configurable: !!descriptor.configurable,
	                    enumerable: !!descriptor.enumerable,
	                    get: properties[keys[i]].get,
	                    set: properties[keys[i]].set
	                };
	            } else {
	                setProperties[keys[i]] = {
	                    configurable: !!descriptor.configurable,
	                    enumerable: !!descriptor.enumerable,
	                    writable: !!descriptor.writable,
	                    value: properties[keys[i]]
	                };
	            }
	        }
	        Object.defineProperties(obj, setProperties);
	        return obj;
	    }



	    var Creation = {
	        /**
	         * Defines properties on this object.
	         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
	         * @param  {Object} properties An object who's properties will be attached to this object.
	         * @return {Object}            This object.
	         */
	        defineProperties: function defineProperties(descriptor,
	            properties) {
	            defineObjectProperties(this, descriptor,
	                properties);
	            return this;
	        },

	        /**
	         * returns the prototype of `this` Creation.
	         * @return {Object} Prototype of `this` Creation.
	         */
	        getProto: function getProto() {
	            return Object.getPrototypeOf(this);
	        },

	        /**
	         * returns the prototype of `this` super Creation.
	         * @return {Object} Prototype of `this` super Creation.
	         */
	        getSuper: function getSuper() {
	            return Object.getPrototypeOf(this.constructor.prototype);
	        }
	    };

	    var Generation = {
	        /**
	         * Returns true if 'generator' was generated by this Generator.
	         * @param  {Generator} generator A Generator.
	         * @return {Boolean}             true or false.
	         */
	        isGeneration: function isGeneration(generator) {
	            assertTypeError(generator, 'function');

	            var _ = this;

	            return _.prototype.isPrototypeOf(generator.prototype);
	        },

	        /**
	         * Returns true if 'object' was created by this Generator.
	         * @param  {Object} object An Object.
	         * @return {Boolean}       true or false.
	         */
	        isCreation: function isCreation(object) {
	            var _ = this;
	            return object instanceof _;
	        },
	        /**
	         * Generates a new generator that inherits from `this` generator.
	         * @param {Generator} ParentGenerator Generator to inherit from.
	         * @param {Function} create           Create method that gets called when creating a new instance of new generator.
	         * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
	         */
	        generate: function generate(construct) {
	            assertTypeError(construct, 'function');

	            var _ = this;

	            defineObjectProperties(
	                construct, {
	                    configurable: false,
	                    enumerable: false,
	                    writable: false
	                }, {
	                    prototype: Object.create(_.prototype)
	                }
	            );

	            defineObjectProperties(
	                construct, {
	                    configurable: false,
	                    enumerable: false,
	                    writable: false
	                },
	                Generation
	            );

	            defineObjectProperties(
	                construct.prototype, {
	                    configurable: false,
	                    enumerable: false,
	                    writable: false
	                }, {
	                    constructor: construct,
	                    generator: construct,
	                }
	            );

	            return construct;
	        },

	        /**
	         * Defines shared properties for all objects created by this generator.
	         * @param  {Object} descriptor Optional object descriptor that will be applied to all attaching properties.
	         * @param  {Object} properties An object who's properties will be attached to this generator's prototype.
	         * @return {Generator}         This generator.
	         */
	        definePrototype: function definePrototype(descriptor,
	            properties) {
	            defineObjectProperties(this.prototype,
	                descriptor,
	                properties);
	            return this;
	        }
	    };

	    function Generator() {}

	    defineObjectProperties(
	        Generator, {
	            configurable: false,
	            enumerable: false,
	            writable: false
	        }, {
	            prototype: Generator.prototype
	        }
	    );

	    defineObjectProperties(
	        Generator.prototype, {
	            configurable: false,
	            enumerable: false,
	            writable: false
	        },
	        Creation
	    );

	    defineObjectProperties(
	        Generator, {
	            configurable: false,
	            enumerable: false,
	            writable: false
	        },
	        Generation
	    );

	    defineObjectProperties(
	        Generator, {
	            configurable: false,
	            enumerable: false,
	            writable: false
	        }, {
	            /**
	             * Returns true if 'generator' was generated by this Generator.
	             * @param  {Generator} generator A Generator.
	             * @return {Boolean}             true or false.
	             */
	            isGenerator: function isGenerator(generator) {
	                return this.isGeneration(generator);
	            },

	            /**
	             * Generates a new generator that inherits from `this` generator.
	             * @param {Generator} extendFrom      Constructor to inherit from.
	             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
	             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
	             */
	            toGenerator: function toGenerator(extendFrom, create) {
	                console.warn(
	                    'Generator.toGenerator is depreciated please use Generator.generateFrom'
	                );
	                return this.generateFrom(extendFrom, create);
	            },

	            /**
	             * Generates a new generator that inherits from `this` generator.
	             * @param {Constructor} extendFrom    Constructor to inherit from.
	             * @param {Function} create           Create method that gets called when creating a new instance of new generator.
	             * @return {Generator}                New Generator that inherits from 'ParentGenerator'.
	             */
	            generateFrom: function generateFrom(extendFrom, create) {
	                assertTypeError(extendFrom, 'function');
	                assertTypeError(create, 'function');

	                defineObjectProperties(
	                    create, {
	                        configurable: false,
	                        enumerable: false,
	                        writable: false
	                    }, {
	                        prototype: Object.create(extendFrom.prototype),
	                    }
	                );

	                defineObjectProperties(
	                    create, {
	                        configurable: false,
	                        enumerable: false,
	                        writable: false
	                    },
	                    Generation
	                );

	                defineObjectProperties(
	                    create.prototype, {
	                        configurable: false,
	                        enumerable: false,
	                        writable: false
	                    }, {
	                        constructor: create,
	                        generator: create,
	                    }
	                );

	                defineObjectProperties(
	                    create.prototype, {
	                        configurable: false,
	                        enumerable: false,
	                        writable: false
	                    },
	                    Creation
	                );

	                return create;
	            }
	        }
	    );

	    Object.freeze(Generator);
	    Object.freeze(Generator.prototype);

	    // Exports
	    if (true) {
	        // AMD
	        !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	            return Generator;
	        }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module === 'object' && typeof exports === 'object') {
	        // Node/CommonJS
	        module.exports = Generator;
	    } else {
	        // Browser global
	        window.Generator = Generator;
	    }

	}());


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strictUriEncode = __webpack_require__(3);
	var objectAssign = __webpack_require__(4);

	function encoderForArrayFormat(opts) {
		switch (opts.arrayFormat) {
			case 'index':
				return function (key, value, index) {
					return value === null ? [
						encode(key, opts),
						'[',
						index,
						']'
					].join('') : [
						encode(key, opts),
						'[',
						encode(index, opts),
						']=',
						encode(value, opts)
					].join('');
				};

			case 'bracket':
				return function (key, value) {
					return value === null ? encode(key, opts) : [
						encode(key, opts),
						'[]=',
						encode(value, opts)
					].join('');
				};

			default:
				return function (key, value) {
					return value === null ? encode(key, opts) : [
						encode(key, opts),
						'=',
						encode(value, opts)
					].join('');
				};
		}
	}

	function parserForArrayFormat(opts) {
		var result;

		switch (opts.arrayFormat) {
			case 'index':
				return function (key, value, accumulator) {
					result = /\[(\d*)]$/.exec(key);

					key = key.replace(/\[\d*]$/, '');

					if (!result) {
						accumulator[key] = value;
						return;
					}

					if (accumulator[key] === undefined) {
						accumulator[key] = {};
					}

					accumulator[key][result[1]] = value;
				};

			case 'bracket':
				return function (key, value, accumulator) {
					result = /(\[])$/.exec(key);

					key = key.replace(/\[]$/, '');

					if (!result || accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};

			default:
				return function (key, value, accumulator) {
					if (accumulator[key] === undefined) {
						accumulator[key] = value;
						return;
					}

					accumulator[key] = [].concat(accumulator[key], value);
				};
		}
	}

	function encode(value, opts) {
		if (opts.encode) {
			return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
		}

		return value;
	}

	function keysSorter(input) {
		if (Array.isArray(input)) {
			return input.sort();
		} else if (typeof input === 'object') {
			return keysSorter(Object.keys(input)).sort(function (a, b) {
				return Number(a) - Number(b);
			}).map(function (key) {
				return input[key];
			});
		}

		return input;
	}

	exports.extract = function (str) {
		return str.split('?')[1] || '';
	};

	exports.parse = function (str, opts) {
		opts = objectAssign({arrayFormat: 'none'}, opts);

		var formatter = parserForArrayFormat(opts);

		// Create an object with no prototype
		// https://github.com/sindresorhus/query-string/issues/47
		var ret = Object.create(null);

		if (typeof str !== 'string') {
			return ret;
		}

		str = str.trim().replace(/^(\?|#|&)/, '');

		if (!str) {
			return ret;
		}

		str.split('&').forEach(function (param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			// Firefox (pre 40) decodes `%3D` to `=`
			// https://github.com/sindresorhus/query-string/pull/37
			var key = parts.shift();
			var val = parts.length > 0 ? parts.join('=') : undefined;

			// missing `=` should be `null`:
			// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
			val = val === undefined ? null : decodeURIComponent(val);

			formatter(decodeURIComponent(key), val, ret);
		});

		return Object.keys(ret).sort().reduce(function (result, key) {
			var val = ret[key];
			if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
				// Sort object keys, not values
				result[key] = keysSorter(val);
			} else {
				result[key] = val;
			}

			return result;
		}, Object.create(null));
	};

	exports.stringify = function (obj, opts) {
		var defaults = {
			encode: true,
			strict: true,
			arrayFormat: 'none'
		};

		opts = objectAssign(defaults, opts);

		var formatter = encoderForArrayFormat(opts);

		return obj ? Object.keys(obj).sort().map(function (key) {
			var val = obj[key];

			if (val === undefined) {
				return '';
			}

			if (val === null) {
				return encode(key, opts);
			}

			if (Array.isArray(val)) {
				var result = [];

				val.slice().forEach(function (val2) {
					if (val2 === undefined) {
						return;
					}

					result.push(formatter(key, val2, result.length));
				});

				return result.join('&');
			}

			return encode(key, opts) + '=' + encode(val, opts);
		}).filter(function (x) {
			return x.length > 0;
		}).join('&') : '';
	};


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	module.exports = function (str) {
		return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
			return '%' + c.charCodeAt(0).toString(16).toUpperCase();
		});
	};


/***/ },
/* 4 */
/***/ function(module, exports) {

	/*
	object-assign
	(c) Sindre Sorhus
	@license MIT
	*/

	'use strict';
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ }
/******/ ]);