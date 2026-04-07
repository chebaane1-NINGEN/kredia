import React from 'react';
import UnifiedClientCreate from '../../components/UnifiedClientCreate';

const AgentClientCreate: React.FC = () => {
  return (
    <UnifiedClientCreate
      isAgent={true}
      redirectPath="/agent/clients"
      title="Add New Client"
      subtitle="Create a new client account with required documents"
    />
  );
};

export default AgentClientCreate;
