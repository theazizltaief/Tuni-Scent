import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritePerfumesComponent } from './favorite-perfumes.component';

describe('FavoritePerfumesComponent', () => {
  let component: FavoritePerfumesComponent;
  let fixture: ComponentFixture<FavoritePerfumesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritePerfumesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritePerfumesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
