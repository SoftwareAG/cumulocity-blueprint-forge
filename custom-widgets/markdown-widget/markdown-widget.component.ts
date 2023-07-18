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

import { Component, OnInit, Input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'lib-markdown-widget',
  templateUrl: './markdown-widget.component.html',
  styleUrls: ['./markdown-widget.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MarkdownWidgetComponent implements OnInit {
  @Input() config;
  constructor() { }

  ngOnInit() {
  }

}
