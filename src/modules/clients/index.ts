// Public API for clients module
export { ClientList } from './components/ClientList';
export { ArchiveList } from './components/ArchiveList';
export { ClientCard } from './components/ClientCard';
export { ClientForm } from './components/ClientForm';
export { useClients } from './hooks/useClients';
export { fetchClientById } from './api/clientsApi';
export type { Client, CreateClientInput, UpdateClientInput } from './types';
