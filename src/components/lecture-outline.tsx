"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OutlineNode } from "@/lib/outline";
import { cn } from "@/lib/utils";

function flatten(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function nodeHref(node: OutlineNode) {
  return node.href ?? `#${node.id}`;
}

function OutlineLinks({
  nodes,
  active,
}: {
  nodes: OutlineNode[];
  active?: string;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => {
        const href = nodeHref(node);
        const className = cn(
          "block rounded-md px-2 py-1 text-[13px] leading-snug transition-colors",
          active === node.id
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        );
        return (
          <li key={node.id}>
            {href.startsWith("#") ? (
              <a href={href} className={className}>
                {node.text}
              </a>
            ) : (
              <Link href={href} className={className}>
                {node.text}
              </Link>
            )}
            {node.children.length > 0 ? (
              <div className="ml-2 border-l border-border/80 pl-1">
                <OutlineLinks nodes={node.children} active={active} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function LectureOutline({
  nodes,
  label = "Содержание",
}: {
  nodes: OutlineNode[];
  label?: string;
}) {
  const [active, setActive] = useState(nodes[0]?.id);

  useEffect(() => {
    const elements = flatten(nodes)
      .map((node) => document.getElementById(node.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: [0, 0.25, 1] },
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [nodes]);

  return (
    <nav aria-label={label}>
      <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <OutlineLinks nodes={nodes} active={active} />
    </nav>
  );
}
