// client/electron/main/di.ts
import { db, initDB } from "./db";
import { BlockSqliteRepository } from "./repository/BlockSqliteRepository";

export interface AppRepositories {
  blockRepository: BlockSqliteRepository;
}

let repositories: AppRepositories | null = null;

/**
 * initAppRepositories()
 *  - DB 초기화 후 repository 인스턴스를 생성
 */
export function initAppRepositories(): AppRepositories {
  if (repositories) return repositories;

  initDB();

  const blockRepository = new BlockSqliteRepository(db);
  repositories = {
    blockRepository,
  };

  return repositories;
}

export function getRepositories(): AppRepositories {
  if (!repositories) {
    throw new Error(
      "Repositories not initialized. Call initAppRepositories() first.",
    );
  }
  return repositories;
}
