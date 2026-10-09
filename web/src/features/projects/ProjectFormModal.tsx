// Create/edit project form, rendered inside a modal, validated with the shared zod schema.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@pms/shared';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import type { ProjectDto } from './types';

interface ProjectFormModalProps {
  project?: ProjectDto;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => Promise<void>;
  submitError: string | null;
}

// Renders project create/edit form
export function ProjectFormModal({ project, onClose, onSubmit, submitError }: ProjectFormModalProps) {
  const isEdit = Boolean(project);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(isEdit ? updateProjectSchema : createProjectSchema) as never,
    defaultValues: project
      ? {
          name: project.name,
          description: project.description ?? '',
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
        }
      : { status: 'NOT_STARTED' },
  });

  // Forwards validated form data up
  async function handleFormSubmit(input: CreateProjectInput) {
    await onSubmit(input);
  }

  return (
    <Modal title={isEdit ? 'Edit project' : 'New project'} onClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Name" error={errors.name?.message} {...register('name')} />
        <TextField label="Description" error={errors.description?.message} {...register('description')} />
        <SelectField label="Status" error={errors.status?.message} {...register('status')}>
          <option value="NOT_STARTED">Not started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <TextField
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>
        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
