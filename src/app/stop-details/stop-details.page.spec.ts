import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StopDetailsPage } from './stop-details.page';

describe('StopDetailsPage', () => {
  let component: StopDetailsPage;
  let fixture: ComponentFixture<StopDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StopDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
