import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { FavoritePerfumesComponent } from "../../components/favorite-perfumes/favorite-perfumes.component";

@Component({
  selector: 'app-fragrance-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    FavoritePerfumesComponent
],
  templateUrl: './fragrance-detail.component.html',
  styleUrls: ['./fragrance-detail.component.css']
})
export class FragranceDetailComponent {
  fragranceName = "Sample Fragrance";
  perfumer = "John Doe";
  notes = "Citrus, Vanilla, Musk";
  votes = 4.5;
  newComment = '';
  comments: string[] = [];

  addComment() {
    if (this.newComment.trim()) {
      this.comments.push(this.newComment);
      this.newComment = '';
    }
  }
}
