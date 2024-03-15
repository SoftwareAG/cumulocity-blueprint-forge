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

// Assets need to be imported into the module, or they are not available
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDTDLGeneratorPluginComponent } from './gp-dtdl-generator-plugin.component';
import { DtdlSimulatorModalComponent } from './dtdl-simulator-modal/dtdl-simulator-modal.component';
import { hookNavigator} from '@c8y/ngx-components';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '@c8y/ngx-components';
import { AppIdGuard } from './applicationIdGuard';
import { DeviceSelectorModalService } from './device-selector.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { PopoverModule } from 'ngx-bootstrap/popover';

/*Router guards (canactivate:[AppIdGuard]) is used below to check 
if the device dtdl generator plugin is being called from Application builder so as to redirect user to the application's path.*/
@NgModule({
  declarations: [DeviceDTDLGeneratorPluginComponent,DtdlSimulatorModalComponent],
entryComponents: [DeviceDTDLGeneratorPluginComponent,DtdlSimulatorModalComponent],
  imports: [CommonModule,ReactiveFormsModule,CoreModule,NgSelectModule,PopoverModule.forRoot(),
    RouterModule.forChild([
      {
        path: "DTDLGenerator", component: DeviceDTDLGeneratorPluginComponent, canActivate:[AppIdGuard]
    },
    {
      path: "application/:applicationId/DTDLGenerator", component:DeviceDTDLGeneratorPluginComponent
    }
    ])
  ],
  exports: [],
  providers: [
    DeviceSelectorModalService,
    hookNavigator({
      label: 'DTDL Generator',              
      path: "DTDLGenerator",
      icon: 'create-document',
      priority: 0,
      parent:'Configuration',
      preventDuplicates: true
    })
  ]
})
export class DtdlGeneratorPluginModule {}
