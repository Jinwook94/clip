import { clipboard } from "electron";
import path from "node:path";
import { gatherProjectFilesForClipboard } from "./combineAllFiles.js";

export type ClipActionType = "copy" | "txtExtract";

/**
 * @param actionType "copy" or "txtExtract"
 * @param filePaths 사용자가 선택한 파일 경로들 (하지만 이번엔 스크립트처럼 root 하위 전체?)
 * @param script (옵션)
 */
export function runClipAction(
  actionType: ClipActionType,
  filePaths: string[],
  script?: string,
) {
  if (actionType === "copy") {
    // (A) 만약 "선택된 파일만" 합치려면 filePaths를 사용
    // (B) "프로젝트 전체"를 합치려면 gatherProjectFilesForClipboard(??)
    // 여기서는 "프로젝트 루트"를 알기 위해, filePaths[0]에서 상위 디렉토리를 추론하거나
    // 혹은 clipData에 root를 별도로 넘기도록 해야 함

    // 예시: filePaths[0]가 "C:/myproj/src/index.tsx"라면 상위 2~3단계
    // 실제로는 clipData.projectRoot를 함께 넘겨서 써야 함
    const maybeRoot =
      filePaths.length > 0 ? findCommonRoot(filePaths) : process.cwd(); // fallback

    const text = gatherProjectFilesForClipboard(maybeRoot);
    clipboard.writeText(text);
  } else if (actionType === "txtExtract") {
    // script를 실제 eval하거나, 파일 내용 합치는 로직 가능
    // 여기선 간단히 suffix "(extracted)"만 붙임
    const text = filePaths.map((p) => p + " (extracted)").join("\n");
    clipboard.writeText(text);
  }
}

// optional: 경로들의 공통 루트를 찾는 헬퍼
function findCommonRoot(paths: string[]): string {
  if (paths.length === 0) return process.cwd();
  let parts = paths[0].split(path.sep);
  for (let i = 1; i < paths.length; i++) {
    const otherParts = paths[i].split(path.sep);
    // 공통 prefix만 유지
    let j = 0;
    while (
      j < parts.length &&
      j < otherParts.length &&
      parts[j] === otherParts[j]
    ) {
      j++;
    }
    parts = parts.slice(0, j);
  }
  return parts.join(path.sep) || process.cwd();
}
