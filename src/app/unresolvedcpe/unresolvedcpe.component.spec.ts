import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnresolvedcpeComponent } from './unresolvedcpe.component';

describe('UnresolvedcpeComponent', () => {
  let component: UnresolvedcpeComponent;
  let fixture: ComponentFixture<UnresolvedcpeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnresolvedcpeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnresolvedcpeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
