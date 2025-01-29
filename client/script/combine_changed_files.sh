#!/usr/bin/env bash
#
# 1) Git 루트(프로젝트 최상위)로 이동한다.
# 2) "커밋되지 않은(Tracked) 변경" 파일 목록을 얻는다(스테이징 + 비스테이징).
# 3) 그 중 client 폴더 내부(`client/`)에 있는 파일만 추려낸다.
# 4) 특정 확장자(.js, .ts, .json, .sh, .html, .css, .yml 등)에 해당한다면
#    모두 합쳐서 client/script/combined_changed.txt 에 저장한다.
# 5) 병합 전, client 디렉토리 구조와 간단한 프로젝트 정보를 파일 상단에 기록한다.
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
OUTPUT_FILE="client/script/combined_changed.txt"

# 디렉토리 생성 & 기존 파일 삭제
mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"

##############################################
# 2) client 디렉토리 구조 출력
##############################################
echo "# Clip Project Structure (Electron, React, Vite):" >> "$OUTPUT_FILE"
# 여기서도 script 폴더 제외
tree client --charset=ASCII -I "node_modules|dist|.idea|package-lock.json|fonts|script" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

##############################################
# 3) 프로젝트 기술 스택 출력
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

##############################################
# 4) "커밋되지 않은 (Tracked) 변경 파일" 수집
##############################################
echo "# Changed (Uncommitted) Source Code in client:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Git pager 비활성화
export GIT_PAGER=cat

# 4-1) 스테이징된 변경 (Tracked) - client 범위
STAGED=$(git diff --cached --name-only HEAD -- client)

# 4-2) 스테이징 안 된 변경 (Tracked) - client 범위
UNSTAGED=$(git diff --name-only HEAD -- client)

# 4-3) 합쳐서 중복 제거
CHANGED_UNCOMMITTED_FILES=$( (echo "$STAGED"; echo "$UNSTAGED") | sort -u )

##############################################
# 5) 파일 내용 병합
##############################################
for file in $CHANGED_UNCOMMITTED_FILES
do
  # 5-1) 혹시 삭제되었거나 디렉토리이면 건너뛰기
  [ -f "$file" ] || continue

  # 5-2) client/ 내부인지 확인 (중복 안전장치)
  [[ $file == client/* ]] || continue

  # 5-2-1) script 폴더라면 건너뛰기
  [[ $file == client/script/* ]] && continue

  # 5-3) 확장자 필터 (js, jsx, ts, tsx, css, html, yml, yaml, json, sh 등)
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.css|*.html|*.yml|*.yaml|*.json|*.sh)
      echo "### $file:" >> "$OUTPUT_FILE"
      cat "$file" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      ;;
    *)
      # 그 외 확장자는 무시
      ;;
  esac
done

##############################################
# 6) 안내 메시지
##############################################
echo "모든 변경된(Tracked) 파일 중 client/ 내부(단, script 폴더 제외) 파일만 '$OUTPUT_FILE' 에 성공적으로 병합되었습니다."
