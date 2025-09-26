import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

    // Funzione per capitalizzare una stringa
    capitalizeFirstLetter(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
    // Altre funzioni generiche
    calculateSum(a: number, b: number): number {
      return a + b;
    }

    getEntries(obj: { [key: string]: string }): [string, string][] {
      return Object.entries(obj);
    }

    generateToken(length: number = 32): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    }

    getDateFormatted(date:Date): string {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

   GetMonth(): any[] {
      let m =  
      [
        { id: 1, name: "Gennaio" },
        { id: 2, name: "Febbraio" },
        { id: 3, name: "Marzo" },
        { id: 4, name: "Aprile" },
        { id: 5, name: "Maggio" },
        { id: 6, name: "Giugno" },
        { id: 7, name: "Luglio" },
        { id: 8, name: "Agosto" },
        { id: 9, name: "Settembre" },
        { id: 10, name: "Ottobre" },
        { id: 11, name: "Novembre" },
        { id: 12, name: "Dicembre" }
      ]

      return m;
  };

}
