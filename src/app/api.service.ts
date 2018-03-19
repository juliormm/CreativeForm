import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { environment } from '../environments/environment'


@Injectable()
export class ApiService {

    private baseUrl: string = environment.API_URL;

    constructor(private http: Http) { }


    getData(path: string, getError = false) {
        return this.http.get(this.baseUrl + `${path}`, this.jwt('get', false))
            .map((response: Response) => {
                const r = this.extractData(response, getError);
                return r;
            })
            .catch((response: Response) => {
                const errMsg = this.handleError(response);
                return Observable.throw(errMsg);
            });
    }


    insertData(path: string, data: any, getError = false) {
        return this.http.post(this.baseUrl + `${path}`, JSON.stringify(data), this.jwt('put', false))
            .map((response: Response) => {
                const r = this.extractData(response, getError);
                return r;
            })
            .catch((response: Response) => {
                const errMsg = this.handleError(response);
                return Observable.throw(errMsg);
            });
    }

    private jwt(type: string, secure = true): any {
        const currentUser = localStorage.getItem('id_token');
        const headersDetail = new Headers({ 'Accept': 'application/json' });
        if (secure && currentUser) {
            headersDetail.append('Authorization', `Bearer ${currentUser}`);
        }

        if (type === 'put' || type === 'post') {
            headersDetail.append('Content-Type', 'application/json');
        }

        if (type = 'form') {
            headersDetail.append('Content-Type', 'application/x-www-form-urlencoded');
        }

        return { headers: headersDetail };
    }

    private extractData(res: Response, getErr?: boolean) {
        // console.log(res)
        const body = res.json();
        if (getErr) {
            return body;
        }
        if (body.status === 'success') {
            return (body.data) ? body.data : body;
        } else {

            return { failed: true }
        }
    }

    private handleError(error: Response | any) {
        console.log(error);
        let errMsg: string;
        const criticalError = 'Sorry, something went wrong, contact the admin';
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body.error || criticalError;
            errMsg = err || error.statusText;
            // errMsg = err;
            if (err === criticalError) {
                console.log(body);
            }
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        return { failed: errMsg };
        // return Observable.throw(errMsg);
    }

}
