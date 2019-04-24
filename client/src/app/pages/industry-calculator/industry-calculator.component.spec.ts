import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndustryCalculatorComponent } from './industry-calculator.component';

describe('IndustryCalculatorComponent', () => {
  let component: IndustryCalculatorComponent;
  let fixture: ComponentFixture<IndustryCalculatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IndustryCalculatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndustryCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
