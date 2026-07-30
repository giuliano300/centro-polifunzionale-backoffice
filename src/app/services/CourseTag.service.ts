import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../main';

export interface CourseTagOption {
  _id?: string;
  value: string;
  label: string;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseTagService {
  private apiUrl = API_URL + 'course-tags';

  constructor(private http: HttpClient) {}

  getTags(includeInactive = false): Observable<CourseTagOption[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<CourseTagOption[]>(`${this.apiUrl}${includeInactive ? '?includeInactive=true' : ''}`, { headers });
  }

  create(payload: Pick<CourseTagOption, 'value' | 'label'> & Partial<CourseTagOption>): Observable<CourseTagOption> {
    return this.http.post<CourseTagOption>(this.apiUrl, payload, { headers: this.headers() });
  }

  update(id: string, payload: Partial<CourseTagOption>): Observable<CourseTagOption> {
    return this.http.patch<CourseTagOption>(`${this.apiUrl}/${id}`, payload, { headers: this.headers() });
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}
