import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailDialogComponent } from './event-detail-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: EventDetailDialogComponent;
  let fixture: ComponentFixture<EventDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
