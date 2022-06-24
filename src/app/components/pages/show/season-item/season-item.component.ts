import { Component, Input, OnInit } from '@angular/core';
import { SeasonProgress } from '../../../../../types/interfaces/Trakt';
import { Season } from '../../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-season-item',
  templateUrl: './season-item.component.html',
  styleUrls: ['./season-item.component.scss'],
})
export class SeasonItemComponent implements OnInit {
  @Input() seasonProgress?: SeasonProgress;
  @Input() season?: Season;

  ngOnInit(): void {}
}
