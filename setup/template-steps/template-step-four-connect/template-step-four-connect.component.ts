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
import { CdkStep } from "@angular/cdk/stepper";
import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import {
  AlertService,
  AppStateService,
  C8yStepper,
  PluginsService,
  SetupComponent,
  DynamicComponentService,
} from "@c8y/ngx-components";
import { TemplateSetupStep } from "../../template-setup-step";
import { TemplateCatalogSetupService } from "../../template-catalog-setup.service";
import { catchError } from "rxjs/operators";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Observable, Subscription, interval } from "rxjs";
import { tap } from "rxjs/operators";
import {
  ApplicationService,
  IApplication,
  IManagedObject,
  InventoryService,
} from "@c8y/client";
import { AppDataService } from "../../../builder/app-data.service";
import { ProgressIndicatorModalComponent } from "../../../builder/utils/progress-indicator-modal/progress-indicator-modal.component";
import { ProgressIndicatorService } from "../../../builder/utils/progress-indicator-modal/progress-indicator.service";
import { WidgetCatalogService } from "../../../builder/widget-catalog/widget-catalog.service";
import {
  Dashboards,
  MicroserviceDetails,
  PluginDetails,
  TemplateBlueprintDetails,
} from "../../template-setup.model";
import { DependencyDescription } from "../../../builder/template-catalog/template-catalog.model";
import { ApplicationBinaryService } from "../../../builder/application-binary.service";
import { TemplateCatalogService } from "../../../builder/template-catalog/template-catalog.service";
import { DeviceSelectorModalComponent } from "../../../builder/utils/device-selector-modal/device-selector.component";
import { NgForm } from "@angular/forms";
import { SetupConfigService } from "../../setup-config.service";
import { SettingsService } from "../../../builder/settings/settings.service";
import { DOCUMENT } from "@angular/common";
import * as _ from "lodash";
import { cloneDeep } from "lodash-es";
import { ConfigureCustomDashboardModalComponent } from "./configure-custom-dashboard-modal.component";
import { SimulatorConfigService } from "../../../builder/simulator-config/simulator-config.service";
import { AlertMessageModalComponent } from "../../../builder/utils/alert-message-modal/alert-message-modal.component";
import { DashboardListModalComponent } from "../../utils/dashboard-list-modal/dashboard-list.component";
@Component({
  selector: "c8y-template-step-four-connect",
  templateUrl: "./template-step-four-connect.component.html",
  styleUrls: ["./template-step-four-connect.component.css"],
  host: { class: "d-contents" },
})
export class TemplateStepFourConnectComponent
  extends TemplateSetupStep
  implements OnInit
{
  templateDetails: TemplateBlueprintDetails;
  private progressModal: BsModalRef;
  private appList = [];
  private microserviceDownloadProgress = interval(3000);
  private microserviceDownloadProgress$: Subscription;
  private groupTemplate = false;
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
  assetButtonText: String = "Select Device";
  groupTemplateInDashboard: boolean;
  dashboardName: any;
  dashboardTemplate: any;
  templateSelected: string;
  isMSEnabled: boolean = false;
  welcomeTemplateData: any;
  enableSimulator: boolean;
  enableDeviceOrGroup: boolean;
  enableLik: boolean;
  blankTemplateDashboard: boolean;
  isSpin: boolean = false;
  fileUploadMessage: string;
  onSaveClicked: boolean = false;
  groupTemplateFromSimulator: boolean;
  indexOfDashboardUpdatedFromDC: any;
  dynamicDashboardValueToUpdate: any;
  filterTemplates: any;
  dashboardTemplateSelected: any;
  storeDefaultDashboardName: string;
  simulatorConfigFiles: any[];
  isPreviewLoading: boolean;
  pluginDetailsArray: any;
  microserviceArray: any;
  templatesFromDC: any;
  filterChildsDependent:Dashboards[];
  private templateId: string ="";
  blankDashboardURL: any;
  formValid: boolean = false;
  installationFailed: boolean = false;
  isRetry: boolean = false;

  constructor(
    public stepper: C8yStepper,
    protected step: CdkStep,
    protected setup: SetupComponent,
    protected appState: AppStateService,
    protected alert: AlertService,
    private templateCatalogSetupService: TemplateCatalogSetupService,
    private invService: InventoryService,
    private modalService: BsModalService,
    private applicationBinaryService: ApplicationBinaryService,
    private appService: ApplicationService,
    private appDataService: AppDataService,
    private widgetCatalogService: WidgetCatalogService,
    private progressIndicatorService: ProgressIndicatorService,
    private catalogService: TemplateCatalogService,
    @Inject(DOCUMENT) private document: Document,
    private deviceSelectorModalRef: BsModalRef,
    private appStateService: AppStateService,
    protected setupConfigService: SetupConfigService,
    private settingsService: SettingsService,
    private pluginsService: PluginsService,
    private alertService: AlertService,
    private templateCatalogFromDCService: TemplateCatalogService,
    private componentService: DynamicComponentService,
    private simulatorConfigService: SimulatorConfigService
  ) {
    super(stepper, step, setup, appState, alert, setupConfigService);
    this.app = this.appStateService.currentApplication.pipe(
     
    );
    this.app.subscribe((app) => {
      this.currentApp = app;
    });

    this.setup.data$.subscribe(async data => {
      let anyDashboardDeselected;
      if (data.blueprintForge && data.blueprintForge != '') {
        const templateDetails = JSON.parse(sessionStorage.getItem("blueprintForge_ActiveTemplateDetails"));
        if (templateDetails && templateDetails?.dashboards) {
          anyDashboardDeselected = templateDetails.dashboards.find(dashboard => dashboard.selected === false);
        }
        if ((templateDetails && this.templateId !== templateDetails?.templateId) || anyDashboardDeselected) {
          this.templateId = templateDetails.templateId;
          this.templateDetails = templateDetails;
          this.prepareDashboardList();
          this.pluginDetailsArray = cloneDeep(this.templateDetails?.plugins);
          this.microserviceArray = cloneDeep(this.templateDetails?.microservices);
          this.loadTemplatesFromDashboardCatalog();
        }
        this.isFormValid = this.appConfigForm?.form.valid;
        if(!this.appList || this.appList.length === 0) {
          this.appList = await this.templateCatalogSetupService.getAppList();
          this.isMSEnabled =  this.applicationBinaryService.isMicroserviceEnabled(this.appList);
        }
        this.welcomeTemplateData = this.templateCatalogSetupService.welcomeTemplateData;
        this.formValidation('onload');
      }
    });

    this.templateCatalogSetupService.blankTemplate.subscribe((value) => {
      if (value) {
        this.blankTemplateDashboard = value;
        this.configureApp(this.currentApp);
      }
    });
  }


  ngOnInit() {
    this.filterChildsDependent = [];
  }

  async simulatorCreateForDashboard(event, dashboard, index) {
    this.clearDeviceandLinksOnToggleSwitch(dashboard, index);
    if(!dashboard.simulatorConfigFiles || dashboard.simulatorConfigFiles.length  === 0) {
      this.checkForSimulatorConfig(dashboard, index);
    }
    dashboard.enableSimulator = true;
    dashboard.enableLink = false;
    dashboard.enableDeviceOrGroup = false;
    this.loadSimulatorConfigFiles(dashboard);
  }

  private async loadTemplateDetails(dbDashboard): Promise<Observable<any>> {
    return this.catalogService.getTemplateDetails(dbDashboard).pipe(
      catchError((err) => {
        return this.catalogService.getTemplateDetailsFallBack(dbDashboard);
      })
    );
  }

  private async loadTemplateDetailsFromDC(template: any, index?): Promise<void> {
    this.templateDetails.dashboards[index].isSpin = true;
    if (template?.availability && template?.availability === "SHARED") {
      let currentDashboardTemplate = cloneDeep(template.templateDetails);;
      this.templateDetails.dashboards[index].dynamicDashboardArray =
            cloneDeep(currentDashboardTemplate);
    } else {
      this.templateCatalogFromDCService
        .getTemplateDetails(template.dashboard)
        .pipe(
          catchError((err) => {
            console.log(
              "Dashboard Catalog Details: Error in primary endpoint! using fallback..."
            );
            return this.templateCatalogFromDCService.getTemplateDetailsFallBack(
              template.dashboard
            );
          })
        )
        .subscribe((templateDetails) => {
          let currentDashboardTemplate = templateDetails;
          this.templateDetails.dashboards[index].isSpin = false;
          
          this.templateDetails.plugins.length = 0;
          this.templateDetails.plugins = cloneDeep(this.pluginDetailsArray);
          const pluginDependencies: any = currentDashboardTemplate?.input?.dependencies.filter(
            (pluginDep) => pluginDep.type === "plugin"
          );
          this.templateDetails.plugins =
            this.templateDetails.plugins.concat(pluginDependencies);
          this.templateDetails.plugins = this.templateDetails.plugins.reduce(
            (accumulator, current) => {
              if (!accumulator.find((item) => item.id === current.id)) {
                current.selected = true;
                if (this.widgetCatalogService.isCompatiblieVersion(current)) {
                  accumulator.push(current);
                }
              }
              return accumulator;
            },
            []
          );
          // Microservice

          this.templateDetails.microservices.length = 0;
          this.templateDetails.microservices = cloneDeep(
            this.microserviceArray
          );
          const microserviceDependencies: any = currentDashboardTemplate?.input?.dependencies.filter(
            (microserviceDep) => microserviceDep.type === "microservice"
          );
          this.templateDetails.microservices =
            this.templateDetails.microservices.concat(microserviceDependencies);
          this.templateDetails.microservices =
            this.templateDetails.microservices.reduce(
              (accumulator, current) => {
                if (!accumulator.find((item) => item.id === current.id)) {
                  current.selected = true;
                  if (this.widgetCatalogService.isCompatiblieVersion(current)) {
                    accumulator.push(current);
                  }
                }
                return accumulator;
              },
              []
            );

      
          this.templateDetails.dashboards[index].dynamicDashboardArray =
            cloneDeep(currentDashboardTemplate);
          this.loadSimulatorConfigFiles(this.templateDetails.dashboards[index]);
            this.pluginDetailsArray = cloneDeep(this.templateDetails.plugins);
        });
    }
  }


  async validateAndConfigure(app) {
    const isAnyStepPending = this.setup.steps.some(
      (step, index) =>
        index !== this.setup.steps.length - 1 && step.completed === false
    );
    if (!isAnyStepPending) {
      this.next();
      return false;
    }
    let simulatorWarningPopup;
    const alertMessage = {
      title: 'No Simulator Configuration',
      description: `Simulator Configuration doesn't exist for the dashboard template selected. Simulators, devices, or groups won't be created. Do you want to continue?`,
      type: 'warning',
      alertType: 'confirm', //info|confirm,
      confirmPrimary: true //confirm Button is primary
  }

  for (let ts=0; ts < this.templateDetails.dashboards.length; ts++) {
    if (this.templateDetails.dashboards[ts].enableSimulator && this.templateDetails.dashboards[ts].simulatorFileExists === false) {
      simulatorWarningPopup = true;
      break;
    } else {
      simulatorWarningPopup = false;
    }
  }

  if (simulatorWarningPopup) {
    const simulatorDialofRef = this.alertModalDialog(alertMessage);
    await simulatorDialofRef.content.event.subscribe(async data => {
      if (data && data.isConfirm) {
        this.configureApp(app);
      } else {
        return false;
      }
    });
  } else {
    this.configureApp(app);
  }
  }

  async configureApp(app: any) {
    const currentHost = window.location.host.split(":")[0];
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      this.alert.warning("Installation isn't supported when running Application on localhost.");
      return;
    }
    if (this.isRetry) {
      this.next();
      return;
    } 

    this.templateDetails.plugins = this.templateDetails.plugins.reduce(
      (accumulator, current) => {
        if (!accumulator.find((item) => item.id === current.id)) {
          current.selected = true;
          if (this.widgetCatalogService.isCompatiblieVersion(current)) {
            accumulator.push(current);
          }
        }
        return accumulator;
      },
      []
    );

    // Filter dashboards which are selected

    let configDataDashboards = this.templateDetails.dashboards.filter(
      (item) => item.selected === true
    );
    let configDataPlugins = this.templateDetails.plugins;
    let configDataMicroservices = this.templateDetails.microservices;

    // create Dashboard and install dependencies
    // Also connect with the devices selected
    let totalRemotes = configDataPlugins.length;
    totalRemotes = totalRemotes + configDataMicroservices.length;
    totalRemotes = totalRemotes + configDataDashboards.length;

    const eachRemoteProgress: number = Math.floor(
      totalRemotes > 1 ? 90 / totalRemotes : 0
    );
    let overallProgress = 0;
    this.showProgressModalDialog("Verifying dependencies...");

    if (totalRemotes > 1) {
      this.progressIndicatorService.setOverallProgress(overallProgress);
    }
    this.progressIndicatorService.setOverallProgress(5);
    const listOfPackages = await this.pluginsService.listPackages();
    for (let plugin of configDataPlugins) {
      await this.installPlugin(plugin, listOfPackages);
      overallProgress = overallProgress + eachRemoteProgress;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.progressIndicatorService.setOverallProgress(overallProgress);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (this.isMSEnabled) {
      for (let ms of configDataMicroservices) {
        this.progressIndicatorService.setMessage(`Installing ${ms.title}`);
        this.progressIndicatorService.setProgress(10);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const isInstalled =
          (await this.applicationBinaryService.verifyExistingMicroservices(
            ms.id
          )) as any;
        if (!isInstalled) {
          await this.installMicroservice(ms);
        }
        overallProgress = overallProgress + eachRemoteProgress;
        this.progressIndicatorService.setOverallProgress(overallProgress);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let dbClasses = {};
    if (app.applicationBuilder && app.applicationBuilder.selectedTheme) {
      dbClasses = {
        "dashboard-theme-branded": true,
      };
    }

    for (let [index, db] of configDataDashboards.entries()) {
      this.progressIndicatorService.setProgress(20);
      this.progressIndicatorService.setMessage(`Installing ${db.title}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // in case of multiple templates

      let templateDetailsData;
      let dashboardTemplates;
        if (db.welcomeTemplates) {
          this.templateSelected = this.blueprintForge.selectedWelcomeTemplate;
          dashboardTemplates = this.welcomeTemplateData.find(
            (dashboardTemplate) =>
              dashboardTemplate.dashboardName === this.templateSelected
          );
          if (
            dashboardTemplates &&
            this.templateSelected === "Default Template"
          ) {
            templateDetailsData = await (
              await this.loadTemplateDetails(db.dashboard)
            ).toPromise();
          } else {
            templateDetailsData = await (
              await this.loadTemplateDetails(dashboardTemplates.dashboard)
            ).toPromise();
          }
        } else {
  
          if(db.dynamicDashboardArray && db.dynamicDashboardTemplate) {
            templateDetailsData = db.dynamicDashboardArray;
            db.dashboard = db.dynamicDashboardTemplate.dashboard;
          } 
          else 
          {
            templateDetailsData = await (
              await this.loadTemplateDetails(db.dashboard)
            ).toPromise();
          }
         
        }
      

      const dashboardConfiguration = {
        dashboardId: "12598412",
        dashboardName: db.title,
        dashboardIcon: db.icon,
        deviceId: "",
        tabGroup: "",
        dashboardVisibility: db.visibility,
        roles: "",
        templateType: db.templateType, // 0: default, 1: group, 2: type
        classes: dbClasses,
      };

      this.progressIndicatorService.setProgress(40);
      if (
        db.title !== "Instruction" &&
        db.title !== "Welcome" &&
        db.title !== "Help and Support" &&
        db.isConfigRequred
      ) {
        templateDetailsData.widgets.forEach((widget) => {
          const dbWidgetConfig = db.basicConfig.find(
            (basicConfig) => basicConfig.componentId == widget.componentId
          );
          if (dbWidgetConfig) {
            dbWidgetConfig.config.forEach((item) => {
              // Works if widget config in global presales is not nested
              if (item.type === "select") {
                if (
                  widget.config &&
                  widget.config?.hasOwnProperty(item.fieldName)
                ) {
                  widget.config[item.fieldName].push(item.name);
                }
              } else {
                if (
                  widget.config &&
                  widget.config?.hasOwnProperty(item.fieldName)
                ) {
                  widget.config[item.fieldName] = item.name;
                }
              }
            });
          }
        });
      }

      // 1. normal dashboard : isGroupDashboard: false
      // 2. normal but device or group without folder: isGroupDashboard: false
      // 3. group template -with folder - > isGroupDashboard : true
      if (db.isGroupDashboard || (db.templateType && db.templateType === 2)) {
        this.groupTemplate = true;
      } else {
        this.groupTemplate = false;
      }
      
      let findMatchedSimulator;
      if (db.devices && db.devices[0]?.reprensentation?.id === 'dummy_id') {
        findMatchedSimulator = this.templateDetails.dashboards.find(matchedSim => db.defaultLinkedDashboard === matchedSim.title);
        if (findMatchedSimulator) {
          if (findMatchedSimulator.enableSimulator && findMatchedSimulator.simulatorFileExists && !findMatchedSimulator?.simulatorGeneratedAlready) {
            await this.simulatorFileGeneration(findMatchedSimulator);
            
          }
          if(findMatchedSimulator?.simulatorGeneratedAlready) {
            db.devices = findMatchedSimulator.devices;
          }
        }
      }

      if (db.enableSimulator && db.simulatorFileExists && !db?.simulatorGeneratedAlready) {
        await this.simulatorFileGeneration(db);
      }

        templateDetailsData.input.devices = db.devices;
     
      if (
        db.title !== "Instruction" &&
        db.title !== "Welcome" &&
        db.title !== "Help and Support"
      ) {
        // Newly added code for different way of linking dashboards
          let findDashbordsWithMatchedLink =
            this.templateDetails.dashboards.filter(
              (itemWithLinkSet) =>
                itemWithLinkSet.defaultLinkedDashboard === db.title
            );
            if (findDashbordsWithMatchedLink) {
              findDashbordsWithMatchedLink.forEach(
            
                (dependentDb) => {
                  
                  (dependentDb.devices = db.devices);
    
                  this.filterChildsDependent = configDataDashboards.filter(cdDashboard => cdDashboard.defaultLinkedDashboard === dependentDb.title);
                  if (this.filterChildsDependent) {
                    this.filterChildsDependent.forEach(childDependent => childDependent.devices = dependentDb.devices);
                  }
                }
              );
            }
      }

        await this.catalogService.createDashboard(
          this.currentApp,
          dashboardConfiguration,
          db,
          templateDetailsData,
          this.groupTemplate
        );
      
      this.progressIndicatorService.setProgress(90);
      overallProgress = overallProgress + eachRemoteProgress;
      this.progressIndicatorService.setOverallProgress(overallProgress);
    }
    const appBuilderApp: any = await (
      await this.appDataService.getAppDetails(this.currentApp.id + "")
    ).toPromise();
    await this.processDashboardLinks(appBuilderApp);
    this.storeLatestSortedOrderinApp(appBuilderApp);
    await this.progressIndicatorService.setProgress(95);
    overallProgress = overallProgress + eachRemoteProgress;
    this.progressIndicatorService.setOverallProgress(overallProgress);
    if (window && window["aptrinsic"]) {
      window["aptrinsic"]("track", "gp_blueprint_forge_template_installed", {
        templateName: this.templateDetails.title,
        appName: this.currentApp.name,
        tenantId: this.settingsService.getTenantName(),
      });
    }
    this.hideProgressModalDialog();
    if (this.blankTemplateDashboard) {
      this.setup.steps[2].completed = true;
      this.setup.stepCompleted(2);
      this.next();
      this.showProgressModalDialog(
        "Establishing Basic Dashboards for Blank Template"
      );
      this.progressIndicatorService.setOverallProgress(5);
      this.setup.steps[3].completed = true;
      this.setup.stepCompleted(3);
      this.next();
      await new Promise((resolve) => setTimeout(resolve, 5000));
      this.hideProgressModalDialog();
    } else if((!this.installationFailed) || (this.isRetry)) {
      this.next();
    } else {
      this.isRetry = true;
    }
  }

  async installMicroservice(microService: MicroserviceDetails): Promise<void> {
    let counter = 10;
    this.microserviceDownloadProgress$ =
      this.microserviceDownloadProgress.subscribe(async (val) => {
        counter++;
        if (counter <= 40) {
          this.progressIndicatorService.setProgress(counter);
        }
      });
      const fileName = microService.link.replace(/^.*[\\\/]/, "");
    const data = await this.templateCatalogSetupService
      .downloadBinary(microService.link);
      if (!data) {

        // Flag to show the alert service of missing microservice/plugin for the first time
        this.installationFailed = true;
        
        this.alertService.danger(
          "Unable to install "+fileName+". Please install it manually.",
          "Unable to install the "+fileName+ " because the 'Cumulocity Community Utils' microservice is not installed or subscribed."
        );
        return;
      }
    let createdApp = null;
    this.microserviceDownloadProgress$.unsubscribe();
    try {
      this.progressIndicatorService.setProgress(40);
      this.progressIndicatorService.setMessage(
        `Installing ${microService.title}`
      );
      const blob = new Blob([data], {
        type: "application/zip",
      });
      
      const fileOfBlob = new File([blob], fileName);

      const createdApp =
        await this.applicationBinaryService.createAppForMicroservice(
          fileOfBlob,
          microService
        );
      this.progressIndicatorService.setProgress(50);
      counter = 50;
      this.microserviceDownloadProgress$ =
        this.microserviceDownloadProgress.subscribe(async (val) => {
          counter++;
          if (counter <= 80) {
            this.progressIndicatorService.setProgress(counter);
          }
        });
      await this.applicationBinaryService.uploadMicroservice(
        fileOfBlob,
        createdApp
      );
      this.microserviceDownloadProgress$.unsubscribe();
      this.progressIndicatorService.setProgress(80);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (ex) {
      createdApp = null;
      this.alert.danger(
        "There is some technical error! Please try after sometime."
      );
      console.error(ex.message);
    }
  }

  async installPlugin(
    plugin: PluginDetails,
    listOfPlugins: IApplication[]
  ): Promise<void> {
    const widgetBinaryFound = listOfPlugins.find(
      (app) =>
        app.name.toLowerCase() === plugin.title?.toLowerCase() ||
        (app.contextPath &&
          app.contextPath?.toLowerCase() === plugin?.contextPath?.toLowerCase())
    );
    this.progressIndicatorService.setMessage(`Installing ${plugin.title}`);
    this.progressIndicatorService.setProgress(10);
    if (widgetBinaryFound) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.progressIndicatorService.setProgress(30);
      await this.widgetCatalogService
        .updateRemotesInCumulocityJson(widgetBinaryFound, true)
        .then(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          },
          (error) => {
            this.alert.danger(
              "There is some technical error! Please try after sometime."
            );
            console.error(error);
          }
        );
    } else {
      this.progressIndicatorService.setProgress(10);
      const fileName = plugin.link.replace(/^.*[\\\/]/, "");
      const data = await this.templateCatalogSetupService
        .downloadBinary(plugin.link);
      if (!data) {
         // Flag to show the alert service of missing microservice/plugin for the first time
         this.installationFailed = true;
         
        this.alertService.danger(
          "Unable to install "+fileName+". Please install it manually.",
          "Unable to install the "+fileName+ " because the 'Cumulocity Community Utils' microservice is not installed or subscribed."
        ); 
        return;
      } 
      
      this.progressIndicatorService.setProgress(20);
      const blob = new Blob([data], {
        type: "application/zip",
      });
      
      const fileOfBlob = new File([blob], fileName);
      await this.widgetCatalogService.installPackage(fileOfBlob).then(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        },
        (error) => {
          this.alert.danger(
            "There is some technical error! Please try after sometime."
          );
          console.error(error);
        }
      );
    }
  }

  //Processing dashboardlinks for dashboard navigations
  private async processDashboardLinks(app) {
    if (
      this.templateDetails.dashboardLinks &&
      this.templateDetails.dashboardLinks.length > 0
    ) {
      if (this.currentApp.id) {
        this.progressIndicatorService.setMessage(`Updating Dashboard links`);
       
        if (
          app.applicationBuilder &&
          app.applicationBuilder?.dashboards &&
          app.applicationBuilder?.dashboards.length > 0
        ) {
          let dashboards = app.applicationBuilder.dashboards;
          for (let dbLinks of this.templateDetails.dashboardLinks) {
            const updatableDashboardId = dashboards.find(
              (db) => db.name === dbLinks.dashboardName
            )?.id;
            const targetDashboardId = dashboards.find(
              (db) =>
                db.name === dbLinks.targetDashboardName 
            )?.id;
            if (updatableDashboardId && targetDashboardId) {
              const updatableDashboardObj = (
                await this.invService.detail(updatableDashboardId)
              ).data?.c8y_Dashboard;
              if (updatableDashboardObj) {
                const keys = Object.keys(updatableDashboardObj.children);
                keys.forEach((key, idx) => {
                  if (
                    updatableDashboardObj?.children[key]?.componentId ==
                    dbLinks.widgetComponentId
                  ) {
                    _.set(
                      updatableDashboardObj.children[key],
                      dbLinks.updatableProperty,
                      targetDashboardId
                    );
                  }
                });
                await this.invService.update({
                  id: updatableDashboardId,
                  c8y_Dashboard: updatableDashboardObj,
                });
              }
            }
          }
        }
      }
    }
  }

  //TODO Refactor
  openDeviceSelectorDialog(dashboard, templateType: number, index) {
    switch (templateType) {
      case 1:
        this.assetButtonText = "Device Group";
        this.groupTemplate = true;
        break;
      case 2:
        this.assetButtonText = "Device/Asset Type";
        this.groupTemplate = true;
        break;
      default:
        this.assetButtonText = "Device/Asset";
        this.groupTemplate = false;
        break;
    }
    this.deviceSelectorModalRef = this.modalService.show(
      DeviceSelectorModalComponent,
      { class: "c8y-wizard", initialState: { templateType } }
    );

    if (templateType == 2) {
      this.deviceSelectorModalRef.content.onTypeSelected.subscribe(
        (selectedItem: IManagedObject) => {
          dashboard.name = selectedItem;
          dashboard.templateType = templateType;
          dashboard.devices = [
            {
              type: "Temperature Sensor",
              placeholder: "device01",
              reprensentation: {
                id: selectedItem,
                name: selectedItem,
              },
            },
          ];
          
            for (
              let dd = 0;
              dd < this.templateDetails.dashboards.length;
              dd++
            ) {
              if (
                this.templateDetails.dashboards[dd].isDeviceRequired === true &&
                (this.templateDetails.dashboards[dd].linkWithDashboard && dashboard.id && 
                  this.templateDetails.dashboards[dd].linkWithDashboard ===
                  dashboard.id)
              ) {
                this.templateDetails.dashboards[dd].devices = null;
                this.templateDetails.dashboards[dd].linkDashboards = [];
                this.templateDetails.dashboards[dd].defaultLinkedDashboard = 'Select Link';
              } 
            }
            this.formValidation('onload', dashboard);
            this.generateLinkingDashboards();
          }
          
       // }
      );
    } else {
      this.deviceSelectorModalRef.content.onDeviceSelected.subscribe(
        (selectedItem: IManagedObject) => {
          dashboard.name = selectedItem["name"];
          dashboard.templateType = templateType;
          dashboard.devices = [
            {
              type: "Temperature Sensor",
              placeholder: "device01",
              reprensentation: {
                id: selectedItem.id,
                name: selectedItem["name"],
              },
            },
          ];
          
          
            for (
              let dd = 0;
              dd < this.templateDetails.dashboards.length;
              dd++
            ) {
              if (
                this.templateDetails.dashboards[dd].isDeviceRequired === true &&
                (this.templateDetails.dashboards[dd].linkWithDashboard && dashboard.id &&
                this.templateDetails.dashboards[dd].linkWithDashboard ===
                  dashboard.id)
              ) {
                this.templateDetails.dashboards[dd].devices = !this
                  .templateDetails.dashboards[dd].devices
                  ? dashboard.devices
                  : this.templateDetails.dashboards[dd].devices;
                this.templateDetails.dashboards[dd].defaultLinkedDashboard =
                  dashboard.title;
              }
            }
            this.formValidation('onload', dashboard);
          this.generateLinkingDashboards();
        }
      );
    }
  }

  hideProgressModalDialog() {
    this.progressModal.hide();
  }

  showProgressModalDialog(message: string): void {
    this.progressModal = this.modalService.show(
      ProgressIndicatorModalComponent,
      { class: "c8y-wizard", initialState: { message } }
    );
  }

  assignSelectedDashboard(index, event, sentFrom) {
    this.templateDetails.dashboards[index].dynamicDashboardAssigned = true;
    if (sentFrom === 'fromTemplate') {
      this.checkForSimulatorConfig(event.item, index);
      this.templateDetails.dashboards[index].dynamicDashboardTemplate =
      event.item;
      this.loadTemplateDetailsFromDC(event.item, index);
    } else if (sentFrom === 'fromPopup') {
      this.checkForSimulatorConfig(event, index);
      this.templateDetails.dashboards[index].dynamicDashboardTemplate =
      event;
      this.loadTemplateDetailsFromDC(event, index);
    }
    
  }

  async checkForSimulatorConfig(event, index) {
    let templateDetailsData;
    templateDetailsData = await (
      await this.loadTemplateDetails(event.dashboard)
    ).toPromise();
    if (
      templateDetailsData.simulatorDTDL &&
      templateDetailsData.simulatorDTDL[0].simulatorFile &&
      templateDetailsData.simulatorDTDL[0].simulatorFileName
    ) {
      this.templateDetails.dashboards[index].simulatorFileExists = true;
    } else {
      this.templateDetails.dashboards[index].simulatorFileExists = false;
    }
    this.templateDetails.dashboards[index].dtdlFileExists = true ? templateDetailsData.dtdl : false;
    if (templateDetailsData.dtdl) {
      this.templateDetails.dashboards[index].dtdlURL = templateDetailsData.dtdl;
    }
    
  }

  private loadTemplatesFromDashboardCatalog() {
    this.templateCatalogFromDCService
      .getTemplateCatalog()
      .pipe(
        catchError((err) => {
          console.log(
            "Dashboard Catalog: Error in primary endpoint! using fallback..."
          );
          return this.templateCatalogFromDCService.getTemplateCatalogFallBack();
        })
      )
      .subscribe(
        (catalog: any) => {
          this.filterTemplates = catalog
            ? catalog
            : [];
            this.blankDashboardURL = this.filterTemplates.find(urlObject => urlObject.title === 'Blank Dashboard');
          let findMatchedIdObject;
          this.templateDetails.dashboards.forEach((item, index) => {
            if (item.linkWithDashboard) {
              findMatchedIdObject = this.templateDetails.dashboards.find(
                (match) => match.id === item.linkWithDashboard
              );
              if (
                findMatchedIdObject &&
                findMatchedIdObject.devices &&
                findMatchedIdObject.devices[0].reprensentation.id
              ) {
                item.defaultLinkedDashboard = findMatchedIdObject.title
                  ? findMatchedIdObject.title
                  : "";
              }
            } else {
              item.defaultLinkedDashboard = "";
            }
          });

        },
        (error) => {
          this.alertService.danger(
            "There is some technical error! Please try after sometime."
          );
        }
      );
  }

  private async prepareDashboardList() {

    // Revert back sort based on original index to create the application in original order
    const storedTemplateDashboards = cloneDeep(this.templateDetails.dashboards);
    let commonDashboards = [];
    let functionalDashboards = [];
    let helpAndSupport;
    storedTemplateDashboards.forEach(dashboard => {
      if (dashboard.title === 'Instruction' || dashboard.title === 'Welcome') {
        commonDashboards.push(dashboard);
      } else if (dashboard.title !== 'Help and Support'){
        functionalDashboards.push(dashboard);
      } else {
        helpAndSupport = dashboard;
      }
    });

      functionalDashboards = functionalDashboards.reduce(
        (acc, element) => {
          if (element.isGroupDashboard) {
            return [element, ...acc];
          }
          return [...acc, element];
        },
        []
      );
    this.templateDetails.dashboards = commonDashboards.concat(functionalDashboards);
    this.templateDetails.dashboards.push(helpAndSupport);

    this.templateDetails.dashboards.forEach(async (dashboard, index) => {
      dashboard.enableSimulator = false;
      dashboard.enableDeviceOrGroup = true;
      dashboard.enableLink = false;
  
      if (
        dashboard.title != "Instruction" &&
        dashboard.title != "Help and Support" &&
        dashboard.title != "Welcome"
      ) {
        dashboard.linkDashboards = [];
      }

      if (dashboard.linkWithDashboard) {
        dashboard.enableLink = true;
        dashboard.enableSimulator = dashboard.enableDeviceOrGroup = false;
       
            
      } else if (
        dashboard.enableSimulator
      ) {
        this.loadSimulatorConfigFiles(dashboard);
      }

      dashboard.selectedDashboardName = dashboard.title;
      dashboard.dashboardTemplateSelected = dashboard.title;
      dashboard.defaultLinkedDashboard ="Select Link";
    });
  }

  async loadSimulatorConfigFiles(dashboard) {
    let templateDetailsData;
    let simulatorConfigFile = "";
    let simulatorFileName = "";
    if(dashboard && dashboard.dynamicDashboardArray && dashboard.dynamicDashboardArray.simulatorDTDL && dashboard.dynamicDashboardArray.simulatorDTDL.length > 0) {
      simulatorConfigFile = dashboard.dynamicDashboardArray.simulatorDTDL[0]?.simulatorFile;
      simulatorFileName = dashboard.dynamicDashboardArray.simulatorDTDL[0]?.simulatorFileName;
    } else {
      templateDetailsData = await (
        await this.loadTemplateDetails(dashboard.dashboard)
      ).toPromise();
      if (templateDetailsData && templateDetailsData.simulatorDTDL && templateDetailsData.simulatorDTDL.length > 0) {
        simulatorConfigFile = templateDetailsData.simulatorDTDL[0]?.simulatorFile;
      simulatorFileName = templateDetailsData.simulatorDTDL[0]?.simulatorFileName;
      }
    }

    const SimulatorConfigFiles = [];
    let currentSimulatorData;

    if (simulatorConfigFile) {
      currentSimulatorData = await (
        await this.loadTemplateDetails(simulatorConfigFile)
      ).toPromise();

      SimulatorConfigFiles.push({
        fileName: simulatorFileName,
        fileContent: currentSimulatorData,
      });
    }
    dashboard.simulatorConfigFiles = SimulatorConfigFiles;
  }

  linkOtherDashboard(dashboard) {
    dashboard.enableLink = true;
    dashboard.enableSimulator = false;
    dashboard.enableDeviceOrGroup = false;
    if (!dashboard.linkDashboards || dashboard.linkDashboards?.length === 0) {
      this.generateLinkingDashboards();
    }
    this.formValidation('onload', dashboard);
  }

  connectActualDeviceOrGroup(dashboard, index) {
    dashboard.enableDeviceOrGroup = true;
    dashboard.enableSimulator = dashboard.enableLink = false;
    this.clearDeviceandLinksOnToggleSwitch(dashboard, index);
    this.formValidation('onload', dashboard);
  }

  async updateDepedencies(index) {
    if (
      !this.templateDetails[index] ||
      !this.templateDetails[index].input ||
      !this.templateDetails[index].input.dependencies ||
      this.templateDetails[index].input.dependencies.length === 0
    ) {
      return;
    }

    for (let dependency of this.templateDetails[index].input.dependencies) {
      if (dependency.type && dependency.type == "microservice") {
        dependency.isInstalled =
          (await this.applicationBinaryService.verifyExistingMicroservices(
            dependency.id
          )) as any;
        dependency.isSupported = true;
        dependency.visible = true;
      } else {
        this.verifyWidgetCompatibility(dependency, index);
        if (dependency.ids && dependency.ids.length > 0) {
          Promise.all(
            dependency.ids.map(async (id) => {
              return (await this.componentService.getById(id)) ? true : false;
            })
          ).then((widgetStatusList: boolean[]) => {
            const widgetObj = widgetStatusList.find((widget) => !widget);
            dependency.isInstalled = widgetObj == undefined;
          });
        } else {
          this.componentService.getById(dependency.id).then((widget) => {
            dependency.isInstalled = widget != undefined;
          });
        }
      }
    }
  }

  generateLinkingDashboards() {
    let linkDashboards: any = cloneDeep(this.templateDetails.dashboards);

    linkDashboards = linkDashboards.filter(
      (item) =>
        item.title != "Welcome" &&
        item.title !== "Help and Support" &&
        item.title !== "Instruction" &&
        ((item.devices && item.devices[0]?.reprensentation.id !== null && item.devices?.length > 0) ||
          (item.simulatorGroupName && item.simulatorNoOfDevices)) &&
          JSON.stringify(item.templateType) !== '2'
    );
    this.templateDetails.dashboards.forEach((dashboardItem) => {
      if (
        dashboardItem.title != "Instruction" &&
        dashboardItem.title != "Help and Support" &&
        dashboardItem.title != "Welcome"
      ) {

        let linkDashboardsCopy = cloneDeep(linkDashboards);
        linkDashboardsCopy =  linkDashboardsCopy.filter( copyDashboard =>  copyDashboard.title !== dashboardItem.title); 
        dashboardItem.linkDashboards = linkDashboardsCopy;
        
      }
      let dashboardExistInDC = this.filterTemplates.find(template => template.title === dashboardItem.title);
      if (dashboardExistInDC) {
        dashboardItem.dashboardTemplateSelected = dashboardItem.title;
      } else {
        dashboardItem.dashboardTemplateSelected = "Blank Dashboard";
      }
      
      dashboardItem.defaultLinkedDashboard =
        !dashboardItem.linkDashboards ||
        dashboardItem.linkDashboards.length === 0
          ? "Select Link"
          : dashboardItem.defaultLinkedDashboard;
    });
  }

  configureCustomDashboard() {
    this.bsModalRef = this.modalService.show(
      ConfigureCustomDashboardModalComponent,
      { class: "c8y-wizard" }
    );
    this.bsModalRef.content.onSave.subscribe((response) => {
      response.dashboardTemplateSelected = "Blank Dashboard";
      response.selectedDashboardName = "Blank Dashboard";
      response.dashboard = this.blankDashboardURL.dashboard;
      this.templateDetails.dashboards.push(response);
      this.loadTemplatesForCustomDashboard();
      this.formValidation('onload', response);
    });
  }

  removeCustomDashboard(i) {
    this.templateDetails.dashboards.splice(i, 1);
    this.formValidation('onload');
  }

  onSelectOfLinkingDashboard(linkDashboard, dashboardIndex, dashboard) {
    this.templateDetails.dashboards[dashboardIndex].defaultLinkedDashboard =
      linkDashboard.title;
    this.templateDetails.dashboards[dashboardIndex].devices = linkDashboard.devices;
    this.formValidation('onload', dashboard);
  }

  sortDashboardsByTitle(sortableArray) {
    let sortedData = sortableArray.sort((a, b) => {
      let x = a.title.toLowerCase();
      let y = b.title.toLowerCase();
      if (x > y) {
        return 1;
      }
      if (x < y) {
        return -1;
      }
      return 0;
    });
    return sortedData;
  }

  private verifyWidgetCompatibility(dependency: DependencyDescription, index) {
    if (this.widgetCatalogService.isCompatiblieVersion(dependency)) {
      dependency.isSupported = true;
      dependency.visible = true;
    } else {
      const differentDependencyVersion = this.templateDetails[
        index
      ].input.dependencies.find(
        (widget) =>
          widget.id === dependency.id && widget.link !== dependency.link
      );
      dependency.isSupported = false;
      if (differentDependencyVersion) {
        dependency.visible = false;
      } else {
        dependency.visible = true;
      }
    }
  }
  async simulatorFileGeneration(dashboard) {
    dashboard.templateType = 1;
      let isGroup = true;
      let content =  await this.simulatorConfigService.generateSimulatorFromConfiguration(
        dashboard.simulatorGroupName,
        dashboard.simulatorNoOfDevices,
        dashboard.simulatorConfigFiles[0].fileContent,
        isGroup,
        dashboard.simulatorGroupName,
      );
      if(content && content.status == 0)
      {
          // this.currentApp.applicationBuilder.simulators = content.simulators;
          this.currentApp=content.app;
          dashboard.name = content?.deviceId;
          dashboard.devices = [
            {
              type: "Temperature Sensor",
              placeholder: "device01",
              reprensentation: {
                id: content?.deviceId,
                name: content?.deviceName,
              },
            },
          ];

          this.templateDetails?.dashboards.forEach(dashboardItem => {
            if (dashboardItem.defaultLinkedDashboard === dashboard.title) {
              dashboardItem.devices = dashboard.devices;
            }
          })
          dashboard.simulatorGeneratedAlready = true;
        }
      else {
        if(content && content.status) {
          this.alertService.danger(content.message);
        }
      }
  }

  checkAndGenerateLinks(dashboard) {
    this.formValidation('onload', dashboard);
    if (dashboard.simulatorGroupName && dashboard.simulatorNoOfDevices) {
      dashboard.templateType = 1;
      // Assign some data to take care of link, only for UI purpose at this stage
      dashboard.devices = [
        {
          type: "Temperature Sensor",
          placeholder: "device01",
          reprensentation: {
            id: "dummy_id",
            name: dashboard.simulatorGroupName,
          },
        },
      ];

      for (let dd = 0; dd < this.templateDetails.dashboards.length; dd++) {
        if (
          this.templateDetails.dashboards[dd].isDeviceRequired === true &&
          (this.templateDetails.dashboards[dd].linkWithDashboard && dashboard.id && this.templateDetails.dashboards[dd].linkWithDashboard === dashboard.id)
        ) {
          this.templateDetails.dashboards[dd].devices = !this.templateDetails
            .dashboards[dd].devices
            ? dashboard.devices
            : this.templateDetails.dashboards[dd].devices;
          this.templateDetails.dashboards[dd].defaultLinkedDashboard =
            dashboard.title;
        }
      }
      this.generateLinkingDashboards();
      this.formValidation('onload', dashboard);
    } else {
      this.formValidation('onload', dashboard);
    }
  }

  private async storeLatestSortedOrderinApp(app) {
    if (
      app.applicationBuilder &&
      app.applicationBuilder?.dashboards &&
      app.applicationBuilder?.dashboards.length > 0
    ) {
      let appBuilderDashboards = [];
      let commonDashboards = [];
        let functionalDashboards = [];
        let helpAndSupport;
        app.applicationBuilder.dashboards.forEach(dashboard => {
          if (dashboard.name === 'Instruction' || dashboard.name === 'Welcome') {
            commonDashboards.push(dashboard);
          } else if (dashboard.name && dashboard.name !== 'Help and Support'){
            functionalDashboards.push(dashboard);
          } else if (dashboard.name === 'Help and Support') {
            helpAndSupport = dashboard;
          }
        });
        functionalDashboards = functionalDashboards.reduce(
          (acc, element) => {
            if (!element.groupTemplate) {
              return [element, ...acc];
            }
            return [...acc, element];
          },
          []
        );

        if (commonDashboards && commonDashboards.length > 0) {
          appBuilderDashboards = commonDashboards;
        }
        if (functionalDashboards && functionalDashboards.length > 0) {
          if (appBuilderDashboards && appBuilderDashboards.length > 0) {
            appBuilderDashboards = appBuilderDashboards.concat(functionalDashboards);
          } else {
            appBuilderDashboards = functionalDashboards;
          }
        }
          if (helpAndSupport) {
            appBuilderDashboards.push(helpAndSupport);
          }
          if (appBuilderDashboards && appBuilderDashboards.length > 0) {
            app.applicationBuilder.dashboards = appBuilderDashboards;
          }
          await this.appService.update({
            id: app.id,
            applicationBuilder: app.applicationBuilder
        } as any);
    }
  }

  private loadTemplatesForCustomDashboard() {
    this.templateCatalogFromDCService
      .getTemplateCatalog()
      .pipe(
        catchError((err) => {
          console.log(
            "Dashboard Catalog: Error in primary endpoint! using fallback..."
          );
          return this.templateCatalogFromDCService.getTemplateCatalogFallBack();
        })
      )
      .subscribe(
        (catalog: any) => {
        },
        (error) => {
          this.alertService.danger(
            "There is some technical error! Please try after sometime."
          );
        }
      );
  }

  formValidation( type: string, dashboard?) {
    let formValid;
    if (type === 'onchange') {
      if (dashboard.enableSimulator && (!dashboard.simulatorGroupName || !dashboard.simulatorNoOfDevices)) {
        formValid = false;
      } else if ((dashboard.enableDeviceOrGroup) && (!dashboard.devices || dashboard.devices.length === 0)) {
        formValid = false;
      } else if (dashboard.enableLink && (!dashboard.defaultLinkedDashboard ||  dashboard.defaultLinkedDashboard === 'Select Link' || !dashboard.dashboardTemplateSelected)) {
        formValid = false;
      } else if ((dashboard.isGroupDashboard && !dashboard.selectedDashboardName) || (!dashboard.enableLink && !dashboard.selectedDashboardName)) {
        formValid = false;
      } else {
        formValid = true;
      }
    }

    if (type === 'onload') {
      if (this.templateDetails && this.templateDetails.dashboards) {

        for(let ts = 0; ts < this.templateDetails.dashboards.length; ts++) {
          if (this.templateDetails.dashboards[ts].isDeviceRequired) {
            if (this.templateDetails.dashboards[ts].enableSimulator && (!this.templateDetails.dashboards[ts].simulatorGroupName || !this.templateDetails.dashboards[ts].simulatorNoOfDevices)) {
              formValid = false;
              break;
            } else if ((this.templateDetails.dashboards[ts].enableDeviceOrGroup)  && (!this.templateDetails.dashboards[ts].devices || this.templateDetails.dashboards[ts].devices.length === 0)) {
              formValid = false;
              break;
            } else if (this.templateDetails.dashboards[ts].enableLink && (!this.templateDetails.dashboards[ts].defaultLinkedDashboard ||  this.templateDetails.dashboards[ts].defaultLinkedDashboard === 'Select Link' || !this.templateDetails.dashboards[ts].dashboardTemplateSelected)) {
              formValid = false;
              break;
            } else if ((this.templateDetails.dashboards[ts].isGroupDashboard && !this.templateDetails.dashboards[ts].selectedDashboardName) || (!this.templateDetails.dashboards[ts].enableLink && !this.templateDetails.dashboards[ts].selectedDashboardName)) {
              formValid = false;
              break;
            } else {
              formValid = true;
            }
          }
        }
        
      }
    }
    this.formValid = formValid;
  }

  downloadDTDL(dashboardIndex) {
    const dtdlLink = document.createElement("a");
    dtdlLink.href = this.catalogService.getGithubURL(this.templateDetails.dashboards[dashboardIndex].dtdlURL);;
    document.body.appendChild(dtdlLink);
    dtdlLink.click();
    document.body.removeChild(dtdlLink);
}

private alertModalDialog(message: any): BsModalRef {
  return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
}
  
clearDeviceandLinksOnToggleSwitch(dashboard, dashboardIndex) {
    this.templateDetails.dashboards[dashboardIndex].devices = null;
    dashboard.name = null;
    dashboard.simulatorGroupName = "";
    dashboard.simulatorNoOfDevices = "";
    for (
      let dd = 0;
      dd < this.templateDetails.dashboards.length;
      dd++
    ) {
      if (
        this.templateDetails.dashboards[dd].isDeviceRequired === true &&
        (this.templateDetails.dashboards[dd].linkWithDashboard && dashboard.id && 
          this.templateDetails.dashboards[dd].linkWithDashboard ===
          dashboard.id)
      ) {
        this.templateDetails.dashboards[dd].devices = null;
        this.templateDetails.dashboards[dd].linkDashboards = [];
        this.templateDetails.dashboards[dd].defaultLinkedDashboard = 'Select Link';
      } 
    }
  
}

showDashboardTemplatesListAndPreview(dashboardTemplatesList, dashboard, index, fromTypeahead, event) {
  let dashboardTemplateData;
  dashboardTemplatesList = this.sortDashboardsByTitle(dashboardTemplatesList);
dashboardTemplatesList.forEach(async (item, index) => {
  if (item.dashboard) {
    dashboardTemplateData = await (
      await this.loadTemplateDetails(item.dashboard)
    ).toPromise();
    

    dashboardTemplatesList[index].dashboardPreview = this.catalogService.getGithubURL(dashboardTemplateData.preview);
  }
  
})
  this.deviceSelectorModalRef = this.modalService.show(
    DashboardListModalComponent,
      { class: "modal-lg", initialState: { dashboardTemplatesList } }
    );

    this.deviceSelectorModalRef.content.onTemplateSelected.subscribe(templateSelected => {
      if (fromTypeahead === 'fromSelectedDashboardTypeahead') {
        dashboard.selectedDashboardName = templateSelected;
      } else if (fromTypeahead === 'fromDashboardTemplateTypeahead') {
        dashboard.dashboardTemplateSelected = templateSelected;
      }
      let filterSelectedDashboardData = this.filterTemplates.find(item => item.title?.trim() === templateSelected?.trim());
      this.assignSelectedDashboard(index, filterSelectedDashboardData, 'fromPopup');
});
}
}
