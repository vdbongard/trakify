export function translatedOrUndefined<
  T extends { title?: string | null; overview?: string | null }
>(
  translationObject?: T,
  translation?: { title?: string | null; overview?: string | null }
): T | undefined {
  if (!translationObject || Object.keys(translationObject).length < 0) return undefined;
  return translated(translationObject, translation);
}

export function translated<
  T extends { title?: string | null; name?: string | null; overview?: string | null }
>(translationObject: T, translation?: { title?: string | null; overview?: string | null }): T {
  const translationObjectClone = { ...translationObject };

  if (!translation) return translationObjectClone;

  if (translationObject.title)
    translationObjectClone.title = translation.title ?? translationObject.title;

  if (translationObject.name)
    translationObjectClone.name = translation.title ?? translationObject.name;

  if (translationObject.overview)
    translationObjectClone.overview = translation.overview ?? translationObject.overview;

  return translationObjectClone;
}
