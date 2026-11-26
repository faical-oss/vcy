import { ArrowRight, BookOpen, Clock, User } from "lucide-react";
import Image from "next/image";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { NavItemLink } from "@/components/layout/nav-item-link";
import { EXTERNAL_URLS } from "@/constants/routes";
import { cn } from "@/helpers/cn";
import type { MagazineArticle } from "@/interfaces";

function ArticleCard({ article, featured = false }: { article: MagazineArticle; featured?: boolean }) {
  return (
    <article className="group flex flex-col">
      <NavItemLink href={article.href} external={article.external} className="flex flex-col after:absolute after:inset-0">
        <span className={cn("relative mb-4 block w-full overflow-hidden bg-surface-blue", featured ? "aspect-[3/4]" : "aspect-video")}>
          {article.imageSrc ? <Image src={article.imageSrc} alt="" fill sizes={featured ? "(min-width: 1024px) 400px, 100vw" : "(min-width: 640px) 270px, 100vw"} className="object-cover" /> : null}
        </span>
        <span className="mb-2 flex items-center gap-2">
          <BookOpen className="size-[11px] text-muted-blue" aria-hidden />
          <span className="text-micro uppercase tracking-widest text-muted-blue">{article.category}</span>
        </span>
        <h3 className="mb-2 font-display text-title-sm font-medium leading-snug text-primary transition-colors group-hover:text-muted-blue">{article.title}</h3>
        <p className={cn("mb-3 text-body", featured ? "text-sm leading-relaxed" : "line-clamp-2 text-xs leading-relaxed")}>{article.excerpt}</p>
      </NavItemLink>
      <p className={cn("flex items-center gap-2 text-xs leading-6 text-body", featured && "mt-auto")}>
        <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full border border-muted-blue bg-surface-blue text-primary">
          <User className="size-3" />
        </span>
        {article.author}
        <span aria-hidden className="text-base text-border">·</span>
        <span className="flex items-center gap-1 text-muted-blue">
          <Clock className="size-2.5" aria-hidden /> {article.readTimeMinutes} min read
        </span>
      </p>
    </article>
  );
}

const HOME_HEADING = { tag: "Travel journal", title: "From the Magazine", description: "Stories, guides and inspiration for mindful travellers." };

/** `heading` and `visitLink` default to the Home copy; Lifestyle pages pass their own (the magazine is on another site, so its link is external). */
export function MagazineSection({
  articles,
  heading = HOME_HEADING,
  visitLink = { href: EXTERNAL_URLS.magazine, external: true },
}: {
  articles: MagazineArticle[];
  heading?: { tag: string; title: string; description: string };
  visitLink?: { href: string; external?: boolean; className?: string };
}) {
  const [featured, ...rest] = articles;

  return (
    <section aria-labelledby="magazine-title" className="bg-surface py-10 sm:py-14">
      <Container>
        <SectionHeading
          id="magazine-title"
          tag={heading.tag}
          title={heading.title}
          description={heading.description}
          className="mb-8"
          action={
            visitLink.external ? (
              <NavItemLink href={visitLink.href} external className={cn(buttonVariants({ variant: "link", size: "inline" }), "shrink-0", visitLink.className)}>
                Visit the magazine <ArrowRight className="size-3.5" aria-hidden />
              </NavItemLink>
            ) : (
              <ButtonLink href={visitLink.href} variant="link" size="inline" className={cn("shrink-0", visitLink.className)}>
                Visit the magazine <ArrowRight className="size-3.5" aria-hidden />
              </ButtonLink>
            )
          }
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {featured ? (
            <div className="relative flex lg:col-span-1 [&>article]:flex-1">
              <ArticleCard article={featured} featured />
            </div>
          ) : null}
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-2">
            {rest.map((article) => (
              <li key={article.id} className="relative flex [&>article]:flex-1">
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
