/**
 * @file ipcRendererOnce.ts
 *
 * 이전에는 "clip-run-done" 이벤트 발생 시 alert()를 띄웠으나,
 * 이제는 App.tsx 안에서 toast로 스낵바를 표시하므로
 * 이 파일의 등록 로직은 제거되었습니다.
 */

let isClipRunDoneRegistered = false;

export function ensureClipRunDoneListener() {
  // 더 이상 아무것도 하지 않음.
  // clip-run-done 처리는 App.tsx 내부 useEffect에서 toast로 처리
  if (isClipRunDoneRegistered) return;
  isClipRunDoneRegistered = true;
  console.log("[ipcRendererOnce] (no-op) clip-run-done listener is not used.");
}
