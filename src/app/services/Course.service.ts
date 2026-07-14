import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CreateCourse } from '../interfaces/courses';

export interface CourseFilters {
  start?: string;
  end?: string;
  status?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = API_URL + "courses";

  constructor(private http: HttpClient) {}

  getCourses(filters: CourseFilters = {}): Observable<Course[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = this.buildQuery(filters);
    return this.http.get<Course[]>(this.apiUrl + params, { headers });
  }

  getCourse(id: string): Observable<Course>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Course>(this.apiUrl + "/" + id, { headers });
  }

  create(course: CreateCourse): Observable<Course>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Course>(this.apiUrl, course, { headers });
  }

  update(id: string, course: CreateCourse): Observable<Course>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.patch<Course>(this.apiUrl + "/" + id, course, { headers });
  }

  delete(id: string): Observable<{ deleted: boolean }>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete<{ deleted: boolean }>(this.apiUrl + "/" + id, { headers });
  }

  private buildQuery(filters: object): string {
    const params = new URLSearchParams();
    Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      }
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
