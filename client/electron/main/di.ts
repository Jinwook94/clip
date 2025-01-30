// client/electron/main/di.ts
import { db, initDB } from "./db";
import { ClipSqliteRepository } from "./repository/ClipSqliteRepository";
import { LabelSqliteRepository } from "./repository/LabelSqliteRepository";
import { IClipRepository } from "./repository/IClipRepository";
import { ILabelRepository } from "./repository/ILabelRepository";

export interface AppRepositories {
  clipRepository: IClipRepository;
  labelRepository: ILabelRepository;
}

let repositories: AppRepositories | null = null;

export function initAppRepositories(): AppRepositories {
  if (repositories) {
    return repositories;
  }

  // DB 초기화
  initDB();

  // Repository 인스턴스 생성
  const clipRepository = new ClipSqliteRepository(db);
  const labelRepository = new LabelSqliteRepository(db);

  repositories = {
    clipRepository,
    labelRepository,
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
