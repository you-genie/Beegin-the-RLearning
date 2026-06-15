import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// Vite 환경에서 Monaco 워커 등록
;(self as any).MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
}

export function createEditor(
  container: HTMLElement,
  value: string,
): monaco.editor.IStandaloneCodeEditor {
  return monaco.editor.create(container, {
    value,
    language: 'python',
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 4,
  })
}
