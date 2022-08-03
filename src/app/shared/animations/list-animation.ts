import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

export const listAnimation = trigger('listAnimation', [
  transition(':enter, :leave, * => 0, * => -1', []),
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, height: 0 }),
        stagger(30, animate('400ms ease-out', style({ opacity: 1, height: '*' }))),
      ],
      { optional: true }
    ),
    query(':leave', animate('200ms', style({ opacity: 0, height: 0 })), { optional: true }),
  ]),
]);
