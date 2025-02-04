import { db, initDB } from "./db";
import { BlockSqliteRepository } from "./repository/BlockSqliteRepository";
import { BlockTypeSqliteRepository } from "./repository/BlockTypeSqliteRepository";

export interface AppRepositories {
  blockRepository: BlockSqliteRepository;
  blockTypeRepository: BlockTypeSqliteRepository;
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
  const blockTypeRepository = new BlockTypeSqliteRepository(db);
  repositories = {
    blockRepository,
    blockTypeRepository,
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
