export interface IDbAdapter<T> {
  findAll(): T[]
  findById(id: string): T | undefined
  findWhere(predicate: (item: T) => boolean): T[]
  insert(item: T): T | Promise<T>
  update(id: string, patch: Partial<T>): T | Promise<T | null> | null
  remove(id: string): boolean | Promise<boolean>
}

export type MaybePromise<T> = T | Promise<T>