#!/usr/bin/env bash
#
# 1) Git 루트로 이동하여, "커밋되지 않은(Tracked) 변경"을 가져온다.
# 2) 그중 client/ 내부 파일만 필터링한다.
# 3) diff에서 실제 추가(+)된 코드 라인만 추출해, client/script/combined_added_lines.txt 에 모은다.
#    (즉, -로 제거된 라인이나 diff 헤더/메타 정보(+++ 등)는 제외)
#

set -e

##############################################
# 0) Git 루트로 이동
##############################################
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

##############################################
# 1) 결과를 저장할 파일 (루트 기준)
##############################################
OUTPUT_FILE="client/script/combined_added_lines.txt"

# 디렉토리 생성 & 이전 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

##############################################
# 2) (선택) client 트리 구조, 기술스택 등 정보 출력
##############################################
echo "# Clip Project Structure (Electron, React, Vite):" >> "$OUTPUT_FILE"
# 여기서 script 폴더는 표시되지 않도록 -I "script" 추가
tree client --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts|script" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 프로젝트 기술 스택 출력
##############################################
echo "# Project Tech stack:" >> "$OUTPUT_FILE"
echo "- TypeScript ^5.4.2" >> "$OUTPUT_FILE"
echo "- Electron ^33.2.0" >> "$OUTPUT_FILE"
echo "- React ^18.3.1" >> "$OUTPUT_FILE"
echo "- Vite ^5.4.11" >> "$OUTPUT_FILE"
echo "- Zustand" >> "$OUTPUT_FILE"
echo "- Tailwind CSS" >> "$OUTPUT_FILE"
echo "- shadcn/ui (radix-ui), @tabler/icons-react," >> "$OUTPUT_FILE"
echo "- electron-store, better-sqlite3" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "# Added Lines (Uncommitted Changes in client):" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) Git pager 비활성화
##############################################
export GIT_PAGER=cat

##############################################
# 4) 변경된 파일 목록(Tracked) 중 v 안에 있는 것만 추출
##############################################
STAGED=$(git diff --cached --name-only HEAD -- client)
UNSTAGED=$(git diff --name-only HEAD -- client)

CHANGED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 5) 파일별로 "추가된 라인(+)"만 추출해서 병합
##############################################
for file in $CHANGED_FILES
do
  # 5-1) 파일 존재 여부 확인 (삭제된 파일 등 제외)
  [ -f "$file" ] || continue

  # 5-2) client 내부인지 재확인 (안전장치)
  [[ $file == client/* ]] || continue

  # 5-2-1) script 폴더라면 건너뛰기
  [[ $file == client/script/* ]] && continue

  # (스테이징 + 미스테이징) diff를 모두 합쳐서 실제 추가된(+ 라인)만 추출
  DIFF_LINES=$(
    (
      git diff --cached HEAD -- "$file"
      git diff HEAD -- "$file"
    ) \
    | grep -E '^\+[^\+]'  # 맨 앞에 '+'이고, 두 번째 문자가 '+' 아닌 라인만 (+++ 등은 제외)
  )

  # 추가된 라인이 없다면 스킵
  if [ -z "$DIFF_LINES" ]; then
    continue
  fi

  # 구분자 & 추가 라인 출력
  echo "### $file:" >> "$OUTPUT_FILE"
  echo "$DIFF_LINES" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 6) 마무리 안내
##############################################
echo "추가된(+) 코드 라인들이 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
