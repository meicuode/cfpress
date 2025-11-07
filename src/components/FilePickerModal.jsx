import { useState, useEffect } from 'react'

function FilePickerModal({ isOpen, onClose, onSelect, fileType = 'all' }) {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentPath, setCurrentPath] = useState('/')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadFiles()
    }
  }, [isOpen, currentPath])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/files?path=${encodeURIComponent(currentPath)}&limit=100`)
      const data = await response.json()

      if (response.ok) {
        setFolders(data.folders || [])

        // 根据文件类型过滤
        let filteredFiles = data.files || []
        if (fileType === 'image') {
          filteredFiles = filteredFiles.filter(f => f.isImage)
        } else if (fileType === 'video') {
          filteredFiles = filteredFiles.filter(f => f.isVideo)
        }

        setFiles(filteredFiles)
      }
    } catch (error) {
      console.error('加载文件失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath)
    setSelectedFile(null)
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length > 0 ? '/' + parts.join('/') : '/')
    setSelectedFile(null)
  }

  const handleFileClick = (file) => {
    setSelectedFile(file)
  }

  const handleConfirmSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[80vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#23282d]">选择文件</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateUp}
              disabled={currentPath === '/'}
              className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 返回上级
            </button>
            <span className="text-sm text-[#646970]">当前路径: {currentPath}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 border border-gray-300 text-sm rounded ${
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 border border-gray-300 text-sm rounded ${
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              列表
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-[#646970]">加载中...</div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Folders */}
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.path)}
                      className="border border-gray-200 rounded p-4 hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <div className="text-4xl text-center mb-2">📁</div>
                      <div className="text-sm text-center text-[#23282d] truncate">
                        {folder.name}
                      </div>
                    </div>
                  ))}

                  {/* Files */}
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`border rounded p-2 cursor-pointer transition-colors ${
                        selectedFile?.id === file.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {file.isImage ? (
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.filename}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded mb-2">
                          <span className="text-4xl">📄</span>
                        </div>
                      )}
                      <div className="text-xs text-center text-[#23282d] truncate">
                        {file.filename}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Folders */}
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.path)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <span className="text-2xl">📁</span>
                      <span className="text-sm text-[#23282d]">{folder.name}</span>
                    </div>
                  ))}

                  {/* Files */}
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer ${
                        selectedFile?.id === file.id
                          ? 'bg-blue-50 border border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {file.isImage ? (
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.filename}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                          <span className="text-xl">📄</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm text-[#23282d]">{file.filename}</div>
                        <div className="text-xs text-[#646970]">
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {folders.length === 0 && files.length === 0 && (
                <div className="text-center py-8 text-[#646970]">
                  此文件夹为空
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-[#646970]">
            {selectedFile ? (
              <span>已选择: {selectedFile.filename}</span>
            ) : (
              <span>请选择一个文件</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirmSelect}
              disabled={!selectedFile}
              className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilePickerModal
