import { Injectable } from '@angular/core';
import { API_URL } from '../../main';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CreateCourse } from '../interfaces/courses';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = API_URL + "courses";

  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]>{
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Course[]>(this.apiUrl, { headers });
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
}
