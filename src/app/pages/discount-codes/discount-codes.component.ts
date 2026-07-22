import { Component, ViewChild, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DiscountCode } from '../../interfaces/discount-codes';
import { DiscountCodeService } from '../../services/DiscountCode.service';
import { Spaces } from '../../interfaces/spaces';
import { SpacesService } from '../../services/Space.service';

@Component({
  selector: 'app-discount-codes',
  imports: [NgIf, NgFor, ReactiveFormsModule, MatButtonModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSelectModule, MatSlideToggleModule, MatTableModule],
  templateUrl: './discount-codes.component.html',
  styleUrl: './discount-codes.component.scss'
})
export class DiscountCodesComponent {
  private fb = inject(FormBuilder);
  readonly allOption = '__all__';
  readonly roleOptions = ['cliente', 'gestore'];
  private allSpacesMode = true;
  private allRolesMode = true;
  discounts: DiscountCode[] = [];
  dataSource = new MatTableDataSource<DiscountCode>([]);
  displayedColumns = ['code', 'value', 'target', 'spaces', 'users', 'rule', 'uses', 'status', 'actions'];
  spaces: Spaces[] = [];
  selected: DiscountCode | null = null;
  isLoading = true;
  isSaving = false;
  message = '';
  messageType: 'success' | 'warning' | 'delete' = 'warning';

  form = this.fb.group({
    code: ['', Validators.required],
    type: ['percentage' as 'percentage' | 'fixed', Validators.required],
    value: [0, [Validators.required, Validators.min(0)]],
    target: ['all' as 'all' | 'booking' | 'course', Validators.required],
    spaceIds: [[] as string[]],
    userRoles: [[] as string[]],
    rule: ['manual' as 'manual' | 'new_user' | 'monthly_purchases'],
    newUserDays: [30, [Validators.min(1)]],
    monthlyPurchaseMin: [0, [Validators.min(0)]],
    isActive: [true],
    validFrom: [null as Date | null],
    validTo: [null as Date | null],
    maxUses: [null as number | null],
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private discountService: DiscountCodeService, private spacesService: SpacesService) {}

  ngOnInit(): void {
    this.loadSpaces();
    this.load();
  }

  loadSpaces(): void {
    this.spacesService.getSpaces().subscribe({
      next: (spaces) => {
        this.spaces = spaces;
        if (!this.form.value.spaceIds?.length) {
          this.form.controls.spaceIds.setValue([this.allOption], { emitEvent: false });
        }
      },
    });
  }

  load(): void {
    this.isLoading = true;
    this.discountService.getAll().subscribe({
      next: (items) => {
        this.discounts = items;
        this.dataSource = new MatTableDataSource<DiscountCode>(items);
        this.dataSource.paginator = this.paginator;
        this.isLoading = false;
      },
      error: () => {
        this.messageType = 'warning';
        this.message = 'Sconti non disponibili.';
        this.isLoading = false;
      }
    });
  }

  edit(discount: DiscountCode): void {
    this.selected = discount;
    this.allSpacesMode = !this.spaceIds(discount).length;
    this.allRolesMode = !discount.userRoles?.length;
    this.form.patchValue({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      target: discount.target,
      spaceIds: this.formSpaceIds(discount),
      userRoles: this.formRoles(discount),
      rule: discount.rule || 'manual',
      newUserDays: discount.newUserDays || 30,
      monthlyPurchaseMin: discount.monthlyPurchaseMin || 0,
      isActive: discount.isActive,
      validFrom: this.inputDate(discount.validFrom),
      validTo: this.inputDate(discount.validTo),
      maxUses: discount.maxUses ?? null,
    });
  }

  reset(): void {
    this.selected = null;
    this.allSpacesMode = true;
    this.allRolesMode = true;
    this.form.reset({ code: '', type: 'percentage', value: 0, target: 'all', spaceIds: [this.allOption], userRoles: [this.allOption], rule: 'manual', newUserDays: 30, monthlyPurchaseMin: 0, isActive: true, validFrom: null, validTo: null, maxUses: null });
  }

  save(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    const raw = this.form.getRawValue();
    const rawSpaceValues = raw.spaceIds || [];
    const rawRoleValues = raw.userRoles || [];
    const selectedSpaces = this.cleanValues(rawSpaceValues);
    const selectedRoles = this.cleanValues(rawRoleValues);
    const payload: Partial<DiscountCode> = {
      code: raw.code || '',
      type: raw.type || 'percentage',
      value: Number(raw.value || 0),
      target: raw.target || 'all',
      spaceIds: this.isAllSpacesValue(rawSpaceValues) ? [] : selectedSpaces,
      userRoles: this.isAllRolesValue(rawRoleValues) ? [] : selectedRoles,
      rule: raw.rule || 'manual',
      newUserDays: Number(raw.newUserDays || 30),
      monthlyPurchaseMin: Number(raw.monthlyPurchaseMin || 0),
      isActive: raw.isActive !== false,
      validFrom: this.formatApiDate(raw.validFrom),
      validTo: this.formatApiDate(raw.validTo),
      maxUses: raw.maxUses || undefined,
    };
    const request = this.selected
      ? this.discountService.update(this.selected._id, payload)
      : this.discountService.create(payload);
    request.subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Sconto salvato.';
        this.isSaving = false;
        this.reset();
        this.load();
      },
      error: (error) => {
        this.messageType = 'warning';
        this.message = error?.error?.message || 'Sconto non salvato.';
        this.isSaving = false;
      }
    });
  }

  delete(discount: DiscountCode): void {
    if (!confirm(`Eliminare il codice ${discount.code}?`)) {
      return;
    }
    this.discountService.delete(discount._id).subscribe({
      next: () => {
        this.messageType = 'delete';
        this.message = 'Sconto eliminato.';
        this.load();
      },
      error: (error) => {
        this.messageType = 'warning';
        this.message = error?.error?.message || 'Sconto non eliminato.';
      }
    });
  }

  typeLabel(type: DiscountCode['type']): string {
    return type === 'percentage' ? 'Percentuale' : 'Importo fisso';
  }

  targetLabel(target: DiscountCode['target']): string {
    const labels = { all: 'Seleziona tutto', booking: 'Prenotazioni', course: 'Corsi' };
    return labels[target];
  }

  valueLabel(discount: DiscountCode): string {
    return discount.type === 'percentage'
      ? `${discount.value}%`
      : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(discount.value);
  }

  spaceName(discount: DiscountCode): string {
    const ids = this.spaceIds(discount);
    if (!ids.length) {
      return 'Tutti gli spazi';
    }
    return ids.map((id) => this.spaces.find((space) => space._id === id)?.name || 'Spazio selezionato').join(', ');
  }

  roleLabel(discount: DiscountCode): string {
    const roles = discount.userRoles || [];
    if (!roles.length) return 'Tutti gli utenti';
    const labels: Record<string, string> = { cliente: 'Clienti', gestore: 'Gestori', admin: 'Admin' };
    return roles.map((role) => labels[role] || role).join(', ');
  }

  ruleLabel(discount: DiscountCode): string {
    if (discount.rule === 'new_user') return `Nuovi registrati (${discount.newUserDays || 30} giorni)`;
    if (discount.rule === 'monthly_purchases') return `Da ${discount.monthlyPurchaseMin || 0} acquisti/mese`;
    return 'Manuale';
  }

  private spaceIds(discount: DiscountCode): string[] {
    return (discount.spaces || []).map((space) => typeof space === 'string' ? space : space._id);
  }

  onSpaceSelectionChange(values: string[]): void {
    const clean = this.cleanValues(values);
    if (values.includes(this.allOption) && !this.allSpacesMode) {
      this.allSpacesMode = true;
      this.form.controls.spaceIds.setValue([this.allOption], { emitEvent: false });
      return;
    }
    if (!values.length && this.allSpacesMode) {
      this.form.controls.spaceIds.setValue([this.allOption], { emitEvent: false });
      return;
    }
    if (values.includes(this.allOption) && this.allSpacesMode && clean.length) {
      this.allSpacesMode = false;
      this.form.controls.spaceIds.setValue(clean, { emitEvent: false });
      return;
    }
    this.allSpacesMode = false;
    this.form.controls.spaceIds.setValue(clean, { emitEvent: false });
  }

  onRoleSelectionChange(values: string[]): void {
    const clean = this.cleanValues(values);
    if (values.includes(this.allOption) && !this.allRolesMode) {
      this.allRolesMode = true;
      this.form.controls.userRoles.setValue([this.allOption], { emitEvent: false });
      return;
    }
    if (!values.length && this.allRolesMode) {
      this.form.controls.userRoles.setValue([this.allOption], { emitEvent: false });
      return;
    }
    if (values.includes(this.allOption) && this.allRolesMode && clean.length) {
      this.allRolesMode = false;
      this.form.controls.userRoles.setValue(clean, { emitEvent: false });
      return;
    }
    this.allRolesMode = false;
    this.form.controls.userRoles.setValue(clean, { emitEvent: false });
  }

  selectAllSpaces(): void {
    this.allSpacesMode = true;
    setTimeout(() => this.form.controls.spaceIds.setValue([this.allOption], { emitEvent: false }));
  }

  selectAllRoles(): void {
    this.allRolesMode = true;
    setTimeout(() => this.form.controls.userRoles.setValue([this.allOption], { emitEvent: false }));
  }

  selectedSpacesLabel(): string {
    const values = this.form.value.spaceIds || [];
    const ids = this.cleanValues(values);
    if (this.isAllSpacesValue(values)) return 'Seleziona tutto';
    return ids.map((id) => this.spaces.find((space) => space._id === id)?.name).filter(Boolean).join(', ');
  }

  selectedRolesLabel(): string {
    const values = this.form.value.userRoles || [];
    const roles = this.cleanValues(values);
    if (this.isAllRolesValue(values)) return 'Seleziona tutto';
    const labels: Record<string, string> = { cliente: 'Clienti', gestore: 'Gestori' };
    return roles.map((role) => labels[role] || role).join(', ');
  }

  private formSpaceIds(discount: DiscountCode): string[] {
    const ids = this.spaceIds(discount);
    return ids.length ? ids : [this.allOption];
  }

  private formRoles(discount: DiscountCode): string[] {
    return discount.userRoles?.length ? discount.userRoles : [this.allOption];
  }

  private allSpaceIds(): string[] {
    return this.spaces.map((space) => space._id);
  }

  private selectedSpaceIds(): string[] {
    return this.cleanValues(this.form.value.spaceIds || []);
  }

  private selectedRoleValues(): string[] {
    return this.cleanValues(this.form.value.userRoles || []);
  }

  private cleanValues(values: string[]): string[] {
    return values.filter((value) => value !== this.allOption);
  }

  private areAllSpacesSelected(values = this.selectedSpaceIds()): boolean {
    return this.spaces.length > 0 && values.length === this.spaces.length;
  }

  private areAllRolesSelected(values = this.selectedRoleValues()): boolean {
    return this.roleOptions.every((role) => values.includes(role));
  }

  private isAllSpacesValue(values: string[]): boolean {
    return values.includes(this.allOption) || !this.cleanValues(values).length || this.areAllSpacesSelected(this.cleanValues(values));
  }

  private isAllRolesValue(values: string[]): boolean {
    return values.includes(this.allOption) || !this.cleanValues(values).length || this.areAllRolesSelected(this.cleanValues(values));
  }

  private inputDate(value?: string | Date): Date | null {
    return value ? new Date(value) : null;
  }

  private formatApiDate(value?: Date | string | null): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
