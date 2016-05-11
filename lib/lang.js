/* -*- mode: js; indent-tabs-mode: nil; -*- */
// Copyright (c) 2008  litl, LLC
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// Utilities that are "meta-language" things like manipulating object props

function getPropertyDescriptor(obj, property) {
    if (obj.hasOwnProperty(property))
        return Object.getOwnPropertyDescriptor(obj, property);
    return getPropertyDescriptor(Object.getPrototypeOf(obj), property);
}

function _copyProperty(source, dest, property) {
    var descriptor = getPropertyDescriptor(source, property);
    Object.defineProperty(dest, property, descriptor);
}

function copyProperties(source, dest) {
    for (var property in source) {
        _copyProperty(source, dest, property);
    }
}

function copyPublicProperties(source, dest) {
    for (var property in source) {
        if (typeof(property) == 'string' &&
            property.substring(0, 1) == '_') {
            continue;
        } else {
            _copyProperty(source, dest, property);
        }
    }
}

// Class magic
// Adapted from MooTools, MIT license
// https://github.com/mootools/moootools-core

function _Base() {
    throw new TypeError('Cannot instantiate abstract class _Base');
}

_Base.__super__ = null;
_Base.prototype._init = function() { };
_Base.prototype.__name__ = '_Base';
_Base.prototype.toString = function() {
    return '[object ' + this.__name__ + ']';
};

function _parent() {
    if (!this.__caller__)
        throw new TypeError("The method 'parent' cannot be called");

    var caller = this.__caller__;
    var name = caller._name;
    var parent = caller._owner.__super__;

    var previous = parent ? parent.prototype[name] : undefined;

    if (!previous)
        throw new TypeError("The method '" + name + "' is not on the superclass");

    return previous.apply(this, arguments);
}

function Class(params) {
    return this._construct.apply(this, arguments);
}

Class.__super__ = _Base;
Class.prototype = Object.create(_Base.prototype);
Class.prototype.constructor = Class;
Class.prototype.__name__ = 'Class';

Class.prototype.wrapFunction = function(name, meth) {
    if (meth._origin) meth = meth._origin;

    function wrapper() {
        var prevCaller = this.__caller__;
        this.__caller__ = wrapper;
        var result = meth.apply(this, arguments);
        this.__caller__ = prevCaller;
        return result;
    }

    wrapper._origin = meth;
    wrapper._name = name;
    wrapper._owner = this;

    return wrapper;
}

Class.prototype.toString = function() {
    return '[object ' + this.__name__ + ' for ' + this.prototype.__name__ + ']';
};

Class.prototype._construct = function(params) {
    if (!params.Name) {
        throw new TypeError("Classes require an explicit 'Name' parameter.");
    }
    var name = params.Name;

    var parent = params.Extends;
    if (!parent)
        parent = _Base;

    var newClass;
    if (params.Abstract) {
        newClass = function() {
            throw new TypeError('Cannot instantiate abstract class ' + name);
        };
    } else {
        if (parent.prototype._construct || params._construct) {
            newClass = function() {
                return this._construct.apply(this, arguments);
            };
        } else {
            newClass = function() {
                this.__caller__ = null;
                this._init.apply(this, arguments);
            };
        }
    }

    // Since it's not possible to create a constructor with
    // a custom [[Prototype]], we have to do this to make
    // "newClass instanceof Class" work, and so we can inherit
    // methods/properties of Class.prototype, like wrapFunction.
    Object.setPrototypeOf(newClass, this.constructor.prototype);

    newClass.__super__ = parent;
    newClass.prototype = Object.create(parent.prototype);
    newClass.prototype.constructor = newClass;

    newClass._init.apply(newClass, arguments);

    return newClass;
};

Class.prototype._init = function(params) {
    var name = params.Name;

    var propertyObj = { };

    Object.getOwnPropertyNames(params).forEach(function(name) {
        if (['Name', 'Extends', 'Abstract'].indexOf(name) !== -1)
            return;

        var descriptor = Object.getOwnPropertyDescriptor(params, name);

        if (typeof descriptor.value === 'function')
            descriptor.value = this.wrapFunction(name, descriptor.value);

        // we inherit writable and enumerable from the property
        // descriptor of params (they're both true if created from an
        // object literal)
        descriptor.configurable = false;

        propertyObj[name] = descriptor;
    }.bind(this));

    Object.defineProperties(this.prototype, propertyObj);
    Object.defineProperties(this.prototype, {
        '__name__': { writable: false,
                      configurable: false,
                      enumerable: false,
                      value: name },
        'parent': { writable: false,
                    configurable: false,
                    enumerable: false,
                    value: _parent }});
};

module.exports =
    { Class: Class,
      copyProperties: copyProperties,
      getPropertyDescriptor: getPropertyDescriptor
    };