// Public API for projects module
export { ProjectCard } from './components/ProjectCard';
export { ProjectForm } from './components/ProjectForm';
export { SubProjectList } from './components/SubProjectList';
export { useProjects } from './hooks/useProjects';
export { useSubProjects } from './hooks/useSubProjects';
export { fetchProjectById, deleteProject } from './api/projectsApi';
export type { Project, SubProject, CreateProjectInput, UpdateProjectInput } from './types';
