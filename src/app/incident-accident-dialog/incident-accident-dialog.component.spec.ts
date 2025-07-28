import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentAccidentDialogComponent } from './incident-accident-dialog.component';

describe('IncidentAccidentDialogComponent', () => {
  let component: IncidentAccidentDialogComponent;
  let fixture: ComponentFixture<IncidentAccidentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentAccidentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentAccidentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
