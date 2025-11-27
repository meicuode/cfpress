import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../contexts/ToastContext'

function ShareButtons({ url, title }) {
  const toast = useToast()
  const [showWechatQR, setShowWechatQR] = useState(false)

  const shareToTwitter = () => {
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(title)
    window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, '_blank', 'width=600,height=400')
  }

  const shareToWeibo = () => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)
    window.open(`https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`, '_blank', 'width=600,height=400')
  }

  const shareToFacebook = () => {
    const encodedUrl = encodeURIComponent(url)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'width=600,height=400')
  }

  const shareToTelegram = () => {
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(title)
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank', 'width=600,height=400')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      toast.error('复制失败')
    }
  }

  const shareToWechat = () => {
    setShowWechatQR(true)
  }

  return (
    <>
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-sm font-medium text-text-primary">分享文章</h3>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 微信 */}
            <button
              onClick={shareToWechat}
              className="flex items-center gap-2 px-4 py-2 bg-[#07c160] hover:bg-[#06ad56] text-white rounded-lg transition-colors text-sm"
              title="分享到微信"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.152-4.823 1.922-6.588 1.539-1.527 3.634-2.346 5.791-2.346.276 0 .554.016.824.046C17.213 4.174 13.334 2.188 8.691 2.188zm7.309 1.626c-5.23 0-9.468 3.419-9.468 7.636 0 2.336 1.315 4.416 3.31 5.829a.618.618 0 01.224.696l-.419 1.562a.469.469 0 00-.049.224c0 .172.136.312.304.312.072 0 .137-.025.193-.064l2.053-1.159a.907.907 0 01.755-.103c.951.223 1.948.343 2.977.343 5.23 0 9.468-3.419 9.468-7.636 0-4.217-4.238-7.636-9.468-7.636z"/>
              </svg>
              <span className="max-md:hidden">微信</span>
            </button>

            {/* 微博 */}
            <button
              onClick={shareToWeibo}
              className="flex items-center gap-2 px-4 py-2 bg-[#e6162d] hover:bg-[#c9152a] text-white rounded-lg transition-colors text-sm"
              title="分享到微博"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.98 17.45c-1.42.14-2.63-.39-2.71-1.18-.08-.79.96-1.55 2.37-1.69 1.42-.14 2.63.39 2.71 1.18.09.79-.95 1.55-2.37 1.69zm-1.46-4.15c-.42.13-.88-.01-1.04-.32-.16-.31.03-.66.45-.79.42-.13.88.01 1.04.32.16.31-.03.66-.45.79zm7.98.22c-.24-1.99-2.15-3.36-4.82-3.44 0 0-.82-.02-1.11-.07-.14-.03-.24-.13-.24-.27 0-.16.12-.29.27-.31.55-.07 4.49-.48 5.37 2.28.14.44-.19.92-.65.92-.24 0-.46-.12-.57-.32-.09-.17-.19-.5-.25-.79zm-3.17-7.04c-.85 0-1.54.69-1.54 1.54s.69 1.54 1.54 1.54 1.54-.69 1.54-1.54-.69-1.54-1.54-1.54zm1.17 7.03c-.57.18-1.21-.02-1.42-.45-.21-.43.05-.92.61-1.1.57-.18 1.21.02 1.42.45.21.43-.05.92-.61 1.1zm2.57-8.06c-1.08-.24-2.22-.18-3.23.15-.3.1-.48.41-.38.71.1.3.41.48.71.38.79-.26 1.67-.3 2.51-.12.3.06.58-.13.64-.43.06-.3-.13-.58-.43-.64-.28-.06-.56-.08-.82-.05zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.5c-3.22 0-5.83-1.91-5.83-4.27 0-2.36 2.61-4.27 5.83-4.27s5.83 1.91 5.83 4.27c0 2.36-2.61 4.27-5.83 4.27z"/>
              </svg>
              <span className="max-md:hidden">微博</span>
            </button>

            {/* Twitter/X */}
            <button
              onClick={shareToTwitter}
              className="flex items-center gap-2 px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors text-sm"
              title="分享到 Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="max-md:hidden">Twitter</span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareToFacebook}
              className="flex items-center gap-2 px-4 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg transition-colors text-sm"
              title="分享到 Facebook"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="max-md:hidden">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              onClick={shareToTelegram}
              className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg transition-colors text-sm"
              title="分享到 Telegram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.093.036.305.02.469z"/>
              </svg>
              <span className="max-md:hidden">Telegram</span>
            </button>

            {/* 复制链接 */}
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-primary border border-border text-text-primary rounded-lg transition-colors text-sm"
              title="复制链接"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="max-md:hidden">复制链接</span>
            </button>
          </div>
        </div>
      </div>

      {/* 微信二维码弹窗 - 使用 Portal 渲染到 body */}
      {showWechatQR && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowWechatQR(false)}
        >
          <div
            className="bg-bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">微信扫码分享</h3>
              <button
                onClick={() => setShowWechatQR(false)}
                className="text-text-secondary hover:text-text-primary text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="bg-white p-4 rounded-lg mb-4 flex items-center justify-center">
              {/* 使用 CF Worker API 生成二维码 */}
              <img
                src={`/api/qrcode?url=${encodeURIComponent(url)}`}
                alt="微信分享二维码"
                className="w-[200px] h-[200px]"
              />
            </div>
            <p className="text-sm text-text-secondary text-center">
              使用微信扫描二维码分享文章
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default ShareButtons
