import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FragranceDetailComponent } from './fragrance-detail.component';

describe('FragranceDetailComponent', () => {
  let component: FragranceDetailComponent;
  let fixture: ComponentFixture<FragranceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FragranceDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FragranceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
