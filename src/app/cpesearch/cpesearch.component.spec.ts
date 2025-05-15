import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpesearchComponent } from './cpesearch.component';

describe('CpesearchComponent', () => {
  let component: CpesearchComponent;
  let fixture: ComponentFixture<CpesearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpesearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CpesearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
