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
import {Component, Inject, OnDestroy, Renderer2} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import { from, interval, Observable, Subscription } from "rxjs";
import {ContextDashboardType} from "@c8y/ngx-components/context-dashboard";
import { InventoryService, ApplicationService, UserService, IApplication, IManagedObject } from "@c8y/client";
import {last, delay} from "lodash-es";
//import {SMART_RULES_AVAILABILITY_TOKEN} from "./smartrules/smart-rules-availability.upgraded-provider";
import {IApplicationBuilderApplication} from "../iapplication-builder-application";
import {AppStateService} from "@c8y/ngx-components";
import { SettingsService } from "../../builder/settings/settings.service";
import { AccessRightsService } from "../../builder/access-rights.service";
import { switchMap, tap } from "rxjs/operators";
import { AppIdService } from "../../builder/app-id.service";
import { DOCUMENT } from "@angular/common";
import { BsModalService } from "ngx-bootstrap/modal";
import { ImportDashboardCatalogModalComponent } from "../template-catalog/import-dashboard-catalog.component";

@Component({
    selector: 'app-builder-context-dashboard',
    template: `
        <c8y-tab *ngFor="let tab of tabs" [icon]="tab.icon" [label]="tab.label" [path]="tab.path"
                 [priority]="tab.priority"></c8y-tab>

        <ng-container [ngSwitch]="deviceDetail">
             <legacy-smart-rules *ngSwitchCase="'smartrules'"></legacy-smart-rules>
            <legacy-alarms *ngSwitchCase="'alarms'"></legacy-alarms>
            <legacy-data-explorer *ngSwitchCase="'data_explorer'"></legacy-data-explorer>
            
            <ng-container *ngSwitchDefault>
                <c8y-action-bar-item priority="9000" placement="more" *ngIf="importDashboardVisibility">
                        <button class="btn btn-link" title="Import dashboard as template to Dashboard Catalog" (click)="showImportModal()"><i c8yIcon="data-import"></i>Add to Catalog</button>
                </c8y-action-bar-item>
                <ng-container [ngSwitch]="isGroupTemplate">
                    <dashboard-by-id *ngSwitchCase="false" [dashboardId]="dashboardId" [context]="context"
                                     [disabled]="disabled" style="display:block;"></dashboard-by-id>
                    <group-template-dashboard *ngSwitchCase="true" style="display:block;" [dashboardId]="dashboardId" [deviceId]="this.deviceId" [context]="context"
                                     [disabled]="disabled"></group-template-dashboard>
                    <ng-container *ngSwitchCase="undefined"><!--Loading--></ng-container>
                </ng-container>
            </ng-container>
        </ng-container>
    `,
    host: {'class': 'dashboard'}
})
export class AppBuilderContextDashboardComponent implements OnDestroy {
    applicationId: string;
    dashboardId: string;
    tabGroup?: string
    deviceId?: string
    deviceDetail?: string
    dashboardSmartRulesAlarmsExplorerVisibility = true;

    appSubscription = new Subscription();
    isGroupTemplate?: boolean;
    app: Observable<any>;
    context: Partial<{
        id: string,
        name: string,
        type: ContextDashboardType
    }> = {}

    disabled = true;

    tabs: {
        label: string,
        icon: string,
        path: string,
        priority: number
    }[] = [];

    subscriptions = new Subscription();
    private readonly LIST_FILTER = {
        pageSize: 2000,
        withTotalPages: true
    };
    importDashboardVisibility = false;
    constructor(
        private activatedRoute: ActivatedRoute, private router:Router,
        private inventoryService: InventoryService,
        private applicationService: ApplicationService,
      //  @Inject(SMART_RULES_AVAILABILITY_TOKEN) private c8ySmartRulesAvailability: any,
        private userService: UserService,
        private appStateService: AppStateService,
        private settingsService: SettingsService,
        private accessRightsService: AccessRightsService,
        private appIdService: AppIdService,
        @Inject(DOCUMENT) private document: Document, private renderer: Renderer2,
        private modalService: BsModalService
    ) {
        this.app = this.appIdService.appIdDelayedUntilAfterLogin$.pipe(
            switchMap(appId => from(
                applicationService.detail(appId).then(res => res.data as any)
            ))
        );

        this.subscriptions.add(this.activatedRoute.paramMap.subscribe(async paramMap => {
            // Always defined
            this.applicationId = paramMap.get('applicationId');
            this.dashboardId = paramMap.get('dashboardId')
            // Optional
            this.tabGroup = paramMap.get('tabGroup');
            this.deviceId = paramMap.get('deviceId');
            this.deviceDetail = paramMap.get('deviceDetail');

            
            this.isGroupTemplate = undefined;
            this.dashboardSmartRulesAlarmsExplorerVisibility = await this.settingsService.isDashboardVisibilitySmartRulesAlarmsExplorer();

            // The user may have simulator access (INVENTORY_ADMIN)
            // but we don't necessarily want them messing with the dashboards unless they have app edit permissions
            // A security hole but not a major one
            this.disabled = !userService.hasAllRoles(appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);

            // This is to make sure page is rendered before displaying option to user
            this.displayImportDashboardOption();
            
            // TODO: check to see if applicationId + dashboardId/tabGroup has changed we don't need to reset the tabs if they haven't - it'll stop the flashing

            const tabs = [];
            this.tabs = tabs;
            if (this.deviceId && this.dashboardSmartRulesAlarmsExplorerVisibility) {
                /* if (this.c8ySmartRulesAvailability.shouldShowLocalSmartRules()) {
                    tabs.push({
                        label: 'Smart rules',
                        icon: 'asterisk',
                        priority: 3,
                        path: this.createDeviceTabPath(this.dashboardId, 'smartrules')
                    })
                } */
               /*  tabs.push({
                    label: 'Alarms',
                    icon: 'bell',
                    priority: 2,
                    path: this.createDeviceTabPath(this.dashboardId, 'alarms')
                }, {
                    label: 'Data explorer',
                    icon: 'bar-chart',
                    priority: 1,
                    path: this.createDeviceTabPath(this.dashboardId, 'data_explorer')
                }); */
            }

            const app = (await this.applicationService.detail(this.applicationId)).data as IApplicationBuilderApplication;
            const dashboard = app.applicationBuilder.dashboards
                .find(dashboard => dashboard.id === this.dashboardId && this.accessRightsService.userHasAccess(dashboard.roles));

            this.isGroupTemplate = (dashboard && dashboard.groupTemplate) || false;

            if(this.deviceId) {
                const deviceMO = await (await this.inventoryService.detail(this.deviceId)).data;
                this.context = {
                    id: this.deviceId,
                    name: (deviceMO ? deviceMO.name: '')
                }
            }
            if (!dashboard && !this.deviceDetail) {
                console.warn(`Dashboard: ${this.dashboardId} isn't part of application: ${this.applicationId}`);
                this.router.navigateByUrl(`/home`);
            }

            if (this.tabGroup) {
                const dashboardsInTabgroup = app.applicationBuilder.dashboards
                    .filter(dashboard => (dashboard.tabGroup === this.tabGroup || (dashboard && dashboard.groupTemplate && dashboard.tabGroup === 'deviceId'))
                     && dashboard.visibility !== 'hidden' && this.accessRightsService.userHasAccess(dashboard.roles))
                tabs.push(...await Promise.all(dashboardsInTabgroup.map(async (dashboard, i) => {
                    const isGroupTemplate = (dashboard && dashboard.groupTemplate) || false;
                    if (isGroupTemplate) {
                        //  const childAssets = (await this.inventoryService.childAssetsList(dashboard.deviceId, {pageSize: 2000, query: 'has(c8y_IsDevice)'})).data;
                        let childAssets: IManagedObject[];
                        if(dashboard.templateType && dashboard.templateType == 2) {
                            childAssets = (await this.inventoryService.listQuery({ __filter: { __and: [{ __or: [{__has: 'c8y_IsDevice' }, {__has: 'c8y_IsAsset'  } ]}, {__and: [{id: this.tabGroup },{type: dashboard.deviceId }] }] }}, this.LIST_FILTER)).data;
                        } else {
                            childAssets = (await this.inventoryService.childAssetsList(dashboard.deviceId, { pageSize: 2000, query: `$filter=(has(c8y_IsDevice) and (id eq '${this.tabGroup}')) ` })).data;
                        }
                        const matchingDevice = (childAssets && childAssets.length > 0 ? childAssets[0] : null);
                        if (matchingDevice) {
                            return {
                                label: last(dashboard.name.split(/[/\\]/)),
                                icon: dashboard.icon,
                                priority: dashboardsInTabgroup.length - i + 1000,
                                path: this.createTabGroupTabPath(dashboard.id, matchingDevice.id)
                            }
                        }
                    } else {
                        return {
                            label: last(dashboard.name.split(/[/\\]/)),
                            icon: dashboard.icon,
                            priority: dashboardsInTabgroup.length - i + 1000,
                            path: this.createTabGroupTabPath(dashboard.id, dashboard.deviceId)
                        }
                    }
                })));
            }
            if (this.deviceId && !this.tabGroup) {
                if (dashboard) {
                    tabs.push({
                        label: last(dashboard.name.split(/[/\\]/)),
                        icon: dashboard.icon,
                        priority: 1000,
                        path: this.createDeviceTabPath(dashboard.id)
                    });
                } else {
                    // If for some reason the user has navigated to a dashboard that isn't part of the app then add the tab anyway
                    tabs.push({
                        label: 'Dashboard',
                        icon: 'th',
                        priority: 1000,
                        path: this.createDeviceTabPath(this.dashboardId)
                    });
                }
            }

            // Removing undefined tab for group template
            this.tabs = this.tabs.filter(tab => tab !== undefined);

            // Bug ? mutliple active tabs while routing. Hack by hijacking DOM
            const tabOutletInt = interval(50);
            const tabOutletSub = tabOutletInt.subscribe(async val => {
                const activeTabs = document.querySelectorAll('c8y-tabs-outlet li.active') as any;
                if (activeTabs.length > 1) {
                    activeTabs.forEach(tab => {
                        const tabName = (tab.textContent ? tab.textContent.trim() : '');
                        if (tabName !== 'Smart rules' && tabName !== 'Alarms' && tabName !== 'Data explorer') {
                            tab.classList.remove('active');
                        }
                        if (tabName === 'Smart rules' || tabName === 'Alarms' || tabName === 'Data explorer') {
                            this.appSubscription = this.app.subscribe((app) => {
                                if (app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                                    this.renderer.addClass(this.document.body, 'dashboard-body-theme');
                                } else {
                                    this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
                                }
                            });
                        } else {
                            this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
                        }
                    });
                } else {
                    activeTabs.forEach(tab => {
                        const tabName = (tab.textContent ? tab.textContent.trim() : '');
                        if (tabName === 'Smart rules' || tabName === 'Alarms' || tabName === 'Data explorer') {
                            this.appSubscription = this.app.subscribe((app) => {
                                if (app.applicationBuilder.branding.enabled && (app.applicationBuilder.selectedTheme && app.applicationBuilder.selectedTheme !== 'Default')) {
                                    this.renderer.addClass(this.document.body, 'dashboard-body-theme');
                                } else {
                                    this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
                                }
                            });
                        } else {
                            this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
                        }
                    }); 
                }
                tabOutletSub.unsubscribe();
            });

        }));


    }

    private displayImportDashboardOption() {
        delay( ()=> {
            this.importDashboardVisibility = this.hasAdminRights();
        }, 3000);
    }

    showImportModal() {
        this.modalService.show(ImportDashboardCatalogModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: {dashboardId: this.dashboardId  } });
        
    }
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.appSubscription.unsubscribe();
    }

    createDeviceTabPath(dashboardId: string, deviceDetail?: string) {
        let path = `/application/${this.applicationId}`;
        if (this.tabGroup) {
            path += `/tabgroup/${this.tabGroup}`;
        }
        if (!this.tabGroup || !deviceDetail) {
            path += `/dashboard/${dashboardId}`;
        }
        path += `/device/${this.deviceId}`;
        if (deviceDetail) {
            path += `/${deviceDetail}`;
        }
        return path;
    }

    createTabGroupTabPath(dashboardId: string, deviceId?: string) {
        let path = `/application/${this.applicationId}`;
        path += `/tabgroup/${this.tabGroup}`;
        path += `/dashboard/${dashboardId}`;
        if (deviceId) {
            path += `/device/${deviceId}`
        }
        return path;
    }


    hasAdminRights() {
        return this.userService.hasAllRoles(this.appStateService.currentUser.value, ["ROLE_INVENTORY_ADMIN", "ROLE_APPLICATION_MANAGEMENT_ADMIN"]);
    }
}
