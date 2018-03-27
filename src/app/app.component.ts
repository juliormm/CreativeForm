import { Component, OnInit, ContentChild, ViewChild, AfterViewChecked, Inject, ChangeDetectorRef, EventEmitter, Directive, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationExtras } from '@angular/router';

import { DOCUMENT } from '@angular/platform-browser';
import { FormGroup, FormControl, Validators, FormBuilder, FormArray, ValidatorFn, ValidationErrors, AbstractControl, EmailValidator } from '@angular/forms';
import { ApiService } from './api.service';

import { UploadOutput, UploadInput, UploadFile, humanizeBytes, UploaderOptions } from 'ngx-uploader';
import { PageScrollConfig, PageScrollService, PageScrollInstance } from 'ng2-page-scroll';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';


import { environment } from '../environments/environment';



export interface IProjectSave {
    am: any;
    campaign_name: string;
    client: any;
    creatives: any[];
    owner: string;
    crv_form?: number;
}

export interface IcrvTypes {
    richmedia: any;
    standard: any;
    static: any;
}
export interface IcrvFormData {
    additionalEmails: string;
    campaignAssetsDate: string;
    campaignEndDate: string;
    campaignMsgPrimary: string;
    // campaignMsgSecondary: string;
    // campaignNotes: string;
    campaignStartDate: string;
    campaignTarget: string;
    clientWebsite: string;
    creatives: IcrvTypes;
    crvVersions: number;
    executiveEmail: string;
    executiveName: string;
    // executivePhone: string;
    exists: any[];
}

export interface IsendData {
    additionalEmails: string;
    campaignAssetsDate: string;
    campaignEndDate: string;
    campaignMsgPrimary: string;
    // campaignMsgSecondary: string;
    // campaignNotes: string;
    campaignStartDate: string;
    campaignTarget: string;
    clientWebsite: string;
    crvVersions: number;
    creatives?: any;
    crvNotes: string;
    executiveEmail: string;
    executiveName: string;
    // executivePhone: string;
    exists: string;
    safeLater: IProjectSave;
    kpi: string;
    assets_hash: string;
}


export interface PhnxMediaPlan {
    start_date: string;
    end_date: string;
}

export interface PhnxAM {
    am_name: string;
    am_id: number;
    am_email: string;
    am_phnx_id: number;
}

export interface PhnxSales {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export interface PhnxClient {
    client_id: number;
    client_name: string;
    client_phnx_id: number;
}


export interface PhnxDownload {
    campaign_name: string;
    client: PhnxClient;
    am: PhnxAM;
    owner: string;
    phnx_id: number;
    kpi: string;
    media_plan: PhnxMediaPlan;
    target_audience: any[];
    sales_reps: PhnxSales;
    creatives: any[];
    formID: number;
    code: number;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    maintenanceOn = true;
    formID;
    showThankyou = false;
    phnxIDValid = false;
    phnxIDErr = false;
    oldPhnxIDErr = false;
    showProcessing = false;
    showErrors = false;
    validCreatives = false;
    uploadPercent = 0;
    tryAnotherID = false;

    phnxID: string;
    prevPhnxID: string;
    mainForm: FormGroup;
    campaignEndDateComp: FormControl;
    phnxPattern = '\d{5,6}';
    emailPattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    phonePattern = /(?:\d{1}\s)?\(?(\d{3})\)?[-.]?\s?(\d{3})[-.]?\s?(\d{4})/;
    tmpEndDate = 0;
    exitFormArray: FormArray;
    creativeGroup: FormGroup;
    crvVersionControl: FormControl;
    hashKey: string;
    sendData: IsendData;
    endDateDisabled = true;
    phnxData: PhnxDownload;
    formStatus = 'Saving...';
    creativeCount = 1;
    activeCrvType = '';
    selectedCreatives = {
        static: [],
        standard: [],
        richmedia: []
    };

    @ViewChild('dpStart') public startDateCal;
    @ViewChild('fileInput') fileInput;
    @ViewChild('modalElm') modalElm;
    @ViewChild('errorMessages') modalErrs;

    bsConfig = { containerClass: 'theme-default' };
    endCampDate = new Date();

    uploadOptions: UploaderOptions;

    filesToUpload: UploadFile[];
    uploadInput: EventEmitter<UploadInput>;

    modalRef: BsModalRef;

    errText: string;
    errHeader: string;

    formHash$;

    constructor(
        private _api: ApiService,
        private formBuilder: FormBuilder,
        public pageScrollService: PageScrollService, @Inject(DOCUMENT)
        private document: any,
        private route: ActivatedRoute,
        private modalService: BsModalService) {

        this.uploadInput = new EventEmitter<UploadInput>(); // input events, we use this to emit data to ngx-uploader
        this.filesToUpload = [];

        PageScrollConfig.defaultScrollOffset = 50;
        PageScrollConfig.defaultDuration = 500;

    }

    ngOnInit() {
        this.hashKey = Math.random().toString(36).substring(7);

        this.formHash$ = this.route.queryParams
            .subscribe((qparam: any) => {
                if ('ref' in qparam) {
                    console.log(qparam['ref']);
                    // load campaign
                    // this._api.getData('api/am/continue-form/' + qparam['ref']).subscribe((data: PhnxDownload) => {


                    // });

                }
            });
    }

    // PHNX calls
    // 1 - valid
    // 2 - no creatives
    // 3 - in progress
    // 4 - no phnx id found
    onImportPHNX() {

        if (this.phnxID.length >= 5) {
            if (this.prevPhnxID != this.phnxID) {
                this.prevPhnxID = this.phnxID;
                this.showProcessing = true;
                this.formStatus = 'Getting Campaign...';
                this._api.getData('api/am/creative-form/phnx/' + this.phnxID).subscribe((data: PhnxDownload) => {

                    switch (data.code) {
                        case 1:
                            this.phnxData = data;
                            this.formID = data.formID;
                            this.buildForm();
                            this.phnxIDValid = true;
                            break;
                        case 2:
                            // no creatives
                            this.errText = 'No creatives where found on the media plan, make sure the media plan reflects the creatives that need production.';
                            this.errHeader = 'No Creatives Found!';
                            this.openModal(this.modalErrs);
                            break;
                        case 3:
                            // in progress
                            // this.oldPhnxIDErr = true;
                            this.errText = 'This PHNX ID is already submitted, if you need to update the form, please access the form by using the email sent to you.';
                            this.errHeader = 'Creative Request In Progress';
                            this.openModal(this.modalErrs);
                            break;
                        case 4:
                            // no phnx id found
                            this.phnxIDErr = true;
                            this.errText = 'Could not find the PHNX ID, please double check the ID';
                            this.errHeader = 'No Campaign Found!';
                            this.openModal(this.modalErrs);
                            this.tryAnotherID = true;

                            break;

                    }

                    this.showProcessing = false;
                    this.formStatus = 'Saving...';
                });
            } else {
                this.tryAnotherID = true;
            }

        } else {
            if (this.prevPhnxID != this.phnxID) {
                this.prevPhnxID = this.phnxID;
                this.phnxIDErr = true;
                this.errText = 'Could not find the PHNX ID, please double check the ID';
                this.errHeader = 'No Campaign Found!';
                this.openModal(this.modalErrs);
            } else {
                this.tryAnotherID = true;
            }

        }
    }

    onPhnxBoxUpKey(event) {
        if (this.prevPhnxID !== this.phnxID) {
            // this.oldPhnxIDErr = false;
            // this.phnxIDErr = false;
            this.tryAnotherID = false;
        }
    }





    // New Campaign



    // Load Campaign






    //Tools

    formatDate(date) {
        return date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();
    }

    addRemoveDays(date: Date, days: number, add = true) {
        const result = new Date(date);
        if (add) {
            result.setDate(result.getDate() + days);
        } else {
            result.setDate(result.getDate() - days);
        }

        return result;
    }

    disabledPassToday() {
        return new Date();
    }

    changeEndDate(date) {
        this.endCampDate = this.addRemoveDays(date, 1, true);
        if (date > this.campaignEndDateComp.value) {
            this.campaignEndDateComp.setValue(null);
        }
    }

    buildForm() {
        const baseData = {
            client: (this.phnxData.client) ? this.phnxData.client : { client_name: null }
        };
        const plus2Days = this.addRemoveDays(new Date(), 2);
        const stgDate = plus2Days.getMonth() + 1 + '/' + plus2Days.getDate() + '/' + plus2Days.getFullYear();
        this.mainForm = new FormGroup({
            executiveName: new FormControl({ value: (this.phnxData.sales_reps) ? this.phnxData.sales_reps.first_name + ' ' + this.phnxData.sales_reps.last_name : null, disabled: false }, [Validators.required]),
            executiveEmail: new FormControl({ value: (this.phnxData.sales_reps) ? this.phnxData.sales_reps.email : null, disabled: false }, [Validators.required, Validators.pattern(this.emailPattern)]),
            additionalEmails: new FormControl(null),
            // executivePhone: new FormControl(null, [Validators.required, Validators.pattern(this.phonePattern)]),
            clientName: new FormControl({ value: baseData.client.client_name, disabled: (baseData.client.client_name) }, [Validators.required]),
            clientWebsite: new FormControl(null, [Validators.required]),
            campaignName: new FormControl({ value: this.phnxData.campaign_name, disabled: true }, [Validators.required]),
            campaignKPI: new FormControl({ value: this.phnxData.kpi, disabled: (this.phnxData.kpi) }, [Validators.required]),
            campaignStartDate: new FormControl({ value: (this.phnxData.media_plan) ? new Date(this.phnxData.media_plan.start_date) : null, disabled: false }, [Validators.required]),
            campaignEndDate: new FormControl({ value: (this.phnxData.media_plan) ? new Date(this.phnxData.media_plan.end_date) : null, disabled: false }, [Validators.required]),
            campaignAssetsDate: new FormControl(stgDate),
            campaignMsgPrimary: new FormControl(null, [Validators.required]),
            // campaignMsgSecondary: new FormControl(null),
            campaignTarget: new FormControl(null, [Validators.required]),
            // campaignNotes: new FormControl(null),
            crvVersions: new FormControl(this.creativeCount),
            crvNotes: new FormControl(null),
            creatives: this.formBuilder.group({

                static: new FormGroup({
                    static_300x250: new FormControl({ value: this.getCreativeItems('static_300x250'), disabled: true }),
                    static_728x90: new FormControl({ value: this.getCreativeItems('static_728x90'), disabled: true }),
                    static_160x600: new FormControl({ value: this.getCreativeItems('static_160x600'), disabled: true }),
                    static_600x600: new FormControl({ value: this.getCreativeItems('static_600x600'), disabled: true }),
                    static_1200x444: new FormControl({ value: this.getCreativeItems('static_1200x444'), disabled: true }),
                    static_1200x628: new FormControl({ value: this.getCreativeItems('static_1200x628'), disabled: true }),
                    static_320x50: new FormControl({ value: this.getCreativeItems('static_320x50'), disabled: true }),
                    static_300x50: new FormControl({ value: this.getCreativeItems('static_300x50'), disabled: true }),
                }),

                standard: new FormGroup({
                    standard_300x250: new FormControl({ value: this.getCreativeItems('standard_300x250'), disabled: true }),
                    standard_728x90: new FormControl({ value: this.getCreativeItems('standard_728x90'), disabled: true }),
                    standard_160x600: new FormControl({ value: this.getCreativeItems('standard_160x600'), disabled: true }),
                    standard_300x600: new FormControl({ value: this.getCreativeItems('standard_300x600'), disabled: true }),
                    standard_970x90: new FormControl({ value: this.getCreativeItems('standard_970x90'), disabled: true }),
                    standard_970x250: new FormControl({ value: this.getCreativeItems('standard_970x250'), disabled: true }),
                    standard_320x50: new FormControl({ value: this.getCreativeItems('standard_320x50'), disabled: true }),
                    standard_300x50: new FormControl({ value: this.getCreativeItems('standard_300x50'), disabled: true }),
                }),
                richmedia: new FormGroup({
                    richmedia_300x250: new FormControl({ value: this.getCreativeItems('richmedia_300x250'), disabled: true }),
                    richmedia_728x90: new FormControl({ value: this.getCreativeItems('richmedia_728x90'), disabled: true }),
                    richmedia_160x600: new FormControl({ value: this.getCreativeItems('richmedia_160x600'), disabled: true }),
                    richmedia_300x600: new FormControl({ value: this.getCreativeItems('richmedia_300x600'), disabled: true }),
                    richmedia_970x250: new FormControl({ value: this.getCreativeItems('richmedia_970x250'), disabled: true }),
                    richmedia_300x600Exp: new FormControl({ value: this.getCreativeItems('richmedia_300x600Exp'), disabled: true }),
                    richmedia_728x315Exp: new FormControl({ value: this.getCreativeItems('richmedia_728x315Exp'), disabled: true }),
                    richmedia_500x250Exp: new FormControl({ value: this.getCreativeItems('richmedia_500x250Exp'), disabled: true })
                })
            }),
            exists: new FormArray([])
        });

        this.crvVersionControl = this.mainForm.get('crvVersions') as FormControl;
        this.creativeGroup = this.mainForm.get('creatives') as FormGroup;
        this.exitFormArray = this.mainForm.get('exists') as FormArray;
        this.campaignEndDateComp = this.mainForm.get('campaignEndDate') as FormControl;
        this.addNewExit();


    }


    setActiveIfCrv(type, setActive = true) {
        const cont = this.creativeGroup.get(type) as FormGroup;
        const found = Object.keys(cont.controls).some(item => {
            const c = cont.get(item) as FormGroup;
            if (c.value) {
                return true;
            } else {
                return false;
            }
        });
        if (setActive && found) {
            if (!this.activeCrvType) {
                this.activeCrvType = type;
            }
        }
        return found;
    }

    getCreativeItems(_name) {
        const sub = _name.split('_');
        const found = this.phnxData.creatives.some(item => item.type.toLowerCase() === sub[0] && item.size.std_size === sub[1]);
        if (found) { this.validCreatives = true; }
        return found;

    }



    addNewExit() {
        this.exitFormArray.push(this.newExit());
    }

    removeExit(index) {
        this.exitFormArray.removeAt(index);
    }

    sendExitFix() {
        const formExits: any[] = this.exitFormArray.value;
        const fixed = [];
        this.exitFormArray.value.forEach((ite, idx) => {
            if (idx === 0) {
                fixed.push({ MainExit: ite.exitUrl });
            } else {
                const t = {};
                t[ite.exitName] = ite.exitUrl;
                fixed.push(t);
            }
        });

        return (fixed[0].MainExit) ? fixed : [];

    }

    newExit(): FormGroup {
        // const times = this.mainForm.get('exists') as FormArray;
        let exitItem;
        if (this.exitFormArray.length === 0) {
            exitItem = new FormGroup({
                exitName: new FormControl({ value: 'MainExit', disabled: true }),
                exitUrl: new FormControl(null),
            });
        } else {
            exitItem = new FormGroup({
                exitName: new FormControl(null, [Validators.required]),
                exitUrl: new FormControl(null),
            });
        }
        return exitItem;
    }

    setActiveType(active: string) {
        this.activeCrvType = active;
    }

    onCreativeCount(count) {
        this.creativeCount = count;
        this.crvVersionControl.setValue(count);
    }

    // checkChanged(event) {
    //     if (event.target.checked) {
    //         this.validCreatives = true;
    //     } else {
    //         this.validateCreatives();
    //     }
    // }



    processForm() {
        this.modalElm.hide();
        this.showProcessing = true;
        // const startDate = this.mainForm.get('campaignStartDate').value;
        // const endDate = this.mainForm.get('campaignEndDate').value;
        this.sendData = Object.assign({}, this.mainForm.value);
        delete this.sendData.creatives;
        if (!this.phnxData.client) {
            this.phnxData.client = {
                client_id: null,
                client_name: this.mainForm.get('clientName').value,
                client_phnx_id: null
            };
        }
        // console.log(this.phnxData);
        this.sendData.safeLater = Object.assign({}, this.phnxData);
        this.sendData.safeLater.creatives = this.extractCreatives();
        this.sendData.safeLater.owner = 'LIN';
        this.sendData.assets_hash = this.sanatizeNames(this.mainForm.get('clientName').value) + '_' + this.hashKey;
        this.sendData.exists = JSON.stringify(this.sendExitFix());
        this.sendData.kpi = this.mainForm.get('campaignKPI').value;
        this.sendData.campaignEndDate = this.formatDate(this.mainForm.get('campaignEndDate').value);
        this.sendData.campaignStartDate = this.formatDate(this.mainForm.get('campaignStartDate').value);

        // console.log(this.sendData);
        this._api.insertData('api/am/creative-form/' + this.formID, this.sendData, false).subscribe(res => {
            if (this.filesToUpload.length > 0) {
                this.startUpload();
            } else {
                this.showProcessing = false;
                this.showThankyou = true;
            }

        });
    }

    // modalRespose(respData) {
    //     if (respData.yes) {
    //         this._modalService.hideModal();
    //         this.processForm();
    //     } else {
    //         this._modalService.hideModal(); // cancelled
    //     }
    // }

    // modalNoAttachedFiles() {
    //     console.log('calling modal');
    //     console.log(this._modalService);
    //     const msg = '<strong>Assets are required to start job!</strong><br> Have you provided a link to assets in notes section?';
    //     this._modalService.showModal({ component: ModalYesNoComponent, title: 'Missing Files?', message: msg, id: 'continue' });
    // }

    onSubmitBtn() {
        if (this.validCreatives && this.mainForm.valid) {
            if (this.filesToUpload.length > 0) {
                this.processForm();
            } else {
                this.modalElm.show();
            }

        } else {
            console.log('failed missing creative');
            this.showErrors = true;
            this.gotoFirstMissing();
        }
    }

    onUploadOutput(output: UploadOutput): void {
        // console.log(output);
        if (output.type === 'addedToQueue' && typeof output.file !== 'undefined') { // add file to array when added
            this.filesToUpload.push(output.file);
        } else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
            const index = this.filesToUpload.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
            this.filesToUpload[index] = output.file;
            this.updateUploading();
        } else if (output.type === 'removed') {
            this.filesToUpload = this.filesToUpload.filter((file: UploadFile) => file !== output.file);
        }
    }

    updateUploading() {
        this.formStatus = 'Uploading files...';
        let totalProgress = 0;
        this.filesToUpload.forEach(file => {
            totalProgress += file.progress.data.percentage;
        });
        this.uploadPercent = Math.round(totalProgress / this.filesToUpload.length);

        if (this.uploadPercent === 100) {
            this.showProcessing = false;
            this.showThankyou = true;
        }
    }

    startUpload(): void {
        const event: UploadInput = {
            type: 'uploadAll',
            url: environment.API_URL + 'api/am/form-upload/' + this.formID,
            method: 'POST',
            data: { foo: 'bar' }
        };

        this.uploadInput.emit(event);
    }

    cancelUpload(id: string): void {
        this.uploadInput.emit({ type: 'cancel', id: id });
    }

    removeFile(id: string): void {
        this.uploadInput.emit({ type: 'remove', id: id });

    }

    removeAllFiles(): void {
        this.uploadInput.emit({ type: 'removeAll' });
    }

    extractCreatives() {
        const obj = Object.assign({}, this.creativeGroup.value);
        const rm = ('richmedia' in obj) ? this.convertCreative(obj.richmedia, 'RichMedia') : [];
        const std = ('standard' in obj) ? this.convertCreative(obj.standard, 'Standard') : [];
        const sta = ('static' in obj) ? this.convertCreative(obj.static, 'Static') : [];

        let allCrvs = [];

        if (rm.length > 0) {
            allCrvs = allCrvs.concat(rm);
        }

        if (std.length > 0) {
            allCrvs = allCrvs.concat(std);
        }

        if (sta.length > 0) {
            allCrvs = allCrvs.concat(sta);
        }

        return allCrvs;
    }

    validateCreatives() {
        const stats = this.setActiveIfCrv('static', false);
        const std = this.setActiveIfCrv('standard', false);
        const rm = this.setActiveIfCrv('richmedia', false);

        this.validCreatives = (stats || std || rm) ? true : false;

    }

    convertCreative(_crv: any, _type: string) {

        const reg = /[\d]{2,4}[x]{1}[\d]{2,4}/i;
        const resp = [];

        Object.keys(_crv).forEach(item => {

            if (_crv[item]) {
                const sub = item.split('_');
                let size;
                let exp = false;
                if (sub[1].includes('Exp')) {
                    exp = true;
                    size = reg.exec(sub[1])[0];
                } else {
                    size = sub[1];
                }


                const re = {
                    duplicate: {
                        active: false,
                        times: 6,
                    },
                    options: {
                        carousel: false,
                        clicktocall: false,
                        custom: false,
                        expandable: exp,
                        fmcontent: false,
                        form: false,
                        gallery: false,
                        location: false,
                        map: false,
                        pushdown: false,
                        video: false,
                    },
                    size: {
                        custom_size: null,
                        expand_size: null,
                        std_size: size
                    },
                    type: _type,
                    versionName: null
                };

                resp.push(re);
            }


        });

        return resp;
    }

    sanatizeNames(value: string) {
        return this.toTitleCase(value).replace(/([\W_])+/g, '');
    }

    toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1);
        });
    }

    gotoFirstMissing() {
        const keys = Object.keys(this.mainForm.controls);
        let found = false;
        for (let i = 0; i < keys.length; i++) {
            if (this.mainForm.get(keys[i]).invalid) {
                const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#' + keys[i]);
                this.pageScrollService.start(pageScrollInstance);
                found = true;
                break;
            }
        }

        if (!found) {
            const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#creativeAdBlock');
            this.pageScrollService.start(pageScrollInstance);
        }
    }


    confirmModal() {
        if (!this.mainForm.get('crvNotes').value) {
            this.cancelModal();
        } else {
            this.processForm();
        }
    }

    cancelModal() {
        this.modalElm.hide();
        const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#notesCreativesSet');
        this.pageScrollService.start(pageScrollInstance);
    }


    openModal(template: TemplateRef<any>) {
        this.modalRef = this.modalService.show(template);
    }
}
