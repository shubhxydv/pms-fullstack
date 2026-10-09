// Create/edit task form, rendered inside a modal, validated with the shared zod schema.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@pms/shared';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import type { TaskDto } from './types';

interface TaskFormModalProps {
  projectId: string;
  task?: TaskDto;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  submitError: string | null;
}

// Renders task create/edit form
export function TaskFormModal({ projectId, task, onClose, onSubmit, submitError }: TaskFormModalProps) {
  const isEdit = Boolean(task);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(isEdit ? updateTaskSchema : createTaskSchema) as never,
    defaultValues: task
      ? {
          name: task.name,
          description: task.description ?? '',
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
        }
      : { projectId, priority: 'MEDIUM', status: 'PENDING' },
  });

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <TextField label="Name" error={errors.name?.message} {...register('name')} />
        <TextField label="Description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Priority" error={errors.priority?.message} {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </SelectField>
          <SelectField label="Status" error={errors.status?.message} {...register('status')}>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </SelectField>
        </div>
        <TextField label="Due date" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
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
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
