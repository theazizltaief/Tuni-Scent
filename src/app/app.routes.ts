import { Routes } from '@angular/router'; // Keep only one import

import { FragranceDetailComponent } from './pages/fragrance-detail/fragrance-detail.component';

export const routes: Routes = [  // Make sure 'routes' is exported
  { path: 'fragrance/:id', component: FragranceDetailComponent },
  { path: '', redirectTo: '/fragrance/1', pathMatch: 'full' } // Default page
];
