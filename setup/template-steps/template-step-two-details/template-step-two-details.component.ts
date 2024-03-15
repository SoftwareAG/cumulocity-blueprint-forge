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
import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { AlertService, AppStateService, C8yStepper, SetupComponent } from '@c8y/ngx-components';
import { TemplateSetupStep } from './../../template-setup-step';
import { TemplateCatalogSetupService } from '../../template-catalog-setup.service';
import { catchError, take } from "rxjs/operators";
import { GalleryItem, ImageItem } from 'ng-gallery';
import { TemplateBlueprintDetails } from './../../template-setup.model';
import { SetupConfigService } from './../../setup-config.service';

@Component({
  selector: 'c8y-template-step-two-details',
  templateUrl: './template-step-two-details.component.html',
  styleUrls: ['./template-step-two-details.component.css'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'd-contents' }
})
export class TemplateStepTwoDetailsComponent extends TemplateSetupStep implements AfterViewInit {
  public templateDetails: TemplateBlueprintDetails;
  configDetails: any;
  images: GalleryItem[];
  blueprintForgeTemplateURL: any;
  dataBlueprintForgeURL: any;
  load: number;

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
    this.load = 0;
    
      this.setup.data$.subscribe(data => {
        if (data.blueprintForge && data.blueprintForge != '') {
          if (this.load == 0) {
          this.templateDetails = null;
          const templateURL = data.blueprintForge.templateURL;
          this.loadTemplateDetailsCatalog(templateURL);
          this.load = this.load + 1;
          } 
        }
      });
    
  }

  ngOnInit() {
      this.setup.data$.subscribe(data => {
      if (this.load > 0 && this.dataBlueprintForgeURL !== data.blueprintForge.templateURL) {
        this.templateCatalogSetupService.dynamicDashboardTemplateDetails.next([]);
          this.dataBlueprintForgeURL = data.blueprintForge.templateURL;
            this.loadTemplateDetailsCatalog(data.blueprintForge.templateURL);
      }
        });
      
     
  }

  ngAfterViewInit() {
    this.verifyStepCompleted();
  }

  loadTemplateDetailsCatalog(dashboardURL) {
    this.templateCatalogSetupService.getTemplateDetailsCatalog(dashboardURL)
      .pipe(catchError(err => {
        console.log('Dashboard Catalog: Error in primary endpoint! using fallback...');
        return this.templateCatalogSetupService.getTemplateDetailsCatalogFallBack(dashboardURL)
      }))
      .subscribe((catalog: TemplateBlueprintDetails) => {

        this.templateDetails = catalog;
        if (this.templateDetails && this.templateDetails.media) {
          this.templateDetails.media.forEach((media: any) => {
            media.image = this.templateCatalogSetupService.getGithubURL(media.image);
            media.thumbImage = this.templateCatalogSetupService.getGithubURL(media.thumbImage);
          });
        } else {
          this.templateDetails.media = [];
        }
        if (this.templateDetails && this.templateDetails.microservices === undefined) {
          this.templateDetails.microservices = [];
        }
        if (this.templateDetails && this.templateDetails.media) {
          this.images = this.templateDetails.media.map(item => new ImageItem({ src: item.image }));
        } else {
          this.images = [];
        }
        this.templateCatalogSetupService.templateData.next(this.templateDetails);
      }, error => {
        this.alertService.danger("There is some technical error! Please try after sometime.");
      });
  }

 
}
