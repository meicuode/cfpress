/**
 * 从 Editor.js JSON 数据中提取纯文本
 */
export function extractTextFromEditorJS(data, maxLength = 200) {
  if (!data || !data.blocks) {
    return ''
  }

  let text = ''

  for (const block of data.blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'header':
        // 移除 HTML 标签
        const cleanText = block.data.text?.replace(/<[^>]*>/g, '') || ''
        text += cleanText + ' '
        break

      case 'list':
        if (block.data.items) {
          const items = block.data.items.map(item => {
            if (typeof item === 'string') {
              return item.replace(/<[^>]*>/g, '')
            }
            return item.content?.replace(/<[^>]*>/g, '') || ''
          })
          text += items.join(', ') + ' '
        }
        break

      case 'quote':
        text += block.data.text?.replace(/<[^>]*>/g, '') || ''
        text += ' '
        break

      case 'code':
        // 代码块不包含在摘要中
        break

      default:
        // 其他类型暂不处理
        break
    }

    // 如果已经超过最大长度，提前结束
    if (text.length > maxLength) {
      break
    }
  }

  // 清理多余空格并截断
  text = text.trim().replace(/\s+/g, ' ')

  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...'
  }

  return text
}

/**
 * 获取文章摘要（优先使用自定义摘要，否则从内容提取）
 */
export function getThreadExcerpt(thread, maxLength = 200) {
  // 如果有自定义摘要，直接使用
  if (thread.excerpt) {
    return thread.excerpt.length > maxLength
      ? thread.excerpt.slice(0, maxLength) + '...'
      : thread.excerpt
  }

  // 尝试从内容提取
  try {
    const parsedContent = JSON.parse(thread.content)
    return extractTextFromEditorJS(parsedContent, maxLength)
  } catch (e) {
    // 如果不是 JSON，直接截取纯文本
    const plainText = thread.content?.replace(/<[^>]*>/g, '') || ''
    return plainText.length > maxLength
      ? plainText.slice(0, maxLength) + '...'
      : plainText
  }
}
