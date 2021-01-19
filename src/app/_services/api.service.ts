import { AuthToken } from 'forge-apis';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { AlertService } from '../_alert/alert.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private alertService: AlertService) {}
  /* Nur für Development */
  // private API_BASE = 'http://localhost:4200';
  private API_BASE = 'https://felix-platform-backend.herokuapp.com';

  public async get2LToken(): Promise<AuthToken> {
    return await this.http
      .get(`${this.API_BASE}/forge/Get2LTokenETHZ`)
      .toPromise()
      .then((res) => {
        return Promise.resolve(res);
      })
      .catch((error) => {
        this.alertService.error(error);
        return null;
      });
  }

  public async getspecificProject(projectID: string): Promise<any> {
    return this.http
      .get(`${this.API_BASE}/projects/getspecificProject/${projectID}`)
      .toPromise()
      .then((res) => {
        return Promise.resolve(res);
      })
      .catch((error) => {
        this.alertService.error(error);
        return null;
      });
  }
}
