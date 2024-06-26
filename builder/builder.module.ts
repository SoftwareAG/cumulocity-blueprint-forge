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
import {Inject, NgModule, Renderer2, RendererFactory2} from "@angular/core";
import {ApplicationModule} from "./application/application.module";
import {RouterModule} from "@angular/router";
import {DashboardConfigComponent} from "./application-config/dashboard-config.component";
import {EditDashboardModalComponent} from "./application-config/edit-dashboard-modal.component";
import {NewDashboardModalComponent} from "./application-config/new-dashboard-modal.component";
import {AppStateService, CoreModule, HookProviderTypes, LoginService, hookNavigator} from "@c8y/ngx-components";
import {IconSelectorModule} from "../icon-selector/icon-selector.module";
import {TooltipModule} from "ngx-bootstrap/tooltip";
import {SortableModule} from "ngx-bootstrap/sortable";
import {WizardModule} from "../wizard/wizard.module";
import {BrandingModule} from "./branding/branding.module";
import {AppBuilderNavigationService} from "./navigation/app-builder-navigation.service";
import {
    AppBuilderConfigNavigationRegistrationService,
    AppBuilderConfigNavigationService
} from "./navigation/app-builder-config-navigation.service";
import { BrandingComponent } from "./branding/branding.component";
import { SimulatorConfigModule } from "./simulator-config/simulator-config.module";
import { AppIdService } from "./app-id.service";
import { SimulatorConfigComponent } from "./simulator-config/simulator-config.component";
import { MarkdownModule } from "ngx-markdown";
import { BrandingDirtyGuardService } from "./branding/branding-dirty-guard.service";
import { fromEvent, Observable } from "rxjs";
import { distinctUntilChanged, filter, withLatestFrom } from "rxjs/operators";
import { TemplateCatalogModule } from "./template-catalog/template-catalog.module";
import { RectangleSpinnerModule } from "./utils/rectangle-spinner/rectangle-spinner.module";
import { DeviceSelectorModalModule } from "./utils/device-selector-modal/device-selector.module";
import { ProgressIndicatorModalModule } from "./utils/progress-indicator-modal/progress-indicator-modal.module";
import { DOCUMENT } from '@angular/common';
import { DeviceSelectorModule } from '../device-selector/device-selector.module';
import { AlertMessageModalModule } from "./utils/alert-message-modal/alert-message-modal.module";
import { SimulatorWorkerAPI } from "./simulator/mainthread/simulator-worker-api.service";
import { SimulatorManagerService } from "./simulator/mainthread/simulator-manager.service";
import { NgSelectModule } from "@ng-select/ng-select";
import { LockStatus } from "./simulator/mainthread/simulation-lock.service";
import { ButtonsModule } from "ngx-bootstrap/buttons";
import { DashboardNodeComponent } from "./application-config/dashboard-node.component";
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { DragDropModule } from "@angular/cdk/drag-drop";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { AlertMessageModalComponent } from "./utils/alert-message-modal/alert-message-modal.component";
import { AppDataService } from "./app-data.service";
import { RedirectToApp } from "./application/app-builder-guard";
import { SettingsService } from "./settings/settings.service";
@NgModule({
    imports: [
        ApplicationModule,
        RouterModule.forChild([
            {
                path: '',
                pathMatch: 'full',
                component: DashboardConfigComponent,
                canActivate: [RedirectToApp],
                children: []
            }, {
                path: 'application/:applicationId/config',
                component: DashboardConfigComponent
            },
             {
                path: 'application/:applicationId/branding',
                component: BrandingComponent,
                canDeactivate: [BrandingDirtyGuardService]
            }, {
                path: 'application/:applicationId/simulator-config',
                component: SimulatorConfigComponent
            }
        ]),
        CoreModule,
        IconSelectorModule,
        RectangleSpinnerModule,
        ProgressIndicatorModalModule,
        DeviceSelectorModalModule,
        SortableModule.forRoot(),
        WizardModule,
        TemplateCatalogModule,
        TooltipModule.forRoot(),
        BrandingModule.forRoot(),
        SimulatorConfigModule,
        DeviceSelectorModule,
        MarkdownModule.forRoot(),
        AlertMessageModalModule,
        NgSelectModule,
        ButtonsModule.forRoot(),
        CollapseModule.forRoot(),
        DragDropModule
    ],
    declarations: [
        DashboardConfigComponent,
        DashboardNodeComponent,
        NewDashboardModalComponent,
        EditDashboardModalComponent
    ],
    entryComponents: [
        NewDashboardModalComponent,
        EditDashboardModalComponent,
    ],
    providers: [
        AppBuilderNavigationService,
        AppBuilderConfigNavigationService, AppBuilderConfigNavigationRegistrationService,
        hookNavigator(AppBuilderNavigationService, {providerType: HookProviderTypes.ExistingProvider}),
        hookNavigator(AppBuilderConfigNavigationService, {providerType: HookProviderTypes.ExistingProvider})
    ]
})
export class BuilderModule {
    private renderer: Renderer2;
    constructor(appStateService: AppStateService, loginService: LoginService, private appDataService: AppDataService,
        simSvc: SimulatorWorkerAPI, simulatorManagerService: SimulatorManagerService,
        appIdService: AppIdService, private settingService: SettingsService,
        rendererFactory: RendererFactory2, @Inject(DOCUMENT) private _document: Document,
        private modalService: BsModalService) {
        
        const lockStatus$ = new Observable<{ isLocked: boolean, isLockOwned: boolean, lockStatus?: LockStatus }>(subscriber => {
            const listenerId = simSvc
                .addLockStatusListener(lockStatus => subscriber.next(lockStatus));
            subscriber.add(() => simSvc.removeListener(listenerId));
        });

        // If the user leaves the page then unlock the simulators
        fromEvent(window, "beforeunload")
            .pipe(withLatestFrom(lockStatus$))
            .subscribe(([event, lockStatus]) => {
                if (lockStatus.isLockOwned) {
                    simSvc.unlock();
                }
            });
       
         appStateService.currentTenant
        .pipe(filter(tenant => !!tenant))
        .pipe(distinctUntilChanged())
        .subscribe(async (tenant) => {
            if(tenant) {
                await simSvc.setTenant(tenant)
                this.settingService.setTenant(tenant);
                const validAnalyticsProvider = await this.settingService.loadAnalyticsProvider();
                if(validAnalyticsProvider) {
                    this.renderer = rendererFactory.createRenderer(null, null);
                    this.registerAndTrackAnalyticsProvider(true);
                }
            }
        });
       
        appIdService.appId$
        .pipe(filter(appId => !!appId))
        .pipe(distinctUntilChanged())
        .subscribe(async (appId) => 
        {
            if(appId) {   
                this.appDataService.getAppDetails(appId)
                .pipe(filter(app => !!app))
                .pipe(distinctUntilChanged()).subscribe( app => {
                    if(app.applicationBuilder && app.applicationBuilder?.simulators && app.applicationBuilder?.simulators.length > 0){
                        simulatorManagerService.initialize();                 
                    }
                });
                
                await simSvc.setAppId(appId) 
            }
            this.registerAndTrackAnalyticsProvider(false, appId);
        });
    }

    alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    private async registerAndTrackAnalyticsProvider(isRegister: boolean, appId?: any) {
        if(isRegister) {
            this.settingService.isAnalyticsProviderLoaded = true;
            const provider = this.settingService.getAnalyticsProvider();
            const identity = this.settingService.getIdentity();
            this.initGainsight(provider.providerURL, provider.providerKey, 
                identity, this.settingService.getTenantName());
        } else {
            if(window && window['aptrinsic'] ){
                window['aptrinsic']('track', 'gp_blueprint_forge_apppage_viewed', {
                    "appId": appId,
                    "tenantId": this.settingService.getTenantName(), 
                 });
            }
        }
    }
    //Gainsight Integration
    private initGainsight(url: string, key: string, indentity : string, accountId : string) {
        let script = this.renderer.createElement("script");
        script.type = `text/javascript`;
        script.text =
          `
            (function(n,t,a,e,co){var i="aptrinsic";n[i]=n[i]||function(){
              (n[i].q=n[i].q||[]).push(arguments)},n[i].p=e;n[i].c=co;
            var r=t.createElement("script");r.async=!0,r.src=a+"?a="+e;
            var c=t.getElementsByTagName("script")[0];c.parentNode.insertBefore(r,c)
          })(window,document,"${url}","${key}"); //Integration key
          ` +
          `
          aptrinsic("identify",
          {
            "id":"${indentity}"
          },
          {
            //Account Fields
            "id": "${accountId}", //Required
          });
            `;
    
        this.renderer.appendChild(this._document.body, script);
      }
}
