/*
* Copyright (c) 2024 Software AG, Darmstadt, Germany and/or its licensors
*
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
 */

export interface displayName {
    en ?: string;
}

export interface contents {
    '@id' ?: String;
    '@type' ?: String[];
    displayName ?: displayName;
    name ?: String;
    schema ?: String;
    unit ?: String;
}

export interface dtdlObject {
    "@context" ?: string;
    "@id" ?: string;
    "@type" ?: string;
    contents ?: contents[];
    displayName ?: displayName;
}

export interface metadata{
    hideSimulatorName?: boolean,
    name?: string,
    icon?: string,
    description?: string
}

export interface dtdlModelConfig{
    schema?: string,
    fragment?: string,
    unit?: string,
    isObjectType?: boolean,
    series?: string,
    matchingValue?: string,
    eventText?: string,
    simulationType?: string,
    alternateConfigs?: alternateConfigs
    id?: string,
    eventType?: string,
    measurementName?: string
}

export interface operations{
    schema?: string,
    isObjectType?: boolean,
    maxValue?:number | string,
    simulationType?: string,
    dtdlDeviceId?: number | string,
    matchingValue?: string,
    modalSize?: string,
    interval?: Number | string,
    alternateConfigs?: alternateConfigs,
    dtdlModelConfig?: any[],
    deviceId?: string | number,
    eventType?: string,
    measurementName?: string,
    fragment?: string,
    unit?: string,
    minValue?: number | string,
    series?: string,
    eventText?: string,
    id?: string,
    value?: string
}

export interface alternateConfigs{
    configIndex?: number | string,
    opSourceName?: string,
    payloadFragment?: string,
    operations?: operations[],
    opEnabled?: boolean,
    opReply?: boolean,
    opSource?: string
}

export interface config{
    serverSide?: Boolean,
    dtdlDeviceId?: String,
    metadata?: metadata,
    intervalInvalid?: Boolean,
    matchingValue?: String,
    modalSize?: String,
    interval?: Number | String,
    alternateConfigs?: alternateConfigs,
    isGroup?: boolean,
    dtdlModelConfig?: any[],
    deviceName?: string,
    deviceId?: string | number
}

export interface dtdlSimulator{
    serverSide?: boolean,
    lastUpdated?: Date | string,
    name?: string,
    id?: string | number,
    type?: string,
    config?: config
}