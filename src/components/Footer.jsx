function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto py-10 px-5 bg-bg-secondary border-t border-border max-md:py-8">
      <div className="max-w-[1400px] mx-auto text-center">
        <div className="mb-4">
          <p className="text-[13px] text-text-secondary mb-2">
            © {currentYear} 没有 没有梦想的成品. All Rights Reserved
          </p>
          <div className="flex justify-center items-center gap-2 mb-4">
            <a href="/rss" className="text-[13px] text-text-secondary hover:text-accent-blue">
              RSS
            </a>
            <span className="text-text-secondary">·</span>
            <a href="/sitemap" className="text-[13px] text-text-secondary hover:text-accent-blue">
              Sitemap
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-text-secondary">Powered by Astro & Fuwari</p>
          <p className="text-xs text-text-secondary">⏱ 本站总文章数为75310篇</p>
          <p className="text-xs text-text-secondary">渝ICP备2023056549号</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
