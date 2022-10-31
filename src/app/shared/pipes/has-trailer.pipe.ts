import { Pipe, PipeTransform } from '@angular/core';
import { TmdbShow, Video } from '@type/interfaces/Tmdb';

export function getTrailer(tmdbShow: TmdbShow): Video | undefined {
  const videos = [...tmdbShow.videos.results];
  const videosReversed = [...tmdbShow.videos.results].reverse();
  const trailer =
    videosReversed.find((video) => {
      return video.site === 'YouTube' && video.type === 'Trailer';
    }) ||
    videos.find((video) => {
      return video.site === 'YouTube' && video.type === 'Teaser';
    });
  return trailer;
}

@Pipe({
  name: 'getTrailer',
  standalone: true,
})
export class GetTrailerPipe implements PipeTransform {
  transform(tmdbShow: TmdbShow): Video | undefined {
    return getTrailer(tmdbShow);
  }
}
