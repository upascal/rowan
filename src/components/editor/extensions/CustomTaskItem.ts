import TaskItem from '@tiptap/extension-task-item';
import { generateId } from '../../../utils';

export const CustomTaskItem = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes.id || generateId(),
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const id = `task-${node.attrs.id || generateId()}`;
    
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
