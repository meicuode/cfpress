import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../../contexts/ToastContext'
import { useConfirm } from '../../contexts/ConfirmContext'

function AdminFilesPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const [searchParams, setSearchParams] = useSearchParams()

  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  // 从 URL 读取路径，如果没有则默认为 '/'
  const [currentPath, setCurrentPath] = useState(searchParams.get('path') || '/')
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [filterType, setFilterType] = useState('all') // all, image, video, document
  const [previewFile, setPreviewFile] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadQueue, setUploadQueue] = useState([]) // 上传队列
  const [dragActive, setDragActive] = useState(false)
  const [storageStats, setStorageStats] = useState(null)
  const [statsExpanded, setStatsExpanded] = useState(false)

  // 监听 URL 参数变化，同步到 currentPath
  useEffect(() => {
    const pathFromUrl = searchParams.get('path') || '/'
    if (pathFromUrl !== currentPath) {
      setCurrentPath(pathFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    loadFiles()
    loadStorageStats()
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

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/admin/storage-stats')
      const data = await response.json()

      if (response.ok) {
        setStorageStats(data.stats)
      }
    } catch (error) {
      console.error('加载存储统计失败:', error)
    }
  }

  // 处理文件添加到上传队列
  const handleFilesAdded = (fileList) => {
    const newFiles = Array.from(fileList).map((file, index) => ({
      id: Date.now() + index,
      file: file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending', // pending, uploading, success, error
      error: null
    }))
    setUploadQueue(prev => [...prev, ...newFiles])
  }

  // 上传单个文件
  const uploadSingleFile = async (queueItem) => {
    // 更新状态为上传中
    setUploadQueue(prev => prev.map(item =>
      item.id === queueItem.id
        ? { ...item, status: 'uploading', progress: 0 }
        : item
    ))

    const formData = new FormData()
    formData.append('files', queueItem.file)
    formData.append('path', currentPath)
    formData.append('uploadUser', 'admin')

    try {
      const xhr = new XMLHttpRequest()

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadQueue(prev => prev.map(item =>
            item.id === queueItem.id
              ? { ...item, progress }
              : item
          ))
        }
      })

      // 上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.uploaded && data.uploaded.length > 0) {
            setUploadQueue(prev => prev.map(item =>
              item.id === queueItem.id
                ? { ...item, status: 'success', progress: 100 }
                : item
            ))
            // 刷新文件列表和存储统计
            loadFiles()
            loadStorageStats()
          } else {
            setUploadQueue(prev => prev.map(item =>
              item.id === queueItem.id
                ? { ...item, status: 'error', error: data.error || '上传失败' }
                : item
            ))
          }
        } else {
          setUploadQueue(prev => prev.map(item =>
            item.id === queueItem.id
              ? { ...item, status: 'error', error: '上传失败' }
              : item
          ))
        }
      })

      // 上传出错
      xhr.addEventListener('error', () => {
        setUploadQueue(prev => prev.map(item =>
          item.id === queueItem.id
            ? { ...item, status: 'error', error: '网络错误' }
            : item
        ))
      })

      xhr.open('POST', '/api/admin/files/upload')
      xhr.send(formData)
    } catch (error) {
      console.error('上传失败:', error)
      setUploadQueue(prev => prev.map(item =>
        item.id === queueItem.id
          ? { ...item, status: 'error', error: error.message }
          : item
      ))
    }
  }

  // 监听队列变化，自动上传pending状态的文件
  useEffect(() => {
    const pendingFiles = uploadQueue.filter(item => item.status === 'pending')
    if (pendingFiles.length > 0) {
      // 延迟一点开始上传，让UI先更新
      setTimeout(() => {
        pendingFiles.forEach(item => {
          uploadSingleFile(item)
        })
      }, 100)
    }
  }, [uploadQueue.length])

  // 处理文件输入
  const handleFileInput = (event) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return
    handleFilesAdded(fileList)
    event.target.value = '' // 清空 input
  }

  // 处理拖拽进入
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  // 处理拖拽离开
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  // 处理拖拽悬停
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // 处理文件拖放
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const fileList = e.dataTransfer.files
    if (fileList && fileList.length > 0) {
      handleFilesAdded(fileList)
    }
  }

  // 打开上传弹窗
  const openUploadModal = () => {
    setShowUploadModal(true)
    setUploadQueue([])
  }

  // 关闭上传弹窗
  const closeUploadModal = () => {
    // 检查是否有正在上传的文件
    const uploading = uploadQueue.some(item => item.status === 'uploading')
    if (uploading) {
      const confirmed = window.confirm('还有文件正在上传，确定要关闭吗？')
      if (!confirmed) return
    }
    setShowUploadModal(false)
    setUploadQueue([])
  }

  // 移除队列中的文件
  const removeFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id))
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
        loadStorageStats()
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
    // 更新 URL 参数
    setSearchParams({ path: folderPath })
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const newPath = parts.length === 0 ? '/' : '/' + parts.join('/')
    setCurrentPath(newPath)
    // 更新 URL 参数
    setSearchParams({ path: newPath })
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

  // 下载文件
  const handleDownload = (file) => {
    // 使用 download=1 参数来触发下载
    const downloadUrl = `${file.url}?download=1`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('开始下载文件')
  }

  return (
    <>
      <Helmet>
        <title>文件管理</title>
      </Helmet>

      {/* Main content wrapper */}
      <div className="bg-white rounded-lg shadow" style={{ paddingBottom: statsExpanded ? '320px' : '60px' }}>
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
              <button
                onClick={openUploadModal}
                className="px-4 py-2 bg-[#0073aa] text-white rounded text-sm hover:bg-[#005a87] flex items-center"
              >
                📤 上传文件
              </button>
            </div>
          </div>

          {/* Path breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#646970] mb-4">
            <button
              onClick={() => navigateToFolder('/')}
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
                    navigateToFolder(path)
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

                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(file)
                          }}
                          className="bg-[#0073aa] text-white px-2 py-1 rounded text-xs hover:bg-[#005a87]"
                          title="下载"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(file)
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
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
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-sm text-[#0073aa] hover:text-[#005a87] hover:underline"
                            >
                              下载
                            </button>
                            <button
                              onClick={() => handleDelete(file)}
                              className="text-sm text-red-600 hover:text-red-800 hover:underline"
                            >
                              删除
                            </button>
                          </div>
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

      {/* Storage Stats Bar - Fixed at viewport bottom, aligned with file panel */}
      {storageStats && (
        <div className="fixed bottom-2 bg-white border-t border-gray-200 shadow-lg z-40 rounded-b-lg" style={{ left: '208px', right: '8px' }}>
          {/* Collapse/Expand Bar */}
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#23282d]">
                💾 存储空间统计
              </span>
              {!statsExpanded && (
                <span className="text-xs text-[#646970]">
                  {storageStats.totalFiles} 个文件 · {formatSize(storageStats.usedSpace)} / {formatSize(storageStats.totalSpace)} ({storageStats.usagePercent}%)
                </span>
              )}
            </div>
            <span className="text-[#646970]">
              {statsExpanded ? '▼' : '▲'}
            </span>
          </button>

          {/* Expanded Content */}
          {statsExpanded && (
            <div className="px-6 pb-4 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Total Files */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-[#646970] mb-1">总文件数</div>
                  <div className="text-2xl font-bold text-[#0073aa]">
                    {storageStats.totalFiles}
                  </div>
                </div>

                {/* Total Folders */}
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-[#646970] mb-1">文件夹数</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {storageStats.totalFolders}
                  </div>
                </div>

                {/* Used Space */}
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-[#646970] mb-1">已使用</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatSize(storageStats.usedSpace)}
                  </div>
                </div>

                {/* Total Space */}
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-[#646970] mb-1">总容量</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatSize(storageStats.totalSpace)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#646970]">使用率</span>
                  <span className="text-xs font-medium text-[#23282d]">
                    {storageStats.usagePercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      storageStats.usagePercent > 90
                        ? 'bg-red-600'
                        : storageStats.usagePercent > 70
                        ? 'bg-yellow-500'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.max(storageStats.usagePercent, 0.5)}%`,
                      minWidth: storageStats.usagePercent > 0 ? '4px' : '0'
                    }}
                  ></div>
                </div>
              </div>

              {/* File Type Breakdown */}
              {storageStats.fileTypes && storageStats.fileTypes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {storageStats.fileTypes.map((type) => (
                    <div key={type.type} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#646970]">
                          {type.type === 'image' ? '🖼️ 图片' : type.type === 'video' ? '🎬 视频' : '📄 文档'}
                        </span>
                        <span className="text-xs font-medium text-[#23282d]">
                          {type.count} 个
                        </span>
                      </div>
                      <div className="text-xs text-[#646970] mt-1">
                        {formatSize(type.total_size)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeUploadModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#23282d]">上传文件到 {currentPath}</h2>
              <button
                onClick={closeUploadModal}
                className="text-[#646970] hover:text-[#23282d] text-2xl"
              >
                ×
              </button>
            </div>

            {/* Drop Zone */}
            <div
              className={`m-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-[#0073aa] bg-blue-50'
                  : 'border-gray-300 hover:border-[#0073aa]'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg text-[#23282d] mb-2">
                  拖拽文件到这里，或点击选择文件
                </p>
                <p className="text-sm text-[#646970]">
                  支持多文件上传
                </p>
              </label>
            </div>

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <h3 className="text-sm font-medium text-[#23282d] mb-3">
                  上传队列 ({uploadQueue.length} 个文件)
                </h3>
                <div className="space-y-3">
                  {uploadQueue.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#23282d] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#646970]">
                            {formatSize(item.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {item.status === 'pending' && (
                            <span className="text-xs text-[#646970]">等待中...</span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="text-xs text-[#0073aa]">上传中...</span>
                          )}
                          {item.status === 'success' && (
                            <span className="text-xs text-green-600">✓ 成功</span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-xs text-red-600">✗ 失败</span>
                          )}
                          {(item.status === 'pending' || item.status === 'error') && (
                            <button
                              onClick={() => removeFromQueue(item.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              移除
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(item.status === 'uploading' || item.status === 'success') && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.status === 'success' ? 'bg-green-600' : 'bg-[#0073aa]'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Error Message */}
                      {item.status === 'error' && item.error && (
                        <p className="text-xs text-red-600 mt-1">{item.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 bg-white border border-gray-300 text-[#23282d] rounded text-sm hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminFilesPage
