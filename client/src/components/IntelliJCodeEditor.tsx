import React, { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { Extension, EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightActiveLine,
  highlightSpecialChars,
} from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history } from "@codemirror/commands";
import { tags } from "@lezer/highlight";

/** 1) IntelliJ Dark Theme-like highlight style */
const intelliJDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#cf8e6d" },
  { tag: [tags.string], color: "#6aab73" },
  { tag: [tags.number, tags.bool, tags.null], color: "#2aacb8" },
  { tag: tags.comment, color: "#7a7e85", fontStyle: "italic" },
  {
    tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
    color: "#56a8f5",
  },
  {
    tag: [tags.constant(tags.name), tags.standard(tags.name)],
    color: "#c77dbb",
  },
  { tag: [tags.className, tags.typeName], color: "#bcbec4" },
  { tag: [tags.propertyName], color: "#c77dbb" },
  { tag: [tags.operator, tags.punctuation], color: "#bcbec4" },
  { tag: [tags.name], color: "#bcbec4" },
  { tag: [tags.invalid], color: "#f75464" },
]);

/** 2) IntelliJ Dark theme (background, gutter, selection, etc.) */
const intelliJDarkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1E1F22",
      color: "#BCBEC4",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "14px",
    },
    ".cm-content": {
      backgroundColor: "#1E1F22",
      caretColor: "#FFFFFF",
    },
    ".cm-line": {
      backgroundColor: "transparent",
    },
    ".cm-gutters": {
      backgroundColor: "#1E1F22",
      color: "#606366",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "#26282e",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#23252A",
      color: "#C8C8C8",
    },
    ".cm-cursor": {
      borderLeft: "1.5px solid #FFFFFF",
    },
  },
  { dark: true },
);

/** 3) 에디터 기본 확장 세트 (히스토리, 단축키, 라인 강조 등) */
const basicSetup: Extension = [
  highlightSpecialChars(),
  history(),
  EditorState.allowMultipleSelections.of(true),
  keymap.of(defaultKeymap),
  highlightActiveLine(),
];

/** 최종 컴포넌트 */
interface IntelliJCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  height?: string;
}

export default function IntelliJCodeEditor({
  value,
  onChange,
  height = "70vh",
}: IntelliJCodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange],
  );

  const extensions = [
    basicSetup,
    javascript({ jsx: true, typescript: false }),
    syntaxHighlighting(intelliJDarkHighlightStyle),
    intelliJDarkTheme,
    EditorView.lineWrapping,
  ];

  return (
    <div style={{ height }}>
      {/**
       * ★ 최후에 또 한 번 override:
       *   만약 .ͼ4, .ͼ16 등에서 !important 로 선택영역을 투명/흰색 처리한다면,
       *   아래 규칙을 통해 더 높은 우선순위로 #224383을 강제.
       */}
      <style>
        {` 
        .cm-editor .cm-line::selection,
        .cm-editor .cm-line ::selection,
        .cm-editor .cm-selectionBackground,
        .cm-editor .cm-rangeSelection,
        .cm-editor.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground {
          background-color: #224383 !important;
        }
        `}
      </style>

      <CodeMirror
        value={value}
        height={height}
        extensions={extensions}
        onChange={handleChange}
      />
    </div>
  );
}
