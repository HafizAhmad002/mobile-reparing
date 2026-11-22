import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import Reveal from '../components/Reveal'
import Photo from '../components/ui/Photo'
import Button from '../components/ui/Button'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { posts } from '../data/posts'
import NotFound from './NotFound'

export default function BlogPost() {
  const { slug } = useParams()
  const post = posts.find((p) => p.slug === slug)
  useDocumentTitle(post ? `${post.title} — FixPoint` : 'Article not found', post?.excerpt)
  if (!post) return <NotFound />

  const more = posts.filter((p) => p.slug !== slug).slice(0, 2)

  return (
    <article className="mx-auto max-w-[760px] px-6 py-10 md:py-14">
      <Link to="/blog" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent"><ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> All tips</Link>
      <div className="mt-4 flex items-center gap-3 text-xs">
        <span className="rounded-full bg-tint px-3 py-1 font-bold text-accent">{post.category}</span>
        <span className="inline-flex items-center gap-1 text-muted"><Clock size={13} strokeWidth={2} aria-hidden="true" /> {post.minutes} min read</span>
      </div>
      <h1 className="mt-4 text-[clamp(32px,4.4vw,50px)] font-extrabold leading-[1.06] tracking-[-0.035em]">{post.title}</h1>
      <Photo src={post.image} alt={post.title} rounded="rounded-[28px]" className="mt-8 h-[260px] md:h-[360px]" />
      <div className="mt-8 space-y-5 text-[17px] leading-[1.75] text-body">
        {post.body.map((para, i) => <p key={i}>{para}</p>)}
      </div>

      <Reveal className="mt-12">
        <div className="rounded-[28px] bg-ink p-8 text-white">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">Need help with your phone?</h2>
          <p className="mt-1 text-[15px] text-[#C9CCD6]">Tell us what’s wrong and we will come to you.</p>
          <Button to="/book" variant="white" className="mt-5">Book a repair</Button>
        </div>
      </Reveal>

      <h2 className="mt-12 text-xl font-extrabold tracking-[-0.02em]">More tips</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {more.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="rounded-[24px] border border-line bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#C9D6FF]">
            <span className="text-xs font-bold text-accent">{p.category}</span>
            <p className="mt-1 text-base font-extrabold leading-snug tracking-[-0.02em]">{p.title}</p>
          </Link>
        ))}
      </div>
    </article>
  )
}
