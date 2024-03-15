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

import { Component, Input } from "@angular/core";
import { dtdlObject, contents, displayName, dtdlModelConfig, alternateConfigs, operations, metadata, config, dtdlSimulator } from "./models/dtdlObject";
import { AlertService } from "@c8y/ngx-components";
import { IManagedObject, IManagedObjectBinary, IResult, ISeriesFilter, InventoryBinaryService, MeasurementService} from "@c8y/client";
import { setTheme } from "ngx-bootstrap/utils";
import { DeviceSelectorModalService } from "./device-selector.service";
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { DtdlSimulatorModalComponent } from "./dtdl-simulator-modal/dtdl-simulator-modal.component";
import * as moment from "moment";
import * as _ from "lodash";

@Component({
  selector: 'device-dtdl-generator-plugin',
  templateUrl: './gp-dtdl-generator-plugin.component.html',
  styleUrls: ['./gp-dtdl-generator-plugin.component.css']
})
export class DeviceDTDLGeneratorPluginComponent {
  public dtdlCreated: boolean = false;
  public simConfigCreated: boolean = false;
  public isLoading:boolean=false;
  public dtdlObjects: dtdlObject[] = [];
  public searchString: string;
  public deviceName: string = '';
  public deviceId: string = '';

  private dtdlJson = '';
  private simConfigJson = '';
  private blob: Blob;
  private contents: contents[] = [];
  private type: string[] = ['Telemetry'];
  private context = 'dtmi:dtdl:context;2';
  private baseId = 'dtmi:softwareag:globalPresales:';
  
  @Input() config;
  @Input() appId; //getting appID for application from the route url.
  // currDate = new Date().toISOString();
  now = moment().toISOString();
  sixMonthsPrior = moment().add(-6,'months').toISOString();

  public templateType: number;
  public devices: IManagedObject[] = [];
  public deviceSelected: IManagedObject;
  public deviceChanged: boolean = false;

  public bsModalRef: BsModalRef;
  private mesPageLimit: number;
  /* 
    simulatorType:[
        { name:'--select type--', value:0 },
        { name:'Random value', value:1 },
        { name:'Value series', value:2 }
    ]
  */
  private simulatorType: number;
  // _ = require("lodash");
  dtdlModelConfig: dtdlModelConfig[] = [];
  dtdlSimulatorConfig: dtdlSimulator;
  interval: number[] = [];
  meanInterval: number = 30;

  generateSimConfigPopoverText = `
  <p>This simulator configuration file is compatible with the simulators in Application Builder and Blueprint Forge</p>
  <p>
    <b>How to use:</b>
    <ul>
      <li>Generate simulator configuration for selected device.</li>
      <li>Download generated file.</li>
      <li>Navigate to Application Builder or Blueprint Forge app</li>
      <li>Go to simulator tab.</li>
      <li>Click on add simulator, then choose <i>import existing simulator</i>.</li>
      <li>Upload simulator configuration file.</li>
    </ul>    
  </p>
    `;
  generateDTDLPopoverText = `
  <p>A Digital Twins Definition Language (DTDL) file serves as the representation of the digital twin for a physical device. If your physical device is configured in device management, a DTDL file can be generated. Additionally, this DTDL file can be employed for simulating a real device.</p>
  `;

  constructor(private modalService: BsModalService, private devicesService: DeviceSelectorModalService, private measurementService: MeasurementService, private inventoryBinaryService: InventoryBinaryService, private alertService: AlertService) {
    setTheme('bs4');
  };

  //function calling device service to get devices for queried search string
  public searchForDevice(): void {
    if (!this.searchString || this.searchString === '' || this.searchString.length == 0) {
      this.devices = [];
    }
    else if (this.searchString && this.searchString.length >= 3) {
      this.devicesService.queryDevices(this.templateType, this.searchString)
        .then(response => {
          this.devices = response.data as IManagedObject[];
        });
    }
  }

  //below function is to clear search string for device
  public clearSearch(): void {
    this.searchString = '';
    this.devices = [];
  }

  //function to apply css on selected device.
  public isDeviceSelected(device: IManagedObject): boolean {
    return this.deviceSelected && this.deviceSelected.id === device.id;
  }

  //below function is called when a device is selected
  public selectDevice(device: IManagedObject): void {
    this.deviceSelected = device;
    if (this.deviceId && this.deviceId !== this.deviceSelected.id) {
      this.deviceChanged = true;
    }
    this.deviceId = this.deviceSelected.id;
    this.searchString = this.deviceSelected.name;
    this.devices = [];
    this.dtdlObjects = [];
  }

  //below function to trim 'c8y_' word from measurement name and add space between words
  private trimC8y(name: string): string {
    let newName = name.replace('c8y_', '');
    newName = newName.split(/(?=[A-Z])/).join(' ');
    return newName;
  }

  // below function is to get measurements for the device selected and pass them to generate respective files.
  public async getMeasurements(clickedOn: string) {
    this.isLoading=true;
    this.deviceName = this.deviceSelected.name;
    this.dtdlCreated = false;
    this.simConfigCreated = false;
    const filter: ISeriesFilter = {
      dateFrom: this.sixMonthsPrior,
      dateTo: this.now,
      source: this.deviceId
    };
    let messurements = await this.measurementService.listSeries(filter);
    if (clickedOn == 'Generate DTDL')
      this.generateContentsForDTDL(messurements);
    else if (clickedOn == 'Generate simulator')
      this.showDtdlSimulatorModal(messurements);
  }

  private generateContentsForDTDL(messurements: any) {
    this.contents = [];
    if (messurements.data && messurements.data.series && messurements.data.series.length > 0) {
      messurements.data.series.forEach((series, index) => {
        this.type.push(series?.type);
        let displayName: displayName = {};
        if (series?.type.indexOf('c8y_') >= 0) {
          let disName = this.trimC8y(series?.type);
          displayName.en = disName;
        }
        else {
          displayName.en = series?.type;
        }
        let content: contents = {
          "@id": this.baseId + this.deviceName + ':' + series?.type + ';1',
          "@type": this.type,
          displayName: displayName,
          name: series.name,
          schema: 'double',
          unit: series.unit
        }
        this.contents.push(content);
        this.type = ['Telemetry'];
      });
    }
    this.generateDtdl();
  }

  //below functions runs after getting measurmenets as contents to create the desired dtdl file.
  private generateDtdl() {
    this.dtdlObjects = [];
    let displayName: displayName = {
      en: this.deviceName
    };
    let dtdl: dtdlObject = {
      '@context': this.context,
      '@id': this.baseId + this.deviceName + ';1',
      '@type': 'Interface',
      contents: this.contents,
      displayName: displayName
    };
    this.dtdlObjects.push(dtdl);
    this.dtdlJson = JSON.stringify(this.dtdlObjects, null, 2);
    this.blob = new Blob([this.dtdlJson], { type: 'application/json' });
    this.dtdlCreated = true;
    this.deviceChanged = false;
    this.isLoading=false;
  }

  //function showing configurator modal for simulator configuration
  private showDtdlSimulatorModal(messurements) {
    this.bsModalRef = this.modalService.show(DtdlSimulatorModalComponent, { backdrop: 'static', class: 'modal-sm', initialState: {messurements} });
    this.bsModalRef.content.onGenerate.subscribe((response) => {
      this.mesPageLimit = response.pageSize;
      this.simulatorType = response.typeSelected;
      this.generateDTDLSimulator(response.selectedMeasurements);
    });
    this.bsModalRef.content.onCancel.subscribe((canceled)=>{
      this.isLoading=false;
    })
  }

  private async generateDTDLSimulator(series) {
    if (series && series.length > 0) {
      this.dtdlModelConfig = [];
      this.interval = [];
      this.generateDtdlModelConfig(series);
    }
  }

  // getting list of measurmeents for a measuremnt to generate DtdlModelConfig for each measurmeent.
  private async generateDtdlModelConfig(selectedMeasurements) {
    for (let series of selectedMeasurements) {
      const msmtFilter = {
        pageSize: this.mesPageLimit,
        valueFragmentSeries: series.name,
        valueFragmentType: series?.type,
        dateFrom: this.sixMonthsPrior,
        dateTo: this.now,
        revert: true,
        source: this.deviceId
      };
      let mesListResponse = (await (this.measurementService.list(msmtFilter)));
      if(mesListResponse && mesListResponse.data && mesListResponse.data.length>0){
        let unit= mesListResponse.data[0][series?.type][series.name].unit;
        let times = mesListResponse.data.map((element) => element.time);
  
        this.pushToInterval(times);
  
        //getting eventText for measurement
        let measName = series?.type;
        if (series?.type.indexOf('c8y_') >= 0) {
          measName= this.trimC8y(series?.type);
        }
  
        //generating dtdlModelConfig for the measurement
        let dtdlModelConfig: dtdlModelConfig = {
          schema: "double",
          fragment: series?.type,
          unit: unit,
          isObjectType: false,
          series: series.name,
          matchingValue: "default",
          eventText: measName,
          simulationType: this.getSimulationType(),
          alternateConfigs: this.getAlternateConfigs(this.getOperations(series,mesListResponse,measName,unit)),
          id: this.baseId + this.deviceName + ':' + series?.type + ';1',
          eventType: series.name,
          measurementName: measName
        }
        this.dtdlModelConfig.push(dtdlModelConfig);
      }
      else{
        this.alertService.info("No measurements found or failed to get measurments");
        this.isLoading=false;
      }
    }
    this.generateSimConfig();
  }

  private pushToInterval(times) {
    let n = (times.length >6 ? 6 : times.length);
    //creating array for intervals of size 5, then getting it's mean to get final interval.
    let intervales: number[] = [];
    for (let i = 0, j = 1; j < n; i++, j++) {
      intervales.push((new Date(times[i])).valueOf() - (new Date(times[j])).valueOf());
    }
    let int: number = (_.round(_.mean(intervales), -3) / 1000);
    this.interval.push(int);
  }

  private getSimulationType():string{
    return (this.simulatorType==1 ? "randomValue" : "valueSeries");
  }

  private getAlternateConfigs(operations?:operations):alternateConfigs{
    let alternateConfigs={
      configIndex: 0,
      opSourceName: "",
      payloadFragment: "c8y_Command.text",
      operations: [],
      opEnabled: false,
      opReply: false,
      opSource: ""
    }
    if(operations){
      alternateConfigs.operations=[operations];
    }
    return alternateConfigs
  }

  private getOperations(series,mesListResponse,measName,unit):operations{
    let values = mesListResponse.data.map((element) => element[series?.type][series.name].value);

    //generating operations for measurement
    let operations: operations = {
      schema: "double",
      isObjectType: false,
      simulationType:this.getSimulationType(),
      alternateConfigs:this.getAlternateConfigs(),
      eventType: series.name,
      measurementName: measName,
      fragment: series?.type,
      unit: unit,
      series: series.name,
      matchingValue: "default",
      eventText: measName,
      id: this.baseId + this.deviceName + ':' + series?.type + ';1'
    }
    if(this.simulatorType==1){
      let minValue: number = _.min(values);
      let maxValue: number = _.max(values);
      operations.minValue=minValue;
      operations.maxValue=maxValue;
    }
    else if(this.simulatorType==2){
      values=values.reverse();
      let value:string=values.join(',');
      operations.value=value;
    }

    return operations;
  }

  //generating simulator configuration
  private generateSimConfig(): void {
    let now = new Date();
    let nowTime = now.getTime();
    
    this.dtdlSimulatorConfig = {
      serverSide: false,
      lastUpdated: now.toISOString(),
      name: this.deviceName,
      id: nowTime,
      type: "DTDL",
      config: this.getConfig()
    }
    this.simConfigJson = JSON.stringify(this.dtdlSimulatorConfig, null, 2);
    this.blob = new Blob([this.simConfigJson], { type: 'application/json' });
    this.simConfigCreated = true;
    this.deviceChanged = false;
    this.isLoading=false;
  }

  //generating config to make final dtdl Simulator configuration
  private getConfig():config{
    let metadata: metadata = {
      hideSimulatorName: true,
      name: "DTDL",
      icon: "window-restore",
      description: "Simulate a device based on DTDL (Digital Twin Definition Language)"
    }

    this.meanInterval = _.mean(this.interval);
    this.meanInterval= this.meanInterval < 30 ? 30 : this.meanInterval;

    let config={
      serverSide: false,
      dtdlDeviceId: "",
      metadata: metadata,
      intervalInvalid: false,
      matchingValue: "default",
      modalSize: "modal-md",
      interval: this.meanInterval,          
      alternateConfigs: {
        configIndex: 0,
        opSourceName: "",
        payloadFragment: "c8y_Command.text",
        operations: [
          {
            dtdlDeviceId: "",
            matchingValue: "default",
            modalSize: "modal-md",
            interval: this.meanInterval,          
            alternateConfigs: {
              configIndex: 0,
              opSourceName: "",
              payloadFragment: "c8y_Command.text",
              operations: [],
              opReply: false,
              opSource: ""
            },
            dtdlModelConfig: [],
            deviceId: ""
          }
        ],
        opReply: false,
        opSource: ""
      },
      isGroup: false,
      dtdlModelConfig: this.dtdlModelConfig,
      deviceName: this.deviceName,
      deviceId: ""
    }
    return config;
  }

  //below function is to download dtdl file created.
  public download() {
    const url = URL.createObjectURL(this.blob);
    const link = document.createElement('a');
    link.href = url;
    if (this.dtdlCreated)
      link.download = `${this.deviceName}_dtdl.json`;
    else if (this.simConfigCreated)
      link.download = `${this.deviceName}_config.json`;
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  }

  //below function is to save generated file to File Repository
  public async saveToFileRepository() {
    var savedId;
    if (this.dtdlCreated)
      savedId = await this.createBinary(this.blob);
    else if (this.simConfigCreated)
      savedId = await this.createBinarySimConfig(this.blob);
    if (savedId.data && savedId.data.id) {
      if (this.dtdlCreated)
        this.alertService.success(`File ${this.deviceName}_DTDL saved successfully with id:${savedId.data.id}`, `${this.deviceName}_DTDL file saved to Files Repository with id:${savedId.data.id}`);
      else if (this.simConfigCreated)
        this.alertService.success(`File ${this.deviceName}_CONFIG saved successfully with id:${savedId.data.id}`, `${this.deviceName}_CONFIG file saved to Files Repository with id:${savedId.data.id}`);
    }
    else {
      this.alertService.info("Failed to save file", `Save to File Repository failed`);
    }

  }
  private createBinary(floorMap: Blob): Promise<IResult<IManagedObjectBinary>> {
    return this.inventoryBinaryService.create(floorMap, { name: `${this.deviceName}_DTDL` });
  }
  private createBinarySimConfig(floorMap: Blob): Promise<IResult<IManagedObjectBinary>> {
    return this.inventoryBinaryService.create(floorMap, { name: `${this.deviceName}_CONFIG` });
  }

  //below function is to copy the dtdl generated as text to clipboard.
  public copyInputMessage(inputElement) {
    inputElement.setSelectionRange(0, 99999); //for mobile devices
    navigator.clipboard.writeText(inputElement.value);
    this.alertService.success("Copied Text to clipboard");
  }
}