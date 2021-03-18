// -*- mode: typescript; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Thingpedia
//
// Copyright 2019 The Board of Trustees of the Leland Stanford Junior University
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

import Mixins from './mixins.json';

export type DeviceCategory = 'data'|'online'|'physical'|'system';

export interface DeviceListRecord {
    name : string;
    description : string;
    primary_kind : string;
    website : string;
    repository : string;
    issue_tracker : string;
    license : string;
    category : DeviceCategory;
    subcategory : string;
}

interface NoneDeviceFactory {
    type : 'none';
    category : DeviceCategory;
    kind : string;
    text : string;
}

interface OAuthDeviceFactory {
    type : 'oauth2';
    category : DeviceCategory;
    kind : string;
    text : string;
}

interface InteractiveDeviceFactory {
    type : 'interactive';
    category : DeviceCategory;
    kind : string;
    text : string;
}

interface DiscoveryDeviceFactory {
    type : 'discovery';
    category : DeviceCategory;
    kind : string;
    text : string;
    discoveryType : string;
}

export interface FormField {
    name : string;
    label : string;
    type : string;
}

interface FormDeviceFactory {
    type : 'form';
    category : DeviceCategory;
    kind : string;
    text : string;
    fields : FormField[];
}

export type DeviceFactory =
    NoneDeviceFactory |
    OAuthDeviceFactory |
    InteractiveDeviceFactory |
    DiscoveryDeviceFactory |
    FormDeviceFactory;
export interface MultipleDeviceFactory {
    type : 'multiple';
    text : string;
    choices : DeviceFactory[];
}

export interface EntityRecord {
    type : string;
    value : string;
    canonical : string;
    name : string;
}

export interface EntityLookupResult {
    meta : {
        name : string;
        is_well_known : boolean|number;
        has_ner_support : boolean|number;
    };
    data : EntityRecord[];
}

export interface EntityTypeRecord {
    type : string;
    name : string;
    is_well_known : boolean|number;
    has_ner_support : boolean|number;
}

export interface LocationInput {
    latitude : number;
    longitude : number;
}

export interface LocationRecord {
    latitude : number;
    longitude : number;
    display : string;
    canonical : string;
    full_name : string;
    rank : number;
    importance : number;
    address : any;
}

export interface DeviceNameRecord {
    kind : string;
    kind_canonical : string;
}

export interface MixinDeclaration {
    kind : string;
    types : string[];
    args : string[];
    required : boolean[];
    is_input : boolean[];
    facets : string[];
}

/**
 * The base class of all clients to access the Thingpedia API.
 *
 * Accessing the Thingpedia API from Almond occurs in a platform-specific manner,
 * through clients that extend this class.
 *
 * @interface
 */
export default abstract class BaseClient {
    /**
     * @protected
     */
    constructor() {
    }

    /**
     * The locale to use when querying Thingpedia, as BCP 47 tag.
     */
    abstract get locale() : string;

    abstract getModuleLocation(id : string) : Promise<string>;

    abstract getDeviceCode(id : string) : Promise<string>;

    abstract getSchemas(kinds : string[], withMetadata ?: boolean) : Promise<string>;

    abstract getDeviceList(klass ?: string, page ?: number, page_size ?: number) : Promise<DeviceListRecord[]>;

    abstract searchDevice(q : string) : Promise<DeviceListRecord[]>;

    abstract getDeviceFactories(klass : string) : Promise<DeviceFactory[]>;

    abstract getDeviceSetup(kinds : string[]) : Promise<{ [key : string] : DeviceFactory|MultipleDeviceFactory|null }>;

    abstract getKindByDiscovery(publicData : any) : Promise<string>;

    abstract getExamplesByKey(key : string) : Promise<string>;

    abstract getExamplesByKinds(kinds : string[]) : Promise<string>;

    abstract clickExample(exampleId : number) : Promise<void>;

    abstract lookupEntity(entityType : string, searchTerm : string) : Promise<EntityLookupResult>;

    abstract lookupLocation(searchTerm : string, around ?: LocationInput) : Promise<LocationRecord[]>;

    abstract getAllExamples() : Promise<string>;

    abstract getAllDeviceNames() : Promise<DeviceNameRecord[]>;

    abstract getAllEntityTypes() : Promise<EntityTypeRecord[]>;

    getMixins() : Promise<{ [key : string] : MixinDeclaration }> {
        const mixins : { [key : string] : MixinDeclaration } = {};
        for (const mixin of Mixins.data)
            mixins[mixin.kind] = mixin;
        return Promise.resolve(mixins);
    }
}
