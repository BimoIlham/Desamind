type Lesson = {
  title: string;
  duration: number;
};

export function normalizeLessons(value: unknown): Lesson[] {
  if (Array.isArray(value)) {
    return value
      .map((lesson) => ({
        title: String((lesson as any)?.title ?? 'Pelajaran'),
        duration: Number((lesson as any)?.duration ?? 0),
      }))
      .filter((lesson) => lesson.title.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      return normalizeLessons(JSON.parse(value));
    } catch {
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((title) => ({ title, duration: 0 }));
    }
  }

  return [];
}

export function normalizeTrainingModule<T extends Record<string, any> | null>(module: T): T {
  if (!module) return module;
  return {
    ...module,
    lessons: normalizeLessons(module.lessons),
    rating: Number(module.rating ?? 0),
    enrolled: Number(module.enrolled ?? 0),
    duration_minutes: Number(module.duration_minutes ?? 0),
  };
}

export function normalizeTrainingModules<T extends Record<string, any>>(modules: T[]) {
  return modules.map((module) => normalizeTrainingModule(module));
}
