export interface IDbAdapter<T> {
  findAll(): T[]
  findById(id: string): T | undefined
  findWhere(predicate: (item: T) => boolean): T[]
  insert(item: T): T
  update(id: string, patch: Partial<T>): T | null
  remove(id: string): boolean
}