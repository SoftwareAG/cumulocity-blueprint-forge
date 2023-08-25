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

import { colorToHex, contrastingTextColor, lighter, darker } from "./color-util";

export function standardTheme(branding: any) {
    const standardTheme = `
    body {

        /* Navigator color: */
        --brand-primary: ${colorToHex(branding.colors.primary)};
        --brand-light: ${lighter(branding.colors.primary)};
        --navigator-active-bg: ${colorToHex(branding.colors.active)};

        /* Navigator text: */
        --navigator-text-color: ${colorToHex(branding.colors.textOnPrimary)};
        --navigator-title-color: ${colorToHex(branding.colors.textOnPrimary)};
        --navigator-active-color: ${colorToHex(branding.colors.textOnActive)};
        --navigator-hover-color: ${colorToHex(branding.colors.hover)};
      

        /* All the other text: */
        --brand-dark: ${colorToHex(branding.colors.text)};
        --header-hover-color: ${branding.colors.hover ? colorToHex(branding.colors.hover) : '#14629f'};
        --header-color: ${branding.colors.headerBar ? colorToHex(branding.colors.headerBar) : '#ffffff'};
        --page-tabs-background:${branding.colors.tabBar ? colorToHex(branding.colors.tabBar) : '#ffffff'};
     
        ${branding.logoHeight != undefined ? '--navigator-platform-logo-height: ' + branding.logoHeight + 'px;' : ''}

        /*1017 changes */
        --header-text-color:  ${colorToHex(branding.colors.text)};
        --c8y-action-bar-color-actions:${colorToHex(branding.colors.text)};
        --c8y-action-bar-icon-color:${colorToHex(branding.colors.text)};
        --c8y-nav-tabs-color-default:${colorToHex(branding.colors.text)};
        --c8y-nav-tabs-icon-color-default:${colorToHex(branding.colors.text)};
        --c8y-action-bar-color-actions-hover:${colorToHex(branding.colors.hover)};
        --c8y-action-bar-background-default: ${colorToHex(branding.colors.toolBar)};
        --header-hover-color: ${colorToHex(branding.colors.hover)};    
        --navigator-color-active:  ${colorToHex(branding.colors.textOnPrimary)};
        --navigator-separator-color: ${colorToHex(branding.colors.primary)};
        --c8y-body-background-color: ${darker(branding.colors.primary)};
        --navigator-bg-color: ${colorToHex(branding.colors.primary)};
        --navigator-header-bg: ${colorToHex(branding.colors.primary)};
        --c8y-component-icon-dark-color-dark: ${colorToHex(branding.colors.text)};
        --c8y-component-background-default: ${darker(branding.colors.primary)};
        --c8y-form-control-background-focus:${darker(branding.colors.primary)};
        --c8y-form-control-background-default:${darker(branding.colors.primary)};
        --c8y-form-control-color-default:${colorToHex(branding.colors.text)};
        --c8y-component-color-default:${colorToHex(branding.colors.text)};
        --c8y-btn-default-background-default: ${lighter(branding.colors.primary)};
        --c8y-btn-default-background-hover:  ${lighter(branding.colors.primary)};
        --c8y-btn-default-background-active:${colorToHex(branding.colors.primary)};
        --c8y-btn-default-background-focus:${colorToHex(branding.colors.primary)};
      

        /* Widget specific */
        --component-color: ${colorToHex(branding.colors.text)};
        --card-color: ${colorToHex(branding.colors.text)};
        --card-background: ${colorToHex(branding.colors.primary)};
        --component-background: ${colorToHex(branding.colors.primary)};
        

        --dropdown-background: ${branding.colors.headerBar ? colorToHex(branding.colors.headerBar) : '#ffffff'};
        --toolbar-background:${branding.colors.toolBar ? colorToHex(branding.colors.toolBar) : '#ffffff'};
        --toolbar-color: ${colorToHex(branding.colors.text)};
        --toolbar-actions-color-hover: ${branding.colors.toolBar ? colorToHex(branding.colors.hover) : '#14629f'};
        --toolbar-focus-color: ${colorToHex(branding.colors.text)};
        --dropdown-actions-color-hover: ${colorToHex(branding.colors.text)};
        --component-actions-color-hover: ${colorToHex(branding.colors.text)};
        --page-tabs-link-color: ${colorToHex(branding.colors.text)};
        --page-tabs-actions-color: ${colorToHex(branding.colors.text)};
        --page-tabs-actions-color-hover: ${colorToHex(branding.colors.text)};
        --list-group-actions-color: var(--component-link-color, #000);
        --dropdown-active-color:${colorToHex(branding.colors.active)};
        --tooltip-background: ${colorToHex(branding.colors.active)};/*0b385b*/
        --tooltip-color: ${colorToHex(branding.colors.textOnActive)};

        }

        .header-bar {
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs > div > a {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 -1px 0 0 var(--c8y-body-background-color, var(--c8y-component-border-color));
        }

        .page-tabs-horizontal .tabContainer .nav-tabs > div.active > a {
            background-color: var(--page-tabs-background, #fff);
            box-shadow: inset 0 calc(var(--c8y-nav-tabs-border-width-active) * -1) 0 0 var(--c8y-nav-tabs-border-color-active);
        }

        .navigator .title .tenant-brand {
        background-image: url(${CSS.escape(branding.logo || '')});
        padding-bottom: var(--navigator-platform-logo-height,28px);
        }

        .title .c8y-app-icon {
        ${branding.logoHeight != undefined ? '' : 'margin-top: -16px;'}
        }

       
        .btn.btn-primary {
        color: ${contrastingTextColor(branding.colors.primary)};
        background-color: var(--brand-primary);
        }
        .btn.btn-primary:active,.btn.btn-primary:active:hover {
        color: ${contrastingTextColor(branding.colors.text)};
        
        }
        .btn.btn-primary:hover,.btn.btn-primary:focus {
        color: var(--brand-primary, #1776BF);
        background-color: ${contrastingTextColor(branding.colors.primary)};
        }
        .btn-link:focus {
        /*color: ${contrastingTextColor(branding.colors.text)};*/
        }

        .body-theme {
            --body-background-color: var(--c8y-body-background-color,#fff);
        }
        .simulator-body-theme {
           --body-background-color: var(--c8y-body-background-color, #fff);
        }
        .dashboard-body-theme {
            --body-background-color: var(--c8y-body-background-color,#fff);
        }
        .label-color {
            color: var(--navigator-active-color, #000);
        }
        .card-color {
            background: var(--brand-light, #fff);
            color: var(--navigator-active-color, #000);
        }
        .card {
            background: var(--brand-light, var(--c8y-component-background-default));
        }
        .nav-tabs > li > button {
        color: var(--navigator-active-bg,#0b385b) !important;
        }
        .nav-tabs > li > button:hover:not([disabled]) {
        color: var(--brand-primary,#1776bf) !important;
        }
        select.form-control:focus, select:focus {
        color: ${colorToHex(branding.colors.primary)} !important;
        }

        .c8y-dropdown:not(.btn){
            color: var(--navigator-active-color, var(--c8y-root-component-color-actions)) !important;
            background-color: transparent !important;
        }

        .app-switcher {
            background-color: var(--header-color, var(--c8y-component-background-default));
        }
        
        .app-main-header .app-switcher .appLink {
            color: var(--navigator-color-active, var(--c8y-component-color-default)) !important;
        }
        .app-switcher-dropdown-menu{
            border: none !important;
        }

        .pagination > .active > a {
            border: 1px solid var(--c8y-component-border-color, var(--c8y-root-component-border-color));
        }
       
    `;

    return standardTheme;
}