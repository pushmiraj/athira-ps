import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import api from '../../../lib/api'
import * as WS from '../../../lib/wsEvents'

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚙️' },
  { id: 'c', name: 'C', icon: '🔧' },
  { id: 'go', name: 'Go', icon: '🔷' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'typescript', name: 'TypeScript', icon: '💙' },
]

const DEFAULT_CODE = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!";\n  return 0;\n}',
  c: '#include <stdio.h>\n\nint main() {\n  printf("Hello, World!");\n  return 0;\n}',
  go: 'package main\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, World!")\n}',
  rust: 'fn main() {\n  println!("Hello, World!");\n}',
  typescript: 'console.log("Hello, World!");',
}

export default function CodeCompiler({ send, wsRef, isTutor }) {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const editorRef = useRef(null)

  // Handle language change (both tutor and student can change)
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    const newCode = DEFAULT_CODE[newLang] || ''
    setCode(newCode)
    setOutput('')
    // Broadcast to other participant
    send(WS.CODE_EDITOR_UPDATE, { language: newLang, code: newCode })
  }

  // Handle code change (both tutor and student can edit)
  const handleCodeChange = (newCode) => {
    setCode(newCode)
    // Broadcast to other participant
    send(WS.CODE_EDITOR_UPDATE, { language, code: newCode })
  }

  // Run code (both can run)
  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('⏳ Running code...')
    try {
      const { data } = await api.post('/code/execute', { language, code })
      const result = data.success
        ? data.output || 'Code executed successfully (no output)'
        : `❌ Error:\n${data.error}`
      setOutput(result)
      // Broadcast output to student
      send(WS.CODE_OUTPUT_BROADCAST, { output: result })
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Execution failed'
      const result = `❌ Error:\n${errorMsg}`
      setOutput(result)
      send(WS.CODE_OUTPUT_BROADCAST, { output: result })
    } finally {
      setIsRunning(false)
    }
  }

  // Listen for WebSocket updates (student receives)
  useEffect(() => {
    if (!wsRef?.current) return
    const handler = (e) => {
      try {
        const envelope = JSON.parse(e.data)
        if (envelope.event === WS.CODE_EDITOR_UPDATE) {
          const { language: newLang, code: newCode } = envelope.payload
          setLanguage(newLang)
          setCode(newCode)
        }
        if (envelope.event === WS.CODE_OUTPUT_BROADCAST) {
          setOutput(envelope.payload.output)
        }
      } catch {}
    }
    wsRef.current.addEventListener('message', handler)
    return () => wsRef.current?.removeEventListener('message', handler)
  }, [wsRef])

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200 gap-3">
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minWidth: '150px' }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>
              {lang.icon} {lang.name}
            </option>
          ))}
        </select>

        {/* Run Button */}
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isRunning ? (
            <>⏳ Running...</>
          ) : (
            <>▶️ Run Code</>
          )}
        </button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-0 border-b border-slate-300">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
          onMount={(editor) => { editorRef.current = editor }}
        />
      </div>

      {/* Output Console */}
      <div className="h-40 bg-slate-900 text-green-400 p-3 overflow-auto font-mono text-sm">
        <div className="text-xs text-slate-400 mb-1.5 font-sans">Output Console:</div>
        <pre className="whitespace-pre-wrap">{output || '💡 No output yet. Write your code and click "Run Code" to execute!'}</pre>
      </div>
    </div>
  )
}
