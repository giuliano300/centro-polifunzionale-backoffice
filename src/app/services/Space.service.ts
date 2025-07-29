import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Spaces } from '../interfaces/spaces';

@Injectable({
  providedIn: 'root'
})
export class SpacesService {

    private apiUrl = API_URL + "spaces";
    
    constructor(private http: HttpClient) {}

    getSpaces(): Observable<Spaces[]>{
      const token = localStorage.getItem('authToken'); 
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });      
      return this.http.get<Spaces[]>(this.apiUrl, { headers });
    }

    getSpace(id: string): Observable<Spaces>{
      return this.http.get<Spaces>(this.apiUrl + "/" + id);
    }

    delete(id: string):Observable<boolean>{
      const token = localStorage.getItem('authToken'); 
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });      
      return this.http.delete<boolean>(this.apiUrl + "/" + id, { headers });
    }
  
}
