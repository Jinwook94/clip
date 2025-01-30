/**
 * Clip: 도메인 모델
 */
export interface Clip {
  id: string;
  name: string;
  projectRoot: string;
  selectedPaths: string[];
  actionType: "copy" | "txtExtract";
  actionCode?: string;
  shortcut?: string;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
