// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of ThingEngine
//
// Copyright 2015-2016 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details
"use strict";

const Url = require('url');
const ip = require('ip');
const Q = require('q');

const HttpHelpers = require('./http');

module.exports = {
    isPubliclyAccessible(url) {
        var parsed = Url.parse(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
            return false;
        if (!ip.isV4Format(parsed.hostname) && !ip.isV6Format(parsed.hostname))
            return true;
        return ip.isPublic(parsed.hostname);
    },

    getStream(platform, url) {
        if (url.startsWith('http'))
            return HttpHelpers.getStream(url);

        var contentApi = platform.getCapability('content-api');
        if (contentApi === null)
            throw new Error('Unable to handle URL ' + url);

        return contentApi.getStream(url);
    }
}