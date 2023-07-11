import { CdkStep } from '@angular/cdk/stepper';
import { Component } from '@angular/core';
import { AlertService, AppStateService, C8yStepper, SetupComponent, Widget } from '@c8y/ngx-components';
import { TemplateSetupStep } from './../../template-setup-step';
import { TemplateCatalogSetupService } from '../../template-catalog-setup.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { DeviceSelectorModalComponent } from './../../../builder/utils/device-selector-modal/device-selector.component';
import { ApplicationService, IApplication, IManagedObject, InventoryService } from '@c8y/client';
import { ProgressIndicatorModalComponent } from './../../../builder/utils/progress-indicator-modal/progress-indicator-modal.component';
import { ProgressIndicatorService } from './../../../builder/utils/progress-indicator-modal/progress-indicator.service';
import { SettingsService } from './../../../builder/settings/settings.service';
import { WidgetCatalogService } from './../../../builder/widget-catalog/widget-catalog.service';
import { SetupConfigService } from './../../setup-config.service';

@Component({
  selector: 'c8y-template-step-four-summary',
  templateUrl: './template-step-four-summary.component.html',
  styleUrls: ['./template-step-four-summary.component.css'],
  host: { class: 'd-contents' }
})
export class TemplateStepFourSummaryComponent extends TemplateSetupStep {
  templateDetails:any;
  private progressModal: BsModalRef;
  widgetDetails: any;
  app: any;
  private appList = [];

  public dashboardConfiguration = {
    dashboardId: '12598412',
    dashboardName: '',
    dashboardIcon: 'th',
    deviceId: '',
    tabGroup: '',
    dashboardVisibility: '',
    roles: ''
};

  constructor(
    public stepper: C8yStepper,
    protected step: CdkStep,
    protected setup: SetupComponent,
    protected appState: AppStateService,
    protected alert: AlertService,
    private templateCatalogSetupService: TemplateCatalogSetupService,
    private modalService: BsModalService,
    private deviceSelectorModalRef: BsModalRef,
    private progressIndicatorService: ProgressIndicatorService,
    private inventoryService: InventoryService,
    private widgetCatalogService: WidgetCatalogService,
    protected setupConfigService: SetupConfigService
    
  ) {
    super(stepper, step, setup, appState, alert, setupConfigService);
  }

  ngOnInit() {
    
    this.templateCatalogSetupService.templateData.subscribe(currentData => {
      if (currentData) {
        this.templateDetails = currentData;
      }
    });
  }

  openDeviceSelectorDialog(dashboard: any, index): void {
    this.deviceSelectorModalRef = this.modalService.show(DeviceSelectorModalComponent, { class: 'c8y-wizard', initialState: {} });
    if (this.templateDetails.devices && this.templateDetails.devices.length === 0) {
      this.templateDetails.devices = [{
        type: "",
        placeholder: "",
        reprensentation: {
        id: "",
        name: ""
      }
      }];
    }
    this.deviceSelectorModalRef.content.onDeviceSelected.subscribe((selectedDevice: IManagedObject) => {
         this.templateDetails.devices[index].reprensentation = {
            id: selectedDevice.id,
            name: selectedDevice['name']
        }; 
        dashboard.devicesName = selectedDevice['name'];
    });
 }

 showProgressModalDialog(message: string): void {
  this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
}

async configureApp() {

  // create Dashboard and install dependencies
  // Also connect with the devices selected

  let totalRemotes = this.templateDetails.plugins.length;
  totalRemotes = totalRemotes + this.templateDetails.microservices.length;
  totalRemotes = totalRemotes + this.templateDetails.dashboards.length;

  const eachRemoteProgress: number = Math.floor((totalRemotes > 1 ? (90 / totalRemotes) : 0));
  let overallProgress = 0;
  this.showProgressModalDialog("Verifying plugins...")
  if (totalRemotes > 1) { this.progressIndicatorService.setOverallProgress(overallProgress) }
  
  for (let plugin of this.templateDetails.plugins) {
    this.progressIndicatorService.setMessage(`Installing ${plugin.title}`);
    this.progressIndicatorService.setProgress(30);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(90);
    overallProgress = overallProgress + eachRemoteProgress;
    this.progressIndicatorService.setOverallProgress(overallProgress)
  };
  await new Promise(resolve => setTimeout(resolve, 3000));
  for (let ms of this.templateDetails.microservices) {
    this.progressIndicatorService.setMessage(`Installing ${ms.title}`);
    this.progressIndicatorService.setProgress(30);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(90);
    overallProgress = overallProgress + eachRemoteProgress;
    this.progressIndicatorService.setOverallProgress(overallProgress)
  };
  await new Promise(resolve => setTimeout(resolve, 3000));
  for (let db of this.templateDetails.dashboards) {
    this.progressIndicatorService.setMessage(`Installing ${db.name}`);
    this.progressIndicatorService.setProgress(30);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.progressIndicatorService.setProgress(90);
    overallProgress = overallProgress + eachRemoteProgress;
    this.progressIndicatorService.setOverallProgress(overallProgress)
  };
  this.hideProgressModalDialog();
  this.next();
}

hideProgressModalDialog() {
  this.progressModal.hide();
}


/* Code for creating dashboard & installing dependencies*/

// this.dashboardConfiguration.dashboardName = (this.dashboardPath ? `${this.dashboardPath}/${this.dashboardConfiguration.dashboardName}` : this.dashboardConfiguration.dashboardName);
//         await this.catalogService.createDashboard(this.app, this.dashboardConfiguration, this.selectedTemplate, this.templateDetails);
    async configureAppTest(application, dashboardConfiguration) {
      await this.inventoryService.create({
        "c8y_Dashboard": this.templateCatalogSetupService.getCumulocityDashboardRepresentation(dashboardConfiguration, this.widgetDetails.widgets)
    }).then(({ data }) => {
       this.installDependency();

        return ;
    }).then(() => {
    });


    // install plugins

    for (let plugin of this.templateDetails.plugins) {
      if (plugin.link != '') {
        this.downloadAndInstallPackage(plugin.link);
      }
      
    }

    // install microservices

    for (let ms of this.templateDetails.microservices) {
      if (ms.link != '') {
      this.downloadAndInstallPackage(ms.link);
      }
    }
    }

    async installDependency(): Promise<void> {
      // const currentHost = window.location.host.split(':')[0];

      // Check if required
      // if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      //     this.alert.warning("Runtime widget installation isn't supported when running Blueprint Forge on localhost.");
      //     return;
      // }
      this.progressIndicatorService.setProgress(10);
      let link = "/blueprintForge/boonLogic/sag-ps-pkg-boonlogic-config-runtime-widget-2.0.1.zip?ref=blueprint-forge";
      this.downloadAndInstallPackage(link);
  }

    

  downloadAndInstallPackage(link) {
    this.templateCatalogSetupService.downloadBinary(link)
                .subscribe(data => {
                    this.progressIndicatorService.setProgress(20);
                    const blob = new Blob([data], {
                        type: 'application/zip'
                    });
                    const fileName = link.replace(/^.*[\\\/]/, '');
                    const fileOfBlob = new File([blob], fileName);
                    this.widgetCatalogService.installPackage(fileOfBlob).then(async () => {
                        
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        this.hideProgressModalDialog();
                    }, error => {
                        this.alert.danger("There is some technical error! Please try after sometime.");
                        console.error(error);
                    });
                });
  }




}
