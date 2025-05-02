export interface Project {
  name: string;
  content: string;
}

export type Projects = { [key: string]: string };

export type ViewMode = 'wysiwyg' | 'raw';

export const DEFAULT_PROJECT_TEMPLATE = (projectName: string) => `# TODO

- [ ] Task 1
- [ ] task 2

## Task Group A
- [ ] Task A.1
- [ ] task A.2

## Task Group B
- [ ] Task B.1
  - [ ] task B.1.1
  - [ ] task B.1.2
- [ ] task B.2

# In Progress

- [ ] Task 1
- [ ] task 2

# Done

- [ ] task 3`;
