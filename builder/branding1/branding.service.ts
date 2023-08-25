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

import { Injectable } from "@angular/core";
import * as fa from "fontawesome";
import * as delay from "delay";
import { SettingsService } from "../settings/settings.service";
declare const FontFace: any;
import * as d3 from "d3-color";

/**
 * Adds style elements to the head which set the css variables required to re-theme cumulocity
 * Also deals with css required for icons, the app name, favicon etc
 */
@Injectable()
export class BrandingService1 {
    appGeneral: HTMLStyleElement;
    appBranding: HTMLStyleElement;
    powerByBlock: HTMLStyleElement;
    favicon: HTMLLinkElement;

    fontAwesomeLoaded: Promise<void>;
    isFontAwesomeLoaded: boolean = false;

    private isNavlogoVisible = true;
    constructor(private settingService: SettingsService) {
        this.appGeneral = document.createElement('style');
        this.appBranding = document.createElement('style');
        this.powerByBlock = document.createElement('style');
        document.head.appendChild(this.appGeneral);
        document.head.appendChild(this.appBranding);
        document.head.appendChild(this.powerByBlock);
        this.settingService.isNavlogoVisible().then(isVisible => {
            this.isNavlogoVisible = isVisible;
            this.updatePowerbyLogo(this.isNavlogoVisible);
        });

        this.favicon = document.head.querySelector('[rel=icon]');

        if (typeof FontFace != 'undefined') {
            // this.fontAwesomeLoaded = new FontFace('FontAwesome', 'url(./fontawesome-webfont-20fd1704ea223900efa9fd4e869efb08.woff2)').load();
            this.fontAwesomeLoaded = new FontFace('FontAwesome', 'url(./fonts/fontawesome-webfont.woff2)').load();
        } else {
            this.fontAwesomeLoaded = Promise.resolve();
        }

        this.fontAwesomeLoaded.then(() => {
            this.isFontAwesomeLoaded = true;
        });
    }

    updateStyleForApp(app) {
        // If font awesome is not loaded then refresh the view when it loads - so that the favicon can be loaded properly
        if (!this.isFontAwesomeLoaded) {
            this.fontAwesomeLoaded.then(() => {
                this.updateStyleForApp(app);
            });
        }
        this.updatePowerbyLogo(this.isNavlogoVisible);
        if (app && app.applicationBuilder) {
            this.appGeneral.innerText = `
.title .c8y-app-icon i {
    display: none;
}
.title .c8y-app-icon {
    margin-top: -16px;
}
.title .c8y-app-icon::before {
    font-family: "FontAwesome";
    content: "${fa(app.applicationBuilder.icon)}";
    font-size: ${app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.hideIcon ? '0' : 'var(--navigator-app-icon-size, 46px)'};
}
.title .c8y-app-icon::after {
    content: '${CSS.escape(app.name)}';
    display: block;
    margin-top: -6px;
    padding-left: 5px;
    padding-right: 5px;
    white-space: pre-wrap;
}
.title span {
    display: none;
}

.app-main-header .app-view::before {
  font-family: "FontAwesome";
  content: "${fa(app.applicationBuilder.icon)}";
  font-size: 2em;
  width: 32px;
  transform: scale(1);
  margin-left: 0.5em;
  transition: all .4s ease-in-out;
}
.app-main-header.open .app-view::before {
  width: 0;
  transform: scale(0);
  margin-left: 0;
}
.app-main-header .app-view c8y-app-icon  {
  display: none;
}

.navigatorContent .link.active {
    border-left-color: var(--navigator-active-color);
}


`;
            // The below if condition works only when primary color is white
            if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors
                && (app.applicationBuilder.branding.colors.primary === '#ffffff' || app.applicationBuilder.branding.colors.primary === '#fff' || app.applicationBuilder.branding.colors.primary === 'white')) {
                this.loadFaviconURL(app);

            } else if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors) {
                this.loadFaviconURL(app);

            } else {
                /*  const faviconUrl = this.createFaviconUrl('#1776BF', app.applicationBuilder.icon);
                 this.favicon.setAttribute('type', 'image/png');
                 this.favicon.setAttribute('href', faviconUrl); */
                this.loadFaviconURL(app);
                this.appBranding.innerText = '';
            }
        } else {
            this.favicon.removeAttribute('type');
            this.favicon.setAttribute('href', 'favicon.ico');

                    /*   this.appGeneral.innerText = `
            .title span::after {
                content: "V${__VERSION__}";
                display: block;
                font-size: small;
            }
            `; */
            this.appBranding.innerText = '';
        }
    }

    colorToHex(color: string): string {
        try {
            return d3.color(color).hex();
        } catch (e) {
            return 'white'
        }
    }

    lighter(color: string): string {
        try {
            return d3.color(color).brighter().hex()
        } catch (e) {
            return 'white'
        }
    }

    contrastingTextColor(primaryColor: string): string {
        try {
            const color = d3.color(primaryColor).rgb();
            // Formula from Gacek: https://stackoverflow.com/a/1855903/11530669
            return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255 > 0.5 ? 'black' : 'white';
        } catch (e) {
            return 'white';
        }
    }

    private async loadFaviconURL(app) {
        await delay(1000);
        if (app.applicationBuilder.branding && app.applicationBuilder.branding.enabled && app.applicationBuilder.branding.colors) {
            const faviconUrl = this.createFaviconUrl(app.applicationBuilder.branding.colors.primary, app.applicationBuilder.icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        } else {
            const faviconUrl = this.createFaviconUrl('#1776BF', app.applicationBuilder.icon);
            this.favicon.setAttribute('type', 'image/png');
            this.favicon.setAttribute('href', faviconUrl);
        }


    }
    createFaviconUrl(primaryColor: string, icon: string): string {
        const color = this.colorToHex(primaryColor);
        const canvas = document.createElement('canvas');
        canvas.height = 16;
        canvas.width = 16;
        const context = canvas.getContext('2d');
        context.font = '16px FontAwesome';
        context.textBaseline = 'top';
        context.textAlign = 'left';
        context.fillStyle = color;
        context.fillText(fa(icon), 0, 0, 16);
        return canvas.toDataURL();
    }

    private updatePowerbyLogo(isLogoVisible: boolean) {
        if (isLogoVisible) {
            this.powerByBlock.innerText = `
            .powered-by {
                display: block;
            }
            `
        } else {
            this.powerByBlock.innerText = `
            .powered-by {
                display: none;
            }
            `
        }
    }
}