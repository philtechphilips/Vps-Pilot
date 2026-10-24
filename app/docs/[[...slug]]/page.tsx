import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DocsToc } from "@/components/docs/toc";
import { Icon } from "@/components/icons";
import { allDocs, docHref, findDoc } from "@/lib/docs/nav";
import { pages } from "@/lib/docs/pages";

export function generateStaticParams() {
  return allDocs.map((d) => ({ slug: d.slug ? d.slug.split("/") : [] }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  const found = findDoc(slug?.join("/") ?? "");
  if (!found) return {};
  return { title: found.doc.slug ? found.doc.title : { absolute: "VPSPilot Docs" }, description: found.doc.description };
}

export default function DocPage({ params }: PageProps<"/docs/[[...slug]]">) {
  return (
    <Suspense fallback={<DocSkeleton />}>
      <Doc params={params} />
    </Suspense>
  );
}

function DocSkeleton() {
  return (
    <div className="px-4 pt-10 sm:px-8 lg:px-12 lg:pt-14">
      <div className="mx-auto max-w-[740px] space-y-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-10 w-2/3 rounded-md" />
        <div className="skeleton h-5 w-full rounded" />
      </div>
    </div>
  );
}

async function Doc({ params }: { params: PageProps<"/docs/[[...slug]]">["params"] }) {
  const { slug } = await params;
  const key = slug?.join("/") ?? "";
  const found = findDoc(key);
  const Body = pages[key];
  if (!found || !Body) notFound();
  const { doc, prev, next } = found;

  return (
    <div className="flex">
      <article data-doc className="min-w-0 flex-1 px-4 pt-10 pb-20 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mx-auto max-w-[740px]">
          <div className="mb-3 text-[13px] font-medium text-accent-fg">{doc.section}</div>
          <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.04em] text-fg sm:text-[40px]">{doc.title}</h1>
          <p className="mt-4 text-[17px] leading-8 text-muted">{doc.description}</p>
          <div className="mt-8 h-px bg-ink/[0.06]" />

          <div className="mt-10">
            <Body />
          </div>

          <nav aria-label="Previous and next page" className="mt-16 grid gap-3 border-t border-ink/[0.06] pt-8 sm:grid-cols-2">
            {prev ? (
              <Link href={docHref(prev.slug)} className="group rounded-xl border border-ink/[0.08] p-4 transition-colors hover:border-ink/20">
                <span className="flex items-center gap-1 text-xs text-subtle">
                  <Icon name="arrow-left" size={12} className="transition-transform group-hover:-translate-x-0.5" /> Previous
                </span>
                <span className="mt-1 block text-sm font-medium text-fg">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={docHref(next.slug)} className="group rounded-xl border border-ink/[0.08] p-4 text-right transition-colors hover:border-ink/20">
                <span className="flex items-center justify-end gap-1 text-xs text-subtle">
                  Next <Icon name="arrow-right" size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-1 block text-sm font-medium text-fg">{next.title}</span>
              </Link>
            )}
          </nav>
        </div>
      </article>

      <aside className="hidden w-60 shrink-0 xl:block">
        <div className="thin-scrollbar sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-14 pr-6">
          <DocsToc key={key} />
        </div>
      </aside>
    </div>
  );
}
