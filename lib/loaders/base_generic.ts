// -*- mode: typescript; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Thingpedia
//
// Copyright 2019-2020 The Board of Trustees of the Leland Stanford Junior University
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>

import * as ThingTalk from 'thingtalk';

import * as Utils from '../utils';
import { makeBaseDeviceMetadata } from '../compat';
import * as ConfigMixins from '../config';
import BaseDevice from '../base_device';

import type BaseEngine from '../base_engine';

export default class BaseGenericModule {
    protected _id : string;
    protected _manifest : ThingTalk.Ast.ClassDef;
    protected _loaded : BaseDevice.DeviceClass<BaseDevice>|null;
    protected _config : ConfigMixins.Base|null;

    constructor(kind : string, ast : ThingTalk.Ast.ClassDef) {
        this._id = kind;
        this._manifest = ast;
        this._loaded = null;

        this._config = ConfigMixins.get(this._manifest);
    }

    protected _loadModule() {
        let params : string[] = [];
        if (this._config) {
            if (this._config.module === 'org.thingpedia.config.form')
                // eslint-disable-next-line @typescript-eslint/ban-types
                params = Object.keys(Utils.findMixinArg(this._config.mixin, 'params') as {});
            else if (this._config.module === 'org.thingpedia.config.oauth2')
                params = Utils.findMixinArg(this._config.mixin, 'profile') as string[] || [];
        }

        const newClass = class GenericDevice extends BaseDevice {
            params : unknown[];

            constructor(engine : BaseEngine, state : BaseDevice.DeviceState) {
                super(engine, state);
                this.params = params.map((k) => state[k]);
            }

            async checkAvailable() {
                return BaseDevice.Availability.AVAILABLE;
            }
        };
        if (this._config)
            this._config.install(newClass);
        newClass.manifest = this._manifest;
        newClass.metadata = makeBaseDeviceMetadata(this._manifest);
        this._loaded = newClass;
    }

    get id() {
        return this._id;
    }
    get manifest() {
        return this._manifest;
    }
    get version() {
        return this._manifest.getImplementationAnnotation<number>('version')!;
    }
    get config() {
        return this._config;
    }

    clearCache() {
        // nothing to do here
    }

    getDeviceClass() : Promise<BaseDevice.DeviceClass<BaseDevice>> {
        if (this._loaded === null) {
            try {
                this._loadModule();
            } catch(e) {
                this._loaded = null;
                return Promise.reject(e);
            }
        }
        return Promise.resolve(this._loaded!);
    }
}
