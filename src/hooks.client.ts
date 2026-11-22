import type { HandleClientError } from '@sveltejs/kit/hooks';

export const handleError: HandleClientError = ({ error }) => {
  console.error('Client error caught:', error);
};