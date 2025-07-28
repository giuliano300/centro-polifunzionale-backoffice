import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailLocationDialogComponent } from './detail-location-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: DetailLocationDialogComponent;
  let fixture: ComponentFixture<DetailLocationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailLocationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailLocationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
