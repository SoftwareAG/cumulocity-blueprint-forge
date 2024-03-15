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

import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { Subject } from "rxjs";

@Component({
    selector: 'dtdl-simulator-modal',
    templateUrl: './dtdl-simulator-modal.component.html',
    styleUrls: ['./dtdl-simulator-modal.component.css','../../../node_modules/@ng-select/ng-select/themes/default.theme.css'],
    encapsulation: ViewEncapsulation.None
})


export class DtdlSimulatorModalComponent implements OnInit{
    messurements:any;
    selectedMeasurements:any[];
    series:any[];
    typeOptions=[
        // { name:'--select type--', value:0 },
        { name:'Random value', value:1 },
        { name:'Value series', value:2 }
    ];
    pageOptions=[
        { name:'Last 50 measurements', value:50 },
        { name:'Last 100 measurements', value:100 },
        { name:'Last 200 measurements', value:200 }
    ]
    typeSelected=1;
    pageSize=50;
    public onGenerate: Subject<any>;
    public onCancel: Subject<boolean>;

    constructor(public bsModalRef: BsModalRef){
        this.onGenerate=new Subject();
        this.onCancel=new Subject();
    };
    ngOnInit(): void {
        this.series=this.messurements.data.series;
        this.selectedMeasurements=this.messurements.data.series;
    }

    createSimulatorClicked(){
        let response:any={
            pageSize:this.pageSize,
            typeSelected:this.typeSelected,
            selectedMeasurements:this.selectedMeasurements
        }
        this.onGenerate.next(response);
        this.bsModalRef.hide();
    }

    cancelClicked(){
        this.onCancel.next(true);
        this.bsModalRef.hide();
    }
}