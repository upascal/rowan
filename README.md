# Markdown Kanban

Markdown Kanban is a lightweight task management application that combines the simplicity of Markdown with the visual organization of Kanban boards. Write in Markdown, visualize as Kanban.

## Features

- **Dual View System**: Toggle between raw Markdown editing and a visual Kanban board view
- **Project Management**: Create, select, and manage multiple projects
- **Local Storage**: All projects are saved in your browser's local storage
- **Task Hierarchy**: Support for nested tasks and subtasks
- **Markdown Compatibility**: Standard Markdown format that works with other Markdown editors

## How It Works

Markdown Kanban uses a simple convention to transform Markdown into Kanban boards:

1. **Columns**: Level 1 headings (`# Heading`) become Kanban columns
2. **Tasks**: Markdown task lists (`- [ ] Task`) become cards in those columns
3. **Subtasks**: Indented task lists become nested subtasks within a card

For example, this Markdown:

```markdown
# TODO

- [ ] Design homepage
- [ ] Update documentation

# In Progress

- [ ] Refactor API
  - [ ] Implement error handling
  - [ ] Add unit tests

# Done

- [x] Setup project
```

Automatically transforms into a Kanban board with three columns (TODO, In Progress, Done) containing the respective tasks.

## Getting Started

1. Create a new project by entering a name in the sidebar
2. Use the default template or write your own Markdown
3. Toggle between Markdown and Kanban views using the buttons in the header

## Technical Details

Built with:
- React + TypeScript
- Tiptap rich text editor with Markdown support
- Local browser storage for persistence

## Use Cases

- Personal task management
- Simple project planning
- Note-taking with actionable items
- Quick Kanban boards without complex project management tools

Markdown Kanban is perfect for users who appreciate the simplicity of plain text but benefit from visual organization when managing tasks.
