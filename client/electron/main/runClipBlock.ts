import { createRequire } from "node:module";
import { getRepositories } from "./di";
import type { ActionBlock } from "./domain/block";

export async function runClipBlock(clipId: string) {
  const requireFunc = createRequire(import.meta.url);
  const { blockRepository } = getRepositories();

  // clip 불러오기
  const clipBlock = await blockRepository.findById(clipId);
  if (!clipBlock || clipBlock.type !== "clip") {
    return { error: true, message: "Clip block not found or invalid" };
  }

  // 자식 action block 찾기
  const allBlocks = await blockRepository.findAll();
  const children = allBlocks.filter((b) => clipBlock.content.includes(b.id));
  const actionBlock = children.find((b) => b.type === "action") as ActionBlock | undefined;
  if (!actionBlock) {
    return { error: true, message: "No action block in this clip" };
  }

  // code 실행
  const code = actionBlock.properties.code;
  if (typeof code !== "string" || !code.trim()) {
    return { error: true, message: "No code in action block" };
  }

  try {
    const userFunc = new Function("clipBlock", "children", "require", code);
    userFunc(clipBlock, children, requireFunc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: true, message: "Error running code: " + msg };
  }

  return { error: false, message: "Clip run done!" };
}
