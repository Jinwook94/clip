#!/usr/bin/env bash
# todo 프로젝트 소개 추가
# 1) 현재 스크립트가 위치한 디렉토리(보통 client/script)에서
#    상위 디렉토리(client)로 이동.
# 2) node_modules, dist, .idea, package-lock.json, fonts, script 등의
#    디렉토리/파일을 제외하고 특정 확장자(.js, .ts, .css, .html, .json, .sh 등)를
#    하나의 파일(script/combined.txt)로 병합.
# 3) 최종적으로 "script/combined.txt"에 모든 소스가 합쳐지고,
#    프로젝트 구조와 기술 스택 정보를 상단에 기록한다.
#

set -e

##############################################
# 0) 스크립트 위치 기준으로 상위 디렉토리(client)로 이동
##############################################
cd "$(dirname "$0")/.."

##############################################
# 1) 결과를 저장할 파일 (client 기준)
##############################################
OUTPUT_FILE="script/combined.txt"
CURRENT_DIR="$(basename "$(pwd)")"

# 기존 파일 삭제 & 디렉토리 생성
rm -f "$OUTPUT_FILE"
mkdir -p "$(dirname "$OUTPUT_FILE")"

##############################################
# 2) 프로젝트 구조(tree) 출력
##############################################
echo "# Clip Project Structure (Electron, React, Vite):" >> "$OUTPUT_FILE"
tree . --charset=ASCII \
  -I "node_modules|dist|.idea|package-lock.json|fonts|script|LICENSE|README.md|.github|.vscode|test|*.gif|release" \
  >> "$OUTPUT_FILE"
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
# 4) 전체 소스코드 병합
#    (LICENSE, README.md, *.gif, .github, .vscode, test 폴더 제외)
##############################################
echo "# Full Project Source Code:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# find 로 필요한 확장자만 검색
find . \
  \( -name "*.js" \
     -o -name "*.jsx" \
     -o -name "*.ts" \
     -o -name "*.tsx" \
     -o -name "*.yml" \
     -o -name "*.css" \
     -o -name "*.html" \
     -o -name "*.json" \
     -o -name "*.sh" \) \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.idea/*" \
  ! -path "*/fonts/*" \
  ! -path "*/src/data/*" \
  ! -path "*/script/*" \
  ! -path "*/.github/*" \
  ! -path "*/.vscode/*" \
  ! -path "*/test/*" \
  ! -name "package-lock.json" \
  ! -name "LICENSE" \
  ! -name "README.md" \
  ! -iname "*.gif" \
  ! -path "*/release/*" \
  | sort \
  | while read -r file
do
  # file 에서 "./" 제거 후 "client/" 형태로 상대 경로 표현
  relative_path="$CURRENT_DIR/${file#./}"

  echo "# $relative_path:" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

##############################################
# 5) 마무리 안내
##############################################
echo "모든 파일이 $CURRENT_DIR/$OUTPUT_FILE 에 성공적으로 병합되었습니다."
