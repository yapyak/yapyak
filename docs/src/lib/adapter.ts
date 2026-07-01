type Adapter = {
  frameworks: string[];
  label: string;
  value: string;
};

const ADAPTERS: Adapter[] = [
  {
    frameworks: [
      'react',
      'vue',
      'svelte',
    ],
    label: 'None',
    value: 'none',
  },
  {
    frameworks: [
      'react',
    ],
    label: 'React Router',
    value: 'react-router',
  },
  {
    frameworks: [
      'react',
    ],
    label: 'TanStack Start',
    value: 'tanstack-start',
  },
  {
    frameworks: [
      'svelte',
    ],
    label: 'SvelteKit',
    value: 'sveltekit',
  },
];

export function filterAdaptersByFramework(framework: string) {
  return ADAPTERS.filter((adapter) => adapter.frameworks.includes(framework));
}

export function visibleOptionsForGroup<
  T extends {
    value: string;
  },
>(groupId: string, options: T[], framework: string): T[] {
  if (groupId !== 'adapter') {
    return options;
  }
  const allowed = new Set(
    filterAdaptersByFramework(framework).map((adapter) => adapter.value),
  );
  return options.filter((option) => allowed.has(option.value));
}
