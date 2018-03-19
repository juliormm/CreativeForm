import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { ApiService } from './api.service'; 
 
import { NgUploaderModule } from 'ngx-uploader';
import { ProgressbarModule,  } from 'ngx-bootstrap/progressbar';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { ModalModule, AlertModule, BsDropdownModule, TooltipModule } from 'ngx-bootstrap';
import { Ng2PageScrollModule } from 'ng2-page-scroll';

import { AppComponent } from './app.component';
import { NumericOnlyDirective } from './numeric-only.directive';


@NgModule({
  declarations: [
    AppComponent,
    NumericOnlyDirective
  ],
  imports: [
    BrowserModule, CommonModule, FormsModule, HttpModule, NgUploaderModule, ReactiveFormsModule, ProgressbarModule.forRoot(), BsDatepickerModule.forRoot(), TooltipModule.forRoot(), ModalModule.forRoot(), BsDropdownModule.forRoot(), Ng2PageScrollModule.forRoot()
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
