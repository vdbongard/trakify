import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'category',
  standalone: true,
})
export class CategoryPipe implements PipeTransform {
  transform<T extends { category: string }>(arrayWithCategory: T[], category: string): T[] {
    return arrayWithCategory.filter((arrayObject) => arrayObject.category === category);
  }
}
