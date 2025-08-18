import { useAppSelector } from '@/store/hooks';
import {
  selectNavigationMenu,
  selectNavigationPermissions,
  selectNavigationAnalytics,
  selectNavigationBreadcrumbs,
  selectNavigationBadges,
  selectNavigationLoading,
  selectNavigationError,
} from '@/store/navigationSelectors';

export const useNavigationState = () => {
  const menu = useAppSelector(selectNavigationMenu);
  const permissions = useAppSelector(selectNavigationPermissions);
  const analytics = useAppSelector(selectNavigationAnalytics);
  const breadcrumbs = useAppSelector(selectNavigationBreadcrumbs);
  const badges = useAppSelector(selectNavigationBadges);
  const loading = useAppSelector(selectNavigationLoading);
  const error = useAppSelector(selectNavigationError);

  return { menu, permissions, analytics, breadcrumbs, badges, loading, error };
};