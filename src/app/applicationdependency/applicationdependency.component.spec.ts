import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationdependencyComponent } from './applicationdependency.component';

describe('ApplicationdependencyComponent', () => {
  let component: ApplicationdependencyComponent;
  let fixture: ComponentFixture<ApplicationdependencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationdependencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationdependencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
