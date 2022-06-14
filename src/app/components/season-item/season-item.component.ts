import { Component, Input, OnInit } from '@angular/core';
import { SeasonProgress } from '../../../types/interfaces/Trakt';

@Component({
  selector: 'app-season-item',
  templateUrl: './season-item.component.html',
  styleUrls: ['./season-item.component.scss'],
})
export class SeasonItemComponent implements OnInit {
  @Input() season?: SeasonProgress;

  ngOnInit(): void {}
}
