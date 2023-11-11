import BaseGameModel from "@/server/games/base/BaseGameModel";

export default abstract class BaseGameRepository<T extends BaseGameModel> {
  storage: Map<string, T>;
  constructor() {
    this.storage = new Map();
  }
  findAll(): T[] {
    return [...this.storage.values()];
  }
  findMultiple(ids: string[]): T[] {
    const results: Array<T> = [];
    for (const id of ids) {
      const result = this.storage.get(id);
      if (!result) {
        continue;
      }
      results.push(result);
    }
    return results;
  }
  findOne(id: string): T | undefined {
    return this.storage.get(id);
  }
  save(item: T): boolean {
    return !!this.storage.set(item.getId(), item);
  }
  delete(item: T): boolean {
    return this.storage.delete(item.getId());
  }
}
