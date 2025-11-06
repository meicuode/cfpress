import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function AdminFilesPage() {
  const toast = useToast()
  const confirm = useConfirm()

  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('/')
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [filterType, setFilterType] = useState('all') // all, image, video, document
  const [previewFile, setPreviewFile] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [currentPath, filterType])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/files?path=${encodeURIComponent(currentPath)}&type=${filterType}`)
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files || [])
        setFolders(data.folders || [])
      } else {
        toast.error(data.error || '加载文件失败')
      }
    } catch (error) {
      console.error('加载文件失败:', error)
      toast.error('加载文件失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    const formData = new FormData()

    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i])
    }
    formData.append('path', currentPath)
    formData.append('uploadUser', 'admin')

    try {
      const response = await fetch('/api/admin/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || `上传成功 ${data.uploaded.length} 个文件`)
        loadFiles()
        event.target.value = '' // 清空 input
      } else {
        toast.error(data.error || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (file) => {
    const confirmed = await confirm({
      title: '删除文件',
      message: `确定要删除 "${file.filename}" 吗？此操作不可恢复。`,
      confirmText: '删除',
      type: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('文件已删除')
        loadFiles()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const handleCreateFolder = async () => {
    const folderName = prompt('请输入文件夹名称:')
    if (!folderName || !folderName.trim()) return

    try {
      const response = await fetch('/api/admin/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName.trim(),
          parentPath: currentPath
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('文件夹已创建')
        loadFiles()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建失败:', error)
      toast.error('创建失败')
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
  }

  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath)
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length === 0 ? '/' : '/' + parts.join('/'))
  }

  const openPreview = (file) => {
    if (file.isImage || file.isVideo) {
      setPreviewFile(file)
    } else {
      window.open(file.url, '_blank')
    }
  }

  const closePreview = () => {
    setPreviewFile(null)
  }

  return (
    <>
      <Helmet>
        <title>文件管理</title>
      </Helmet>

      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-normal text-[#23282d]">文件管理</h1>
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-white border border-gray-300 text-[#23282d] rounded text-sm hover:bg-gray-50"
              >
                📁 新建文件夹
              </button>
              <label className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] cursor-pointer flex items-center">
                {uploading ? '上传中...' : '📤 上传文件'}
                <input
                  type="file"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Path breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#646970] mb-4">
            <button
              onClick={() => setCurrentPath('/')}
              className="hover:text-[#0073aa] hover:underline"
            >
              🏠 根目录
            </button>
            {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, index, arr) => (
              <span key={index} className="flex items-center gap-2">
                <span>/</span>
                <button
                  onClick={() => {
                    const path = '/' + arr.slice(0, index + 1).join('/')
                    setCurrentPath(path)
                  }}
                  className="hover:text-[#0073aa] hover:underline"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {['all', 'image', 'video', 'document'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === type
                      ? 'bg-[#0073aa] text-white'
                      : 'bg-gray-100 text-[#23282d] hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? '全部' : type === 'image' ? '图片' : type === 'video' ? '视频' : '文档'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#0073aa] text-white' : 'bg-gray-100 text-[#646970]'}`}
                title="网格视图"
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#0073aa] text-white' : 'bg-gray-100 text-[#646970]'}`}
                title="列表视图"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-[#646970]">加载中...</div>
          ) : (
            <>
              {currentPath !== '/' && (
                <button
                  onClick={navigateUp}
                  className="mb-4 text-[#0073aa] hover:underline text-sm"
                >
                  ⬆️ 返回上级
                </button>
              )}

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Folders */}
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.path)}
                      className="cursor-pointer p-4 border border-gray-200 rounded hover:bg-gray-50 hover:border-[#0073aa] transition-all"
                    >
                      <div className="text-4xl text-center mb-2">📁</div>
                      <div className="text-sm text-center text-[#23282d] truncate">{folder.name}</div>
                    </div>
                  ))}

                  {/* Files */}
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="relative group border border-gray-200 rounded hover:border-[#0073aa] transition-all overflow-hidden"
                    >
                      <div
                        onClick={() => openPreview(file)}
                        className="cursor-pointer p-2"
                      >
                        {file.isImage ? (
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : file.isVideo ? (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
                            <span className="text-4xl">🎬</span>
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center rounded">
                            <span className="text-4xl">📄</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-[#23282d] truncate" title={file.filename}>
                          {file.filename}
                        </div>
                        <div className="text-xs text-[#646970]">{formatSize(file.size)}</div>
                      </div>

                      <button
                        onClick={() => handleDelete(file)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">名称</th>
                      <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">大小</th>
                      <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">类型</th>
                      <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">上传时间</th>
                      <th className="text-left px-4 py-3 font-medium text-sm text-[#646970]">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folders.map(folder => (
                      <tr key={`folder-${folder.id}`} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigateToFolder(folder.path)}
                            className="flex items-center gap-2 text-[#0073aa] hover:underline"
                          >
                            📁 {folder.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#646970]">-</td>
                        <td className="px-4 py-3 text-sm text-[#646970]">文件夹</td>
                        <td className="px-4 py-3 text-sm text-[#646970]">{formatDate(folder.created_at)}</td>
                        <td className="px-4 py-3 text-sm text-[#646970]">-</td>
                      </tr>
                    ))}
                    {files.map(file => (
                      <tr key={file.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openPreview(file)}
                            className="flex items-center gap-2 text-[#0073aa] hover:underline"
                          >
                            {file.isImage ? '🖼️' : file.isVideo ? '🎬' : '📄'} {file.filename}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#646970]">{formatSize(file.size)}</td>
                        <td className="px-4 py-3 text-sm text-[#646970]">{file.mimeType}</td>
                        <td className="px-4 py-3 text-sm text-[#646970]">{formatDate(file.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(file)}
                            className="text-sm text-red-600 hover:text-red-800 hover:underline"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12 text-[#646970]">
                  此文件夹为空
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closePreview}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-200 z-10"
            >
              ✕ 关闭
            </button>
            {previewFile.isImage ? (
              <img
                src={previewFile.url}
                alt={previewFile.filename}
                className="max-w-full max-h-[90vh] object-contain rounded"
              />
            ) : previewFile.isVideo ? (
              <video
                src={previewFile.url}
                controls
                className="max-w-full max-h-[90vh] rounded"
              >
                您的浏览器不支持视频播放
              </video>
            ) : null}
            <div className="mt-4 text-white text-center">
              <p>{previewFile.filename}</p>
              <p className="text-sm text-gray-300">{formatSize(previewFile.size)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminFilesPage
