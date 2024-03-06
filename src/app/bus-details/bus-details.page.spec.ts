import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusDetailsPage } from './bus-details.page';

describe('BusDetailsPage', () => {
  let component: BusDetailsPage;
  let fixture: ComponentFixture<BusDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
