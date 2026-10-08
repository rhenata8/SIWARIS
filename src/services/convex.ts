import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

export const isConvexEnabled = Boolean(convexUrl && convexUrl.trim() !== '' && convexUrl.startsWith('http'));

export const convexClient = isConvexEnabled ? new ConvexReactClient(convexUrl as string) : null;
