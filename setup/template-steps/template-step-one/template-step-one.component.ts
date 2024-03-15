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
import { AfterViewInit, OnInit, Component } from '@angular/core';
import { AlertService, AppStateService, C8yStepper, SetupComponent } from '@c8y/ngx-components';
import { TemplateSetupStep } from './../../template-setup-step';
import { TemplateCatalogSetupService } from '../../template-catalog-setup.service';
import { catchError } from "rxjs/operators";
import { TemplateBlueprintDetails, TemplateBlueprintEntry } from './../../template-setup.model';
import { SetupConfigService } from './../../setup-config.service';
import { TemplateCatalogEntry } from './../../../builder/template-catalog/template-catalog.model';

@Component({
  selector: 'c8y-template-step-one',
  templateUrl: './template-step-one.component.html',
  styleUrls: ['./template-step-one.component.css'],
  host: { class: 'd-contents' }
})
export class TemplateStepOneComponent extends TemplateSetupStep implements OnInit, AfterViewInit {


  public templates: Array<TemplateBlueprintEntry> = [];
  public welcomeTemplate: Array<TemplateCatalogEntry> = [];

  public filterTemplates: Array<TemplateBlueprintEntry> = [];
  templateDetails: TemplateBlueprintDetails;
  constructor(
    public stepper: C8yStepper,
    protected step: CdkStep,
    protected setup: SetupComponent,
    protected appState: AppStateService,
    protected alert: AlertService,
    private templateCatalogSetupService: TemplateCatalogSetupService,
    private alertService: AlertService,
    protected setupConfigService: SetupConfigService
  ) {
    super(stepper, step, setup, appState, alert, setupConfigService);
  }

  ngOnInit() {
    this.loadTemplateCatalog();
  }

  ngAfterViewInit() {
    this.verifyStepCompleted();

  }
  loadTemplateCatalog() {
    this.templateCatalogSetupService.getTemplateCatalog()
      .pipe(catchError(err => {
        console.log('Dashboard Catalog: Error in primary endpoint! using fallback...');
        return this.templateCatalogSetupService.getTemplateCatalogFallBack()
      }))
      .subscribe((catalog: any) => {
        this.templates = this.templates.concat(catalog[0]);
        this.templateCatalogSetupService.welcomeTemplateData.next(catalog[1]);
        this.filterTemplates = (this.templates ? this.templates : []);
        this.filterTemplates.forEach(template => {
          if (template.thumbnail && template?.thumbnail != '') {
            template.thumbnail = this.templateCatalogSetupService.getGithubURL(template.thumbnail);
          }
        })
      }, error => {
        this.alertService.danger("There is some technical error! Please try after sometime.");
      });
  }
  async selectedTemplate(dashboardURL: string) {
    this.blueprintForge.templateURL = dashboardURL;
    await this.next();    // Navigation to details page
  }
}
