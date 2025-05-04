import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-favorite-perfumes',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './favorite-perfumes.component.html',
  styleUrls: ['./favorite-perfumes.component.css']
})
export class FavoritePerfumesComponent {
  favoritePerfumes = [
    { name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", image: "assets/images/baccarat.jpg" },
    { name: "Oud Wood", brand: "Tom Ford", image: "assets/images/oudwood.jpg" },
    { name: "Layton", brand: "Parfums de Marly", image: "assets/images/layton.jpg" }
  ];

  removeFavorite(index: number) {
    this.favoritePerfumes.splice(index, 1);
  }
}
