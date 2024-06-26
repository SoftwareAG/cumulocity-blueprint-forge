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

import {Component} from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { Subject } from "rxjs";

@Component({
    selector: 'configure-custom-dashboard-modal',
    templateUrl: './configure-custom-dashboard-modal.component.html',
})

export class ConfigureCustomDashboardModalComponent{

    title:string = '';
    description:string= '';
    isGroup:boolean=false;

    public onSave: Subject<any>;

    constructor(public bsModalRef: BsModalRef){
        this.onSave=new Subject();
    };

    save(){
        let response:any={
            title:this.title,
            description:this.description,
            isGroupDashboard:this.isGroup,
            isMandatory:false,
            isSelectAsset: true,
            isSelectGroup: true,
            isSelectType: true,
            selected: true,
            isCustom: true,
            isDeviceRequired: true,
            enableDeviceOrGroup: true,
            defaultLinkedDashboard: 'Select Link',
            visibility: "",
            icon: "th"
        };
        this.onSave.next(response);
        this.bsModalRef.hide();
    }
    cancel(){
        this.bsModalRef.hide();
    }
}