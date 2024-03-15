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

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NavigatorNodeData } from '@c8y/ngx-components';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppIdGuard implements CanActivate{
    appId:string;
    url:string;
    public hookNode:NavigatorNodeData={
        label: 'DTDL Generator',              
        path: 'DTDLGenerator',
        icon: 'create-document',
        priority: 0,
        parent:'Configuration',
        preventDuplicates: true
    }
    constructor(private router: Router){}
    
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        this.url=this.router.url;
        if(this.url.indexOf('application')>=0){
            let appId=this.url.split('application')[1].split('/')[1];
            this.appId=appId;
            this.router.navigate([`application/${this.appId}/DTDLGenerator`]);
            return false
        }
        return true
    }
}