import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/interfaces/Tmdb';
import { ImagePrefixW185 } from '@constants';

@Component({
  selector: 't-show-cast',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <h2 class="mat-h2">Cast</h2>
    <div class="cast-wrapper">
      <div *ngFor="let castSingle of cast" class="cast">
        <img
          [rawSrc]="posterPrefix + castSingle.profile_path"
          width="185"
          height="278"
          [alt]="castSingle.name"
          class="cast-profile"
        />
        <p class="cast-text">
          {{ castSingle.name }}
          <span class="character">({{ castSingle.roles[0].character }})</span>
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      @import 'src/app/styles';

      .cast-wrapper {
        display: flex;
        gap: 1rem;
        overflow: auto;

        .cast {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          width: 185px;
        }

        .cast-text {
          @include ellipsis;
        }

        .cast-profile {
          border-radius: var(--border-radius);
        }

        .character {
          color: var(--text-color-2);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowCastComponent {
  @Input() cast?: Cast[] | null;

  posterPrefix = ImagePrefixW185;
}
