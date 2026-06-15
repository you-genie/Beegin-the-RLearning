import type { EngineConfig, EngineResult } from './types'
import banditSrc from '../engine/bandit.py?raw'
import agentSrc from '../engine/agent.py?raw'
import runnerSrc from '../engine/runner.py?raw'

const PYODIDE_VERSION = 'v0.27.2'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

let pyodidePromise: Promise<any> | null = null

async function getPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = (async () => {
    const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)
    const pyodide = await mod.loadPyodide({ indexURL: INDEX_URL })
    pyodide.FS.mkdirTree('engine')
    pyodide.FS.writeFile('engine/__init__.py', '')
    pyodide.FS.writeFile('engine/bandit.py', banditSrc)
    pyodide.FS.writeFile('engine/agent.py', agentSrc)
    pyodide.FS.writeFile('engine/runner.py', runnerSrc)
    pyodide.runPython("import sys\nif '' not in sys.path:\n    sys.path.insert(0, '')")
    return pyodide
  })()
  return pyodidePromise
}

/** Pyodide를 미리 로드한다 (로딩 UI용). */
export function preloadRuntime(): Promise<unknown> {
  return getPyodide()
}

/** 플레이어 reward 코드 + 레벨 config로 학습을 실행하고 결과를 반환. */
export async function runTraining(
  playerSource: string,
  config: EngineConfig,
): Promise<EngineResult> {
  const pyodide = await getPyodide()
  const runFn = pyodide.runPython(
    'from engine.runner import run_training\nrun_training',
  )
  const cfg = pyodide.toPy(config)
  try {
    const proxy = runFn(playerSource, cfg)
    const result = proxy.toJs({ dict_converter: Object.fromEntries }) as EngineResult
    proxy.destroy()
    return result
  } finally {
    cfg.destroy()
    runFn.destroy()
  }
}
