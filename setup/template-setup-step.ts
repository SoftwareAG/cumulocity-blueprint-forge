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
import { AppStateService, AlertService, C8yStepper, SetupComponent } from '@c8y/ngx-components';
import { BlueprintForge } from './template-setup.model';
import { SetupConfigService } from './setup-config.service';
const DEFAULT_CONFIG: BlueprintForge = {
  templateURL: "",
  selectedStepperIndex: 0,
  plugins: [],
  dashboards: [],
  microservices: [],
};

export abstract class TemplateSetupStep {
  config: any = {}
  blueprintForge: BlueprintForge = DEFAULT_CONFIG;
  pending = false;

  constructor(
    public stepper: C8yStepper,
    protected step: CdkStep,
    protected setup: SetupComponent,
    protected appState: AppStateService,
    protected alert: AlertService,
    protected setupConfigService: SetupConfigService
  ) {
    this.stepper.linear = true;
  }

  verifyStepCompleted() {
     this.blueprintForge = this.setupConfigService.stepCompleted(this.stepper, this.step, this.setup);
     if(!this.blueprintForge) { this.blueprintForge = DEFAULT_CONFIG;}
  }
  async next(stepIndex?) {
    this.pending = true;
    try {
      this.blueprintForge.selectedStepperIndex = (stepIndex) ? stepIndex : this.stepper.selectedIndex;
      this.config.blueprintForge = this.blueprintForge;
      const newConfig = { ...this.setup.data$.value, ...this.config };
      await this.appState.updateCurrentApplicationConfig(newConfig);
      this.step.completed = true;
      this.setup.stepCompleted(stepIndex ? stepIndex : this.stepper.selectedIndex);
      this.setup.data$.next(newConfig);
      this.stepper.next();
    } catch (ex) {
      this.alert.addServerFailure(ex);
    } finally {
      this.pending = false;
    }
  }

  back() {
    this.stepper.previous();
  }
}
