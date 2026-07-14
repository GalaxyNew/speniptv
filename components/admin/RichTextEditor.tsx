'use client'

import React, { useRef, useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  readOnly?: boolean
}

export default function RichTextEditor({ value, onChange, placeholder = '在此撰写文章内容...', readOnly = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isVisual, setIsVisual] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Initialize content on mount or view toggle
  useEffect(() => {
    if (isVisual && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [isVisual, value])

  // Synchronize input to parent form
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Execute standard formatting commands
  const execCmd = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  // Handle hyperlink insertion
  const handleAddLink = () => {
    const url = prompt('请输入链接 URL:', 'https://')
    if (url) {
      execCmd('createLink', url)
    }
  }

  // Handle local image file picker click
  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Upload image to /api/admin/upload and insert img tag
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('只能上传图片文件！')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '图片上传失败')
      }

      // Focus editor back to insert image at last selection cursor
      if (editorRef.current) {
        editorRef.current.focus()
      }

      // Insert image tag at selection cursor
      const imgHtml = `<img src="${data.url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; display: block;" />`
      execCmd('insertHTML', imgHtml)
    } catch (err: any) {
      console.error(err)
      alert(err.message || '上传出错，请重试')
    } finally {
      setUploading(false)
      e.target.value = '' // Clear input
    }
  }

  return (
    <div style={{
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: 10,
      background: 'rgba(15, 23, 42, 0.6)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Outfit, Inter, sans-serif'
    }}>
      {/* View Tabs */}
      {!readOnly && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(30, 41, 59, 0.4)'
        }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setIsVisual(true)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: isVisual ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                color: isVisual ? '#22d3ee' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              🎨 可视化编辑
            </button>
            <button
              type="button"
              onClick={() => setIsVisual(false)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: !isVisual ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                color: !isVisual ? '#22d3ee' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              💻 HTML 源码
            </button>
          </div>
          {uploading && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              ⏳ 图片上传中...
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Formatting Toolbar for Visual Editor */}
      {!readOnly && isVisual && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem',
          padding: '0.5rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(30, 41, 59, 0.2)'
        }}>
          {[
            { label: '<b>B</b>', title: '加粗', cmd: 'bold' },
            { label: '<i>I</i>', title: '斜体', cmd: 'italic' },
            { label: '<u>U</u>', title: '下划线', cmd: 'underline' },
            { label: '<strike>S</strike>', title: '删除线', cmd: 'strikeThrough' },
          ].map(btn => (
            <button
              key={btn.cmd}
              type="button"
              title={btn.title}
              onClick={() => execCmd(btn.cmd)}
              dangerouslySetInnerHTML={{ __html: btn.label }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.15)',
                background: 'rgba(15,23,42,0.4)',
                color: '#f1f5f9',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}
            />
          ))}

          <div style={{ width: 1, background: 'rgba(148,163,184,0.2)', margin: '0 0.25rem' }} />

          {[
            { label: 'H2', title: '二级标题', cmd: 'formatBlock', arg: 'h2' },
            { label: 'H3', title: '三级标题', cmd: 'formatBlock', arg: 'h3' },
            { label: 'Quote', title: '引用段落', cmd: 'formatBlock', arg: 'blockquote' },
            { label: '• List', title: '无序列表', cmd: 'insertUnorderedList' },
            { label: '1. List', title: '有序列表', cmd: 'insertOrderedList' },
          ].map((btn, idx) => (
            <button
              key={idx}
              type="button"
              title={btn.title}
              onClick={() => execCmd(btn.cmd, btn.arg)}
              style={{
                padding: '0 0.5rem',
                height: 32,
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.15)',
                background: 'rgba(15,23,42,0.4)',
                color: '#f1f5f9',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {btn.label}
            </button>
          ))}

          <div style={{ width: 1, background: 'rgba(148,163,184,0.2)', margin: '0 0.25rem' }} />

          <button
            type="button"
            title="插入超链接"
            onClick={handleAddLink}
            style={{
              padding: '0 0.5rem',
              height: 32,
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,0.15)',
              background: 'rgba(15,23,42,0.4)',
              color: '#f1f5f9',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🔗 链接
          </button>

          <button
            type="button"
            title="上传并插入图片"
            onClick={handleImageUploadClick}
            style={{
              padding: '0 0.5rem',
              height: 32,
              borderRadius: 6,
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.15)',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            🖼️ 上传图片
          </button>

          <button
            type="button"
            title="清除格式"
            onClick={() => execCmd('removeFormat')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🧹
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div style={{ position: 'relative', flex: 1, minHeight: 300 }}>
        {isVisual ? (
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            onInput={handleInput}
            style={{
              width: '100%',
              minHeight: 320,
              maxHeight: 600,
              padding: '1rem',
              color: '#cbd5e1',
              background: 'transparent',
              outline: 'none',
              overflowY: 'auto',
              boxSizing: 'border-box',
              lineHeight: 1.7,
              fontSize: '0.925rem'
            }}
          />
        ) : (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={readOnly}
            style={{
              width: '100%',
              minHeight: 320,
              maxHeight: 600,
              padding: '1rem',
              color: '#f1f5f9',
              background: 'rgba(15, 23, 42, 0.4)',
              border: 'none',
              outline: 'none',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              resize: 'vertical',
              boxSizing: 'border-box',
              display: 'block'
            }}
          />
        )}

        {isVisual && !value && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            color: '#64748b',
            pointerEvents: 'none',
            fontSize: '0.925rem'
          }}>
            {placeholder}
          </div>
        )}
      </div>

      {/* Embedded visual styling for WYSIWYG elements */}
      <style jsx global>{`
        [contenteditable] img {
          max-width: 100%;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        [contenteditable] blockquote {
          border-left: 4px solid #22d3ee;
          background: rgba(34, 211, 238, 0.05);
          padding: 0.75rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        [contenteditable] h2 {
          color: #f1f5f9;
          font-size: 1.5rem;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        [contenteditable] h3 {
          color: #f1f5f9;
          font-size: 1.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        [contenteditable] a {
          color: #22d3ee;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
