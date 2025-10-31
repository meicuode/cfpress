import { Link } from 'react-router-dom'

function PostNavigation({ prevPost, nextPost }) {
  return (
    <nav className="flex gap-[100px]">
      {/* Previous Post */}
      {prevPost ? (
        <Link
          to={`/thread/${prevPost.id}`}
          className="flex-1 flex items-center gap-3 px-4 py-3 text-text-primary bg-bg-card backdrop-blur-md rounded-xl border border-border hover:bg-white/5 transition-colors group"
        >
          <span className="text-lg text-text-secondary group-hover:text-accent-blue transition-colors">
            ‹
          </span>
          <span className="text-sm truncate">{prevPost.title}</span>
        </Link>
      ) : (
        <div className="flex-1 px-4 py-3 text-text-secondary text-sm bg-bg-card backdrop-blur-md rounded-xl border border-border">
          没有更多文章了
        </div>
      )}

      {/* Next Post */}
      {nextPost ? (
        <Link
          to={`/thread/${nextPost.id}`}
          className="flex-1 flex items-center justify-end gap-3 px-4 py-3 text-text-primary bg-bg-card backdrop-blur-md rounded-xl border border-border hover:bg-white/5 transition-colors group text-right"
        >
          <span className="text-sm truncate">{nextPost.title}</span>
          <span className="text-lg text-text-secondary group-hover:text-accent-blue transition-colors">
            ›
          </span>
        </Link>
      ) : (
        <div className="flex-1 px-4 py-3 text-text-secondary text-sm bg-bg-card backdrop-blur-md rounded-xl border border-border text-right">
          没有更多文章了
        </div>
      )}
    </nav>
  )
}

export default PostNavigation
