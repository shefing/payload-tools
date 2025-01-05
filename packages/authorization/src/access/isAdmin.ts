import { Access, FieldAccess, User } from 'payload';

export const isAdmin: Access<User> = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(user?.isAdmin);
};

export const isAdminFieldLevel: FieldAccess<{ id: string }, User> = ({ req: { user } }) => {
  // Return true or false based on if the user has an admin role
  return Boolean(user?.isAdmin);
};

export const isNotGeneratorUserFieldLevel: FieldAccess<{ id: string }, User> = ({
  req: { user },
}) => {
  // Return true or false based on if the user is marked as API user
  return !Boolean(user?.isGeneratorUser);
};
