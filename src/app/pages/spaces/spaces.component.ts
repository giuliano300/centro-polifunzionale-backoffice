import { Component, ViewChild } from '@angular/core';
import { Spaces } from '../../interfaces/spaces';
import { SpacesService } from '../../services/Space.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialogComponent } from '../../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

type SpaceRow = Spaces & { action: { viewDetails: string; edit: string; delete: string; toggle: string } };

@Component({
  selector: 'app-spaces',
  imports: [NgFor, RouterLink, MatCardModule, MatButtonModule, MatMenuModule, MatPaginatorModule, MatTableModule, MatCheckboxModule],
  templateUrl: './spaces.component.html',
  styleUrl: './spaces.component.scss'
})
export class SpacesComponent {
 spaces: SpaceRow[] = [];

 displayedColumns: string[] = ['name', 'rentalUnit', 'rentalModes', 'rates', 'slots', 'schedule', 'isAvailable', 'toggle', 'viewDetails', 'edit', 'delete'];

 dataSource = new MatTableDataSource<SpaceRow>(this.spaces);

 @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
      private router: Router,
      private spaceService: SpacesService,
      private dialog: MatDialog
  ) {}

   ngOnInit(): void {
    this.getSpaces();
   }

   getSpaces(){
        this.spaceService.getSpaces()
        .subscribe((data: Spaces[]) => {
          if (!data || data.length === 0) {
            this.spaces = [];
            this.dataSource = new MatTableDataSource<SpaceRow>(this.spaces);
            this.dataSource.paginator = this.paginator;
          } else {
            this.spaces = data.map(c => ({
                ...c, 
                action: {
                    viewDetails: 'ri-menu-search-line',
                    edit: 'ri-edit-line',
                    delete: 'ri-delete-bin-line',
                    toggle: c.isAvailable ? 'ri-pause-circle-line' : 'ri-play-circle-line'
                }
            }));;
            this.dataSource = new MatTableDataSource<SpaceRow>(this.spaces);
            this.dataSource.paginator = this.paginator;
        }
    });

   }

    DeleteItem(item:Spaces){

      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '480px',
        maxWidth: '92vw',
        data: { title: 'Eliminare questa stanza?', message: 'La stanza non sarà più disponibile nel backoffice.', detail: item.name }
      });

      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.spaceService.delete(item._id)
            .subscribe((data: boolean) => {
              if(data){
                this.getSpaces();
              }
            });
        } 
      });
    }

    UpdateItem(item:Spaces){
      this.router.navigate(["/spaces/add/" + item._id]);
    }

    BookingItem(item:Spaces){
      this.router.navigate(["/space/bookings/" + item._id]);
    }

    ToggleAvailability(item: SpaceRow): void {
      this.spaceService.update(item._id, { isAvailable: !item.isAvailable }).subscribe(() => this.getSpaces());
    }

    getAvailabilityLabel(item: Spaces): string {
      return item.isAvailable ? 'Attivo' : 'Disattivo';
    }

    getRentalUnitLabel(item: Spaces): string {
      if (item.rentalUnit === 'workstation') {
        return 'Postazioni';
      }

      return item.sectorEnabled && Number(item.sectorCount || 1) > 1
        ? `Stanza ad aree (${item.sectorCount})`
        : 'Stanza intera';
    }

    getRentalModesLabel(item: Spaces): string {
      const labels: Record<string, string> = {
        time: 'A tempo',
        full_day: 'Giornata'
      };

      return (item.rentalModes || ['time']).map((mode) => labels[mode] || mode).join(', ');
    }

    getRentalModesRows(item: Spaces): string[] {
      const labels: Record<string, string> = {
        time: 'A tempo',
        full_day: 'A giornata'
      };

      return (item.rentalModes || ['time']).map((mode) => labels[mode] || mode);
    }

    getRateRows(item: Spaces): Array<{ label: string; value: string }> {
      const rates: Array<{ label: string; value: string }> = [];
      if ((item.rentalModes || ['time']).includes('time')) {
        rates.push({ label: 'Frazione', value: this.formatRate(item.hourlyRate) });
        if (item.sectorEnabled && Number(item.sectorCount || 1) > 1) {
          rates.push({ label: 'Area', value: this.formatRate(item.sectorRate || item.hourlyRate) });
        }
      }
      if ((item.rentalModes || []).includes('full_day')) {
        rates.push({ label: 'Giorno', value: this.formatRate(item.dailyRate) });
        if (item.sectorEnabled && Number(item.sectorCount || 1) > 1) {
          rates.push({ label: 'Area/giorno', value: this.formatRate(item.sectorDailyRate || item.dailyRate) });
        }
      }

      return rates.length ? rates : [{ label: 'Prezzo', value: 'Non configurato' }];
    }

    private formatRate(value?: number): string {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    }

    getRatesLabel(item: Spaces): string {
      const rates: string[] = [];
      if ((item.rentalModes || ['time']).includes('time')) {
        rates.push(`${item.hourlyRate || 0}/frazione`);
        if (item.sectorEnabled && Number(item.sectorCount || 1) > 1) {
          rates.push(`${item.sectorRate || item.hourlyRate || 0}/area`);
        }
      }
      const daily = item.dailyRate ? `${item.dailyRate}/giorno` : null;
      if ((item.rentalModes || []).includes('full_day') && daily) {
        rates.push(daily);
        if (item.sectorEnabled && Number(item.sectorCount || 1) > 1) {
          rates.push(`${item.sectorDailyRate || item.dailyRate || 0}/area giorno`);
        }
      }
      return rates.length ? rates.join(' - ') : '-';
    }

    getSlotsLabel(item: Spaces): string {
      if (!(item.rentalModes || ['time']).includes('time')) {
        return 'Non previste';
      }

      const openSlots = (item.openingHours || []).filter((slot) => slot.isOpen);
      if (!openSlots.length) {
        return 'Nessun giorno aperto';
      }

      const values = openSlots.map((slot) => Number(slot.maxConsecutiveTimeSlots || item.maxConsecutiveTimeSlots || 1));
      const min = Math.min(...values);
      const max = Math.max(...values);

      if (min === max) {
        return min === 1 ? '1 fascia oraria per acquisto' : `Fino a ${max} fasce orarie consecutive`;
      }

      return `Da ${min} a ${max} fasce orarie in base al giorno`;
    }

    getScheduleLabel(item: Spaces): string {
      const openSlots = (item.openingHours || []).filter((slot) => slot.isOpen);
      if (!openSlots.length) {
        return 'Sempre chiuso';
      }

      const first = openSlots[0];
      const sameHours = openSlots.every((slot) => slot.openTime === first.openTime && slot.closeTime === first.closeTime);
      return sameHours ? `${first.openTime} - ${first.closeTime}` : 'Orari variabili';
    }

  }
