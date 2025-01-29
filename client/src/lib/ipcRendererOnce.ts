/**
 * @file ipcRendererOnce.ts
 *
 * 이 파일은 렌더러 프로세스에서 "clip-run-done" 이벤트를
 * 중복(두 번 이상)으로 등록하지 않도록 방지하기 위해 추가되었습니다.
 * React StrictMode 환경에서 useEffect 등이 여러 번 실행될 수 있는데,
 * 이 헬퍼를 통해 한 번만 이벤트 리스너를 등록하게 만듭니다.
 */

let isClipRunDoneRegistered = false;

export function ensureClipRunDoneListener() {
  // 이미 등록된 상태면 재등록하지 않고 스킵
  if (isClipRunDoneRegistered) {
    console.log("[renderer] clip-run-done listener already registered. Skip.");
    return;
  }
  isClipRunDoneRegistered = true;

  // "clip-run-done" IPC 이벤트를 받으면 alert 메시지 표시
  const onClipRunDone = (_evt: any, payload: { message: string }) => {
    alert(payload.message);
  };

  console.log("[renderer] Registered clip-run-done once!");
  window.ipcRenderer.on("clip-run-done", onClipRunDone);
}
