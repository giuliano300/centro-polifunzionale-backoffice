import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../main';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private socket?: Socket;
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private unreadSubject = new BehaviorSubject<number>(0);
  notifications$ = this.notificationsSubject.asObservable();
  unread$ = this.unreadSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(): void {
    const token = localStorage.getItem('authToken');
    if (!token || this.socket?.connected) {
      return;
    }

    this.load();
    this.socket = io(API_URL.replace(/\/$/, ''), {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('notification', (notification: AppNotification) => {
      const current = this.notificationsSubject.value;
      this.notificationsSubject.next(this.sortRecentFirst([notification, ...current]).slice(0, 30));
      this.unreadSubject.next(this.unreadSubject.value + 1);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
    this.notificationsSubject.next([]);
    this.unreadSubject.next(0);
  }

  load(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<AppNotification[]>(`${API_URL}notifications`, { headers }).subscribe((items) => {
      this.notificationsSubject.next(this.sortRecentFirst(items));
      this.unreadSubject.next(items.filter((item) => !item.isRead).length);
    });
  }

  markAllRead(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const updated = this.notificationsSubject.value.map((item) => ({ ...item, isRead: true }));
    this.notificationsSubject.next(updated);
    this.unreadSubject.next(0);

    this.http.patch(`${API_URL}notifications/read-all`, {}, { headers }).subscribe({
      next: () => this.load(),
      error: () => this.load(),
    });
  }

  private sortRecentFirst(items: AppNotification[]): AppNotification[] {
    return [...items].sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }
}
