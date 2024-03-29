import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusSelectionPage } from './bus-selection.page';

describe('BusSelectionPage', () => {
  let component: BusSelectionPage;
  let fixture: ComponentFixture<BusSelectionPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(BusSelectionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
