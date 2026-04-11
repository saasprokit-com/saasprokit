"use client";

import type { Article as PrismaArticle } from "@repo/database";
import { formatDate } from "@repo/design-system/lib/date";
import { cn } from "@repo/design-system/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ============================================================================
// Type Definitions - Flexible types for partial Prisma relations
// ============================================================================

/** Author fields used by the Article component */
export type ArticleAuthor = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

/** Category fields used by the Article component */
export type ArticleCategory = {
  id?: number;
  name: string;
  slug: string;
  color?: string | null;
};

/** Tag fields used by the Article component */
export type ArticleTag = {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
};

/** Cover image fields used by the Article component */
export type ArticleCoverImage = {
  id?: string;
  path: string;
};

/**
 * Article with relations for display purposes.
 * Uses flexible types that work with Prisma's select queries.
 */
export type ArticleWithRelations = PrismaArticle & {
  author?: ArticleAuthor | null;
  category?: ArticleCategory | null;
  coverImage?: ArticleCoverImage | null;
  tags?: { tag: ArticleTag }[];
};

export type ArticleProps = {
  /** Article data with relations */
  article: ArticleWithRelations;

  /** Layout variant: "vertical" for cards, "horizontal" for list items */
  variant?: "horizontal" | "vertical";

  /** Show/hide optional sections */
  showThumbnail?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showReadTime?: boolean;
  showTags?: boolean;
  showCategory?: boolean;

  /** Maximum number of tags to display */
  maxTags?: number;

  /** URL base paths for links */
  articleBasePath?: string;
  categoryBasePath?: string;
  tagBasePath?: string;

  /** Override className */
  className?: string;
};

// ============================================================================
// Utility Functions
// ============================================================================

function getAuthorName(author?: ArticleAuthor | null): string {
  if (!author) {
    return "";
  }
  if (author.firstName || author.lastName) {
    return `${author.firstName || ""} ${author.lastName || ""}`.trim();
  }
  return author.name || "";
}

// ============================================================================
// Internal Props Type
// ============================================================================

type ArticleInternalProps = Omit<ArticleProps, "variant">;

// ============================================================================
// Vertical Variant (Card Style - Featured Articles)
// ============================================================================

function VerticalArticle({
  article,
  showThumbnail = true,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
  articleBasePath = "/blog",
  className,
}: ArticleInternalProps) {
  return (
    <article
      className={cn(
        "group rounded-xl border border-border transition-shadow hover:shadow-lg",
        className
      )}
    >
      {/* Cover Image */}
      {showThumbnail && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {article.coverImage ? (
            <Image
              alt={article.title}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              src={article.coverImage.path}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Category Badge */}
        {showCategory && article.category && (
          <div className="mb-4">
            <span
              className="inline-block rounded-full px-3 py-1 font-medium text-white text-xs"
              style={{ backgroundColor: article.category.color || "#6366f1" }}
            >
              {article.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 font-semibold text-lg leading-tight tracking-tight group-hover:text-primary">
          <Link href={`${articleBasePath}/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {showExcerpt && article.excerpt && (
          <p className="mb-4 line-clamp-2 text-muted-foreground text-sm">
            {article.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          {showAuthor && article.author && (
            <span>{getAuthorName(article.author)}</span>
          )}
          {showDate && article.publishedAt && (
            <span>{formatDate(article.publishedAt)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// Horizontal Variant (List Style - Latest Articles)
// ============================================================================

function HorizontalArticle({
  article,
  showThumbnail = true,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showReadTime = true,
  showTags = false,
  showCategory = true,
  maxTags = 3,
  articleBasePath = "/blog",
  categoryBasePath = "/category",
  tagBasePath = "/tag",
  className,
}: ArticleInternalProps) {
  return (
    <article className={cn("group", className)}>
      <div className="flex gap-6">
        {/* Thumbnail - hidden on mobile */}
        {showThumbnail && (
          <div className="relative hidden h-32 w-48 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
            {article.coverImage ? (
              <Image
                alt={article.title}
                className="object-cover"
                fill
                sizes="192px"
                src={article.coverImage.path}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
        )}

        <div className="flex-1">
          {/* Meta row: category + read time */}
          <div className="mb-2 flex items-center gap-3">
            {showCategory && article.category && (
              <Link
                className="font-medium text-xs"
                href={`${categoryBasePath}/${article.category.slug}`}
                style={{ color: article.category.color || "#6366f1" }}
              >
                {article.category.name}
              </Link>
            )}
            {showReadTime && article.readTime && (
              <span className="text-muted-foreground text-xs">
                {article.readTime} min read
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 font-semibold text-xl leading-tight tracking-tight group-hover:text-primary">
            <Link href={`${articleBasePath}/${article.slug}`}>
              {article.title}
            </Link>
          </h3>

          {/* Excerpt */}
          {showExcerpt && article.excerpt && (
            <p className="mb-4 line-clamp-2 text-muted-foreground">
              {article.excerpt}
            </p>
          )}

          {/* Footer: author, date, tags */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {showAuthor && article.author && (
                <span>By {getAuthorName(article.author)}</span>
              )}
              {showAuthor &&
                showDate &&
                article.author &&
                article.publishedAt && <span>·</span>}
              {showDate && article.publishedAt && (
                <span>{formatDate(article.publishedAt)}</span>
              )}
            </div>

            {showTags && article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, maxTags).map((articleTag) => (
                  <Link
                    className="rounded-full bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                    href={`${tagBasePath}/${articleTag.tag.slug}`}
                    key={articleTag.tag.id}
                  >
                    {articleTag.tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// Main Article Component
// ============================================================================

export function Article({
  article,
  variant = "vertical",
  showThumbnail = true,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showReadTime = true,
  showTags = false,
  showCategory = true,
  maxTags = 3,
  articleBasePath = "/blog",
  categoryBasePath = "/category",
  tagBasePath = "/tag",
  className,
}: ArticleProps) {
  const props: ArticleInternalProps = {
    article,
    showThumbnail,
    showExcerpt,
    showAuthor,
    showDate,
    showReadTime,
    showTags,
    showCategory,
    maxTags,
    articleBasePath,
    categoryBasePath,
    tagBasePath,
    className,
  };

  if (variant === "horizontal") {
    return <HorizontalArticle {...props} />;
  }

  return <VerticalArticle {...props} />;
}
