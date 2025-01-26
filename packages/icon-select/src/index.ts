import { Field } from 'payload';
import * as Icons from 'flowbite-react-icons';

export const iconOptions = Object.entries(Icons).map((icon) => icon[0]);

interface IconSelectFieldOptions {
  name?: string;
  label?: string;
}

export const createIconSelectField = ({
  name = 'iconType',
  label = 'Icon',
}: IconSelectFieldOptions): Field => ({
  name,
  type: 'text',
  label,
  admin: {
    components: {
      Field: '@michalklor/icon-select/selectIcons',
    },
  },
});
