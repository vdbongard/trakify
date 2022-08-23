export function translatedOrUndefined<T extends { title: string; overview?: string | null }>(
  translationObject?: T,
  translation?: { language: string; overview: string; title: string }
): T | undefined {
  if (!translationObject || Object.keys(translationObject).length < 0) return undefined;
  return translated(translationObject, translation);
}

export function translated<T extends { title: string; overview?: string | null }>(
  translationObject: T,
  translation?: { language: string; overview: string; title: string }
): T {
  const translationObjectClone = { ...translationObject };

  if (!translation) return translationObjectClone;

  translationObjectClone.title = translation.title ?? translationObject.title;

  if (translationObject.overview && translation.overview)
    translationObjectClone.overview = translation.overview;

  return translationObjectClone;
}
