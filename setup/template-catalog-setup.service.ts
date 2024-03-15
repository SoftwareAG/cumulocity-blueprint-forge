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
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { has, get } from "lodash-es";
import { ApplicationService, InventoryBinaryService, InventoryService } from "@c8y/ngx-components/api";
import { CumulocityDashboard, TemplateCatalogEntry } from "./../builder/template-catalog/template-catalog.model";
import { TemplateBlueprintDetails, TemplateBlueprintEntry } from "./template-setup.model";
import { AppBuilderExternalAssetsService } from "app-builder-external-assets";

const packageJson = require('./../package.json');
@Injectable()
export class TemplateCatalogSetupService {

    private GATEWAY_URL_GitHubAsset = '';
    private GATEWAY_URL_GitHubAPI = '';
    private GATEWAY_URL_GitHubAsset_FallBack = '';
    private GATEWAY_URL_GitHubAPI_FallBack = '';
    private bluePrintTemplatePath = '/blueprintForge/template.json';
    private devBranchPath = "?ref=blueprint-forge";
    private preprodBranchPath = "?ref=preprod";
    pkgVersion: any;
    private isFallBackActive = false;
    public templateData = new BehaviorSubject<TemplateBlueprintDetails>(undefined);
    templateData$ = this.templateData.asObservable();

    public welcomeTemplateData = new BehaviorSubject<TemplateCatalogEntry>(undefined);
    welcomeTemplateData$ = this.welcomeTemplateData.asObservable();

    public blankTemplate = new BehaviorSubject(false);
    blankTemplate$ = this.blankTemplate.asObservable();

    public welcomeTemplateSelected = new BehaviorSubject("Default Template");
    welcomeTemplateSelected$ = this.welcomeTemplateSelected.asObservable();

    public dynamicDashboardTemplate = new BehaviorSubject<any>(undefined);
    dynamicDashboardTemplate$ = this.dynamicDashboardTemplate.asObservable();

    public dynamicDashboardTemplateDetails =  new BehaviorSubject<any>(undefined);
    dynamicDashboardTemplateDetails$ = this.dynamicDashboardTemplateDetails.asObservable();

    public indexOfDashboardToUpdateTemplate = new BehaviorSubject<any>(null); 
    indexOfDashboardToUpdateTemplate$ = this.indexOfDashboardToUpdateTemplate.asObservable();


    constructor(private http: HttpClient, private inventoryService: InventoryService,
        private appService: ApplicationService,
        private binaryService: InventoryBinaryService,
        private externalService: AppBuilderExternalAssetsService
    ) {

        this.GATEWAY_URL_GitHubAPI = this.externalService.getURL('GITHUB', 'gatewayURL_Github');
        this.GATEWAY_URL_GitHubAsset = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset');
        this.GATEWAY_URL_GitHubAPI_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_Github_Fallback');
        this.GATEWAY_URL_GitHubAsset_FallBack = this.externalService.getURL('GITHUB', 'gatewayURL_GitHubAsset_Fallback');
        this.pkgVersion = packageJson.version;

    }

    getTemplateCatalog(): Observable<TemplateBlueprintEntry[]> {
        let url = `${this.GATEWAY_URL_GitHubAPI}${this.bluePrintTemplatePath}`;
        if (this.pkgVersion.includes('dev')) {
            url = url + this.devBranchPath;
        } else if (this.pkgVersion.includes('rc')) {
            url = url + this.preprodBranchPath;
        }
        return this.getDataForTemplateCatalog(url);
    }

    getTemplateDetailsCatalog(dashboardurl): Observable<TemplateBlueprintDetails> {
        let url = `${this.GATEWAY_URL_GitHubAPI}${dashboardurl}`;
        if (this.pkgVersion.includes('dev')) {
            url = url + this.devBranchPath;
        } else if (this.pkgVersion.includes('rc')) {
            url = url + this.preprodBranchPath;
        }
        return this.getDataForTemplateDetailsCatalog(url);
    }

    getTemplateDetailsCatalogFallBack(dashboardurl): Observable<TemplateBlueprintDetails> {
        let url = `${this.GATEWAY_URL_GitHubAPI_FallBack}${dashboardurl}`;
        this.isFallBackActive = true;
        if (this.pkgVersion.includes('dev')) {
            url = url + this.devBranchPath;
        } else if (this.pkgVersion.includes('rc')) {
            url = url + this.preprodBranchPath;
        }
        return this.getDataForTemplateDetailsCatalog(url);
    }

    getTemplateCatalogFallBack(): Observable<TemplateBlueprintEntry[]> {
        let url = `${this.GATEWAY_URL_GitHubAPI_FallBack}${this.bluePrintTemplatePath}`;
        this.isFallBackActive = true;
        if (this.pkgVersion.includes('dev')) {
            url = url + this.devBranchPath;
        } else if (this.pkgVersion.includes('rc')) {
            url = url + this.preprodBranchPath;
        }
        return this.getDataForTemplateCatalog(url);
    }

    private getDataForTemplateCatalog(url: string): Observable<any> {
        return this.http.get(`${url}`).pipe(map(response => {
            if (!has(response, 'template')) {
                console.error('Failed to load catalog');
                return undefined;
            }
            let template = response['template'];
            let welcomeTemplate = response['welcomeTemplate'];
            
            welcomeTemplate.map(entry => {
                return {
                title: get(entry, 'dashboardName'),
                dashboard: get(entry, 'dashboard'),
                description: get(entry, 'description')
                } as TemplateCatalogEntry;
            });
            template.map(entry => {
                return {
                    title: get(entry, 'title'),
                    description: get(entry, 'description'),
                    thumbnail: get(entry, 'thumbnail'),
                    config: get(entry, 'config'),
                    comingSoon: get(entry, 'coming_soon'),
                } as TemplateBlueprintEntry;
            });
            let catalog = [template, welcomeTemplate];
            return catalog;
        }));
    }

    private getDataForTemplateDetailsCatalog(url: string): Observable<TemplateBlueprintDetails> {
        return this.http.get(`${url}`).pipe(map(response => {
            let catalog = response as Array<object>;
            return {
                templateId: get(catalog, "templateId"),
                title: get(catalog, 'title'),
                tagLine: get(catalog, 'tagLine'),
                media: get(catalog, 'media'),
                devices: get(catalog, 'devices'),
                plugins: get(catalog, 'plugins'),
                microservices: get(catalog, 'microservices'),
                dashboards: get(catalog, 'dashboards'),
                description: get(catalog, 'description'),
                dashboardLinks: get(catalog, 'dashboardLinks'),
                input: get(catalog, 'input')
            } as TemplateBlueprintDetails;

        }));
    }

    downloadBinary(binaryId: string): Observable<ArrayBuffer> {
        return this.http.get(`${this.GATEWAY_URL_GitHubAsset}${binaryId}`, {
            responseType: 'arraybuffer'
        })
            .pipe(catchError(err => {
                console.log('Template Catalog: Download Binary: Error in primary endpoint! using fallback...');
                return this.http.get(`${this.GATEWAY_URL_GitHubAsset_FallBack}${binaryId}`, {
                    responseType: 'arraybuffer'
                })
            }));
    }

    getGithubURL(relativePath: string) {
        let url = `${this.GATEWAY_URL_GitHubAPI}`;
        if (this.isFallBackActive) {
            url = `${this.GATEWAY_URL_GitHubAPI_FallBack}`;
        }
        if (this.pkgVersion.includes('dev')) {
            return url + `${relativePath}${this.devBranchPath}`;
        } else if (this.pkgVersion.includes('rc')) {
            return url + `${relativePath}${this.preprodBranchPath}`;
        }
        return url + `${relativePath}`;
    }

    getCumulocityDashboardRepresentation(dashboardConfiguration, widgets): CumulocityDashboard {
        return {
            children: this.getWidgetsAsChildren(widgets),
            name: 'Blueprint-Forge-Dashboard',    //dashboardConfiguration.dashboardName
            icon: '',         // dashboardConfiguration.dashboardIcon
            global: true,
            isFrozen: true,
        };
    }

    getDashboardFields(link) {

        return this.http.get(`${this.GATEWAY_URL_GitHubAsset}${link}`).pipe(map(response => {
            let dashboardFields = response as Array<object>;
        })).pipe(catchError(err => {
            console.log('Template Catalog: Download Binary: Error in primary endpoint! using fallback...');
            return this.http.get(`${this.GATEWAY_URL_GitHubAsset_FallBack}${link}`, {
                responseType: 'json'
            })
        }));

    }

    private getWidgetsAsChildren(widgets): object {
        let children = {};
        widgets.forEach(widget => {
            widget.id = this.generateId();
            children[this.generateId()] = widget;
        })

        return children;
    }

    private generateId(): string {
        let id = this.generateRandomInteger(10000, 100000000);
        return id.toString();
    }

    private generateRandomInteger(min, max): number {
        return Math.floor(Math.random() * Math.floor(max) + min);
    }
}