import type { SupabaseClient } from '@supabase/supabase-js';
import { createAcademicRepository } from '$lib/data-access/academic/repository.server';
import { spaces } from '$lib/domain/navigation/spaces';
import { scoreSearchCandidate } from '$lib/domain/search/rank';
import type { SearchResult } from '$lib/domain/search/types';

export async function searchAll(input: {
  supabase: SupabaseClient | null;
  query: string;
  limit?: number;
}) {
  const query = input.query.trim();
  const repository = createAcademicRepository(input.supabase);
  if (!query) return { repositoryStatus: repository.status(), results: [] as SearchResult[] };

  const roomResults: SearchResult[] = spaces
    .map((space) => ({
      kind: 'room' as const,
      id: space.id,
      title: space.name,
      subtitle: space.subtitle ?? space.kind.replaceAll('-', ' '),
      href: `/room/${space.id}`,
      score: scoreSearchCandidate(query, {
        title: space.name,
        aliases: space.aliases ?? [],
        keywords: [space.kind, space.subtitle ?? '']
      })
    }))
    .filter((result) => result.score > 0);

  const [courses, faculty, services, researchAreas, resources] = await Promise.all([
    repository.listCourses({ query }),
    repository.listFaculty({ query }),
    repository.listServices(),
    repository.listResearchAreas(),
    repository.listAcademicResources()
  ]);

  const academicResults: SearchResult[] = [
    ...courses.map((course) => ({
      kind: 'course' as const,
      id: course.id,
      title: course.code,
      subtitle: course.title ?? 'Course',
      href: `/course/${encodeURIComponent(course.code)}`,
      score: scoreSearchCandidate(query, {
        title: course.title ? `${course.code} ${course.title}` : course.code,
        aliases: [course.code],
        canonicalCode: course.code
      })
    })),
    ...faculty.map((person) => ({
      kind: 'faculty' as const,
      id: person.id,
      title: person.displayName,
      subtitle: person.title ?? 'Faculty',
      href: `/faculty/${person.slug}`,
      score: scoreSearchCandidate(query, {
        title: person.displayName,
        keywords: [person.title ?? '']
      })
    })),
    ...services.map((service) => ({
      kind: 'service' as const,
      id: service.id,
      title: service.name,
      subtitle: service.spaceId ? `Academic service · ${service.spaceId.toUpperCase()}` : 'Academic service',
      href: service.slug === 'math-clinic' ? '/services/math-clinic' : `/search?q=${encodeURIComponent(service.name)}`,
      score: scoreSearchCandidate(query, {
        title: service.name,
        keywords: [service.description ?? '', service.spaceId ?? '']
      })
    })),
    ...researchAreas.map((area) => ({
      kind: 'research' as const,
      id: area.id,
      title: area.name,
      subtitle: area.faculty.length
        ? `${area.faculty.length} related faculty profile${area.faculty.length === 1 ? '' : 's'}`
        : 'Research area',
      href: `/research#research-${area.slug}`,
      score: scoreSearchCandidate(query, {
        title: area.name,
        keywords: [area.description ?? '', ...area.faculty.map((person) => person.displayName)]
      })
    })),
    ...resources.map((resource) => ({
      kind: 'resource' as const,
      id: resource.id,
      title: resource.title,
      subtitle: `Academic resource · ${resource.category}`,
      href: `/academics/forms#resource-${resource.slug}`,
      score: scoreSearchCandidate(query, {
        title: resource.title,
        keywords: [resource.category, resource.description ?? '']
      })
    }))
  ].filter((result) => result.score > 0);

  return {
    repositoryStatus: repository.status(),
    results: [...roomResults, ...academicResults]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, input.limit ?? 30)
  };
}
