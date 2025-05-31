import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DependencyvulnerabilitiesComponent } from './dependencyvulnerabilities.component';

describe('DependencyvulnerabilitiesComponent', () => {
  let component: DependencyvulnerabilitiesComponent;
  let fixture: ComponentFixture<DependencyvulnerabilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DependencyvulnerabilitiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DependencyvulnerabilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
