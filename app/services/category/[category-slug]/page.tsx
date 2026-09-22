import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryDirectory } from '@/components/service-inventory-directory'
import { categorySlug } from '@/lib/service-inventory'
import { serviceCategories } from '@/lib/site-data'

const categoryForSlug = (slug: string) => serviceCategories.find((category) => categorySlug(category) === slug)
export function generateStaticParams() { return serviceCategories.map((category) => ({ 'category-slug': categorySlug(category) })) }
export async function generateMetadata({ params }: { params: Promise<{ 'category-slug': string }> }): Promise<Metadata> { const { 'category-slug': slug } = await params; const category = categoryForSlug(slug); return category ? { title: category, description: `Browse ${category} services from Shubh Consultancy Services.` } : { title: 'Category not found' } }
export default async function CategoryPage({ params }: { params: Promise<{ 'category-slug': string }> }) { const { 'category-slug': slug } = await params; if (!categoryForSlug(slug)) notFound(); return <CategoryDirectory slug={slug} /> }
