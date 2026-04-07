import React from 'react';
import UnifiedClientCreate from '../../components/UnifiedClientCreate';

const UserCreateAdvanced: React.FC = () => {
  return (
    <UnifiedClientCreate
      isAgent={false}
      redirectPath="/admin/users"
      title="Create New Client"
      subtitle="Create a new client account with full admin privileges"
    />
  );
};

export default UserCreateAdvanced;
