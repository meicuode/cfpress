function AboutPage() {
  return (
    <div className="bg-bg-card backdrop-blur-md rounded-xl border border-border p-10 max-md:p-6">
      <div className="mb-8 pb-5 border-b border-border">
        <h1 className="text-[28px] font-bold text-text-primary">关于</h1>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">关于本站</h2>
          <p className="text-[15px] text-text-secondary leading-loose mb-2.5">
            这是一个基于 Cloudflare Pages 和 D1 数据库构建的个人博客。
          </p>
          <p className="text-[15px] text-text-secondary leading-loose mb-2.5">
            记录生活、技术和思考的地方。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">关于我</h2>
          <p className="text-[15px] text-text-secondary leading-loose mb-2.5">
            没有梦想的成品
          </p>
          <p className="text-[15px] text-text-secondary leading-loose mb-2.5">
            在计时赛金会是怎样的表现呢就看想
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">联系方式</h2>
          <ul className="list-none p-0">
            <li className="text-[15px] text-text-secondary mb-2.5">
              GitHub: <a href="#" className="text-accent-blue">@username</a>
            </li>
            <li className="text-[15px] text-text-secondary mb-2.5">
              Email: <a href="mailto:hello@example.com" className="text-accent-blue">hello@example.com</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default AboutPage
