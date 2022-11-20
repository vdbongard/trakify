import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/interfaces/Tmdb';
import { ImagePrefixW185 } from '@constants';
import { TickerComponent } from '@shared/components/ticker/ticker.component';

@Component({
  selector: 't-show-cast',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TickerComponent],
  template: `
    <h2 class="mat-subtitle-1">Cast</h2>
    <div class="cast-wrapper">
      <div *ngFor="let castSingle of cast" class="cast">
        <img
          *ngIf="castSingle.profile_path; else imgFallback"
          [ngSrc]="posterPrefix + castSingle.profile_path"
          width="185"
          height="278"
          [alt]="castSingle.name"
          class="cast-profile"
        />
        <ng-template #imgFallback>
          <img ngSrc="assets/poster.png" width="185" height="278" [alt]="castSingle.name" />
        </ng-template>
        <p class="mat-body cast-name" ticker>{{ castSingle.name }}</p>
        <p class="mat-body cast-character" ticker>{{ castSingle.roles[0].character }}</p>
      </div>
    </div>
  `,
  styles: [
    `
          @import 'src/app/shared/styles';
    
          .cast-wrapper {
            display: flex;
            gap: 1rem;
            overflow: auto;
    
            .cast {
              display: flex;
              flex-direction: column;
              flex-shrink: 0;
              width: rem(96px);
    
              @media (min-width: $breakpoint-sm) {
                width: rem(176px);
              }
            }
    
            .cast-profile {
              aspect-ratio: 2 / 3;
              border-radius: var(--border-radius);
            }
    
            .cast-name,
            .cast-character {
              margin: 0;
            }
    
            .cast-name {
              margin-top: 0.75rem;
            }
    
            .cast-character {
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
