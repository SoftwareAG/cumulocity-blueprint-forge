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
import { Injector, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationError, Router, RouterModule as NgRouterModule } from '@angular/router';
import { UpgradeModule as NgUpgradeModule } from '@angular/upgrade/static';
import { AppStateService, CoreModule, RouterModule, hookStepper} from '@c8y/ngx-components';
import { DashboardUpgradeModule, UpgradeModule, HybridAppModule, WidgetComponent } from '@c8y/ngx-components/upgrade';
import { BuilderModule } from "./builder/builder.module";
import { filter, first, map, startWith, tap, withLatestFrom } from "rxjs/operators";
import { IUser } from '@c8y/client';
import { SimulationStrategiesModule } from "./simulation-strategies/simulation-strategies.module";
import { CustomWidgetsModule } from "./custom-widgets/custom-widgets.module";
import { interval } from 'rxjs';
import { SettingsService } from './builder/settings/settings.service';
import { cockpitWidgets } from '@c8y/ngx-components/widgets/cockpit';
import { SetupStep } from '@c8y/ngx-components';
import { HOOK_STEPPER, Steppers,gettext } from '@c8y/ngx-components';
import {DtdlSimulationStrategyFactory} from "./simulation-strategies/dtdl/dtdl.simulation-strategy";
import { HOOK_SIMULATION_STRATEGY_FACTORY } from './builder/simulator/device-simulator';
import { TemplateStepOneComponent } from './setup/template-steps/template-step-one/template-step-one.component';
import { TemplateSetupStepperButtonsComponent } from './setup/template-setup-stepper-buttons.component';
import { TemplateStepTwoDetailsComponent } from './setup/template-steps/template-step-two-details/template-step-two-details.component';
import { TemplateStepThreeConfigComponent } from './setup/template-steps/template-step-three-config/template-step-three-config.component';
import { TemplateCatalogSetupService } from './setup/template-catalog-setup.service';
import { NgImageSliderModule } from 'ng-image-slider';
import { GalleryModule } from 'ng-gallery';
import { LightboxModule } from  'ng-gallery/lightbox';
import { IconSelectorModule } from './icon-selector/icon-selector.module';
import { SetupConfigService } from './setup/setup-config.service';
import { SetupWidgetConfigModalComponent } from './setup/setup-widget-config-modal/setup-widget-config-modal.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TemplateStepFourConnectComponent } from './setup/template-steps/template-step-four-connect/template-step-four-connect.component';
import { WizardModule } from './wizard/wizard.module';
@NgModule({
  declarations: [
    TemplateStepOneComponent, 
    TemplateStepTwoDetailsComponent,
    TemplateStepThreeConfigComponent,
    TemplateStepFourConnectComponent,
    TemplateSetupStepperButtonsComponent,
    SetupWidgetConfigModalComponent,
  ],
  imports: [
    // Upgrade module must be the first
    UpgradeModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(),
    NgRouterModule.forRoot([], { enableTracing: false, useHash: true }),
    CoreModule.forRoot(),
    NgUpgradeModule,
    DashboardUpgradeModule,
    BuilderModule,
    SimulationStrategiesModule,
    cockpitWidgets(),
    CustomWidgetsModule,
    NgImageSliderModule,
    IconSelectorModule,
    GalleryModule.withConfig({
        thumb: false
      }),
    LightboxModule.withConfig({}),
    BsDropdownModule.forRoot(),
    WizardModule
  ],
  providers: [
    TemplateCatalogSetupService,SetupConfigService,
    hookStepper([    {
        stepperId: Steppers.SETUP,
        component: TemplateStepFourConnectComponent,
        label: gettext('Connect'),
        setupId: 'blueprintForgeConfig',
        priority: 15,
        required: true
    },
        {
          stepperId: Steppers.SETUP,
          component: TemplateStepThreeConfigComponent,
          label: gettext('Configuration'),
          setupId: 'blueprintForgeConfig',
          priority: 20,
          required: true

        },
        {
          stepperId: Steppers.SETUP,
          component: TemplateStepTwoDetailsComponent,
          label: gettext('Details'),
          setupId: 'blueprintForgeTemplateDetail',
          priority: 25,
          required: true
        },
        {
          stepperId: Steppers.SETUP,
          component: TemplateStepOneComponent,
          label: gettext('App Template'),
          required: true,
          setupId: 'blueprintForgeApplcationTemplate',
          priority: 30
        }
      ] as SetupStep[]),
    //   { provide: HOOK_SIMULATION_STRATEGY_FACTORY, useClass: DtdlSimulationStrategyFactory, multi: true },
  ],
})
export class AppModule extends HybridAppModule {
    constructor(protected upgrade: NgUpgradeModule, appStateService: AppStateService, private router: Router, 
        private injector: Injector,
        private settingsService: SettingsService) {
        super();

        // Fixes a bug where the router removes the hash when the user tries to navigate to an app and is not logged in
        appStateService.currentUser.pipe(filter(user => user != null)).pipe(
            withLatestFrom(
                router.events.pipe(
                    filter(event => event instanceof NavigationError),
                    tap((event: NavigationError) => {
                        if ((location as any).replaceState) {
                            // Change the location without navigating anywhere
                            (location as any).replaceState(event.url)
                        }
                    }),
                    startWith(null)
                )
            ),
            first(),
            filter(([, event]: [IUser, NavigationError | null]) => event != null),
            map(([, event]: [IUser, NavigationError]) => event)
        ).subscribe(event => {
            router.navigateByUrl(event.url);
        });
    }

    ngDoBootstrap(): void {
        super.ngDoBootstrap();
        // Only do this after bootstrapping so that angularJs is loaded
        // A hack to get href hash changes to always trigger an Angular Router update... There seems to be an AngularUpgrade/AngularJS/Cumulocity bug somewhere that stops the hashchange event firing.
        // This bug is apparent when trying to use the AppSwitcher to change to another AppBuilder App, sometimes it works, sometimes it doesn't
        const $injector = this.injector.get('$injector');
        $injector.invoke(['$rootScope', ($rootScope) => {
            $rootScope.$on('$locationChangeStart', (event, next, current) => {
                const nextSplit = next.split('#');
                const currentSplit = current.split('#');
                // For gainsight tracking
                if (nextSplit.length > 1) { this.trackRouteEvents(nextSplit[1]); }
                if (nextSplit[0] != currentSplit[0]) {
                    return;
                }
                this.router.navigateByUrl(nextSplit.length > 1 ? nextSplit[1] : '');
            });
        }]);

        // Hiding (+) icon sine its not relevant for app builder
        const actionOutletInt = interval(1000);
        const actionOutletSub = actionOutletInt.subscribe(async val => {
            let actionOutlet = document.querySelector('c8y-action-outlet button') as any;
            if (actionOutlet) {
                actionOutlet.disabled = true;
                actionOutlet.style.color = '#B0B9BF';
                actionOutlet.style.display = 'none';
                actionOutletSub.unsubscribe();
            }
        });
    }

    // Gainsight Events Tracking
    private trackRouteEvents(url: string) {
        const urlParams = url.split('/');
        if (urlParams.length > 0) {
            let appId = '';
            let dashboardId = '';
            let other = "";
            if (urlParams.length > 2) {
                urlParams.forEach((param, index) => {
                    switch (param) {
                        case 'application':
                            appId = urlParams[index + 1];
                            break;
                        case 'dashboard':
                            dashboardId = urlParams[index + 1];
                            break;
                        case 'config':
                        case 'branding':
                        case 'simulator-config':
                            other = param;
                            break;
                        default:
                            break;
                    }
                });
                if (window && window['aptrinsic']) {
                    window['aptrinsic']('track', 'gp_blueprint_forge_apppage_viewed', {
                        "appId": appId,
                        "tenantId": this.settingsService.getTenantName(),
                        "dashboardId": dashboardId,
                        "pageId": other
                    });
                }
            } else if (urlParams.length > 1) {
                other = urlParams[1];
                if (window && window['aptrinsic']) {
                    window['aptrinsic']('track', 'gp_blueprint_forge_apppage_viewed', {
                        "tenantId": this.settingsService.getTenantName(),
                        "pageId": other
                    });
                }
            }
        }
    }
}
