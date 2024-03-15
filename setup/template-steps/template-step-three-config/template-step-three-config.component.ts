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
import { CdkStep } from '@angular/cdk/stepper';
import { AfterViewInit, Component, Inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AlertService, AppStateService, C8yStepper, DynamicComponentService, SetupComponent } from '@c8y/ngx-components';
import { TemplateSetupStep } from './../../template-setup-step';
import { TemplateCatalogSetupService } from '../../template-catalog-setup.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TemplateCatalogModalComponent } from '../../../builder/template-catalog/template-catalog.component';
import { Observable, from, Subscription, interval } from 'rxjs';
import { tap } from "rxjs/operators";
import { ApplicationService, IApplication } from '@c8y/client';
import { ProgressIndicatorModalComponent } from '../../../builder/utils/progress-indicator-modal/progress-indicator-modal.component';
import { Dashboards } from './../../template-setup.model';
import { ApplicationBinaryService } from '../../../builder/application-binary.service';
import { TemplateCatalogService } from '../../../builder/template-catalog/template-catalog.service';
import * as delay from "delay";
import { UpdateableAlert } from "../../../builder/utils/UpdateableAlert";
import { contextPathFromURL } from "../../../builder/utils/contextPathFromURL";
import { NgForm } from '@angular/forms';
import { SetupConfigService } from './../../setup-config.service';
import { SetupWidgetConfigModalComponent } from '../../../setup/setup-widget-config-modal/setup-widget-config-modal.component';
import { DOCUMENT } from '@angular/common';
import { BrandingService } from '../../../builder/branding/branding.service';
import { catchError } from "rxjs/operators";
import { DomSanitizer } from '@angular/platform-browser';
import {cloneDeep} from "lodash-es";
import { WidgetCatalogService } from '../../../builder/widget-catalog/widget-catalog.service';
import { DependencyDescription } from '../../../builder/template-catalog/template-catalog.model';
import { TemplateCatalogEntry } from '../../../builder/template-catalog/template-catalog.model';
@Component({
  selector: 'c8y-template-step-three-config',
  templateUrl: './template-step-three-config.component.html',
  styleUrls: ['./template-step-three-config.component.css'],
  host: { class: 'd-contents' }
})
export class TemplateStepThreeConfigComponent extends TemplateSetupStep implements OnInit, AfterViewInit {

  templateDetails: any;
  private progressModal: BsModalRef;
  private appList = [];
  @ViewChild("appConfigForm", { static: false }) appConfigForm: NgForm;

  configStepData: any;
  bsModalRef: BsModalRef;
  newAppName: string;
  newAppContextPath: string;
  newAppIcon: string;

  app: Observable<any>;
  currentApp: IApplication;
  templateDetailsData: any;
  isFormValid = false;
  deviceFormValid: boolean;
  assetButtonText: String = 'Select Device';
  groupTemplateInDashboard: boolean;
  dashboardName: any;
  dashboardTemplate: any;
  templateSelected: string;
  isMSEnabled: boolean = false;
  blankTemplateDashboard: boolean;
  welcomeTemplateData: TemplateCatalogEntry;
  templatesFromDC: any;
  filterNames: any[];
  selectedDashboardName: any;
  sharedTemplates: any;
  filterTemplates: any;
  isPreviewLoading: boolean;
  distinctDependencyNames: any;
  isSpin: boolean = false;
  pluginDetailsArray: any;
  microserviceArray: any;


  constructor(
    public stepper: C8yStepper,
    protected step: CdkStep,
    protected setup: SetupComponent,
    protected appState: AppStateService,
    protected alert: AlertService,
    private templateCatalogSetupService: TemplateCatalogSetupService,
    private modalService: BsModalService, private applicationBinaryService: ApplicationBinaryService,
    private appService: ApplicationService,
    @Inject(DOCUMENT) private document: Document, private brandingService: BrandingService,
    private renderer: Renderer2, private alertService: AlertService, 
    private appStateService: AppStateService, protected setupConfigService: SetupConfigService,
    private templateCatalogFromDCService: TemplateCatalogService,
    private sanitizer: DomSanitizer,
    private componentService: DynamicComponentService,
    private widgetCatalogService: WidgetCatalogService,
  ) {

    super(stepper, step, setup, appState, alert, setupConfigService);
    
    this.app = this.appStateService.currentApplication.pipe(
      tap((app: IApplication & { applicationBuilder: any }) => { 
        this.newAppName = app.name;
        this.newAppContextPath = app.contextPath;
        this.newAppIcon = (app.applicationBuilder && app.applicationBuilder.icon ? app.applicationBuilder.icon: "flash");
      })
    );
    this.app.subscribe(app => {
      this.currentApp = app;
    });
  }

  ngOnInit() {
    this.templateCatalogSetupService.templateData.subscribe(async currentData => {
      this.isFormValid = this.appConfigForm?.form.valid;
      if (currentData) {
        console.log('current data in step 3', currentData, 'template details data', this.templateDetails);
        this.selectedDashboardName = "Default Template";
        this.templateSelected = "Default Template";
        this.templateDetails = currentData;
        this.pluginDetailsArray = JSON.parse(JSON.stringify(this.templateDetails?.plugins));
        this.microserviceArray = JSON.parse(JSON.stringify(this.templateDetails?.microservices));
        this.loadTemplateCatalogFromDashboardCatalog();
      }
      // In case of no device 
      if (!(this.templateDetails?.input) || !(this.templateDetails?.input?.devices) || !(this.templateDetails?.input?.devices?.length > 0)) {
        this.deviceFormValid = true;
      } else {
        this.deviceFormValid = false;
      }
      this.appList = (await this.appService.list({ pageSize: 2000 })).data;
      this.isMSEnabled =  this.applicationBinaryService.isMicroserviceEnabled(this.appList);
    });
    this.templateCatalogSetupService.welcomeTemplateData.subscribe(welcomeTemplateData => {
      this.welcomeTemplateData = welcomeTemplateData;
    });
    
  }

  ngAfterViewInit() {
    this.verifyStepCompleted();
  }

  syncDashboardFlag(event, index) {
    this.templateDetails.dashboards[index].selected = event.target.checked;
  }
  
  syncPluginFlag(event, index) {
    this.templateDetails.plugins[index].selected = event.target.checked;
  }
  syncMicroserviceFlag(event, index) {
    this.templateDetails.microservices[index].selected = event.target.checked;
  }

   async updateAppConfiguration(app: any) {
    if (this.currentApp.name !== this.newAppName ||
      this.currentApp.contextPath !== this.newAppContextPath ||
      (this.currentApp.applicationBuilder && this.currentApp.applicationBuilder.icon !== this.newAppIcon)) {
      await this.saveAppChanges(app);
    } 
    this.blankTemplateDashboard = true;
    this.templateDetails.dashboards.forEach(dashboardItem => {
      if (dashboardItem.title !== 'Welcome' &&
        dashboardItem.title !== 'Help and Support' &&
        dashboardItem.title !== 'Instruction') {
          this.blankTemplateDashboard = false;
          return false;
        }
    })
      if (this.blankTemplateDashboard) {
       this.templateCatalogSetupService.blankTemplate.next(true);
      } else {
        this.next();
      }
}

async saveAppChanges(app) {
  const savingAlert = new UpdateableAlert(this.alertService);
  savingAlert.update('Saving application...');
  try {
    app.name = this.newAppName;
    app.applicationBuilder.icon = this.newAppIcon;
    app.icon = {
      name: this.newAppIcon,
      "class": `fa fa-${this.newAppIcon}`
    };

    const update: any = {
      id: app.id,
      name: app.name,
      key: app.key,
      applicationBuilder: app.applicationBuilder,
      icon: app.icon
    };

    let contextPathUpdated = false;
    const currentAppContextPath = app.contextPath;
    if (app.contextPath && app.contextPath != this.newAppContextPath) {
      app.contextPath = this.newAppContextPath;
      update.contextPath = this.newAppContextPath;
      contextPathUpdated = true;
    }

    let appManifest: any = app.manifest;
    if (appManifest) {
      appManifest.contextPath = app.contextPath;
      appManifest.key = update.key;
      appManifest.icon = app.icon;
      appManifest.name = app.name;
      update.manifest = appManifest;
    }
    await this.appService.update(update);

    if (contextPathUpdated && contextPathFromURL() === currentAppContextPath) {
      savingAlert.update('Saving application...');
      // Pause while c8y server reloads the application
      await delay(5000);
      window.location = `/apps/${this.newAppContextPath}/${window.location.hash}` as any;
    }

    savingAlert.update('Application saved!', 'success');
    savingAlert.close(1500);
    
  } catch (e) {
    savingAlert.update('Unable to save!\nCheck browser console for details', 'danger');
    throw e;
  }
  this.appStateService.currentUser.next(this.appStateService.currentUser.value);
  
}

  showSetupConfigModal(dashboardBasicConfig): BsModalRef {
    return this.modalService.show(SetupWidgetConfigModalComponent, { class: 'c8y-wizard', initialState: { dashboardBasicConfig } });
  }

  async configureBasicInput(dashboard, index) {
    const basicConfigurationRef = this.showSetupConfigModal(dashboard.basicConfig);
    await basicConfigurationRef.content.event.subscribe(async data => {
      if (data && data.isConfirm) {
        this.templateDetails.dashboards[index].basicConfig = data.basicConfigParams;
        this.templateCatalogSetupService.templateData.next(this.templateDetails);
      }
    });
  }

  // TODO: Phase II
  showDashboardCatalogDialog(app: any, dashboard: Dashboards) {
    this.bsModalRef = this.modalService.show(TemplateCatalogModalComponent, { backdrop: 'static', class: 'modal-lg', initialState: { app, dashboard } });
    this.bsModalRef.content.onCancel.subscribe((flag: boolean) => {
      dashboard.selected = false;
    });
    this.bsModalRef.content.onSave.subscribe((flag: boolean) => {
      dashboard.selected = false;
      dashboard.configured = true;
    });
  }

  showProgressModalDialog(message: string): void {
    this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
  }

  

  hideProgressModalDialog() {
    this.progressModal.hide();
  }

  setTheme(app, primary, active, text, textOnPrimary, textOnActive, hover, headerBar, tabBar, toolBar, selectedTheme) {
    app.applicationBuilder.branding.enabled = true;
    app.applicationBuilder.branding.colors.primary = primary;
    app.applicationBuilder.branding.colors.active = active;
    app.applicationBuilder.branding.colors.text = text;
    app.applicationBuilder.branding.colors.textOnPrimary = textOnPrimary;
    app.applicationBuilder.branding.colors.textOnActive = textOnActive;
    app.applicationBuilder.branding.colors.hover = hover;
    app.applicationBuilder.branding.colors.headerBar = headerBar;
    app.applicationBuilder.branding.colors.tabBar = tabBar;
    app.applicationBuilder.branding.colors.toolBar = toolBar;
    app.applicationBuilder.selectedTheme = selectedTheme;

    if (selectedTheme === 'Default') {
      this.renderer.removeClass(this.document.body, 'body-theme');
      this.renderer.removeClass(this.document.body, 'dashboard-body-theme');
    } else {
      this.renderer.addClass(this.document.body, 'body-theme');
    }
    this.brandingService.updateStyleForApp(app);
  }

  assignDashboardName(selectedTemplate) {
    this.templateSelected = selectedTemplate.dashboardName;
    this.templateCatalogSetupService.welcomeTemplateSelected.next(this.templateSelected);
  }

  assignSelectedDashboard(selectedDashboard, index) {
    this.templateCatalogSetupService.indexOfDashboardToUpdateTemplate = index;
    this.selectedDashboardName = selectedDashboard.title.split("-")[0];
    this.templateCatalogSetupService.dynamicDashboardTemplate.next(selectedDashboard);
    this.loadTemplateDetails(selectedDashboard,index);
  }


  loadTemplateCatalogFromDashboardCatalog() {
    this.templateCatalogFromDCService.getTemplateCatalog()
      .pipe(catchError(err => {
        console.log('Dashboard Catalog: Error in primary endpoint! using fallback...');
        return this.templateCatalogFromDCService.getTemplateCatalogFallBack()
      }))
      .subscribe((catalog: any) => {
        this.templatesFromDC = catalog;
        this.filterTemplates = this.templatesFromDC ? this.templatesFromDC : [];
        
          const templateDetailsCopy = JSON.parse(JSON.stringify(this.templateDetails.dashboards));
          let dashboardToUpdateForTemplate = templateDetailsCopy.find(dashboard => (!dashboard.isSimulatorConfigExist && dashboard.isDeviceRequired) || (dashboard.isSimulatorConfigExist && dashboard.linkWithDashboard === '' && dashboard.isDeviceRequired));
          
          if (this.selectedDashboardName !== "Default Template") {
            dashboardToUpdateForTemplate ? (dashboardToUpdateForTemplate.title = this.selectedDashboardName) : null;
          } else {
            dashboardToUpdateForTemplate ? (dashboardToUpdateForTemplate.title = dashboardToUpdateForTemplate.title) : null;
            dashboardToUpdateForTemplate.defaultDashboardSet = true;
          }
          this.templateCatalogSetupService.dynamicDashboardTemplate.next(dashboardToUpdateForTemplate);
          this.filterTemplates?.splice(0, 0, dashboardToUpdateForTemplate);
          this.filterTemplates?.filter(template => (template?.title === dashboardToUpdateForTemplate?.title) ? (template.title = 'Default Template') :  null );
          this.filterTemplates = this.sortDashboardsByTitle();
        
        this.loadTemplateDetails(dashboardToUpdateForTemplate);
      }, error => {
        this.alertService.danger("There is some technical error! Please try after sometime.");
      });
  }

  async loadTemplateDetails(template: any, index?): Promise<void> {
    this.isSpin = true;
    if(template.availability && template.availability === 'SHARED') {
        this.templateDetails = null;
        this.templateDetails[index] = cloneDeep(template.templateDetails);
        if (this.templateDetails[index].preview || this.templateDetails[index].previewBinaryId) {
            this.isPreviewLoading = true;
            this.templateCatalogFromDCService.downloadBinaryFromFileRepo(this.templateDetails[index].previewBinaryId).
                then(async (res: { blob: () => Promise<any>; }) => {
                    const blb = await res.blob();
                    this.isPreviewLoading = false;
                    this.templateDetails[index].preview = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blb)) as any;
                });
        }
        this.updateDepedencies(index);
    } else {
        this.templateCatalogFromDCService.getTemplateDetails(template.dashboard)
        .pipe(catchError(err => {
            console.log('Dashboard Catalog Details: Error in primary endpoint! using fallback...');
            return this.templateCatalogFromDCService  
            .getTemplateDetailsFallBack(template.dashboard);
        }))
        .subscribe(templateDetails => {
          this.isSpin = false;
          this.templateDetails[index] = null;
            this.templateDetails[index] = templateDetails;
            
            this.templateDetails.plugins.length = 0;
            this.templateDetails.plugins = JSON.parse(JSON.stringify(this.pluginDetailsArray));
            const pluginDependencies = this.templateDetails[index]?.input?.dependencies.filter(pluginDep => pluginDep.type === 'plugin');
            this.templateDetails.plugins = this.templateDetails.plugins.concat(pluginDependencies);

            this.templateDetails.plugins = this.templateDetails.plugins.reduce((accumulator, current)=> {
              if (!accumulator.find((item) => item.id === current.id)) {
                current.selected = true;
                if (this.widgetCatalogService.isCompatiblieVersion(current) ) {
                  accumulator.push(current);
                }
              }
              return accumulator;
            }, []);
            // Microservice
            
            this.templateDetails.microservices.length = 0;
            this.templateDetails.microservices = JSON.parse(JSON.stringify(this.microserviceArray));
            const microserviceDependencies = this.templateDetails[index]?.input?.dependencies.filter(microserviceDep => microserviceDep.type === 'microservice');
            this.templateDetails.microservices = this.templateDetails.microservices.concat(microserviceDependencies);
            this.templateDetails.microservices = this.templateDetails.microservices.reduce((accumulator, current)=> {
              if (!accumulator.find((item) => item.id === current.id)) {
                current.selected = true;
                if (this.widgetCatalogService.isCompatiblieVersion(current) ) {
                  accumulator.push(current);
                }
              }
              return accumulator;
            }, []);

            if (this.templateDetails[index].preview) {
                this.templateDetails[index].preview = this.templateCatalogFromDCService.getGithubURL(this.templateDetails[index].preview);
            }
            this.updateDepedencies(index);
            this.templateCatalogSetupService.dynamicDashboardTemplateDetails.next(this.templateDetails[index]);
            
        });
    }
}

async updateDepedencies(index) {
  if (!this.templateDetails[index] || !this.templateDetails[index].input || !this.templateDetails[index].input.dependencies
      || this.templateDetails[index].input.dependencies.length === 0) {
      return;
  }

  for (let dependency of this.templateDetails[index].input.dependencies) {
      if (dependency.type && dependency.type == "microservice") {
          dependency.isInstalled = (await this.applicationBinaryService.verifyExistingMicroservices(dependency.id)) as any;;
          dependency.isSupported = true;
          dependency.visible = true;
      } else {
          this.verifyWidgetCompatibility(dependency, index);
          if(dependency.ids && dependency.ids.length > 0) {
              Promise.all(dependency.ids.map( async id => {
                  return ( await this.componentService.getById(id) ? true : false);
              })).then ((widgetStatusList: boolean[]) => {
                  const widgetObj =  widgetStatusList.find(widget => !widget);
                  dependency.isInstalled = (widgetObj == undefined);
              })
          } else  {
              this.componentService.getById(dependency.id).then(widget => {
                  dependency.isInstalled = (widget != undefined);
              });
          }
      }
  };
}

private verifyWidgetCompatibility(dependency: DependencyDescription, index) {
  if (this.widgetCatalogService.isCompatiblieVersion(dependency)) {
      dependency.isSupported = true;
      dependency.visible = true;
  } else {
      const differentDependencyVersion = this.templateDetails[index].input.dependencies.find(widget => widget.id === dependency.id && widget.link !== dependency.link);
      dependency.isSupported = false;
      if (differentDependencyVersion) {
          dependency.visible = false;
      } else { dependency.visible = true; }
  }
}

sortDashboardsByTitle() {
  let sortedData = this.filterTemplates.sort((a, b) => {
    let x = a.title.toLowerCase();
      let y = b.title.toLowerCase();
      if(x>y){return 1;}
      if(x<y){return -1;}
      return 0;
  })
  return sortedData;
} 

}
