/* relative-path: src/components/CustomTaskItem.ts */

import TaskItem from '@tiptap/extension-task-item';

export const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes.id || Math.random().toString(36).substring(2, 9),
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const id = `task-${node.attrs.id || Math.random().toString(36).substring(2, 9)}`;
    
    return [
      'li',
      {
        ...HTMLAttributes,
        'data-type': 'taskItem',
        'data-checked': node.attrs.checked ? 'true' : 'false',
      },
      [
        'label',
        { for: id },
        [
          'input',
          {
            type: 'checkbox',
            id,
            name: id,
            checked: node.attrs.checked ? 'checked' : null,
          },
        ],
      ],
      ['div', {}, 0],
    ];
  },
});
