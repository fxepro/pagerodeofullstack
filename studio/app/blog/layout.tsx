import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog - PageRodeo',
  description: 'Read our latest blog posts about website performance, SEO, and digital marketing insights.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

