import { Field } from 'payload';

const isAdminFieldLevel = () => true;

const userFields: Field[] = [
  {
    name: 'isAdmin',
    type: 'checkbox',
    defaultValue: false,
    saveToJWT: true,
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
  },
  {
    name: 'isGeneratorUser',
    type: 'checkbox',
    defaultValue: false,
    saveToJWT: true,
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
  },
  {
    name: 'userRoles',
    type: 'relationship',
    saveToJWT: true,
    relationTo: 'roles',
    hasMany: true,
    access: {
      create: isAdminFieldLevel,
      update: isAdminFieldLevel,
    },
  },
];

export default userFields;
