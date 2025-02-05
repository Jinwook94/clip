export interface ClipBlockProps {
  name?: string;
  shortcut?: string;
}

export interface ActionBlockProps {
  code?: string;
  requiredBlockTypes?: string[];
}

/** file 블록: 하나 이상의 경로 값을 저장 (예: 파일 선택)
 *  - 추가: 선택한 파일들이 속한 루트 경로를 저장하는 rootPath 필드를 추가
 */
export interface FileBlockProps {
  rootPath?: string; // 선택한 루트 디렉토리 경로
  paths: string[]; // 선택한 파일 경로 배열 (rootPath 하위 파일들)
  name?: string; // 블록 이름 (옵션)
}

export interface SnippetBlockProps {
  text?: string;
}
