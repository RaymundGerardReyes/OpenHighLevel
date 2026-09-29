'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkflows, createWorkflow } from '../api/workflows-api';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}
