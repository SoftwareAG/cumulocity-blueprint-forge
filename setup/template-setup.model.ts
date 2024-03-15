/*
* Copyright (c) 2023 Software AG, Darmstadt, Germany and/or its licensors
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

import { TemplateCatalogEntry } from "./../builder/template-catalog/template-catalog.model";

// This is for storing configuration
export interface BlueprintForge {
    templateURL?: string;
    selectedStepperIndex?: number;
    plugins?: PluginDetails[];
    microservices?: MicroserviceDetails[];
    dashboards: Dashboards[];
}
export interface TemplateBlueprintEntry {
    templateId: string;
    title: string;
    description: string;
    thumbnail: string;
    config: string;
    comingSoon: boolean;
}

export interface TemplateBlueprintDetails {
    templateId: string;
    title: string;
    tagLine: string;
    description: string;
    media?: MediaDetails[];
    plugins?: PluginDetails[];
    microservices?: MicroserviceDetails[];
    dashboards: Dashboards[];
    dashboardLinks?:DashboardLink [];
    input : {
        devices?: DeviceDetails[];
    }
}

export interface MediaDetails {
    image: string;
    thumbImage: string;
}

export interface PluginDetails  {
    id: string;
    contextPath: string,
    title: string;
    description: string;
    link: string;
    requiredPlatformVersion: string;
    selected?: boolean;
}

export interface MicroserviceDetails {
    id: string;
    title: string;
    link: string;
    description: string;
    selected?: boolean;
}

export interface Dashboards {
    welcomeTemplates: any;
    title: string;
    icon: string;
    isDeviceRequired: boolean;
    dashboard: string;
    description: string;
    selected?: boolean;
    configured?: boolean;
    deviceId?: string;
    dashboardWidgets: DashboardWidgets[];
    isSelectAsset: boolean;
    isSelectType: boolean;
    isSelectGroup: boolean;
    isGroupDashboard: boolean;
    visibility: boolean;
    isMandatory: boolean;
    dashboardTemplate?: TemplateCatalogEntry[];
    linkWithDashboard?: string;
    devices?: DeviceDetails[];
    isSimulatorConfigExist?: boolean;
    templateType?: number;
    basicConfig?: WidgetDetail[];
    isConfigRequred?: boolean;
}
export interface DashboardWidgets {
    id?: string;
    name: string;
    _x: number;
    _y: number;
    _height: number;
    _width: number;
    config: object;
    position?: number;
    title?: string;
    templateUrl?: string;
    configTemplateUrl?: string;
}

/* export interface CSSClasses {
    image: boolean;
    cardDashboard: boolean;
    panelTitleRegular:  boolean;
    card: boolean
} */

 export interface DeviceDetails {
    type: string;
    placeholder: string;
    reprensentation?: {
        id: string;
        name: string;
    };
} 

export interface DashboardLink {
    dashboardName: string;
    updatableProperty?: string;
    targetDashboardName: string;
    targetProperty?: string;
    widgetComponentId?: string;
}

export interface WidgetDetail {
    componentId?: string;
    title?: string;
    config?: WidgetConfig[];
}

export interface WidgetConfig {
    type?: string;
    fieldName?: string;
    name?: string;
}










