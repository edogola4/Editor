import React, { useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { Settings, Share2, Download, Upload, Users, Moon, Sun, Menu } from 'lucide-react'

export const Toolbar = () => {
  const { theme, setTheme } = useEditorStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Share Button */}
      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 group">
        <Share2 size={16} />
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Share Session
        </div>
      </button>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
      >
        {theme === 'vs-dark' ? <Sun size={16} /> : <Moon size={16} />}
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Toggle Theme
        </div>
      </button>

      {/* Settings Button */}
      <div className="relative">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
        >
          <Settings size={16} />
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-xs text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Settings
          </div>
        </button>

        {/* Settings Panel */}
        {isSettingsOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsSettingsOpen(false)}
            />
            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Editor Settings</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                    <select className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600">
                      <option value="12">12px</option>
                      <option value="14">14px</option>
                      <option value="16" selected>16px</option>
                      <option value="18">18px</option>
                      <option value="20">20px</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tab Size</label>
                    <select className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600">
                      <option value="2">2 spaces</option>
                      <option value="4" selected>4 spaces</option>
                      <option value="8">8 spaces</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Word Wrap</label>
                    <button className="w-8 h-4 bg-gray-600 rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Minimap</label>
                    <button className="w-8 h-4 bg-blue-600 rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Line Numbers</label>
                    <button className="w-8 h-4 bg-blue-600 rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700">
                  <button className="w-full text-xs text-gray-400 hover:text-white transition-colors">
                    Keyboard Shortcuts
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
