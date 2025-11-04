/**
 * EditorJS 内容渲染器组件
 * 将 Editor.js 的 JSON 格式转换为 HTML 展示
 */

function EditorJSRenderer({ data }) {
  if (!data || !data.blocks) {
    return null
  }

  const renderBlock = (block) => {
    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}`
        return (
          <HeaderTag
            key={block.id}
            className="font-bold my-4"
            dangerouslySetInnerHTML={{ __html: block.data.text }}
          />
        )

      case 'paragraph':
        return (
          <p key={block.id} className="my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.text }} />
        )

      case 'list':
        if (block.data.style === 'ordered') {
          return (
            <ol key={block.id} className="list-decimal list-inside my-4 space-y-2">
              {block.data.items.map((item, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ol>
          )
        } else if (block.data.style === 'checklist') {
          return (
            <div key={block.id} className="my-4 space-y-2">
              {block.data.items.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.meta?.checked || item.checked || false}
                    readOnly
                    className="rounded"
                  />
                  <span dangerouslySetInnerHTML={{ __html: item.content || item }} />
                </label>
              ))}
            </div>
          )
        } else {
          return (
            <ul key={block.id} className="list-disc list-inside my-4 space-y-2">
              {block.data.items.map((item, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: item.content || item }} />
              ))}
            </ul>
          )
        }

      case 'quote':
        return (
          <blockquote key={block.id} className="border-l-4 border-blue-500 pl-4 italic my-6 text-gray-600">
            <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
            {block.data.caption && (
              <cite className="block mt-2 text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: `— ${block.data.caption}` }} />
            )}
          </blockquote>
        )

      case 'code':
        return (
          <pre key={block.id} className="bg-gray-900 text-gray-100 p-4 rounded my-4 overflow-x-auto">
            <code>{block.data.code}</code>
          </pre>
        )

      case 'delimiter':
        return (
          <div key={block.id} className="text-center text-2xl my-8 text-gray-400">
            * * *
          </div>
        )

      case 'table':
        return (
          <div key={block.id} className="overflow-x-auto my-4">
            <table className="border-collapse w-full">
              <tbody>
                {block.data.content.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="border border-gray-300 p-2"
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'warning':
        return (
          <div key={block.id} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
            <p className="font-bold text-yellow-800" dangerouslySetInnerHTML={{ __html: block.data.title }} />
            <p className="text-yellow-700" dangerouslySetInnerHTML={{ __html: block.data.message }} />
          </div>
        )

      case 'embed':
        return (
          <div key={block.id} className="my-6">
            <div className="relative pb-[56.25%] h-0 overflow-hidden">
              <iframe
                src={block.data.embed}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {block.data.caption && (
              <p className="text-sm text-gray-500 text-center mt-2" dangerouslySetInnerHTML={{ __html: block.data.caption }} />
            )}
          </div>
        )

      case 'image':
        return (
          <figure key={block.id} className="my-6">
            <img
              src={block.data.file.url}
              alt={block.data.caption || ''}
              className="w-full rounded"
            />
            {block.data.caption && (
              <figcaption className="text-sm text-gray-500 text-center mt-2" dangerouslySetInnerHTML={{ __html: block.data.caption }} />
            )}
          </figure>
        )

      default:
        console.warn(`Unknown block type: ${block.type}`, block)
        return null
    }
  }

  return (
    <div className="prose max-w-none">
      {data.blocks.map(renderBlock)}
    </div>
  )
}

export default EditorJSRenderer
