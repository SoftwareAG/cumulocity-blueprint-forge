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

import { Component, OnInit } from "@angular/core";
import { InventoryService } from "@c8y/client";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { TemplateCatalogEntry, TemplateDetails } from "./template-catalog.model";
import { DomSanitizer } from "@angular/platform-browser";
import { TemplateCatalogService } from "./template-catalog.service";
import { ProgressIndicatorModalComponent } from "../utils/progress-indicator-modal/progress-indicator-modal.component";
import { ProgressIndicatorService } from "../utils/progress-indicator-modal/progress-indicator.service";
import { AlertMessageModalComponent } from "../utils/alert-message-modal/alert-message-modal.component";
import { WidgetCatalogService } from "../widget-catalog/widget-catalog.service";

@Component({
    selector: 'import-dashboard-catalog',
    templateUrl: './import-dashboard-catalog.component.html',
    styleUrls: ['import-dashboard-catalog.component.css']
})
export class ImportDashboardCatalogModalComponent implements OnInit {

    app: any;
    dashboardId: any;
    importDashboard:TemplateCatalogEntry = {
        title: "",
        description: "",
        thumbnail: "",
        useCase: "",
        dashboard: "",
        comingSoon: false,
        availability: ""
    }
    dashboardDetail:TemplateDetails ={
        input: {
            devices: [],
            images: [],
            dependencies: [],
            binaries: []
        },
        description: "",
        preview: "",
        widgets: []
    }
    previewImageURL:any = "";
    thumbnailPreviewImageURL: any = "";
    helpTemplatePopoverText = `
    <p class="m-b-8"><b>Share within tenant</b> availability will instantly make the dashboard visible within the tenant in the Dashboard Catalog.</p>
    <p class="m-b-8"><b>Export Template</b> availability will instantly download dashboard template in json format, which can further be used to import in any tenant.</p>
    `;
    //for share with market
    //<p class="m-b-8"><b>Share with market</b> availability will make dashboard to visible publicly and become a permanent part of the Dashboard Catalog once approved. The approval process may take up to 5 working days. If not approved, users can seek support from the Tech Community.</p>
    private previewImageFile: File;
    private thumbnailImageFile: File;
    private progressModal: BsModalRef;

    constructor(private modalRef: BsModalRef, private templateCatalogService: TemplateCatalogService,
        private sanitizer: DomSanitizer,private invService: InventoryService,
        private modalService: BsModalService,private progressIndicatorService: ProgressIndicatorService, private widgetCatalogService: WidgetCatalogService) {}

    async ngOnInit() {
        if(this.dashboardId) {
            const dashboardObj = (await this.invService.detail(this.dashboardId)).data?.c8y_Dashboard;
            if(dashboardObj) {
                this.importDashboard.title = dashboardObj.name;
                this.processingTemplate(dashboardObj);
            }
        }
    }

    onCancelButtonClicked(): void {
        this.modalRef.hide();
    }

    onImageSelected(files: FileList, imageType: string): void {
        if(imageType === 'dbPreview') {
            this.previewImageFile = files.item(0);
            this.previewImageURL = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.previewImageFile));
        } else if(imageType === 'thumbnail' ) {
            this.thumbnailImageFile = files.item(0);
            this.thumbnailPreviewImageURL = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(this.thumbnailImageFile));
        }
    }

    async onSaveButtonClicked() {
        this.dashboardDetail.description = this.importDashboard.description;
        if (this.importDashboard.availability === 'SHARED') {
            this.showProgressModalDialog('Uploading images ...');
            this.importDashboard.thumbnailBinaryId = (this.thumbnailImageFile ? await (this.templateCatalogService.uploadImage(this.thumbnailImageFile)) : "");
            this.progressIndicatorService.setOverallProgress(30);
            this.dashboardDetail.previewBinaryId = ( this.previewImageFile ? await (this.templateCatalogService.uploadImage(this.previewImageFile)) : "");
            this.progressIndicatorService.setOverallProgress(60);
            this.progressIndicatorService.setMessage('Importing Dashboard...');
            this.importDashboard.templateDetails = this.dashboardDetail;
            await this.invService.create({
                c8y_Global: {},
                type: "dashboard-catalog-templates",
                template: this.importDashboard
            }).then( () => {
                this.progressIndicatorService.setOverallProgress(90);
                this.hideProgressModalDialog();
                const alertMessage = {
                    title: 'Success!',
                    description: `Your dashboard has been saved to the Dashboard Catalog successfully.`,
                    type: 'info',
                    alertType: 'info', //info|confirm
                }
                this.alertModalDialog(alertMessage);
            })
                .catch(err => {
                    this.hideProgressModalDialog();
                    const alertMessage = {
                        title: 'Error!',
                        description: `Unable to import your dashboard into the Dashboard Catalog.`,
                        type: 'danger',
                        alertType: 'info', //info|confirm
                    }
                    this.alertModalDialog(alertMessage);
                });
        }
        else if (this.importDashboard.availability === 'EXPORT') {
            const thumbnailBase64 = this.thumbnailImageFile ? await (this.toBase64(this.thumbnailImageFile)) : "";
            this.importDashboard.thumbnail = thumbnailBase64.toString();
            const previewBase64 = this.previewImageFile ? await (this.toBase64(this.previewImageFile)) : "";
            this.dashboardDetail.preview = previewBase64.toString();
            this.importDashboard.templateDetails = this.dashboardDetail;
            let importDashboardJson = JSON.stringify(this.importDashboard, null, 4);
            let importDashboardBlob: Blob = new Blob([importDashboardJson], { type: 'application/json' });
            this.download(importDashboardBlob);
        }
        this.modalRef.hide();
    }

    toBase64 = (file: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    }

    download(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.importDashboard.title}_dashboard.json`;
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
    }

    isImportButtonEnabled() {
        return (this.importDashboard.title && this.importDashboard.title.length >= 0 &&
            this.importDashboard.description && this.importDashboard.availability &&
            ( this.importDashboard.availability === 'SHARED' || this.importDashboard.availability === 'EXPORT' || (
                this.importDashboard.availability === 'MARKET' && this.previewImageFile &&  this.thumbnailImageFile
            )));
    }

    private showProgressModalDialog(message: string): void {
        this.progressModal = this.modalService.show(ProgressIndicatorModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    private alertModalDialog(message: any): BsModalRef {
        return this.modalService.show(AlertMessageModalComponent, { class: 'c8y-wizard', initialState: { message } });
    }

    private hideProgressModalDialog(): void {
        this.progressModal.hide();
    }

    private async processingTemplate(dashboardObj: any) {
        if(dashboardObj && dashboardObj.children && Object.keys(dashboardObj.children).length > 0) {
            const widCatalog:any = await (await this.widgetCatalogService.fetchWidgetCatalog()).toPromise();
            const keys = Object.keys(dashboardObj.children);
            let devicePlaceholder = [];
            keys.forEach( (key, idx) => {
                const children = dashboardObj.children[key];

                // Processing device placeholders
                const config = children.config;
                if(config.device) { devicePlaceholder.push({
                        ...config.device,
                        placeholder: 'Device' + idx
                    })}
                if(config.datapoints && config.datapoints.length > 0) {
                    config.datapoints.forEach((dp, index) => {
                        devicePlaceholder.push({
                            ...dp.__target,
                            placeholder: 'DeviceTarget' + index
                        });

                    });
                }

                // Processing dashboardDetails -> Input -> Dependencies
                if (widCatalog && widCatalog.widgets && widCatalog.widgets.length > 0) {
                    let widget = widCatalog.widgets.find(widget => widget.id === children.componentId && this.widgetCatalogService.isCompatiblieVersion(widget))
                    if (widget) {
                        this.dashboardDetail.input.dependencies.push(widget);
                    } 
                    else {
                        this.dashboardDetail.input.dependencies.push({
                            id: children.componentId,
                            title: children.title,
                            repository: "",
                            link:""
                        })
                    }
                }
                // Processing dashboardDetails -> widgets
                this.dashboardDetail.widgets.push(children);

            })
            this.dashboardDetail.input.dependencies = [...new Map(this.dashboardDetail.input.dependencies.map(v => [v.id, v])).values()]
            devicePlaceholder = [...new Map(devicePlaceholder.map(v => [v.id, v])).values()]

            //processing  template -> input -> devices
            devicePlaceholder.forEach( dPlaceholder => {
                this.dashboardDetail.input.devices.push( {
                    placeholder: dPlaceholder.placeholder,
                    type: dPlaceholder.name
                })

                if(this.dashboardDetail.widgets) {
                    this.dashboardDetail.widgets.forEach( (widget: any) => {
                        const device = (widget.config && widget.config.device ? widget.config.device: null);
                        if( device && device.id === dPlaceholder.id) {
                            widget.config.device.id = `{{${dPlaceholder.placeholder}.id}}`;
                            widget.config.device.name = `{{${dPlaceholder.placeholder}.name}}`
                        }
                        const optionDevice = (widget.config && widget.config.options ? widget.config.options: null);
                        if( optionDevice && optionDevice.device === dPlaceholder.id) {
                            widget.config.options.device = `{{${dPlaceholder.placeholder}.id}}`;
                        }
                        let deviceDPs = (widget.config && widget.config.datapoints ? widget.config.datapoints: null);
                        if(deviceDPs && deviceDPs.length > 0){
                            deviceDPs.forEach(deviceDP => {
                                if( deviceDP.__target && deviceDP.__target.id === dPlaceholder.id) {
                                    deviceDP.__target.id = `{{${dPlaceholder.placeholder}.id}}`;
                                    deviceDP.__target.name = `{{${dPlaceholder.placeholder}.name}}`
                                }
                            });
                        }
                    })
                }
            });
        }
    }
}