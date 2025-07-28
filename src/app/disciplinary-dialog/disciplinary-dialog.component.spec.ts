import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisciplinaryDialogComponent } from './disciplinary-dialog.component';

describe('DisciplinaryDialogComponent', () => {
  let component: DisciplinaryDialogComponent;
  let fixture: ComponentFixture<DisciplinaryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisciplinaryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisciplinaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
