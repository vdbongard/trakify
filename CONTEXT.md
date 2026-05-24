# Trakify

An Angular application for tracking TV show progress, managing a watchlist, favorites, and history by syncing with Trakt and TMDB APIs.

## Language

**Show**:
A TV show tracked by the application.
_Avoid_: TV series, program

**Season**:
A collection of episodes belonging to a Show, numbered from 1, or 0 for Specials.
_Avoid_: Series

**Episode**:
A single broadcast unit of a Show.
_Avoid_: Broadcast, video

**Watchlist**:
A collection of Shows that a User plans to watch in the future.
_Avoid_: Queued shows, saved list

**History**:
A record of Episodes that a User has watched, along with dates.
_Avoid_: Seen list, watch history

**Favorite**:
A User-curated list of Shows marked as preferred.
_Avoid_: Starred shows, liked shows

**Trakt**:
The primary API and synchronization service for show progress, history, and watchlist.
_Avoid_: Trakt.tv

**TMDB**:
The secondary metadata API used to retrieve show artwork, videos/trailers, and air dates.
_Avoid_: The Movie Database

**Aired Episodes**:
Episodes of a Show that have been broadcasted based on their air date and progress data.
_Avoid_: Released episodes, broadcasted episodes

**Remaining Episodes**:
The count of Aired Episodes that a User has not yet marked as watched in their History.
_Avoid_: Unwatched episodes, left episodes
