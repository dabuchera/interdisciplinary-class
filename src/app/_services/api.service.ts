import { AuthToken } from 'forge-apis';
import { Injectable } from '@angular/core';
import {
  HttpClient,
} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}
  /* Nur für Development */
  // private API_BASE = 'http://localhost:4200';
  private API_BASE = 'https://felix-platform-backend.herokuapp.com';

  public async get2LToken(): Promise<AuthToken> {
    return await this.http
      .get(`${this.API_BASE}/forge/Get2LTokenETHZ_interdisziplinary_hotmail`)
      .toPromise()
      .then((res) => {
        return Promise.resolve(res);
      })
      .catch((error) => {
        console.log(error);
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
        console.log(error);
        return null;
      });
  }

  public async uploadModel(groupID: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('model', file, file.name);
    return await this.http.post(`${this.API_BASE}/forge/UploadModel/${groupID}/`, formData).toPromise()
      .then(
        res => {
          return Promise.resolve(res);
        })
      .catch(error => {
        console.log(error);
        return null;
      });
  }

  // Gibt ein Autodesk ApiResponse zurück
  public async startTranslation(urnEncoded: string): Promise<any> {
    return await this.http.get(`${this.API_BASE}/forge/startTranslation/${urnEncoded}`).toPromise()
      .then(
        res => {
          return Promise.resolve(res);
        })
      .catch(error => {
        console.log(error);
        return null;
      });
  }
}
