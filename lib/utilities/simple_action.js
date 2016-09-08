// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of ThingEngine
//
// Copyright 2015 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details

const Q = require('q');

const lang = require('../lang');
const BaseChannel = require('../base_channel');
const Helpers = require('../helpers');

module.exports = new lang.Class({
    Name: 'SimpleAction',
    Extends: BaseChannel,

    _init: function() {
        this.parent.apply(this, arguments);
        console.log('SimpleAction is deprecated. Use a pure ActionClass and override sendEvent.');
    },

    _doInvoke: function() {
        throw new Error('Must override doInvoke for a SimpleAction');
    },

    sendEvent: function(args) {
        return this._doInvoke.apply(this, args);
    },
});
