import { Field } from 'payload';

interface ColorFieldOptions {
  name?: string;
  label?: string;
}

export const createColorField = ({
  name = 'color',
  label = 'Color',
}: ColorFieldOptions): Field => ({
  name,
  type: 'text',
  label,
  admin: {
    components: {
      Field: '@shefing/color-picker/CustomTailWindColors#SelectColorFont',
    },
  },
});
