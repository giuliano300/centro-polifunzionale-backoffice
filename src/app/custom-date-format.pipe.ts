import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDateFormat'
})
export class CustomDateFormatPipe implements PipeTransform {

  transform(date: Date): string {
    if (!date) return '';

      date = new Date(date);
      const day = String(date.getDate()).padStart(2, '0'); // Ottieni il giorno e aggiungi uno zero iniziale se necessario
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ottieni il mese (0-based) e aggiungi uno zero iniziale se necessario
      const year = date.getFullYear(); // Ottieni l'anno
      const hours = String(date.getHours()).padStart(2, '0'); // Ottieni le ore
      const minutes = String(date.getMinutes()).padStart(2, '0'); // Ottieni i minuti
      const seconds = String(date.getSeconds()).padStart(2, '0'); // Ottieni i secondi
  
      return `${day}/${month}/${year}`;
    }
  
  }

