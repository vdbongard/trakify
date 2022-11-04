import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/interfaces/Tmdb';
import { ImagePrefixW185 } from '@constants';

@Component({
  selector: 't-show-cast',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <h2 class="mat-subheading-2">Cast</h2>
    <div class="cast-wrapper">
      <div *ngFor="let castSingle of cast" class="cast">
        <img
          *ngIf="castSingle.profile_path; else imgFallback"
          [rawSrc]="posterPrefix + castSingle.profile_path"
          width="185"
          height="278"
          [alt]="castSingle.name"
          class="cast-profile"
        />
        <ng-template #imgFallback>
          <img rawSrc="assets/poster.png" width="185" height="278" [alt]="castSingle.name" />
        </ng-template>
        <p class="mat-body cast-text">
          {{ castSingle.name }}<br />
          <span class="character">{{ castSingle.roles[0].character }}</span>
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
          width: rem(100px);

          @media (min-width: $breakpoint-sm) {
            width: rem(185px);
          }
        }

        .cast-text {
          @include ellipsis;
        }

        .cast-profile {
          aspect-ratio: 2 / 3;
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
