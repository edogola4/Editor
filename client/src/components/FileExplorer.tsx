import React, { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { File, Folder, FolderOpen, Search, Plus, MoreHorizontal } from 'lucide-react'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  children?: FileItem[]
  isOpen?: boolean
}

export const FileExplorer = () => {
  const { setCode } = useEditorStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [files] = useState<FileItem[]>([
    {
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        {
          name: 'components',
          type: 'folder',
          isOpen: false,
          children: [
            { name: 'App.tsx', type: 'file' },
            { name: 'CodeEditor.tsx', type: 'file' },
            { name: 'UserPresence.tsx', type: 'file' }
          ]
        },
        {
          name: 'store',
          type: 'folder',
          isOpen: false,
          children: [
            { name: 'editorStore.ts', type: 'file' },
            { name: 'authStore.ts', type: 'file' }
          ]
        },
        {
          name: 'utils',
          type: 'folder',
          isOpen: false,
          children: [
            { name: 'socket.ts', type: 'file' },
            { name: 'api.ts', type: 'file' }
          ]
        },
        { name: 'App.tsx', type: 'file' },
        { name: 'main.tsx', type: 'file' },
        { name: 'index.css', type: 'file' }
      ]
    },
    {
      name: 'public',
      type: 'folder',
      isOpen: false,
      children: [
        { name: 'index.html', type: 'file' },
        { name: 'favicon.ico', type: 'file' }
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' }
  ])

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return <File size={16} className="text-blue-400" />
      case 'json':
        return <File size={16} className="text-yellow-400" />
      case 'md':
        return <File size={16} className="text-gray-400" />
      case 'css':
        return <File size={16} className="text-blue-300" />
      default:
        return <File size={16} className="text-gray-400" />
    }
  }

  const getFolderIcon = (isOpen: boolean) => {
    return isOpen ? <FolderOpen size={16} className="text-blue-400" /> : <Folder size={16} className="text-blue-400" />
  }

  const handleFileClick = (fileName: string) => {
    // Load file content
    setCode(`// Content of ${fileName}\n// This is a sample file content`)
  }

  const FileTree = ({ items, level = 0 }: { items: FileItem[], level?: number }) => {
    return (
      <div>
        {items.map((item, index) => (
          <div key={index}>
            <div
              className={`flex items-center space-x-2 py-1 px-2 hover:bg-gray-700/30 cursor-pointer transition-colors ${
                level === 0 ? 'font-medium' : ''
              }`}
              style={{ paddingLeft: `${8 + level * 16}px` }}
              onClick={() => {
                if (item.type === 'folder') {
                  item.isOpen = !item.isOpen
                } else {
                  handleFileClick(item.name)
                }
              }}
            >
              {item.type === 'folder' ? getFolderIcon(item.isOpen || false) : getFileIcon(item.name)}
              <span className="text-sm text-gray-300 truncate">{item.name}</span>
              {item.type === 'file' && (
                <div className="ml-auto opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={12} className="text-gray-500 hover:text-gray-400" />
                </div>
              )}
            </div>
            {item.type === 'folder' && item.isOpen && item.children && (
              <FileTree items={item.children} level={level + 1} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Explorer</h3>
          <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors">
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700/50 text-white text-xs rounded px-2 py-1.5 pl-8 border border-gray-600/50 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto group">
        <FileTree items={files} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-700/50">
        <div className="text-xs text-gray-500 text-center">
          Collaborative Editor
        </div>
      </div>
    </div>
  )
}
