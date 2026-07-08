import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Login } from '../interfaces/Login';
import { AuthUser } from '../interfaces/auth-user';

export interface CreateClientUser {
  name: string;
  email: string;
  phone?: string;
  taxCode?: string;
  password: string;
  role: 'cliente';
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

    private apiUrl = API_URL;
    
    constructor(private http: HttpClient) {}

    login(login:Login): Observable<string>{
      return this.http.post<any>(this.apiUrl + "auth/login", login);
    }

    getUsers(): Observable<AuthUser[]>{
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      return this.http.get<AuthUser[]>(this.apiUrl + "users?limit=100", { headers });
    }

    searchClients(search: string): Observable<AuthUser[]>{
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const query = encodeURIComponent(search.trim());
      return this.http.get<AuthUser[]>(this.apiUrl + "users?role=cliente&limit=20&search=" + query, { headers });
    }

    createClient(user: CreateClientUser): Observable<AuthUser>{
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      return this.http.post<AuthUser>(this.apiUrl + "users", user, { headers });
    }

    deleteUser(id: string): Observable<{ deleted: boolean }>{
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      return this.http.delete<{ deleted: boolean }>(this.apiUrl + "users/" + id, { headers });
    }

}
